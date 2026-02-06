import mongoose from "mongoose";

const NewsSchema = new mongoose.Schema({
    title: String,
    description: String,
    image: String,
    country: String,
    category: String,
    publishedAt: Date,
});

export default mongoose.model("News", NewsSchema);
