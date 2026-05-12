// server/_core/env.ts
// CropGuard AI - Environment Variables Configuration
// 
// Purpose: Centralize all environment variables with defaults and validation.
//          Makes environment configuration type-safe and easier to manage.
//          Loads from .env file via dotenv (imported in server/index.ts)

import 'dotenv/config'; 

// ============================================================================
// Environment Variables
// ============================================================================

/**
 * Application environment configuration
 * All values come from .env file with sensible defaults for development
 */
export const ENV = {
  // ==========================================================================
  // Database & Core Services
  // ==========================================================================
  
  /** PostgreSQL connection string (required for production) */
  databaseUrl: process.env.DATABASE_URL ?? "",
  
  /** Google Gemini AI API key (required for AI recommendations and chat) */
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  
  /** Supabase project URL (optional - for cloud storage) */
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  
  /** Supabase anonymous key (optional - for cloud storage) */
  supabaseKey: process.env.SUPABASE_ANON_KEY ?? "",
  
  /** Hugging Face FastAPI endpoint for MobileNetV3 disease detection */
  fastapiUrl: process.env.FASTAPI_URL ?? "http://127.0.0.1:8000/predict",
  
  /** JWT secret for signing authentication tokens (change in production!) */
  jwtSecret: process.env.JWT_SECRET ?? "cropguard-dev-secret-change-in-production",
  
  /** Server port (default: 3001 for Express backend) */
  port: 3001,
  
  /** Node environment: 'development', 'production', or 'test' */
  nodeEnv: process.env.NODE_ENV ?? "development",

  // ==========================================================================
  // OAuth & External Services
  // ==========================================================================
  
  /** Application ID (used by Manus SDK - optional) */
  appId: process.env.VITE_APP_ID ?? "cropguard-local",
  
  /** Application URL (used for OAuth redirects) */
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  
  /** OAuth server URL (Manus SDK - optional) */
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "https://auth.manus.computer",
  
  /** Cookie secret for session management (optional) */
  cookieSecret: process.env.COOKIE_SECRET ?? "dev-cookie-secret-change-me",
};

// ============================================================================
// Validation Warnings (Development Helper)
// ============================================================================

// Log warnings for missing critical environment variables in development
if (ENV.nodeEnv === "development") {
  if (!ENV.geminiApiKey) {
    console.warn("⚠️ GEMINI_API_KEY not set. AI features will use fallback responses.");
  }
  
  if (ENV.jwtSecret === "cropguard-dev-secret-change-in-production") {
    console.warn("⚠️ Using default JWT_SECRET. Change this in production!");
  }
}