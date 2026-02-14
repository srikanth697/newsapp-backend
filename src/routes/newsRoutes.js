import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../config/upload.js";
import {
    createNews,
    getAllNews,
    getSingleNews,
    updateNews,
    deleteNews,
    getMyStatus
} from "../controllers/newsController.js";

const router = express.Router();

/* =========================
   🆕 MULTILINGUAL NEWS API
   ========================= */

// 1. Create News (with Image Upload)
// POST /api/news
router.post("/", protect, upload.single("image"), createNews);

// 2. Get All News (with language filter ?lang=en)
// GET /api/news
router.get("/", getAllNews);

// 3. Get My Status (Legacy/App Support)
// GET /api/news/my-status
router.get("/my-status", protect, getMyStatus);

// 4. Update News
// PUT /api/news/:id
router.put("/:id", protect, updateNews);

// 5. Delete News
// DELETE /api/news/:id
router.delete("/:id", protect, deleteNews);

// 6. Get Single News (Must be last to avoid shadowing specific paths)
// GET /api/news/:id
router.get("/:id", getSingleNews);


/* =========================
   🚧 LEGACY / EXTRA ROUTES
   (Kept for backward compatibility if needed)
   ========================= */

// If you need specific routes like /today, /saved, etc., add them BEFORE /:id

export default router;
