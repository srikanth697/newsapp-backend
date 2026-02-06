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
    },
    { timestamps: true }
);

export default mongoose.model("User", userSchema);
