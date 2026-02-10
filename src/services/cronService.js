import cron from "node-cron";
import {
    fetchIndiaNews,
    fetchInternationalNews,
    fetchCurrentAffairs,
    fetchHealthNews
} from "./newsService.js";

const initCron = () => {
    // Run every hour
    cron.schedule("0 * * * *", async () => {
        console.log("⏰ Running scheduled full news fetch...");
        try {
            await fetchIndiaNews();
            await fetchInternationalNews();
            await fetchCurrentAffairs();
            await fetchHealthNews();
            console.log("✅ Scheduled full fetch completed.");
        } catch (error) {
            console.error("❌ Scheduled fetch failed:", error.message);
        }
    });


    console.log("🚀 Cron Job initialized: News will be fetched every hour.");
};

export default initCron;
