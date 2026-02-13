import express from "express";
import { getLanguage } from "../controllers/languageController.js";

const router = express.Router();

router.get("/", getLanguage);

export default router;
