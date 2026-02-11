import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswerIndex: { type: Number, required: true }, // Index of the correct option
});

const quizSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: {
        type: String,
        required: true,
        enum: ["Politics", "General", "International", "Sports", "Current Affairs"]
    },
    image: { type: String },
    questions: [questionSchema],
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Easy" },
    totalTime: { type: Number, default: 10 }, // in minutes
}, { timestamps: true });

export default mongoose.model("Quiz", quizSchema);
