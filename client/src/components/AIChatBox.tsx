// client/src/components/AIChatBox.tsx
// CropGuard AI - AI Chat Assistant Component
// 
// Purpose: Provide an interactive chat interface for farmers to ask questions
//          about crop diseases, pest control, soil management, and farming practices.
//          Powered by Google Gemini AI with multi-language support.
//
// Features:
// - Persistent chat history (saved to database for logged-in users)
// - Multi-language responses (English, French, Swahili, Luganda)
// - Suggested questions for first-time users
// - Clear history functionality
// - Text-to-speech integration (handled by parent)
// - Slide-out panel or embedded mode

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Send,
  Bot,
  User,
  X,
  MessageCircle,
  Leaf,
  Trash2,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/_core/hooks/useAuth";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatBoxProps {
  language?: string;      // Language code (en, fr, sw, lg)
  embedded?: boolean;     // If true, renders inline (not as floating button)
}

export default function AIChatBox({ language = "en", embedded = false }: AIChatBoxProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(embedded);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: getWelcomeMessage(language) },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get API URL from environment (works in dev and production)
  const apiUrl = import.meta.env.VITE_API_URL || "";

  // ============================================================================
  // Scroll Management - Auto-scroll to bottom when new messages arrive
  // ============================================================================
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ============================================================================
  // Initialization
  // ============================================================================
  useEffect(() => {
    if (embedded) setIsOpen(true);
  }, [embedded]);

  // ============================================================================
  // Chat History Management
  // ============================================================================
  
  /**
   * Load chat history from database when chat panel is opened
   * Only runs once per session (historyLoaded flag prevents repeated loads)
   */
  useEffect(() => {
    if (isOpen && user?.id && !historyLoaded) {
      loadHistory();
    }
  }, [isOpen, user?.id]);

  const loadHistory = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/chat/history?userId=${user?.id}`);
      if (!res.ok) throw new Error("Failed to load history");
      const history = await res.json();
      if (history && history.length > 0) {
        const formatted = history.map((h: any) => ({
          role: h.role as "user" | "assistant",
          content: h.content,
        }));
        setMessages(formatted);
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
    setHistoryLoaded(true);
  };

  /**
   * Clear all chat history from database and reset local state
   */
  const handleClearHistory = async () => {
    if (!confirm("Delete all chat history? This cannot be undone.")) return;
    try {
      await fetch(`${apiUrl}/api/chat/history?userId=${user?.id}`, { method: "DELETE" });
      setMessages([{ role: "assistant", content: getWelcomeMessage(language) }]);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  // ============================================================================
  // Message Sending
  // ============================================================================
  
  /**
   * Send user message to backend AI and add response to chat
   */
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          language,
          userId: user?.id || null,  // null for guest users
        }),
      });

      if (!res.ok) throw new Error("Chat request failed");
      
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: getErrorMessage(language) },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // Event Handlers
  // ============================================================================
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedClick = (question: string) => {
    setInput(question);
    setTimeout(() => handleSend(), 100);
  };

  // Suggested questions for first-time users (reduces empty state friction)
  const suggestedQuestions = [
    getSuggestedQ1(language),
    getSuggestedQ2(language),
    getSuggestedQ3(language),
  ];

  // ============================================================================
  // UI Components
  // ============================================================================
  
  const chatContent = (
    <div
      className={
        embedded
          ? "flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
          : "fixed bottom-6 right-6 z-50 w-96 h-[620px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
      }
    >
      {/* Header - Gradient background with controls */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm">CropGuard AI</h3>
            <p className="text-xs text-white/70">Your farming assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Clear history button (only for authenticated users with messages) */}
          {user?.id && messages.length > 1 && (
            <button
              onClick={handleClearHistory}
              className="hover:bg-white/20 p-2 rounded-lg transition"
              title="Clear history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {/* Close button (only in floating mode) */}
          {!embedded && (
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-2 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Container - Scrollable area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50 to-white">
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {/* Avatar/Icon */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                msg.role === "user"
                  ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                  : "bg-white border border-slate-200"
              }`}
            >
              {msg.role === "user" ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Leaf className="w-4 h-4 text-emerald-600" />
              )}
            </div>
            {/* Message Bubble */}
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md"
                  : "bg-white border border-slate-200 text-slate-700 shadow-sm"
              }`}
            >
              {msg.content}
            </div>
          </motion.div>
        ))}

        {/* Typing Indicator (when AI is generating response) */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
              <Leaf className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span className="text-xs text-slate-400">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions - Only show on first message */}
      {messages.length <= 1 && !loading && (
        <div className="px-4 py-3 bg-white border-t border-slate-100 flex-shrink-0">
          <p className="text-xs text-slate-400 mb-2 font-medium">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSuggestedClick(q)}
                className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left leading-relaxed"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder(language)}
            className="flex-1 text-sm h-11 rounded-xl border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20"
            disabled={loading}
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            size="icon"
            className="h-11 w-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 flex-shrink-0 shadow-md hover:shadow-lg transition-all"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // Render Logic
  // ============================================================================
  
  return (
    <>
      {/* Floating Button (only in non-embedded mode when closed) */}
      {!embedded && !isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white p-4 rounded-full shadow-xl transition-all"
          title="Open AI Assistant"
        >
          <MessageCircle className="w-6 h-6" />
        </motion.button>
      )}

      {/* Embedded mode (no floating button) */}
      {embedded && chatContent}

      {/* Floating panel (non-embedded mode when open) */}
      <AnimatePresence>
        {!embedded && isOpen && (
          <motion.div
            key="floating-chat"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {chatContent}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================================
// Helper Functions - Multi-language Support
// ============================================================================

function getWelcomeMessage(lang: string): string {
  const messages: Record<string, string> = {
    en: "Hello! I'm your CropGuard AI assistant. I can help you with crop diseases, pest control, soil management, and farming best practices. What would you like to know? 🌱",
    fr: "Bonjour ! Je suis votre assistant IA CropGuard. Je peux vous aider avec les maladies des cultures, la lutte antiparasitaire, la gestion des sols et les meilleures pratiques agricoles. Que voulez-vous savoir ? 🌱",
    sw: "Habari! Mimi ni msaidizi wako wa AI wa CropGuard. Ninaweza kukusaidia kuhusu magonjwa ya mimea, udhibiti wa wadudu, usimamizi wa udongo, na mbinu bora za kilimo. Ungependa kujua nini? 🌱",
    lg: "Mirembe! Nze mubeezi wo wa AI wa CropGuard. Nsobola okuyamba ku ndwadde z'ebirime, okuvvuunuka ebiwuka, okulabirira ettaka, n'enkola ennungi ez'okulima. Ky'oyagala okumanya kiki? 🌱",
  };
  return messages[lang] || messages.en;
}

function getErrorMessage(lang: string): string {
  const messages: Record<string, string> = {
    en: "I'm sorry, I couldn't process your request. Please try again.",
    fr: "Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer.",
    sw: "Samahani, sikuweza kushughulikia ombi lako. Tafadhali jaribu tena.",
    lg: "Nsonyiwa, sinsobodde kukola ky'osabye. Nsaba ogezeeko oluvanyuma.",
  };
  return messages[lang] || messages.en;
}

function getPlaceholder(lang: string): string {
  const placeholders: Record<string, string> = {
    en: "Ask about crop diseases...",
    fr: "Posez des questions sur les maladies...",
    sw: "Uliza kuhusu magonjwa ya mimea...",
    lg: "Buuza ku ndwadde z'ebirime...",
  };
  return placeholders[lang] || placeholders.en;
}

function getSuggestedQ1(lang: string): string {
  const qs: Record<string, string> = {
    en: "How do I treat tomato early blight?",
    fr: "Comment traiter le mildiou précoce de la tomate ?",
    sw: "Jinsi ya kutibu ugonjwa wa mapema wa nyanya?",
    lg: "Nnyinza ntya okuvvuunuka obulwadde bwa tomato?",
  };
  return qs[lang] || qs.en;
}

function getSuggestedQ2(lang: string): string {
  const qs: Record<string, string> = {
    en: "What fertilizer should I use for maize?",
    fr: "Quel engrais dois-je utiliser pour le maïs ?",
    sw: "Nitumie mbolea gani kwa mahindi?",
    lg: "Ebigimusa ki byenina okukozesa ku kasooli?",
  };
  return qs[lang] || qs.en;
}

function getSuggestedQ3(lang: string): string {
  const qs: Record<string, string> = {
    en: "How can I prevent cassava mosaic disease?",
    fr: "Comment prévenir la mosaïque du manioc ?",
    sw: "Jinsi ya kuzuia ugonjwa wa mosaic wa muhogo?",
    lg: "Nnyinza ntya okuziiyiza obulwadde bwa cassava?",
  };
  return qs[lang] || qs.en;
}