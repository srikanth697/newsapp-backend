import express from "express";
import { getLanguage } from "../controllers/languageController.js";

const router = express.Router();

router.post("/", getLanguage);

export default router;
