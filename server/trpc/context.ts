// server/_core/context.ts
// CropGuard AI - tRPC Request Context
// 
// Purpose: Create request context for each tRPC call, including:
// - HTTP request/response objects
// - Database connection
// - Authenticated user (if token provided)
//
// Context is created per request and passed to all procedure handlers

import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { db } from "../db/db.js";
import { getUserById } from "../db/index.js";
import type { User } from "../db/schema.js";
import { ENV } from "../_core/env.js";
import jwt from "jsonwebtoken";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Type definition for tRPC context
 * 
 * Properties:
 * - req: Express request object (for headers, cookies, etc.)
 * - res: Express response object (for setting cookies, headers)
 * - user: Authenticated user or null if not logged in
 * - db: Database connection for queries
 */
export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  db: typeof db;
};

// ============================================================================
// Context Factory Function
// ============================================================================

/**
 * Create tRPC context for each request
 * 
 * Authentication Flow:
 * 1. Extract Authorization header from request
 * 2. Parse "Bearer <token>" format
 * 3. Verify JWT token using secret
 * 4. Fetch user from database using userId from token
 * 5. Return context with user (or null if invalid)
 * 
 * Called automatically by tRPC for every API call
 * 
 * @param opts - Express context options containing request/response
 * @returns Promise resolving to TrpcContext
 * 
 * @example
 * // In Express middleware setup
 * app.use("/api/trpc", createExpressMiddleware({
 *   router: appRouter,
 *   createContext  // This function
 * }));
 */
export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Step 1: Extract Authorization header
    // Format: "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
    const authHeader = opts.req.headers["authorization"];
    const token = authHeader?.split(" ")[1];  // Get token after "Bearer "

    // Step 2: Verify JWT token if present
    if (token) {
      // Verify token signature and extract payload
      const payload = jwt.verify(token, ENV.jwtSecret) as { userId: number };
      
      // Step 3: Fetch user from database
      if (payload?.userId) {
        user = await getUserById(payload.userId);
      }
    }
  } catch {
    // Token is invalid, expired, or malformed
    // Treat as unauthenticated (user remains null)
    // No error thrown - proceed with null user
  }

  // Return context with:
  // - Original request/response objects
  // - User (or null if not authenticated)
  // - Database connection
  return { 
    req: opts.req, 
    res: opts.res, 
    user, 
    db 
  };
}