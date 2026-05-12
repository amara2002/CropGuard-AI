// server/db/schema.ts
// CropGuard AI - Database Schema (Drizzle ORM)
// 
// Purpose: Define PostgreSQL table structures, relationships, and types.
//          Uses Drizzle ORM for type-safe database operations.
//
// Tables:
// - users: Farmer account information
// - scans: Crop disease detection records
// - chat_messages: AI chat conversation history

import {
  pgTable, serial, varchar, text,
  timestamp, integer, jsonb, pgEnum,
} from "drizzle-orm/pg-core";

// ============================================================================
// PostgreSQL Enums
// ============================================================================

/**
 * Scan status enum - Tracks analysis progress
 * - pending: Image uploaded, analysis in progress
 * - completed: Analysis finished successfully
 * - failed: Analysis encountered an error
 */
export const statusEnum = pgEnum("status", ["pending", "completed", "failed"]);

/**
 * Language enum - Supported interface and AI response languages
 * en: English
 * hi: Hindi (future)
 * es: Spanish (future)
 * sw: Swahili
 * lg: Luganda
 * fr: French
 */
export const languageEnum = pgEnum("language", ["en", "hi", "es", "sw", "lg", "fr"]);

// ============================================================================
// Users Table - Farmer Accounts
// ============================================================================

/**
 * Users table stores farmer account information
 * Supports both email/password and Google OAuth authentication
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  
  // OAuth fields (null for email/password users)
  openId: varchar("open_id", { length: 255 }).unique(),  // Google user ID
  
  // Core account fields
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }),  // Null for OAuth users
  name: varchar("name", { length: 255 }),
  
  // Farm profile fields
  farmLocation: text("farm_location"),                    // City/district/region
  preferredLanguage: languageEnum("preferred_language").default("en"),
  cropTypes: text("crop_types"),                          // JSON string array
  
  // System fields
  role: varchar("role", { length: 50 }).default("user"),  // "user" or "admin"
  lastSignedIn: timestamp("last_signed_in").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================================
// Scans Table - Disease Detection Records
// ============================================================================

/**
 * Scans table stores each crop disease detection attempt
 * Contains both AI model outputs and user-provided metadata
 */
export const scans = pgTable("scans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),  // Foreign key to users
  
  // Image metadata
  imageUrl: text("image_url").notNull(),      // Public URL for display
  imageKey: text("image_key").notNull(),      // Local filename for deletion
  
  // User input
  cropType: varchar("crop_type", { length: 100 }).notNull(),
  cropVariety: varchar("crop_variety", { length: 100 }),
  
  // AI Model Output (MobileNetV3)
  detectedDisease: varchar("detected_disease", { length: 255 }),
  confidenceScore: integer("confidence_score"),  // 0-100 percentage
  
  // Gemini AI Recommendations
  diseaseDescription: text("disease_description"),
  treatmentRecommendations: jsonb("treatment_recommendations"),  // Array of treatment objects
  fertilizerSuggestions: jsonb("fertilizer_suggestions"),        // Array of fertilizer objects
  preventionMeasures: jsonb("prevention_measures"),              // Array of prevention objects
  treatmentPlan: text("treatment_plan"),                         // Legacy field (deprecated)
  
  // Status tracking
  errorMessage: text("error_message"),          // Error details if status = 'failed'
  status: statusEnum("status").default("pending"),
  language: languageEnum("language").default("en"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================================
// Chat Messages Table - AI Conversation History
// ============================================================================

/**
 * Chat messages table stores AI assistant conversation history
 * Enables persistent chat across sessions for authenticated users
 */
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: varchar("role", { length: 20 }).notNull(),    // "user" or "assistant"
  content: text("content").notNull(),                 // Message text
  language: varchar("language", { length: 10 }).default("en"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================================
// Type Exports (for TypeScript type safety)
// ============================================================================

// User types
export type User = typeof users.$inferSelect;        // For reading user data
export type NewUser = typeof users.$inferInsert;     // For creating users

// Scan types
export type Scan = typeof scans.$inferSelect;        // For reading scan data
export type NewScan = typeof scans.$inferInsert;     // For creating scans

// Chat message types
export type ChatMessage = typeof chatMessages.$inferSelect;      // For reading messages
export type NewChatMessage = typeof chatMessages.$inferInsert;   // For creating messages