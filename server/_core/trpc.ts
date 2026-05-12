// server/_core/trpc.ts
// CropGuard AI - tRPC Core Configuration
// 
// Purpose: Central tRPC configuration defining procedure types with different
//          authentication levels. All routers inherit from this configuration.
//
// Procedure Types:
// - publicProcedure: Accessible without authentication (login, signup, stats)
// - protectedProcedure: Requires valid JWT token (dashboard, scans, profile)
// - adminProcedure: Requires admin role (system management - future use)

import { initTRPC, TRPCError } from "@trpc/server";
import type { TrpcContext } from "./context.js";

// ============================================================================
// tRPC Server Initialization
// ============================================================================

/**
 * Initialize tRPC with our custom context type
 * 
 * The context provides:
 * - Express request/response objects
 * - Database connection
 * - Authenticated user (if token provided)
 * 
 * This context is passed to every procedure handler
 */
const t = initTRPC.context<TrpcContext>().create();

// ============================================================================
// Base Router Components
// ============================================================================

/**
 * Base router builder - used to create all feature routers
 * 
 * @example
 * export const userRouter = router({
 *   getProfile: protectedProcedure.query(async ({ ctx }) => {
 *     return ctx.user;
 *   })
 * });
 */
export const router = t.router;

/**
 * Public procedure - no authentication required
 * 
 * Use cases:
 * - Login (/auth/login)
 * - Registration (/auth/register)
 * - Password reset (/auth/forgotPassword, /auth/resetPassword)
 * - Public statistics (/stats)
 * - Health checks (/health)
 */
export const publicProcedure = t.procedure;

// ============================================================================
// Authentication Middleware
// ============================================================================

/**
 * Protected procedure - requires authenticated user
 * 
 * How it works:
 * 1. Checks if user exists in context (populated by createContext)
 * 2. If no user, throws UNAUTHORIZED error
 * 3. If authenticated, passes user data to procedure
 * 
 * @throws {TRPCError} with code "UNAUTHORIZED" if not logged in
 * 
 * @example
 * export const getUserProfile = protectedProcedure
 *   .query(async ({ ctx }) => {
 *     // ctx.user is guaranteed to exist here
 *     return {
 *       id: ctx.user.id,
 *       email: ctx.user.email,
 *       name: ctx.user.name
 *     };
 *   });
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in.",
    });
  }
  // Pass user data down to the procedure
  return next({ ctx: { ...ctx, user: ctx.user } });
});

/**
 * Admin procedure - requires admin role (reserved for future use)
 * 
 * More restrictive than protectedProcedure
 * Only users with role = "admin" can access
 * 
 * Use cases:
 * - System monitoring dashboard
 * - User management (list all users)
 * - Analytics across all farmers
 * - Model management (re-train AI model)
 * 
 * @throws {TRPCError} with code "FORBIDDEN" if not admin
 * 
 * @example
 * export const getAllUsers = adminProcedure
 *   .query(async ({ ctx }) => {
 *     // ctx.user.role === "admin" guaranteed here
 *     return await db.select().from(users);
 *   });
 */
export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== "admin") {
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: "Admin access required." 
    });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});