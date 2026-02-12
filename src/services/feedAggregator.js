import FeedNews from "../models/FeedNews.js";
import { fetchRSS } from "./rssService.js";
import { fetchAPINews } from "./apiService.js";
import { deduplicateArticles } from "../utils/deduplicate.js";

/**
 * 🔥 MAIN AGGREGATION PIPELINE
 * 
 * Flow:
 * 1. Fetch from RSS feeds
 * 2. Fetch from API sources
 * 3. Merge all articles
 * 4. Deduplicate (URL + Title similarity)
 * 5. Sort by publish date
 * 6. Save to MongoDB (skip existing URLs)
 */
export const aggregateFeed = async () => {
    console.log("\n🚀 Starting feed aggregation...");
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
        const clean = deduplicateArticles(merged);

        // 4️⃣ Sort by newest first
        clean.sort((a, b) => b.publishedAt - a.publishedAt);

        // 5️⃣ Save to database (skip duplicates)
        let savedCount = 0;
        let skippedCount = 0;

        for (const article of clean) {
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
                    });
                    savedCount++;
                } else {
                    skippedCount++;
                }
            } catch (error) {
                // Skip if duplicate URL (unique constraint violation)
                if (error.code === 11000) {
                    skippedCount++;
                } else {
                    console.error(`❌ Error saving article: ${error.message}`);
                }
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`\n✅ Feed aggregation complete in ${duration}s`);
        console.log(`   💾 Saved: ${savedCount} new articles`);
        console.log(`   ⏭️  Skipped: ${skippedCount} duplicates`);
        console.log(`   📦 Total in DB: ${await FeedNews.countDocuments()}\n`);

        return {
            success: true,
            saved: savedCount,
            skipped: skippedCount,
            duration,
        };
    } catch (error) {
        console.error("❌ Feed aggregation failed:", error.message);
        throw error;
    }
};
