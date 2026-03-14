import fs from "fs";
import path from "path";

const languagesPath = path.join(process.cwd(), "src", "i18n", "languages.json");
const languages = JSON.parse(fs.readFileSync(languagesPath, "utf-8"));

export const getLanguage = (req, res) => {
    const lang = req.language || "en";
    res.json({
        success: true,
        language: lang,
        translations: languages[lang] || languages["en"] || {},
        supportedLanguages: Object.keys(languages)
    });
};

export const updateLanguage = (req, res) => {
    // For users without a bearer token, they can still "update" their language
    // by fetching the new translations. The client will store the selection.
    const lang = req.language || "en";
    res.json({
        success: true,
        message: `Language updated to ${lang}`,
        language: lang,
        translations: languages[lang] || languages["en"] || {},
        supportedLanguages: Object.keys(languages)
    });
};
