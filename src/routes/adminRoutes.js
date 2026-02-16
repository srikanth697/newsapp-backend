import express from "express";
import {
    adminLogin,
    forgotPassword,
    resetPassword,
    verifyResetCode,
    getDashboardStats,
    getAllNews,
    getSingleNews,
    createNewsAdmin,
    updateNewsAdmin,
    deleteNewsAdmin
} from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { uploadMiddleware } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// 🔐 Authentication
router.post("/login", adminLogin);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);

// 📊 Dashboard (Protected)
router.get("/dashboard", protect, adminOnly, getDashboardStats);

// 📰 News Management (Protected)
router.get("/news", protect, adminOnly, getAllNews);
router.get("/news/:id", protect, adminOnly, getSingleNews);
router.post("/news", protect, adminOnly, uploadMiddleware, createNewsAdmin);
router.put("/news/:id", protect, adminOnly, uploadMiddleware, updateNewsAdmin);
router.delete("/news/:id", protect, adminOnly, deleteNewsAdmin);

export default router;
