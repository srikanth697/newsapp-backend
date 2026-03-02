import axios from "axios";

export const callDeepSeek = async (systemPrompt, userPrompt) => {
    try {
        const apiKey = process.env.DEEPSEEK_API_KEY;
        if (!apiKey) {
            throw new Error("AI API Key (DEEPSEEK_API_KEY) is missing in .env");
        }

        // 🧠 Auto-detect Provider: GitHub Models vs DeepSeek
        const isGithubToken = apiKey.startsWith("github_pat_");

        const endpoint = isGithubToken
            ? "https://models.inference.ai.azure.com/chat/completions"
            : "https://api.deepseek.com/chat/completions";

        const modelName = isGithubToken
            ? "gpt-4o"
            : "deepseek-chat";

        console.log(`🤖 AI Provider: ${isGithubToken ? 'GitHub Models' : 'DeepSeek'} (${modelName})`);

        const response = await axios.post(
            endpoint,
            {
                model: modelName,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.4,
                max_tokens: 1500
            },
            {
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                timeout: 30000 // 30s timeout
            }
        );

        return response.data.choices[0].message.content;
    } catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.message;
        console.error("AI API Error:", errorMsg);

        // Handle Insufficient Balance
        if (errorMsg.toLowerCase().includes("insufficient balance")) {
            throw new Error("AI_BALANCE_EXHAUSTED");
        }

        throw new Error(errorMsg);
    }
};
