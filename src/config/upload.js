import multer from "multer";

/**
 * 📦 MULTER CONFIG (PRODUCTION VERSION)
 * Uses memoryStorage for Base64 conversion
 * This allows req.file.buffer to be accessible in controllers
 */
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed"), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});

export const handleMulterError = (err, res) => {
    return res.status(500).json({
        success: false,
        error: err.message || "File upload error",
    });
};

export default upload;
