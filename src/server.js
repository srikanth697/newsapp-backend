import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";
import cron from "node-cron";
import { aggregateFeed } from "./services/feedAggregator.js";
import { generateAINews, autoPublishScheduledNews } from "./services/aiNewsGenerator.js";

const PORT = process.env.PORT || 5000;

// 🔥 Run AI Auto-Publish check every 1 minute
cron.schedule("* * * * *", async () => {
    await autoPublishScheduledNews().catch(err => console.error("Auto-Publish failed:", err));
});

// Connect MongoDB
connectDB();

// 🔥 Run once when server starts
setTimeout(() => {
    console.log("🚀 Running initial feed aggregation...");
    aggregateFeed().catch(err => console.error("Initial aggregation failed:", err));

    // Also run AI News Generation once on start
    setTimeout(() => {
        console.log("🤖 Running initial AI News Generation...");
        generateAINews().catch(err => console.error("Initial AI News Generation failed:", err));
    }, 10000); // Wait 10s more after start to avoid overlapping with feed
}, 5000); // 5s delay

// 🔥 Run every 5 minutes
cron.schedule("*/5 * * * *", async () => {
    console.log("\n⏰ Running scheduled feed aggregation (5 min)...");
    await aggregateFeed().catch(err => console.error("Scheduled aggregation failed:", err));
});

// 🔥 Run AI News Generation every 30 minutes
cron.schedule("*/30 * * * *", async () => {
    console.log("\n⏰ Running scheduled AI News Generation (30 min)...");
    await generateAINews().catch(err => console.error("AI News Generation failed:", err));
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
