
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

        // Using Aggregation for much better performance
        const categoriesWithStats = await Category.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: "news",
                    let: { categorySlug: "$slug" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $or: [
                                        { $eq: ["$category", "$$categorySlug"] },
                                        { $regexMatch: { input: { $toString: "$category" }, regex: { $concat: ["^", "$$categorySlug", "$"] }, options: "i" } }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "newsItems"
                }
            },
            {
                $project: {
                    name: 1,
                    slug: 1,
                    description: 1,
                    articleCount: { $size: "$newsItems" },
                    createdAt: 1,
                    updatedAt: 1
                }
            },
            { $sort: { name: 1 } }
        ]);

        // Overall Stats
        const totalCategories = categoriesWithStats.length;
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
        console.error("GET Categories Error:", error);
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

        // Improved collision check: case-insensitive for slug, exact for name
        const existing = await Category.findOne({
            $or: [
                { name: { $regex: new RegExp(`^${name}$`, 'i') } },
                { slug: cleanSlug }
            ]
        });

        if (existing) {
            const isNameMatch = existing.name.toLowerCase() === name.toLowerCase();
            return res.status(400).json({
                success: false,
                message: isNameMatch ? `Category name "${name}" already exists` : `Slug "${cleanSlug}" is already taken`
            });
        }

        const category = await Category.create({
            name,
            slug: cleanSlug,
            description
        });

        res.status(201).json({ success: true, message: "Category created successfully", category });
    } catch (error) {
        console.error("CREATE Category Error:", error);
        // Handle duplicate key error from MongoDB
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "A category with this name or slug already exists in the database." });
        }
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
        console.error("UPDATE Category Error:", error);
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "This name or slug is already being used by another category." });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. DELETE CATEGORY
export const deleteCategory = async (req, res) => {
    try {
        // Check if category has news articles before deleting
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        const hasNews = await News.countDocuments({ category: category.slug });
        if (hasNews > 0) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete category. It contains articles. Please move or delete the articles first."
            });
        }

        await Category.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
        console.error("DELETE Category Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
