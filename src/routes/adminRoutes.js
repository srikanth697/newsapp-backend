import express from "express";
import {
    getDashboardData,
    getSubmissions,
    getSubmissionStats,
    getUsers,
    getUserStats
} from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes here should be protected and only for admins
router.use(protect, adminOnly);

// Dashboard
router.get("/dashboard", getDashboardData);

// Submissions
router.get("/submissions", getSubmissions);
router.get("/submissions/stats", getSubmissionStats);

// Users
router.get("/users", getUsers);
router.get("/users/stats", getUserStats);

export default router;
