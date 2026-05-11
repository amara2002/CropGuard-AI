import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "../_core/env.js";
import { db } from "../db/db.js";
import { chatMessages } from "../db/schema.js";
import { eq } from "drizzle-orm";

const router = express.Router();

// Test endpoint
router.get("/ping", (req, res) => {
  res.json({ message: "Chat route is working!", timestamp: new Date().toISOString() });
});

// Initialize Gemini
const genAI = new GoogleGenerativeAI(ENV.geminiApiKey);

// GET chat history
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
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// POST new message
router.post("/chat", async (req, res) => {
  const { message, language = "en", userId } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  console.log("📨 Chat request received:", { 
    message: message.substring(0, 50), 
    language, 
    userId 
  });

  const languageMap: Record<string, string> = {
    en: "English", fr: "French", sw: "Swahili", lg: "Luganda",
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

    // Gemini Model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `You are CropGuard AI, an expert agricultural assistant specializing in African smallholder farming.
CRITICAL: Respond in ${langName}. Keep responses concise, practical, and accessible to farmers.

Farmer's question: ${message}
Provide a helpful, practical response focusing on actionable advice.`;

    console.log("🤖 Calling Gemini API with gemini-1.5-flash...");
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    console.log("✅ Gemini response received");

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
    console.error("❌ Chat error:", err.message);
    
    let fallback = "I'm having trouble connecting right now. Please try again in a moment.";
    return res.status(200).json({ response: fallback });
  }
});

// DELETE chat history
router.delete("/chat/history", async (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: "userId required" });

  try {
    await db.delete(chatMessages).where(eq(chatMessages.userId, parseInt(userId)));
    res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete history" });
  }
});

export default router;