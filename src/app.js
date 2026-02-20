import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";
import feedRoutes from "./routes/feedRoutes.js";
import unifiedFeedRoutes from "./routes/unifiedFeedRoutes.js";
import languageRoutes from "./routes/languageRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

import quizRoutes from "./routes/quizRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import { rewriteWithAI, generateQuizFromContent } from "./services/aiService.js";

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
app.use("/api/quiz", quizRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/settings", settingsRoutes);



// Fallback Routes (for clients omitting /api prefix)
app.use("/auth", authRoutes);
app.use("/upload", uploadRoutes);
app.use("/feed", feedRoutes);
app.use("/unified", unifiedFeedRoutes);
app.use("/language", languageRoutes);
app.use("/news", newsRoutes);
app.use("/quiz", quizRoutes);
app.use("/notifications", notificationRoutes);

// 🤖 DEBUG ROUTE: Test Gemini AI
app.get("/api/test-gemini", async (req, res) => {
    console.log("🛠️ Testing Gemini API...");
    const data = await rewriteWithAI("The Indian space agency ISRO has successfully launched a satellite.");
    res.json({ success: !!data, data });
});

// 🧩 DEBUG ROUTE: Test Gemini Quiz Generation
app.get("/api/test-quiz-ai", async (req, res) => {
    console.log("🛠️ Testing Quiz AI...");
    const quiz = await generateQuizFromContent(
        "India won the Cricket World Cup in 2023 after defeating Australia in the final. The match was played in Ahmedabad. Virat Kohli was the top scorer of the tournament with 765 runs.",
        "Cricket World Cup 2023"
    );
    res.json({ success: !!quiz, quiz });
});

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


