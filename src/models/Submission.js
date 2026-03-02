import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    content: { type: String },
    imageUrl: { type: String },
    category: { type: String, required: true },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected", "fake"],
        default: "pending"
    },
    author: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        fullName: { type: String },
        email: { type: String }
    },
    aiDetection: {
        label: { type: String, default: "Real" },
        score: { type: Number, default: 0.95 }
    },
    rejectionReason: { type: String },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model("Submission", submissionSchema);
