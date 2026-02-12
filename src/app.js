import express from "express";
import cors from "cors";
import languageRoutes from "./routes/languageRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";
import feedRoutes from "./routes/feedRoutes.js";
import unifiedFeedRoutes from "./routes/unifiedFeedRoutes.js";

import {
    fetchIndiaNews,
    fetchInternationalNews,
    fetchCurrentAffairs,
    fetchHealthNews,
    fetchTechNews
} from "./services/newsService.js";

const app = express();
app.use(cors());

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api", languageRoutes);

// 🔹 Manual News Fetch Route
app.get("/fetch-news", async (req, res) => {
    try {
        console.log("Starting full news fetch...");
        await fetchIndiaNews();
        await fetchInternationalNews();
        await fetchCurrentAffairs();
        await fetchHealthNews();
        await fetchTechNews();
        res.json({ message: "All news fetched successfully" });
    } catch (err) {
        res.status(500).json({ error: "News fetch failed", details: err.message });
    }
});

// 🔹 Seed Mock News (For Development/Testing)
app.get("/seed-mock-news", async (req, res) => {
    try {
        const News = (await import("./models/News.js")).default;
        const mockNews = (await import("./data/mockNews.json", { assert: { type: "json" } })).default;

        // Add today's date to all mock news
        const newsWithDate = mockNews.map(article => ({
            ...article,
            publishedAt: new Date(),
            status: "approved",
            isUserPost: false
        }));

        await News.insertMany(newsWithDate);
        res.json({
            message: "Mock news seeded successfully",
            count: newsWithDate.length
        });
    } catch (err) {
        res.status(500).json({ error: "Seed failed", details: err.message });
    }
});


// 🔹 News APIs
app.use("/news", newsRoutes);

// 🔥 Aggregated Feed API (RSS + API merged)
app.use("/api/feed", feedRoutes);

// 🎯 UNIFIED Feed API (Old News + New FeedNews merged - USE THIS IN YOUR APP!)
app.use("/api/unified", unifiedFeedRoutes);

export default app;

