import express from "express";
import { getLanguage } from "../controllers/languageController.js";

const router = express.Router();

router.get("/language", getLanguage);

export default router;
