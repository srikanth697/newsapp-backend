import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load JSON manually
const languagesPath = path.join(__dirname, "../data/languages.json");
const languages = JSON.parse(fs.readFileSync(languagesPath, "utf-8"));

export const getLanguage = (req, res) => {
    const { language } = req.body;

    if (!language || !languages[language]) {
        return res.status(400).json({
            success: false,
            message: "Language not supported",
        });
    }

    res.json({
        success: true,
        language,
        translations: languages[language],
    });
};
