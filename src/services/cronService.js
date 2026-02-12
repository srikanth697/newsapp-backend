import cron from "node-cron";
import {
    fetchIndiaNews,
    fetchInternationalNews,
    fetchCurrentAffairs,
    fetchHealthNews,
    fetchTechNews
} from "./newsService.js";

const initCron = () => {
    // ⚠️ DISABLED FOR DEVELOPMENT - Uncomment for production
    // Run every hour
    // cron.schedule("0 * * * *", async () => {
    //     console.log("⏰ Running scheduled full news fetch...");
    //     try {
    //         await fetchIndiaNews();
    //         await fetchInternationalNews();
    //         await fetchCurrentAffairs();
    //         await fetchHealthNews();
    //         await fetchTechNews();
    //         console.log("✅ Scheduled full fetch completed.");
    //     } catch (error) {
    //         console.error("❌ Scheduled fetch failed:", error.message);
    //     }
    // });

    console.log("🚀 Cron Job disabled for development. Use /fetch-news to manually fetch.");
};

export default initCron;
