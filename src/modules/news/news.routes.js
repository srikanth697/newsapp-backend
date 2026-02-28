import express from "express";
import { manualFetch, getNewsByTab, getArticleDetails, debugClearNews, manualGenerateQuiz } from "./news.controller.js";

const router = express.Router();

router.get("/fetch", manualFetch);
router.get("/debug-clear", debugClearNews);
router.get("/details/:id", getArticleDetails);
router.get("/:id([0-9a-fA-F]{24})", getArticleDetails); // Alias for app compatibility
router.post("/manual-quiz-generate", manualGenerateQuiz);
router.get("/", getNewsByTab);

export default router;
