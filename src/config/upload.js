import multer from "multer";

/**
 * 📦 MULTER CONFIG (PRODUCTION VERSION - EXTENSION BASED)
 * Uses memoryStorage for Base64 conversion.
 * Validates based on file extension to fix Flutter mimetype issues.
 */
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        console.log("Incoming file for validation:");
        console.log("Original Name:", file.originalname);
        console.log("Mime Type received:", file.mimetype);

        // Accept based on extension (Fixes application/octet-stream issues from mobile)
        if (/\.(jpg|jpeg|png|webp)$/i.test(file.originalname)) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed"), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});

export const handleMulterError = (err, res) => {
    return res.status(500).json({
        success: false,
        error: err.message || "File upload error",
    });
};

export default upload;
