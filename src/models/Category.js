import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    icon: { type: String, default: "bi-tag" },
    color: { type: String, default: "#007bff" },
    description: String,
    isActive: { type: Boolean, default: true },
    itemCount: { type: Number, default: 0 } // Optional: track news/quizzes in this category
}, { timestamps: true });

export default mongoose.model("Category", categorySchema);
