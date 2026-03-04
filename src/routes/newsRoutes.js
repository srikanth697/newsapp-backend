import express from "express";
import newsController from "../controllers/newsController.js";

const router = express.Router();

router.get("/fetch", newsController.fetchAndSaveNews);
router.get("/:id", newsController.getNewsDetail);

export default router;
