
import mongoose from "mongoose";

const QuizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ["general", "science", "history", "geography", "entertainment", "sports"]
    },
    difficulty: {
        type: String,
        enum: ["easy", "medium", "hard"],
        default: "medium"
    },
    questions: [
        {
            questionText: { type: String, required: true },
            options: [{ type: String, required: true }], // Array of 4 options
            correctOptionIndex: { type: Number, required: true }, // 0-3
            explanation: String
        }
    ],
    status: {
        type: String,
        enum: ["draft", "published", "archived"],
        default: "draft"
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    timerMinutes: {
        type: Number,
        default: 5
    }
}, {
    timestamps: true
});

export default mongoose.model("Quiz", QuizSchema);
