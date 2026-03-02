import express from "express";
import {
    getDashboardData,
    getSubmissions,
    getSubmissionStats,
    getUsers,
    getUserStats,
    getAdminNews,
    getSingleAdminNews,
    createAdminNews,
    updateAdminNews,
    deleteAdminNews,
    approveSubmission,
    rejectSubmission,
    markFakeSubmission
} from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { getAdminQuizzes, createQuiz, updateQuiz, deleteQuiz } from "../modules/quiz/quiz.controller.js";
import { getAllNotifications, sendNotification, deleteNotification } from "../controllers/notificationController.js";
import { getSystemSettings, updateSystemSettings } from "../controllers/settingsController.js";
import { getProfile, updateProfile } from "../controllers/authController.js";
import multer from "multer";

// Configure simple storage for admin-sent notification images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/images/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const notificationUpload = multer({ storage });

const router = express.Router();

// All routes here should be protected and only for admins
router.use(protect, adminOnly);

// Dashboard
router.get("/dashboard", getDashboardData);

// Submissions
router.get("/submissions", getSubmissions);
router.get("/submissions/stats", getSubmissionStats);
router.put("/submissions/:id/approve", approveSubmission);
router.put("/submissions/:id/reject", rejectSubmission);
router.put("/submissions/:id/mark-fake", markFakeSubmission);

// Users
router.get("/users", getUsers);
router.get("/users/stats", getUserStats);

// News Management
router.get("/news", getAdminNews);
router.get("/news/:id", getSingleAdminNews);
router.post("/news", createAdminNews);
router.put("/news/:id", updateAdminNews);
router.delete("/news/:id", deleteAdminNews);

// Quiz Management
router.get("/quizzes", getAdminQuizzes);
router.post("/quizzes", createQuiz);
router.put("/quizzes/:id", updateQuiz);
router.delete("/quizzes/:id", deleteQuiz);

// Notification Management
router.get("/notifications", getAllNotifications);
router.post("/notifications/send", notificationUpload.single("image"), sendNotification);
router.delete("/notifications/:id", deleteNotification);

// System Settings
router.get("/settings", getSystemSettings);
router.put("/settings", updateSystemSettings);

// Admin Profile Management
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

export default router;
