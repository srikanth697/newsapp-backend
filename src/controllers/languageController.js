import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load JSON manually
const languagesPath = path.join(__dirname, "../data/languages.json");
const languages = JSON.parse(fs.readFileSync(languagesPath, "utf-8"));

export const getLanguage = (req, res) => {
    let { language } = req.body;

    // Default to 'en' if not provided or not supported
    if (!language || !languages[language]) {
        language = "en";
    }

    res.json({
        success: true,
        language,
        translations: languages[language],
    });
};
