import express from "express";
import newsController from "../controllers/newsController.js";

const router = express.Router();

router.get("/", newsController.getNewsByTab);
router.get("/fetch", newsController.manualFetch);
router.get("/debug/clear", newsController.debugClearNews);
router.get("/:id", newsController.getNewsDetail);

export default router;
