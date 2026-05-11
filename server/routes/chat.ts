import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "../_core/env.js";
import { db } from "../db/db.js";
import { chatMessages } from "../db/schema.js";
import { eq } from "drizzle-orm";

const router = express.Router();
const genAI = new GoogleGenerativeAI(ENV.geminiApiKey);

// GET chat history for a user
router.get("/chat/history", async (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: "userId required" });

  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.userId, parseInt(userId)))
    .orderBy(chatMessages.createdAt)
    .limit(100);

  res.json(messages);
});

// POST new message
router.post("/chat", async (req, res) => {
  const { message, language = "en", userId } = req.body as {
    message: string;
    language?: string;
    userId?: number;
  };

  if (!message) return res.status(400).json({ error: "Message is required" });

  const languageMap: Record<string, string> = {
    en: "English", fr: "French", sw: "Swahili", lg: "Luganda", hi: "Hindi", es: "Spanish",
  };
  const langName = languageMap[language] || "English";

  try {
    // Save user message
    if (userId) {
      await db.insert(chatMessages).values({
        userId,
        role: "user",
        content: message,
        language,
      });
    }

    // Gemini Model
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    
    const prompt = `
You are CropGuard AI, an expert agricultural assistant specializing in African smallholder farming.
CRITICAL: Respond in ${langName}. Keep responses concise, practical, and accessible to farmers.

Farmer's question: ${message}
Provide a helpful, practical response focusing on actionable advice.
`;
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Save assistant response
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
    console.error("❌ Chat error:", err.message);

    const fallbacks: Record<string, string> = {
      en: "I'm sorry, I'm having trouble connecting right now. Please try again shortly.",
      fr: "Je suis désolé, j'ai des difficultés à me connecter. Veuillez réessayer.",
      sw: "Samahani, nina shida kuunganisha. Tafadhali jaribu tena.",
      lg: "Nsonyiwa, nina buzibu okweyunga. Nsaba ogezeeko oluvanyuma.",
    };

    // Still save the fallback as assistant response
    if (userId) {
      await db.insert(chatMessages).values({
        userId,
        role: "assistant",
        content: fallbacks[language] || fallbacks.en,
        language,
      });
    }

    return res.status(200).json({ response: fallbacks[language] || fallbacks.en });
  }
});

// DELETE chat history for a user
router.delete("/chat/history", async (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: "userId required" });

  await db.delete(chatMessages).where(eq(chatMessages.userId, parseInt(userId)));
  res.json({ success: true });
});

export default router;