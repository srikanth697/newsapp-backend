import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";
import cron from "node-cron";
import { runCronFetch } from "./modules/news/news.service.js";

const PORT = process.env.PORT || 5000;

// Connect MongoDB
connectDB();

// 🔥 Auto Cron: Fetch news every 30 minutes
// Non-blocking, production patterns
cron.schedule("*/30 * * * *", () => {
    console.log("⏰ [CRON] Triggering automated news pipeline...");
    runCronFetch().catch(err => console.error("Cron Error:", err.message));
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
