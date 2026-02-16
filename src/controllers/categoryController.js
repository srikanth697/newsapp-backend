
import Category from "../models/Category.js";
import News from "../models/News.js";

// ==========================================
// 🗂️ CATEGORY MANAGEMENT
// ==========================================

// 1. GET ALL CATEGORIES + STATS (Dashboard Cards)
export const getAllCategories = async (req, res) => {
    try {
        const { search } = req.query;
        let filter = {};

        if (search) {
            filter.name = { $regex: search, $options: "i" };
        }

        const categories = await Category.find(filter).sort({ name: 1 });

        // Calculate stats for each category
        const categoriesWithStats = await Promise.all(categories.map(async (cat) => {
            // Count articles for this category using the 'slug' or 'name' as key in News
            // Assuming News model uses 'category' string field equal to slug or ID.
            // Let's assume News.category stores the SLUG (e.g. 'politics') as per current app design.

            const count = await News.countDocuments({
                category: { $regex: new RegExp(`^${cat.slug}$`, 'i') }
            });

            return {
                ...cat.toObject(),
                articleCount: count
            };
        }));

        // Overall Stats
        const totalCategories = categories.length;
        const totalArticles = categoriesWithStats.reduce((sum, cat) => sum + cat.articleCount, 0);
        const avgPerCategory = totalCategories > 0 ? Math.round(totalArticles / totalCategories) : 0;

        res.json({
            success: true,
            stats: {
                totalCategories,
                totalArticles,
                avgPerCategory
            },
            categories: categoriesWithStats
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. CREATE CATEGORY
export const createCategory = async (req, res) => {
    try {
        const { name, slug, description } = req.body;

        if (!name || !slug) {
            return res.status(400).json({ success: false, message: "Name and Slug are required" });
        }

        // Normalize slug
        const cleanSlug = slug.toLowerCase().trim().replace(/^\//, ''); // Remove leading slash if user added it

        const existing = await Category.findOne({ $or: [{ name }, { slug: cleanSlug }] });
        if (existing) {
            return res.status(400).json({ success: false, message: "Category name or slug already exists" });
        }

        const category = await Category.create({
            name,
            slug: cleanSlug,
            description
        });

        res.status(201).json({ success: true, message: "Category created successfully", category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. UPDATE CATEGORY
export const updateCategory = async (req, res) => {
    try {
        const { name, slug, description } = req.body;
        const categoryId = req.params.id;

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        if (name) category.name = name;
        if (slug) category.slug = slug.toLowerCase().trim().replace(/^\//, '');
        if (description) category.description = description;

        await category.save();

        res.json({ success: true, message: "Category updated successfully", category });
    } catch (error) {
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Category name or slug already exists" });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. DELETE CATEGORY
export const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        res.json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
