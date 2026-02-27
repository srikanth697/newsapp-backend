import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";
import cron from "node-cron";
import { fetchAllNews } from "./modules/news/news.service.js";

const PORT = process.env.PORT || 5000;

// Connect MongoDB
connectDB();

// 🔥 Auto Cron: Fetch news every 30 minutes
cron.schedule("*/30 * * * *", async () => {
    console.log("⏰ Auto-fetching latest news...");
    await fetchAllNews().catch(err => console.error("Cron fetch error:", err.message));
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
