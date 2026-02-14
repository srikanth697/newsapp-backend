import mongoose from "mongoose";

const NewsSchema = new mongoose.Schema({
    // Multilingual Fields
    title: {
        en: { type: String, required: true }, // English is mandatory as fallback
        te: String,
        hi: String,
        ta: String,
        kn: String,
        ml: String
    },
    description: {
        en: String, // Description might be optional in some cases, but good to have en fallback
        te: String,
        hi: String,
        ta: String,
        kn: String,
        ml: String
    },
    content: {
        en: String,
        te: String,
        hi: String,
        ta: String,
        kn: String,
        ml: String
    },

    // Media
    imageUrl: { type: String }, // URL or Base64 string
    source: { type: String, default: "System" },
    sourceUrl: String,

    // Metadata
    category: { type: String, required: true, index: true }, // e.g., politics, sports
    country: { type: String, default: "IN" },

    publishedAt: { type: Date, default: Date.now, index: true },

    // Social Counters
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    savedCount: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // User / Admin Fields
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
        index: true
    },
    rejectionReason: String,
    isUserPost: { type: Boolean, default: false },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true // Automatically manages createdAt and updatedAt
});

// Indexes for performance
NewsSchema.index({ "title.en": "text", "description.en": "text" });
NewsSchema.index({ category: 1, publishedAt: -1 });

export default mongoose.model("News", NewsSchema);
