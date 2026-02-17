
import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { uploadMiddleware } from "../middleware/uploadMiddleware.js";
import {
    getAllNotifications,
    getUnreadNotifications,
    getNotificationStats,
    sendNotification,
    markNotificationRead,
    getUserNotifications,
    markAsReadForUser,
    getUserUnreadCount,
    deleteNotification
} from "../controllers/notificationController.js";

const router = express.Router();

// 📱 User Notifications (Mobile App)
router.get("/user", protect, getUserNotifications);
router.get("/user/unread-count", protect, getUserUnreadCount);
router.put("/:id/user-read", protect, markAsReadForUser);

// 🔔 Admin Notifications (Dashboard List + Stats)
router.get("/unread", protect, adminOnly, getUnreadNotifications);
router.get("/stats", protect, adminOnly, getNotificationStats);
router.get("/", protect, adminOnly, getAllNotifications);

import multer from "multer";

// Configure simple storage for notifications
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/images/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const notificationUpload = multer({ storage });

// 📬 Send Notification (Action Button)
router.post("/send", protect, adminOnly, notificationUpload.single("image"), sendNotification);

// ✏️ Actions (Read, Delete)
router.put("/:id/read", protect, adminOnly, markNotificationRead);
router.delete("/:id", protect, adminOnly, deleteNotification);

export default router;
