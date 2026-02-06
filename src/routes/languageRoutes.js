import express from "express";
import { getLanguage } from "../controllers/languageController.js";

const router = express.Router();

router.post("/language", getLanguage);

export default router;
