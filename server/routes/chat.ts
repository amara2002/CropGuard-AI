import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "../_core/env.js";
import { db } from "../db/db.js";
import { chatMessages } from "../db/schema.js";
import { eq } from "drizzle-orm";

const router = express.Router();

// Initialize Gemini with API key
if (!ENV.geminiApiKey || ENV.geminiApiKey === "") {
  console.error("❌ GEMINI_API_KEY is missing from environment variables!");
}
const genAI = new GoogleGenerativeAI(ENV.geminiApiKey);

// GET chat history for a user
router.get("/chat/history", async (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: "userId required" });

  try {
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, parseInt(userId)))
      .orderBy(chatMessages.createdAt)
      .limit(100);

    res.json(messages);
  } catch (err: any) {
    console.error("❌ History error:", err.message);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// POST new message
router.post("/chat", async (req, res) => {
  const { message, language = "en", userId } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const languageMap: Record<string, string> = {
    en: "English", fr: "French", sw: "Swahili", lg: "Luganda", hi: "Hindi", es: "Spanish",
  };
  const langName = languageMap[language] || "English";

  try {
    // Save user message if logged in
    if (userId) {
      await db.insert(chatMessages).values({
        userId,
        role: "user",
        content: message,
        language,
      });
    }

    // Log API key status (first few chars only for security)
    const apiKeyPrefix = ENV.geminiApiKey ? ENV.geminiApiKey.substring(0, 10) + "..." : "MISSING";
    console.log(`🤖 Chat request - Language: ${langName}, API Key: ${apiKeyPrefix}`);

    // Use the same model that works locally
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    
    const prompt = `You are CropGuard AI, an expert agricultural assistant specializing in African smallholder farming.
CRITICAL: Respond in ${langName}. Keep responses concise, practical, and accessible to farmers.

Farmer's question: ${message}
Provide a helpful, practical response focusing on actionable advice.`;

    console.log(`📤 Sending to Gemini (${message.length} chars)...`);
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    console.log(`✅ Response received (${response.length} chars)`);

    // Save assistant response if logged in
    if (userId) {
      await db.insert(chatMessages).values({
        userId,
        role: "assistant",
        content: response,
        language,
      });
    }

    return res.status(200).json({ response });
    
  } catch (err: any) {
    // Log detailed error
    console.error("❌ Chat error:");
    console.error("  Message:", err.message);
    if (err.status) console.error("  Status:", err.status);
    if (err.response?.data) console.error("  Response:", JSON.stringify(err.response.data, null, 2));

    // Fallback responses in multiple languages
    const fallbacks: Record<string, string> = {
      en: "I apologize, but I'm having trouble connecting right now. Please try again in a moment. For immediate help, check your local agricultural extension office.",
      fr: "Je suis désolé, j'ai des difficultés à me connecter. Veuillez réessayer dans un instant.",
      sw: "Samahani, nina shida kuunganisha. Tafadhali jaribu tena baada ya muda.",
      lg: "Nsonyiwa, nina buzibu okweyunga. Nsaba ogezeeko oluvanyuma.",
    };

    const fallbackResponse = fallbacks[language] || fallbacks.en;
    
    if (userId) {
      await db.insert(chatMessages).values({
        userId,
        role: "assistant",
        content: fallbackResponse,
        language,
      });
    }

    return res.status(200).json({ response: fallbackResponse });
  }
});

// DELETE chat history for a user
router.delete("/chat/history", async (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: "userId required" });

  try {
    await db.delete(chatMessages).where(eq(chatMessages.userId, parseInt(userId)));
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Delete error:", err);
    res.status(500).json({ error: "Failed to delete history" });
  }
});

export default router;