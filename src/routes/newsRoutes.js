import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../config/upload.js";
import {
   createNews,
   getAllNews,
   getSingleNews,
   updateNews,
   deleteNews,
   getMyStatus,
   incrementNewsView,
   getPendingNews,
   approveNews,
   rejectNews
} from "../controllers/newsController.js";

const router = express.Router();

/* =========================
   🆕 MULTILINGUAL NEWS API
   ========================= */

// 1. Create News (Standard REST)
// POST /api/news
router.post("/", protect, upload.single("image"), createNews);

// 🔄 LEGACY ALIASES (For older app versions)
router.post("/create", protect, upload.single("image"), createNews);
router.post("/submit", protect, upload.single("image"), createNews);

// 2. Get All News (Standard REST)
// GET /api/news
router.get("/", getAllNews);

// 🔍 SPECIFIC FILTER ROUTES (Must be before /:id)
router.get("/previous", getAllNews); // Maps to getAllNews logic
router.get("/today", getAllNews);    // Maps to getAllNews logic

// 3. Get My Status (Legacy/App Support)
// GET /api/news/my-status
router.get("/my-status", protect, getMyStatus);

//  👍 SOCIAL ACTIONS (Basic Implementation)
router.put("/:id/view", incrementNewsView); // 👁️ NEW VIEW API
router.post("/:id/like", async (req, res) => {
   // TODO: Move to controller properly. For now, return success to unblock client.
   res.json({ success: true, likes: 0 });
});

router.post("/:id/share", async (req, res) => {
   res.json({ success: true, shares: 0 });
});

router.post("/:id/save", protect, async (req, res) => {
   res.json({ success: true, savedCount: 0 });
});

// 🛡️ ADMIN ROUTES
router.get("/admin/pending", protect, getPendingNews);
router.post("/admin/approve/:id", protect, approveNews);
router.post("/admin/reject/:id", protect, rejectNews);

// 4. Update News

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
