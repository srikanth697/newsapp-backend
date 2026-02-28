import axios from "axios";

export const callDeepSeek = async (systemPrompt, userPrompt) => {
    try {
        if (!process.env.DEEPSEEK_API_KEY) {
            throw new Error("DEEPSEEK_API_KEY is missing");
        }

        const response = await axios.post(
            "https://api.deepseek.com/chat/completions",
            {
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.4,
                max_tokens: 1500
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                    "Content-Type": "application/json"
                },
                timeout: 30000 // 30s timeout
            }
        );

        return response.data.choices[0].message.content;
    } catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.message;
        console.error("DeepSeek API Error:", errorMsg);

        // Specifically handle Insufficient Balance
        if (errorMsg.toLowerCase().includes("insufficient balance")) {
            throw new Error("AI_BALANCE_EXHAUSTED");
        }

        throw new Error(errorMsg);
    }
};
