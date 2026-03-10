import cron from "node-cron";
import newsService from "../services/newsService.js";

let isFetching = false;

export default function startNewsCron() {
    // 1. 🔥 Run IMMEDIATELY on server startup
    console.log("🚀 Server Started: Triggering initial News Pipeline...");
    newsService.runPipeline().then(result => {
        console.log(`✅ Startup Fetch Complete: Found ${result.length} new articles.`);
    }).catch(err => console.error("❌ Startup Fetch Failed:", err.message));

    // 2. ⏰ Schedule to run every 5 minutes
    cron.schedule("*/5 * * * *", async () => {
        if (isFetching) {
            console.log("⏸️ Pipeline already running. Skipping tick.");
            return;
        }

        isFetching = true;
        console.log("Running news pipeline (5m Cycle)...");

        try {
            const result = await newsService.runPipeline();
            console.log(`Pipeline processed ${result.length} new articles.`);
        } catch (error) {
            console.error("Cron error:", error);
        } finally {
            isFetching = false;
        }
    });
}
