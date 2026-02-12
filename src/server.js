import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";
import cron from "node-cron";
import { aggregateFeed } from "./services/feedAggregator.js";

const PORT = process.env.PORT || 5000;

// Connect MongoDB
connectDB();

// 🔥 Run once when server starts
setTimeout(() => {
    console.log("🚀 Running initial feed aggregation...");
    aggregateFeed().catch(err => console.error("Initial aggregation failed:", err));
}, 5000); // 5s delay

// 🔥 Run every 5 minutes
cron.schedule("*/5 * * * *", async () => {
    console.log("\n⏰ Running scheduled feed aggregation (5 min)...");
    await aggregateFeed().catch(err => console.error("Scheduled aggregation failed:", err));
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
