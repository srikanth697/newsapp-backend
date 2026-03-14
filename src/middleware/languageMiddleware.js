import fs from "fs";
import path from "path";

// Load languages.json once
const languagesPath = path.join(process.cwd(), "src", "i18n", "languages.json");
const languages = JSON.parse(fs.readFileSync(languagesPath, "utf-8"));

function detectLanguage(req) {
	// 1. Query param (?lang=)
	let lang = req.query.lang;
	// 2. Body param (if POST/PUT)
	if (!lang && req.body) {
		lang = req.body.lang || req.body.language;
	}
	// 3. Accept-Language header
	if (!lang && req.headers["accept-language"]) {
		const acceptLang = req.headers["accept-language"].split(",")[0].trim();
		lang = acceptLang.split("-")[0]; // e.g., "en-US" → "en"
	}
	// 4. Fallback to English
	if (!lang || !languages[lang]) lang = "en";
	return lang;
}

function tFactory(lang) {
	const translations = languages[lang] || languages["en"];
	return function (key) {
		return translations[key] || key;
	};
}

export function languageMiddleware(req, res, next) {
	const lang = detectLanguage(req);
	req.language = lang;
	req.t = tFactory(lang);
	next();
}
