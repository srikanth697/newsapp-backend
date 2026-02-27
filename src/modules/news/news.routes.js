import express from "express";
import {
    fetchNewsNow,
    getNewsByCategory,
    getSingleNews
} from "./news.controller.js";

const router = express.Router();

router.get("/fetch", fetchNewsNow);
router.get("/", getNewsByCategory);
router.get("/:id", getSingleNews);

export default router;
