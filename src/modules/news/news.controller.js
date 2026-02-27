import News from "./news.model.js";
import { runCronFetch } from "./news.service.js";

export const manualFetch = async (req, res) => {
    runCronFetch(); // Background
    res.json({ success: true, message: "Manual fetch initiated in background." });
};

export const getNewsByTab = async (req, res) => {
    const { tab, page = 1 } = req.query;
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
        default:
            filter.isToday = true;
            if (tab) filter.category = tab;
    }

    const news = await News.find(filter)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit);

    res.json({ success: true, news });
};

export const getArticleDetails = async (req, res) => {
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).json({ success: false });

    news.views += 1;
    await news.save();
    res.json({ success: true, news });
};
