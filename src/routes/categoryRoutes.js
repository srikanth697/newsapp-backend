
import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory
} from "../controllers/categoryController.js";

const router = express.Router();

// 📂 Get Categories (Admin Dashboard - List + Stats)
router.get("/", protect, adminOnly, getAllCategories);

// ➕ Create Category
router.post("/", protect, adminOnly, createCategory);

// ✏️ Update Category
router.put("/:id", protect, adminOnly, updateCategory);

// 🗑️ Delete Category
router.delete("/:id", protect, adminOnly, deleteCategory);

export default router;
