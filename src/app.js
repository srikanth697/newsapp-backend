import express from "express";
import cors from "cors";
import languageRoutes from "./routes/languageRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";

import { fetchIndiaNews } from "./services/newsService.js";

const app = express();
app.use(cors());

app.use(express.json());

app.use("/api", languageRoutes);
app.use("/api/auth", authRoutes);

// 🔹 Manual News Fetch Route
app.get("/fetch-news", async (req, res) => {
    try {
        await fetchIndiaNews();
        res.json({ message: "News fetched & saved" });
    } catch (err) {
        res.status(500).json({ error: "Fetch failed", details: err.message });
    }
});

// 🔹 News APIs
app.use("/news", newsRoutes);

export default app;

