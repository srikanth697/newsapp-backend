import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";
import feedRoutes from "./routes/feedRoutes.js";
import unifiedFeedRoutes from "./routes/unifiedFeedRoutes.js";
import languageRoutes from "./routes/languageRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/unified", unifiedFeedRoutes);
app.use("/api/language", languageRoutes); // Fixed path
app.use("/api/news", newsRoutes);
app.use("/api/admin", adminRoutes);

// Fallback Routes (for clients omitting /api prefix)
app.use("/auth", authRoutes);
app.use("/upload", uploadRoutes);
app.use("/feed", feedRoutes);
app.use("/unified", unifiedFeedRoutes);
app.use("/language", languageRoutes);
app.use("/news", newsRoutes);
app.get("/", (req, res) => res.send("News API is running..."));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || "Internal Server Error",
        stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
});

export default app;


