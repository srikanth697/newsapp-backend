import mongoose from "mongoose";

const systemSettingsSchema = new mongoose.Schema({
    privacyPolicy: {
        type: String,
        default: "Our privacy policy ensures your data is protected..."
    },
    termsAndConditions: {
        type: String,
        default: "By using our service, you agree to these terms..."
    },
    // We can add more global settings here later if needed
}, { timestamps: true });

export default mongoose.model("SystemSettings", systemSettingsSchema);
