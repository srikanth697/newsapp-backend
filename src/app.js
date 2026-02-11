import express from "express";
import cors from "cors";
import languageRoutes from "./routes/languageRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";

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

app.use("/api", languageRoutes);
app.use("/api/auth", authRoutes);

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


// 🔹 News APIs
app.use("/news", newsRoutes);
app.use("/quiz", quizRoutes);

export default app;

