import mongoose from "mongoose";

const NewsSchema = new mongoose.Schema({
    title: String,
    description: String,
    content: String,
    image: String,
    sourceUrl: String,

    country: String,       // IN, US, GLOBAL
    category: String,      // politics, sports, business, tech, etc.

    publishedAt: Date,

    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

export default mongoose.model("News", NewsSchema);
