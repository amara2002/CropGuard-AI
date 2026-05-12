// server/db/db.ts
// CropGuard AI - Database Connection Setup
// 
// Purpose: Configure and export PostgreSQL database connection using Drizzle ORM.
//          Uses postgres.js driver for efficient connection pooling.
//          SSL is configured for Render.com production deployment.
//
// Environment: DATABASE_URL must be set in .env file
// Format: postgresql://username:password@host:port/database

import 'dotenv/config';
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

// ============================================================================
// Configuration Validation
// ============================================================================

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL is missing from your .env file.");
  process.exit(1);
}

// ============================================================================
// PostgreSQL Client Setup
// ============================================================================

/**
 * Create PostgreSQL connection pool
 * 
 * Configuration:
 * - max: 10 concurrent connections (good for moderate traffic)
 * - connect_timeout: 10 seconds (prevents hanging)
 * - ssl: Required for Render.com PostgreSQL (rejectUnauthorized: false for self-signed certs)
 */
const client = postgres(connectionString, {
  max: 10,                      // Maximum connections in pool
  connect_timeout: 10,          // Connection timeout in seconds
  ssl: { rejectUnauthorized: false },  // Accept self-signed certificates (Render)
});

// ============================================================================
// Drizzle ORM Instance
// ============================================================================

/**
 * Drizzle database instance with schema type inference
 * 
 * Provides type-safe database operations
 * All queries will have autocomplete and type checking
 */
export const db = drizzle(client, { schema });