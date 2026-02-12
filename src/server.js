import dotenv from "dotenv";
dotenv.config();
console.log(process.env.NEWS_API_KEY ? "✅ News API key loaded" : "⚠️ News API key missing in .env");

import app from "./app.js";
import connectDB from "./config/db.js";
import initCron from "./services/cronService.js";
import { aggregateFeed } from "./services/feedAggregator.js";

const PORT = process.env.PORT || 5000;

// Connect MongoDB
connectDB();

// Initialize Cron Jobs
initCron();

// 🔥 Run feed aggregation every 10 minutes
setInterval(() => {
    console.log("\n⏰ Running scheduled feed aggregation...");
    aggregateFeed().catch(err => console.error("Scheduled aggregation failed:", err));
}, 10 * 60 * 1000); // 10 minutes

// Run aggregation on startup
setTimeout(() => {
    console.log("\n🚀 Running initial feed aggregation...");
    aggregateFeed().catch(err => console.error("Initial aggregation failed:", err));
}, 5000); // Wait 5 seconds after startup

// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
