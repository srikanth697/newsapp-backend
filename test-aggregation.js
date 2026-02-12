/**
 * 🧪 TEST SCRIPT FOR AGGREGATION ENGINE
 * Run this to test the aggregation without starting the full server
 */

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { aggregateFeed } from "./src/services/feedAggregator.js";

const MONGODB_URI = process.env.MONGODB_URI;

async function test() {
    try {
        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to MongoDB\n");

        console.log("🚀 Starting aggregation test...\n");
        const result = await aggregateFeed();

        console.log("\n📊 Test Results:");
        console.log(`   ✅ Success: ${result.success}`);
        console.log(`   💾 Saved: ${result.saved} new articles`);
        console.log(`   ⏭️  Skipped: ${result.skipped} duplicates`);
        console.log(`   ⏱️  Duration: ${result.duration}s`);

        console.log("\n✅ Test completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("\n❌ Test failed:", error.message);
        console.error(error);
        process.exit(1);
    }
}

test();
