
import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure upload directories exist
const uploadDirs = [
    "uploads/images",
    "uploads/videos",
    "uploads/audio"
];

uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === "image") {
            cb(null, "uploads/images/");
        } else if (file.fieldname === "video") {
            cb(null, "uploads/videos/");
        } else if (file.fieldname === "audio") {
            cb(null, "uploads/audio/");
        } else {
            cb(new Error("Invalid field name"), false);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File Filter
const fileFilter = (req, file, cb) => {
    if (file.fieldname === "image") {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Only image files are allowed!"), false);
        }
    } else if (file.fieldname === "video") {
        if (!file.mimetype.startsWith("video/")) {
            return cb(new Error("Only video files are allowed!"), false);
        }
    } else if (file.fieldname === "audio") {
        if (!file.mimetype.startsWith("audio/")) {
            return cb(new Error("Only audio files are allowed!"), false);
        }
    }
    cb(null, true);
};

// Limits
const limits = {
    fileSize: 100 * 1024 * 1024 // 100MB limit (mainly for video)
};

// Export Middleware
export const uploadMiddleware = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: limits
}).fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
    { name: "audio", maxCount: 1 }
]);
