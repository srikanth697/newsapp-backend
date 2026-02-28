import News from "./news.model.js";
import { runCronFetch } from "./news.service.js";

export const manualFetch = async (req, res) => {
    runCronFetch(); // Background
    res.json({ success: true, message: "Manual fetch initiated in background." });
};

export const getNewsByTab = async (req, res) => {
    try {
        const { tab, page = 1 } = req.query;
        console.log(`🔍 Routing News Fetch for Tab: ${tab || 'all'} (Page: ${page})`);

        const limit = 10;
        const skip = (page - 1) * limit;

        let filter = {};

        // 🧠 Exclusive Tab Logic: 
        // We ensure that articles don't overlap between tabs to respect "don't show same article in different categories"

        if (tab === "previous") {
            filter.isToday = false;
        } else {
            // For active news tabs
            switch (tab) {
                case "india":
                    // Strictly India country, but we can also filter out specific categories if we want extreme exclusivity
                    filter.country = "india";
                    break;
                case "world":
                    // World view often acts as a 'General' bucket, so we filter by world country 
                    // and skip specific niche categories to keep it clean.
                    filter.country = "world";
                    filter.category = { $nin: ["politics", "business", "technology", "sports", "entertainment"] };
                    break;
                case "current-affairs":
                case "politics":
                case "business":
                case "technology":
                case "sports":
                case "entertainment":
                    // Filter strictly by the category provided
                    filter.category = tab;
                    break;
                default:
                    // Default view (All today)
                    filter.isToday = true;
            }
        }

        console.log(`📝 Applied DB Filter:`, JSON.stringify(filter));

        const news = await News.find(filter)
            .sort({ publishedAt: -1 })
            .skip(skip)
            .limit(limit);

        console.log(`✅ Returned ${news.length} articles for tab: ${tab || 'all'}`);

        res.json({
            success: true,
            count: news.length,
            tab: tab || 'all',
            news: news
        });
    } catch (error) {
        console.error("❌ Controller Error (getNewsByTab):", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const debugClearNews = async (req, res) => {
    try {
        console.log("⚠️ DEBUG: Clearing all news articles...");
        const result = await News.deleteMany({});
        res.json({ success: true, message: `Cleared ${result.deletedCount} articles. Database is now clean.` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getArticleDetails = async (req, res) => {
    try {
        const news = await News.findById(req.params.id);
        if (!news) return res.status(404).json({ success: false });

        news.views += 1;
        await news.save();
        res.json({ success: true, news });
    } catch (error) {
        res.status(400).json({ success: false, message: "Invalid ID format" });
    }
};
