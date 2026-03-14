import express from "express";
import { getLanguage, updateLanguage } from "../controllers/languageController.js";

const router = express.Router();

// Fetch language bundle (resolves 404 for GET /api/language)
router.get("/", getLanguage);

// In case the frontend was relying on POST /api/language
router.post("/", getLanguage);

// Update/fetch a specific language for unauthenticated guests
router.post("/update", updateLanguage);

export default router;
