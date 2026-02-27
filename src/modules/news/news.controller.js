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

        switch (tab) {
            case "previous":
                filter.isToday = false;
                break;
            case "india":
                filter.isToday = true;
                filter.country = "india";
                break;
            case "world":
                filter.isToday = true;
                filter.country = "world";
                break;
            case "current-affairs":
            case "politics":
            case "business":
            case "technology":
            case "sports":
            case "entertainment":
                filter.isToday = true;
                filter.category = tab;
                break;
            default:
                filter.isToday = true;
                // If specific category provided in tab but not handled above, try to match it
                if (tab && tab !== 'all') filter.category = tab;
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
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).json({ success: false });

    news.views += 1;
    await news.save();
    res.json({ success: true, news });
};
