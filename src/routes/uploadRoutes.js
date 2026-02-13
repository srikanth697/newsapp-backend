import express from "express";
import multer from "multer";
import { uploadLocal as upload, handleMulterError } from "../config/upload.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, upload.single("image"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "No image uploaded"
            });
        }

        const protocol = req.headers["x-forwarded-proto"] || req.protocol;
        const host = req.get("host");
        const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

        console.log("✅ Image uploaded:", imageUrl);

        res.status(200).json({
            success: true,
            url: imageUrl,
            filename: req.file.filename,
        });
    } catch (error) {
        console.error("Upload Route Error:", error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error during upload",
            details: error.message,
            stack: error.stack,
        });
    }
});

// Specific error handler for this router if multer fails
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError || err.message.includes("Only image files")) {
        return handleMulterError(err, res);
    }
    next(err);
});

export default router;
