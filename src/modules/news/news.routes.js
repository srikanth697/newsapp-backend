import express from "express";
import { manualFetch, getNewsByTab, getArticleDetails, debugClearNews } from "./news.controller.js";

const router = express.Router();

router.get("/fetch", manualFetch);
router.get("/debug-clear", debugClearNews);
router.get("/details/:id", getArticleDetails);
router.get("/", getNewsByTab);

export default router;
