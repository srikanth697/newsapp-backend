import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import languageRoutes from "./routes/languageRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import newsRoutes from "./modules/news/news.routes.js";
import quizRoutes from "./modules/quiz/quiz.routes.js";

const app = express();
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/language", languageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/unified", newsRoutes);
app.use("/api/quiz", quizRoutes); // New Quiz System

// Fallback Routes (for clients omitting /api prefix)
app.use("/auth", authRoutes);
app.use("/upload", uploadRoutes);
app.use("/language", languageRoutes);
app.use("/notifications", notificationRoutes);

app.get("/", (req, res) => res.send("Auth & Core Services API is running..."));

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
