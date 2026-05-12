// server/_core/context.ts
// CropGuard AI - tRPC Request Context
// 
// Purpose: Create request context for each tRPC call containing:
// - HTTP request/response objects (for headers, cookies)
// - Database connection (for queries)
// - Authenticated user (extracted from JWT token)
//
// This context is created per request and passed to all procedure handlers

import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { db } from "../db/db.js";
import { getUserById } from "../db/index.js";
import type { User } from "../db/schema.js";
import { ENV } from "./env.js";
import jwt from "jsonwebtoken";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Type definition for tRPC context
 * 
 * Properties:
 * - req: Express request object (access headers, URL, body)
 * - res: Express response object (set cookies, headers)
 * - user: Authenticated user or null if not logged in
 * - db: Database connection for type-safe queries
 * 
 * This type is used by all tRPC procedures
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
 * Create tRPC context for each incoming request
 * 
 * Authentication Flow:
 * 1. Extract Authorization header from request
 * 2. Parse "Bearer <token>" format
 * 3. Verify JWT token signature using secret
 * 4. Extract userId from token payload
 * 5. Fetch complete user object from database
 * 6. Return context with user (or null if invalid)
 * 
 * Called automatically by tRPC for every API call
 * 
 * @param opts - Express context options containing request/response
 * @returns Promise resolving to TrpcContext
 * 
 * @example
 * // In Express server setup
 * app.use("/api/trpc", createExpressMiddleware({
 *   router: appRouter,
 *   createContext  // This function is called for each request
 * }));
 * 
 * @example
 * // In tRPC procedure
 * export const getProfile = protectedProcedure
 *   .query(async ({ ctx }) => {
 *     // ctx.user is guaranteed to exist for protected procedures
 *     console.log(ctx.user.email);
 *   });
 */
export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // ------------------------------------------------------------------------
    // Step 1: Extract JWT token from Authorization header
    // ------------------------------------------------------------------------
    // Format: "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
    const authHeader = opts.req.headers["authorization"];
    const token = authHeader?.split(" ")[1];  // Get token after "Bearer "

    // ------------------------------------------------------------------------
    // Step 2: Verify JWT token if present
    // ------------------------------------------------------------------------
    if (token) {
      // Verify signature and decode payload
      const payload = jwt.verify(token, ENV.jwtSecret) as { userId: number };
      
      // ------------------------------------------------------------------------
      // Step 3: Fetch user from database
      // ------------------------------------------------------------------------
      if (payload?.userId) {
        user = await getUserById(payload.userId);
      }
    }
  } catch (error) {
    // Token is invalid, expired, or malformed
    // Treat as unauthenticated (user remains null)
    // No error thrown - just proceed without user
    // This allows public procedures to still work
  }

  // ------------------------------------------------------------------------
  // Step 4: Return complete context
  // ------------------------------------------------------------------------
  return { 
    req: opts.req, 
    res: opts.res, 
    user,          // Will be null if not authenticated
    db,            // Database connection for queries
  };
}