const KEYWORD_MAP = {
    sports: ["cricket", "football", "tennis", "olympics", "ipl", "fifa", "bcci", "match", "tournament", "athlete", "golf", "wrestling", "score", "game", "stadium", "pro-kabaddi", "sports"],
    technology: ["tech", "iphone", "apple", "google", "microsoft", "silicon", "semiconductor", "cyber", "ai", "artificial intelligence", "robot", "gadget", "software", "whatsapp", "meta", "nvidia", "openai"],
    business: ["market", "stock", "shares", "sensex", "nifty", "economy", "startup", "founder", "billionaire", "bank", "finance", "ceo", "investment", "tax", "budget", "gdp"],
    politics: ["election", "modi", "minister", "parliament", "congress", "bjp", "government", "policy", "visa", "diplomatic", "treaty", "senate", "candidate"],
    entertainment: ["movie", "bollywood", "hollywood", "ott", "netflix", "trailer", "actor", "actress", "celebrity", "cinema", "film", "concert", "music", "pop star", "fashion", "vogue", "paparazzi", "showbiz", "theatre", "box office"]
};

/**
 * Detects the category of an article visually based on title and content
 * @param {string} title 
 * @param {string} content 
 * @returns {string} Example: "politics", "sports", or "current-affairs" 
 */
export const detectCategory = (title, content) => {
    const text = `${title || ""} ${content || ""}`.toLowerCase();

    for (const [category, keywords] of Object.entries(KEYWORD_MAP)) {
        if (keywords.some(kw => text.includes(kw))) {
            return category;
        }
    }

    return "current-affairs"; // Default fallback
};

/**
 * Detects if an article relates to India
 * @param {string} title
 * @param {string} content
 * @returns {boolean}
 */
export const isIndiaNews = (title, content) => {
    const text = `${title || ""} ${content || ""}`.toLowerCase();
    const indiaKeywords = ["india", "delhi", "mumbai", "indian", "chennai", "kolkata", "karnataka", "kerala", "gujarat", "surat", "pune", "hyderabad", "bangalore", "bengaluru", "modi", "shah", "rahul gandhi", "bjp", "congress", "isro", "bharat"];
    return indiaKeywords.some(kw => text.includes(kw));
};
