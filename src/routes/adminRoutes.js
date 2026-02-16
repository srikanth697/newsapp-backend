import express from "express";
import {
    adminLogin,
    forgotPassword,
    resetPassword,
    verifyResetCode,
    getDashboardStats
} from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔐 Authentication
router.post("/login", adminLogin);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);

// 📊 Dashboard (Protected)
router.get("/dashboard", protect, adminOnly, getDashboardStats);

export default router;
