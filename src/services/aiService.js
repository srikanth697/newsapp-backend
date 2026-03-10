import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function rewriteArticle(content) {
  const prompt = `
Rewrite this news article as a professional journalist.

Rules:
- Keep factual accuracy
- Maintain original meaning
- Write clearly in human journalistic tone
- Output 400 to 500 words
- Single coherent news article
- No plagiarism

Article:
${content}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Gemini rewrite error:", error.message);
    return null;
  }
}

async function generateQuiz(content) {
  const prompt = `
Generate a 5-question multiple choice quiz based on this news article.
Format the output as a valid JSON array of objects.
Do not include any other text, just the JSON array.
Each object must have:
- question (string)
- options (array of 4 strings)
- correctAnswer (string, must be one of the options)
- explanation (string)

Article:
${content}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Clean up potential markdown formatting
    if (text.includes("```json")) {
      text = text.split("```json")[1].split("```")[0];
    } else if (text.includes("```")) {
      text = text.split("```")[1].split("```")[0];
    }

    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Gemini quiz error:", error.message);
    return [];
  }
}

// Global Legacy Support for other modules
export async function callDeepSeek(prompt, content) {
  try {
    const result = await model.generateContent(prompt + "\n\n" + content);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Gemini call error (legacy callDeepSeek):", error.message);
    throw error;
  }
}

export { rewriteArticle, generateQuiz };
export default { rewriteArticle, generateQuiz, callDeepSeek };
