import FeedNews from "../models/FeedNews.js";
import { fetchRSS } from "./rssService.js";
import { fetchAPINews } from "./apiService.js";
import { deduplicateArticles } from "../utils/deduplicate.js";
import { rankArticles } from "../utils/ranking.js";

/**
 * 🔥 MAIN AGGREGATION PIPELINE (Level 2)
 * 
 * Flow:
 * 1. Fetch from RSS feeds
 * 2. Fetch from API sources
 * 3. Merge all articles
 * 4. Deduplicate (URL + Title similarity)
 * 5. Rank smartly (Freshness + Importance)
 * 6. Save to MongoDB (with Score)
 */
export const aggregateFeed = async () => {
    console.log("\n🚀 Starting Professional Feed Aggregation (Level 2)...");
    const startTime = Date.now();

    try {
        // 1️⃣ Fetch from all sources in parallel
        const [rssArticles, apiArticles] = await Promise.all([
            fetchRSS(),
            fetchAPINews(),
        ]);

        console.log(`\n📊 Fetched totals:`);
        console.log(`   RSS: ${rssArticles.length} articles`);
        console.log(`   API: ${apiArticles.length} articles`);

        // 2️⃣ Merge all articles
        const merged = [...rssArticles, ...apiArticles];
        console.log(`\n🔗 Merged: ${merged.length} total articles`);

        // 3️⃣ Deduplicate
        const unique = deduplicateArticles(merged);
        console.log(`\n🛡️  Cleaned: ${unique.length} unique articles`);

        // 4️⃣ Rank smartly (Freshness + Importance)
        const ranked = rankArticles(unique);

        // 5️⃣ Sort by Score (highest first)
        ranked.sort((a, b) => b.score - a.score);

        // 6️⃣ Save to database
        let savedCount = 0;
        let skippedCount = 0;

        for (const article of ranked) {
            try {
                // Check if URL already exists
                const exists = await FeedNews.findOne({ url: article.url });

                if (!exists) {
                    await FeedNews.create({
                        title: article.title,
                        summary: article.summary,
                        content: article.content,
                        url: article.url,
                        image: article.image,
                        source: article.source,
                        category: article.category,
                        publishedAt: article.publishedAt,
                        score: article.score, // Save the smart score
                    });
                    savedCount++;
                } else {
                    skippedCount++;
                }
            } catch (error) {
                if (error.code === 11000) {
                    skippedCount++;
                } else {
                    console.error(`❌ Error saving article: ${error.message}`);
                }
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        // 6️⃣ 🔥 OPTIONAL (PRODUCTION IMPROVEMENT): Delete old news automatically (keep DB light)
        console.log("🧹 Cleaning up old news (older than 30 days)...");
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const deleted = await FeedNews.deleteMany({
            publishedAt: { $lt: thirtyDaysAgo },
        });

        console.log(`\n✅ Feed aggregation complete in ${duration}s`);
        console.log(`   💾 Saved: ${savedCount} new articles`);
        console.log(`   ⏭️  Skipped: ${skippedCount} duplicates`);
        if (deleted.deletedCount > 0) {
            console.log(`   🧹 Deleted: ${deleted.deletedCount} old articles`);
        }
        console.log(`   📦 Total in DB: ${await FeedNews.countDocuments()}\n`);

        return {
            success: true,
            saved: savedCount,
            skipped: skippedCount,
            deleted: deleted.deletedCount,
            duration,
        };
    } catch (error) {
        console.error("❌ Feed aggregation failed:", error.message);
        throw error;
    }
};
