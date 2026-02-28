import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";
import cron from "node-cron";
import { runCronFetch } from "./modules/news/news.service.js";

const PORT = process.env.PORT || 5000;

// Connect MongoDB
connectDB();

// 🔥 Auto Cron: Fetch news every 10 minutes
cron.schedule("*/10 * * * *", () => {
    console.log("⏰ [CRON] Triggering Intelligent News Engine (10m Cycle)...");
    runCronFetch().catch(err => console.error("Cron Process Error:", err.message));
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
