
import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { uploadMiddleware } from "../middleware/uploadMiddleware.js";
import {
    getAllNotifications,
    getNotificationStats,
    sendNotification,
    markNotificationRead,
    deleteNotification
} from "../controllers/notificationController.js";

const router = express.Router();

// 🔔 Admin Notifications (Dashboard List + Stats)
router.get("/", protect, adminOnly, getAllNotifications);
router.get("/stats", protect, adminOnly, getNotificationStats);

// 📬 Send Notification (Action Button)
router.post("/send", protect, adminOnly, uploadMiddleware, sendNotification);

// ✏️ Actions (Read, Delete)
router.put("/:id/read", protect, adminOnly, markNotificationRead);
router.delete("/:id", protect, adminOnly, deleteNotification);

export default router;
