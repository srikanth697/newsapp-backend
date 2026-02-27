import mongoose from "mongoose";

const newsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: String,
    description: String,
    content: String,
    image: String,
    source: String,
    author: String,
    category: String,
    country: String,
    publishedAt: Date,
    isToday: Boolean,
    views: { type: Number, default: 0 }
}, { timestamps: true });

newsSchema.index({ title: 1 }, { unique: true });
newsSchema.index({ category: 1, isToday: 1 });

export default mongoose.model("News", newsSchema);
