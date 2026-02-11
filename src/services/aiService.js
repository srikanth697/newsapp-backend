/**
 * 🤖 Smart AI Content Correction Service
 * 
 * This service simulates AI correction for user posts.
 * It improves grammar, capitalization, and tone to make 
 * user articles look more professional before they reach the admin.
 */

export const correctNewsContent = async (title, description) => {
    // 📝 AI Logic Simulation (Can be replaced with Google Gemini/OpenAI API)

    const polishText = (text) => {
        if (!text) return "";
        let polished = text.trim();

        // 1. Capitalize first letter of every sentence
        polished = polished.replace(/(^\w|\.\s+\w)/gm, (match) => match.toUpperCase());

        // 2. Remove multiple spaces
        polished = polished.replace(/\s+/g, ' ');

        // 3. Ensure it ends with a period if it's a long sentence
        if (polished.length > 20 && !polished.endsWith('.')) {
            polished += '.';
        }

        return polished;
    };

    const AI_title = polishText(title);
    const AI_description = polishText(description);

    return {
        title: AI_title,
        description: AI_description,
        isAIModified: true
    };
};
