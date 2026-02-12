import express from "express";
import { upload } from "../config/upload.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "No image uploaded"
            });
        }

        const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

        res.json({
            success: true,
            url: imageUrl,
            filename: req.file.filename,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Upload failed",
            details: error.message,
        });
    }
});

export default router;
