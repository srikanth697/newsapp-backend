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

// 🔍 SPECIFIC FILTER ROUTES (Must be before /:id)
router.get("/previous", getAllNews); // We will handle "previous" logic in getAllNews via query param override or specific controller if preferred
router.get("/today", getAllNews);    // We will handle "today" via query param

// 3. Get My Status (Legacy/App Support)
// GET /api/news/my-status
router.get("/my-status", protect, getMyStatus);

//  👍 SOCIAL ACTIONS
router.post("/:id/like", async (req, res) => {
   // Implementing inline or importing from controller. 
   // For now, let's keep it consistent and move logic to controller in next step.
   // But to fix the 404/400 immediately, we define the route.
   res.status(501).json({ message: "Social actions moving to controller..." });
});

router.post("/:id/share", async (req, res) => res.json({ success: true }));
router.post("/:id/save", protect, async (req, res) => res.json({ success: true }));

// 🛡️ ADMIN ROUTES
router.get("/admin/pending", protect, async (req, res) => res.json([])); // Placeholders for now
router.post("/admin/approve/:id", protect, async (req, res) => res.json({ success: true }));
router.post("/admin/reject/:id", protect, async (req, res) => res.json({ success: true }));

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
