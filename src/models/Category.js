
import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    slug: {
        type: String,
        lowercase: true,
        trim: true,
        required: true,
        unique: true
    },
    description: {
        type: String
    },
    articleCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

export default mongoose.model("Category", CategorySchema);
