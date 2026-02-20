import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * 🧠 Safe JSON Parser
 */
function safeParse(text) {
    try {
        return JSON.parse(text);
    } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                return JSON.parse(match[0]);
            } catch (e) {
                throw new Error("Invalid JSON structure even after cleaning.");
            }
        }
        throw new Error("No JSON found in response.");
    }
}

/**
 * 🤖 Gemini Rewrite Service
 * Rules:
 * - No "AI Rewrite:" prefix
 * - Trimmed input to 6000 chars
 * - Multiple model rotation
 */
export const rewriteWithAI = async (text, originalTitle = "") => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.error("❌ Missing GEMINI_API_KEY in .env");
            return null;
        }

        const modelNames = ["gemini-flash-latest", "gemini-2.0-flash", "gemini-pro-latest", "gemini-1.5-flash"];
        let result = null;
        let successfulModel = "";

        // Trim input strictly
        const trimmed = text.substring(0, 6000);

        const prompt = `
        You are a professional senior news editor.
        Rewrite the following article into a fully detailed news report.

        STRICT RULES:
        1. Minimum 500 words. (Target between 500-700 words)
        2. Must contain 2-3 structured paragraphs.
        3. Must end with a strong concluding paragraph.
        4. No bullet points.
        5. No summary style writing.
        6. No short description.
        7. Do not cut content.
        8. Maintain journalistic tone.
        9. No "AI generated" wording.
        10. Return ONLY JSON.

        Return format:
        {
          "title": "",
          "summary": "",      // 2–3 sentence short intro (max 60 words)
          "content": "",      // Minimum 500 words full article
          "category": "",     // politics, business, sports, technology, entertainment, world
          "region": ""        // india or world
        }

        Article Content to Expand:
        ${trimmed}
        `;

        for (const modelName of modelNames) {
            try {
                console.log(`🤖 Attempting AI rewrite with ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });

                // Add a small local retry for the model if it's transient
                let attempts = 0;
                while (attempts < 2) {
                    try {
                        const modelResult = await model.generateContent(prompt);
                        if (modelResult && modelResult.response) {
                            result = modelResult;
                            successfulModel = modelName;
                            break;
                        }
                    } catch (innerErr) {
                        attempts++;
                        if (attempts >= 2) throw innerErr;
                        await new Promise(r => setTimeout(r, 1000));
                    }
                }

                if (result) break;
            } catch (err) {
                console.warn(`⚠️ Model ${modelName} failed: ${err.message}`);
                continue;
            }
        }

        if (!result) {
            throw new Error("All models failed");
        }

        const response = await result.response;
        const raw = response.text();
        const cleaned = raw.replace(/```json|```/g, "").trim();
        const aiData = safeParse(cleaned);

        // Sanity check to remove prefix if AI ignored instructions
        if (aiData.title && aiData.title.startsWith("AI Rewrite:")) {
            aiData.title = aiData.title.replace("AI Rewrite:", "").trim();
        }

        console.log(`✅ AI Rewrite successful via ${successfulModel}`);
        return aiData;

    } catch (error) {
        console.error("❌ Gemini API Service Error:", error.message);

        // 🛡️ STABLE FALLBACK: Use original content without truncation where possible
        return {
            title: originalTitle || (text.substring(0, 100).trim() + "..."),
            summary: text.substring(0, 500).trim(),
            content: text, // Use full text for content in fallback
            category: "General",
            isFallback: true
        };
    }
};
