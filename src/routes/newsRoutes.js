import express from "express";
import { postNews } from "../controllers/newsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/post", protect, postNews);

export default router;
