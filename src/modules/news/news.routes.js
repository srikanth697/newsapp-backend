import express from "express";
import {
    fetchNewsNow,
    getNewsByCategory,
    getSingleNews
} from "./news.controller.js";

const router = express.Router();

// 🚀 Manual Fetch (Defined BEFORE :id)
router.get("/fetch", fetchNewsNow);

// 📰 List News
router.get("/", getNewsByCategory);

// 📄 Single News (Using Regex to only match 24-char hex strings)
router.get("/:id([0-9a-fA-F]{24})", getSingleNews);

export default router;
