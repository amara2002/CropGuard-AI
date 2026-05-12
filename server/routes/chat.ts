// server/routes/chat.ts
// CropGuard AI - AI Chat Assistant Routes
// 
// Purpose: Provide conversational AI assistance for farmers using Google Gemini.
//          Handles chat message storage, retrieval, and deletion.
//          Supports 4 languages: English, French, Swahili, Luganda.
//
// Features:
// - Persistent chat history (stored in PostgreSQL)
// - Multilingual responses
// - Conversation memory per user
// - Fallback responses when AI unavailable

import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "../_core/env.js";
import { db } from "../db/db.js";
import { chatMessages } from "../db/schema.js";
import { eq } from "drizzle-orm";

const router = express.Router();

// ============================================================================
// Health/Test Endpoint
// ============================================================================

/**
 * Simple ping endpoint to verify chat routes are working
 * Used by frontend to test API connectivity
 */
router.get("/ping", (req, res) => {
  res.json({ 
    message: "Chat route is working!", 
    timestamp: new Date().toISOString() 
  });
});

// ============================================================================
// Gemini AI Initialization
// ============================================================================

const genAI = new GoogleGenerativeAI(ENV.geminiApiKey);

// ============================================================================
// Chat History Routes
// ============================================================================

/**
 * GET /api/chat/history - Retrieve user's chat history
 * 
 * Returns last 100 messages (most recent first)
 * 
 * @query userId - ID of the authenticated user
 * @returns Array of chat messages with role (user/assistant) and content
 */
router.get("/chat/history", async (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: "userId required" });

  try {
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, parseInt(userId)))
      .orderBy(chatMessages.createdAt)  // Chronological order
      .limit(100);                       // Limit to prevent performance issues
    
    res.json(messages);
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

/**
 * DELETE /api/chat/history - Clear user's chat history
 * 
 * Permanently deletes all chat messages for the user
 * 
 * @query userId - ID of the authenticated user
 */
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

// ============================================================================
// Chat Message Endpoint
// ============================================================================

/**
 * POST /api/chat - Send a message to the AI assistant
 * 
 * Workflow:
 * 1. Validate message
 * 2. Save user message to database (if logged in)
 * 3. Call Gemini AI for response
 * 4. Save AI response to database (if logged in)
 * 5. Return response to frontend
 * 
 * @body message - Farmer's question
 * @body language - Language code (en, fr, sw, lg)
 * @body userId - User ID (optional, null for guests)
 * 
 * @returns { response: string } AI-generated answer
 */
router.post("/chat", async (req, res) => {
  const { message, language = "en", userId } = req.body;

  // Validate input
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  console.log("📨 Chat request received:", { 
    message: message.substring(0, 50),  // Log first 50 chars only
    language, 
    userId 
  });

  // Map language codes to full names for AI prompt
  const languageMap: Record<string, string> = {
    en: "English", 
    fr: "French", 
    sw: "Swahili", 
    lg: "Luganda",
  };
  const langName = languageMap[language] || "English";

  try {
    // ------------------------------------------------------------------------
    // Step 1: Save user message (if authenticated)
    // ------------------------------------------------------------------------
    if (userId) {
      await db.insert(chatMessages).values({
        userId,
        role: "user",
        content: message,
        language,
      });
    }

    // ------------------------------------------------------------------------
    // Step 2: Generate AI response using Gemini
    // ------------------------------------------------------------------------
    // Using gemini-3-flash-preview for fast, high-quality responses
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      generationConfig: {
        temperature: 0.7,        // Balanced creativity
        maxOutputTokens: 800,    // Sufficient for detailed answers
      }
    });
    
    const prompt = `You are CropGuard AI, an expert agricultural assistant specializing in African smallholder farming.
CRITICAL: Respond in ${langName}. Keep responses concise, practical, and accessible to farmers (2-4 sentences max).

Farmer's question: ${message}

Provide a helpful, practical response focusing on actionable advice.`;

    console.log("🤖 Calling Gemini API...");
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    console.log("✅ Chat response received, length:", response.length);

    // ------------------------------------------------------------------------
    // Step 3: Save AI response (if authenticated)
    // ------------------------------------------------------------------------
    if (userId) {
      await db.insert(chatMessages).values({
        userId,
        role: "assistant",
        content: response,
        language,
      });
    }

    // ------------------------------------------------------------------------
    // Step 4: Return response to frontend
    // ------------------------------------------------------------------------
    return res.status(200).json({ response });
    
  } catch (err: any) {
    console.error("❌ Chat error:", err.message);
    
    // Fallback response if Gemini fails
    const fallback = "I'm having trouble connecting. Please try again in a moment.";
    return res.status(200).json({ response: fallback });
  }
});

export default router;