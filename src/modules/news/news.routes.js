import express from "express";
import { manualFetch, getNewsByTab, getArticleDetails } from "./news.controller.js";

const router = express.Router();

router.get("/fetch", manualFetch);
router.get("/details/:id", getArticleDetails);
router.get("/", getNewsByTab);

export default router;
