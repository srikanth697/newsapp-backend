import mongoose from "mongoose";

const newsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true }, // Logic: Use slug as the primary unique identifier
    shortDescription: String,
    rewrittenContent: String,
    image: { type: String, required: true },
    source: String,
    author: { type: String, default: "First Report Staff" },
    category: { type: String, required: true },
    country: { type: String, default: "world" },
    publishedAt: { type: Date, required: true },
    isToday: { type: Boolean, default: true },
    views: { type: Number, default: 0 }
}, { timestamps: true });

// Strict Indexes
newsSchema.index({ slug: 1 }, { unique: true });
newsSchema.index({ category: 1, isToday: 1 });
newsSchema.index({ publishedAt: -1 });
newsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.model("News", newsSchema);
