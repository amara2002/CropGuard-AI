import {
  pgTable, serial, varchar, text,
  timestamp, integer, jsonb, pgEnum,
} from "drizzle-orm/pg-core";

export const statusEnum   = pgEnum("status",   ["pending", "completed", "failed"]);
export const languageEnum = pgEnum("language", ["en", "hi", "es", "sw", "lg", "fr"]);

export const users = pgTable("users", {
  id:                serial("id").primaryKey(),
  openId:            varchar("open_id",  { length: 255 }).unique(), // nullable for email/password users
  email:             varchar("email",    { length: 255 }).unique().notNull(),
  passwordHash:      varchar("password_hash", { length: 255 }),
  name:              varchar("name",     { length: 255 }),
  farmLocation:      text("farm_location"),
  preferredLanguage: languageEnum("preferred_language").default("en"),
  cropTypes:         text("crop_types"),   // JSON-stringified: '["Tomato","Maize"]'
  role:              varchar("role", { length: 50 }).default("user"),
  lastSignedIn:      timestamp("last_signed_in").defaultNow(),
  createdAt:         timestamp("created_at").defaultNow(),
});

export const scans = pgTable("scans", {
  id:                       serial("id").primaryKey(),
  userId:                   integer("user_id").references(() => users.id),
  imageUrl:                 text("image_url").notNull(),
  imageKey:                 text("image_key").notNull(),
  cropType:                 varchar("crop_type",    { length: 100 }).notNull(),
  cropVariety:              varchar("crop_variety", { length: 100 }),
  detectedDisease:          varchar("detected_disease", { length: 255 }),
  confidenceScore:          integer("confidence_score"),
  diseaseDescription:       text("disease_description"),
  treatmentRecommendations: jsonb("treatment_recommendations"),
  fertilizerSuggestions:    jsonb("fertilizer_suggestions"),
  preventionMeasures:       jsonb("prevention_measures"),
  treatmentPlan:            text("treatment_plan"),
  errorMessage:             text("error_message"),
  status:                   statusEnum("status").default("pending"),
  language:                 languageEnum("language").default("en"),
  createdAt:                timestamp("created_at").defaultNow(),
});

// NEW: Chat messages for AI chatbot persistence
export const chatMessages = pgTable("chat_messages", {
  id:        serial("id").primaryKey(),
  userId:    integer("user_id").references(() => users.id).notNull(),
  role:      varchar("role", { length: 20 }).notNull(), // "user" or "assistant"
  content:   text("content").notNull(),
  language:  varchar("language", { length: 10 }).default("en"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type User        = typeof users.$inferSelect;
export type NewUser     = typeof users.$inferInsert;
export type Scan        = typeof scans.$inferSelect;
export type NewScan     = typeof scans.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;