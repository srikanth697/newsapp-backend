import dotenv from "dotenv";
dotenv.config();
console.log(process.env.NEWS_API_KEY ? "✅ News API key loaded" : "⚠️ News API key missing in .env");

import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

// Connect MongoDB
connectDB();

// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
