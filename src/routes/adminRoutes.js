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
    deleteNewsAdmin,
    getUserSubmissions,
    getSubmissionStats,
    getSingleSubmission,
    approveSubmission,
    rejectSubmission,
    markFakeSubmission,
    getAllUsers,
    getUserStats,
    getSingleUser,
    blockUser,
    unblockUser,
    deleteUser
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

// 📬 User Submitted News (Approval System)
router.get("/submissions", protect, adminOnly, getUserSubmissions);
router.get("/submissions/stats", protect, adminOnly, getSubmissionStats); // Stats must be before /:id to avoid conflict
router.get("/submissions/:id", protect, adminOnly, getSingleSubmission);

router.put("/submissions/:id/approve", protect, adminOnly, approveSubmission);
router.put("/submissions/:id/reject", protect, adminOnly, rejectSubmission);
router.put("/submissions/:id/mark-fake", protect, adminOnly, markFakeSubmission);

// 👤 User Management (New)
router.get("/users/stats", protect, adminOnly, getUserStats); // Stats MUST be before :id
router.get("/users", protect, adminOnly, getAllUsers);
router.get("/users/:id", protect, adminOnly, getSingleUser);

router.put("/users/:id/block", protect, adminOnly, blockUser);
router.put("/users/:id/unblock", protect, adminOnly, unblockUser);
router.delete("/users/:id", protect, adminOnly, deleteUser);

export default router;
