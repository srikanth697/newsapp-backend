import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";
import feedRoutes from "./routes/feedRoutes.js";
import unifiedFeedRoutes from "./routes/unifiedFeedRoutes.js";
import languageRoutes from "./routes/languageRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/unified", unifiedFeedRoutes);
app.use("/api", languageRoutes); // Mount at /api so /api/language works
app.use("/news", newsRoutes);

export default app;


