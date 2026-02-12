/**
 * 🧪 TEST AGGREGATION WITHOUT DATABASE
 * This tests the RSS and API fetching + deduplication
 * WITHOUT requiring MongoDB connection
 */

import dotenv from "dotenv";
dotenv.config();

import { fetchRSS } from "./src/services/rssService.js";
import { fetchAPINews } from "./src/services/apiService.js";
import { deduplicateArticles } from "./src/utils/deduplicate.js";

async function testWithoutDB() {
    console.log("🧪 Testing aggregation pipeline (no database)\n");
    const startTime = Date.now();

    try {
        // 1️⃣ Fetch from all sources
        console.log("📡 Fetching from all sources...\n");
        const [rssArticles, apiArticles] = await Promise.all([
            fetchRSS(),
            fetchAPINews(),
        ]);

        console.log(`\n📊 Fetch Results:`);
        console.log(`   RSS: ${rssArticles.length} articles`);
        console.log(`   API: ${apiArticles.length} articles`);

        // 2️⃣ Merge
        const merged = [...rssArticles, ...apiArticles];
        console.log(`\n🔗 Merged: ${merged.length} total articles`);

        // 3️⃣ Deduplicate
        const clean = deduplicateArticles(merged);

        // 4️⃣ Sort
        clean.sort((a, b) => b.publishedAt - a.publishedAt);

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`\n✅ Pipeline test complete in ${duration}s`);
        console.log(`   📦 Final unique articles: ${clean.length}`);
        console.log(`   🗑️  Duplicates removed: ${merged.length - clean.length}`);

        // Show sample articles
        console.log(`\n📰 Sample Articles (first 5):\n`);
        clean.slice(0, 5).forEach((article, i) => {
            console.log(`${i + 1}. ${article.title}`);
            console.log(`   Source: ${article.source} | Category: ${article.category}`);
            console.log(`   URL: ${article.url.substring(0, 60)}...`);
            console.log();
        });

        console.log("✅ Test successful! The aggregation pipeline works.");
        console.log("💡 Now fix your MongoDB connection to save the data.\n");

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Test failed:", error.message);
        console.error(error);
        process.exit(1);
    }
}

testWithoutDB();
