import axios from "axios";

const DEEPSEEK_API = "https://api.deepseek.com/v1/chat/completions";

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
    const response = await axios.post(
      DEEPSEEK_API,
      {
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("AI rewrite error:", error.message);
    return content;
  }
}

export async function callDeepSeek(prompt, content) {
  try {
    const response = await axios.post(
      DEEPSEEK_API,
      {
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt + "\n\n" + content }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("AI deepseek call error:", error.message);
    throw error;
  }
}

export default { rewriteArticle };
