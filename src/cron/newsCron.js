import cron from "node-cron";
import newsService from "../services/newsService.js";

let isFetching = false;

export default function startNewsCron() {
    cron.schedule("*/10 * * * *", async () => {
        if (isFetching) {
            console.log("⏸️ Pipeline already running. Skipping tick.");
            return;
        }

        isFetching = true;
        console.log("Running news pipeline...");

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
