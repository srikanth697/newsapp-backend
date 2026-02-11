import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        phone: {
            type: String,
        },
        password: {
            type: String,
            required: true,
        },

        // Forgot password
        resetOTP: String,
        resetOTPExpire: Date,

        savedNews: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "News"
        }],
        location: {
            type: String,
            default: ""
        },
        readsCount: {
            type: Number,
            default: 0
        },
        postsCount: {
            type: Number,
            default: 0
        },
        isAdmin: {
            type: Boolean,
            default: false
        },
        darkMode: {
            type: Boolean,
            default: false
        },
        language: {
            type: String,
            default: "en"
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        avatar: {
            type: String,
            default: "" // URL to image
        }
    },
    { timestamps: true }
);

export default mongoose.model("User", userSchema);
