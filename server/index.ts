/**
 * server/index.ts
 * 
 * CropGuard AI - Express Backend Server
 * 
 * Purpose: Main entry point for the CropGuard backend API.
 *          Handles image uploads, AI processing, authentication, and database operations.
 *          Vite dev server proxies /api/* requests to this server on port 3001.
 * 
 * Architecture:
 * - Express.js server with tRPC for type-safe API endpoints
 * - PostgreSQL database with Drizzle ORM
 * - Google OAuth for authentication
 * - File storage for uploaded crop images
 * - Integration with Hugging Face FastAPI for AI inference
 * 
 * Deployment: Render.com (Node.js environment)
 */

import "dotenv/config";
import express from "express";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers/index.js";
import { createContext } from "./_core/context.js";
import scanRoutes from "./routes/scan.js";
import googleAuthRoutes from "./routes/googleAuth.js";
import chatRoutes from "./routes/chat.js";

import cors from "cors";

// ============================================================================
// Express App Initialization
// ============================================================================

const app = express();

// ============================================================================
// CORS Configuration - Allow frontend domains
// ============================================================================
// Strictly control which domains can access the API
// - localhost:3000 (Vite dev server default port)
// - localhost:5173 (alternative Vite port)
// - crop-guard-ai-nu.vercel.app (production frontend)
app.use(cors({
  origin: [
    "http://localhost:3000",           // Local development (default Vite)
    "http://localhost:5173",           // Local development (alt Vite port)
    "https://crop-guard-ai-nu.vercel.app"  // Production Vercel frontend
  ],
  credentials: true,  // Allow cookies and auth headers
}));

// ============================================================================
// Body Parsing Middleware
// ============================================================================
// Increase limits to handle base64 encoded images up to 50MB
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ============================================================================
// Static File Serving
// ============================================================================
// Serve uploaded images from the /uploads directory
// This allows the Hugging Face FastAPI service to download images for analysis
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ============================================================================
// Health Check Endpoint
// ============================================================================
// Simple endpoint for monitoring service status
// Used by Render for health checks and by frontend for connectivity testing
app.get("/health", (_req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString() 
  });
});

// ============================================================================
// tRPC Router - Type-safe API endpoints
// ============================================================================
// Mount tRPC router at /api/trpc
// Handles authentication, user profiles, scans, and chat functionality
app.use(
  "/api/trpc",
  createExpressMiddleware({ 
    router: appRouter,      // All tRPC procedures
    createContext           // Request context (user authentication)
  })
);

// ============================================================================
// REST Routes - Traditional API endpoints
// ============================================================================

// Scan routes - Image upload and AI analysis
// POST /api/upload - Upload crop images
// POST /api/scan/analyze - Trigger AI analysis
// POST /api/scan/analyze-guest - Guest analysis (no auth)
app.use("/api", scanRoutes);

// Google OAuth routes - Authentication
// GET /api/auth/google - Initiate Google login
// GET /api/auth/google/callback - OAuth callback handler
app.use("/api/auth", googleAuthRoutes);

// Chat routes - AI chat assistant for farmers
// POST /api/chat - Send message to Gemini AI
// GET /api/chat/history - Retrieve chat history
// DELETE /api/chat/history - Clear chat history
app.use("/api", chatRoutes);

// ============================================================================
// Public Statistics Endpoint - For Marketing Page
// ============================================================================
// No authentication required - used by the landing page to show live stats
app.get("/api/stats", async (_req, res) => {
  try {
    // Dynamically import to avoid circular dependencies
    const { db } = await import("./db/db.js");
    const { scans, users } = await import("./db/schema.js");
    const { sql } = await import("drizzle-orm");

    // Count total scans
    const [scanCount] = await db.select({ count: sql<number>`count(*)` }).from(scans);
    
    // Count total users (farmers helped)
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    
    // Count unique diseases detected (only from completed scans)
    const [diseaseCount] = await db
      .select({ count: sql<number>`count(DISTINCT detected_disease)` })
      .from(scans)
      .where(sql`${scans.status} = 'completed'`);

    res.json({
      scansPerformed: scanCount.count,
      farmersHelped: userCount.count,
      diseasesDetected: diseaseCount.count,
    });
  } catch (err) {
    // If stats query fails (e.g., database not ready), return zeros
    // This prevents the landing page from crashing
    console.error("❌ Stats error:", err);
    res.json({
      scansPerformed: 0,
      farmersHelped: 0,
      diseasesDetected: 0,
    });
  }
});

// ============================================================================
// 404 Handler - Catch unmatched routes
// ============================================================================
// Must be last route handler to avoid interfering with valid routes
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ============================================================================
// Server Startup
// ============================================================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n🌿 CropGuard API    →  http://localhost:${PORT}`);
  console.log(`📡 tRPC endpoint    →  http://localhost:${PORT}/api/trpc`);
  console.log(`🔐 Google OAuth     →  http://localhost:${PORT}/api/auth/google`);
  console.log(`📁 Local uploads    →  http://localhost:${PORT}/uploads`);
  console.log(`💚 Health check     →  http://localhost:${PORT}/health\n`);
});

// ============================================================================
// Type Exports
// ============================================================================
// Export AppRouter type for frontend TypeScript type safety
export type { AppRouter } from "./routers/index.js";