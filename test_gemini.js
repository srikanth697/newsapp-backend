import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testV1() {
    try {
        console.log("Testing with v1 API...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: "v1" });
        const result = await model.generateContent("Hello");
        const response = await result.response;
        console.log(`✅ Success: ${response.text()}`);
    } catch (err) {
        console.error(`❌ Error: ${err.message}`);
    }
    process.exit();
}

testV1();
