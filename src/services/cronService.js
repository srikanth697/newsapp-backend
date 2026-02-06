import cron from "node-cron";
import { fetchIndiaNews } from "./newsService.js";

const initCron = () => {
    // Run every hour
    cron.schedule("0 * * * *", async () => {
        console.log("⏰ Running scheduled news fetch...");
        try {
            await fetchIndiaNews();
            console.log("✅ Scheduled fetch completed.");
        } catch (error) {
            console.error("❌ Scheduled fetch failed:", error.message);
        }
    });

    console.log("🚀 Cron Job initialized: News will be fetched every hour.");
};

export default initCron;
