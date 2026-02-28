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

        // 🧠 Logic: 
        // 1. If 'previous', show articles where isToday is false.
        // 2. Otherwise, we show ALL articles (because they are within our 24h-48h 'recent' window)
        // 3. We then apply specific sub-filters like country or category.

        if (tab === "previous") {
            filter.isToday = false;
        } else {
            // For all other tabs, we don't strictly enforce isToday: true 
            // since we already filtered by 'recent' in the service layer.
            // This ensures data shows up regardless of calendar day crossovers.

            switch (tab) {
                case "india":
                    filter.country = "india";
                    break;
                case "world":
                    filter.country = "world";
                    break;
                case "current-affairs":
                case "politics":
                case "business":
                case "technology":
                case "sports":
                case "entertainment":
                    filter.category = tab;
                    break;
                default:
                    // Default view (World/All today)
                    if (tab && tab !== 'all') filter.category = tab;
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
