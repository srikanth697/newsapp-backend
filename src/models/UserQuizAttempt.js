
import mongoose from "mongoose";

const userQuizAttemptSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        quiz: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Quiz",
            required: true
        },
        score: {
            type: Number,
            required: true
        },
        totalQuestions: {
            type: Number,
            required: true
        },
        correctAnswers: {
            type: Number,
            required: true
        },
        responses: [
            {
                questionId: mongoose.Schema.Types.ObjectId,
                selectedOptionIndex: Number,
                isCorrect: Boolean
            }
        ],
        completedAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

export default mongoose.model("UserQuizAttempt", userQuizAttemptSchema);
