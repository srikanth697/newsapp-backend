import Category from "../models/Category.js";
import slugify from "slugify";

export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.json({ success: true, categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createCategory = async (req, res) => {
    try {
        const { name, icon, color, description } = req.body;
        if (!name) return res.status(400).json({ success: false, message: "Name is required" });

        const slug = slugify(name, { lower: true, strict: true });

        const category = await Category.create({
            name,
            slug,
            icon: icon || "bi-tag",
            color: color || "#007bff",
            description
        });

        res.status(201).json({ success: true, category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (name) {
            req.body.slug = slugify(name, { lower: true, strict: true });
        }

        const category = await Category.findByIdAndUpdate(id, req.body, { new: true });
        if (!category) return res.status(404).json({ success: false, message: "Category not found" });

        res.json({ success: true, category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findByIdAndDelete(id);
        if (!category) return res.status(404).json({ success: false, message: "Category not found" });
        res.json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
