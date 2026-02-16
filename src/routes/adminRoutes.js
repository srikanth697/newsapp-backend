
import express from "express";
import {
    adminLogin,
    forgotPassword,
    resetPassword,
    verifyResetCode
} from "../controllers/adminController.js";

const router = express.Router();

// 🔐 Authentication
router.post("/login", adminLogin);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);

export default router;
