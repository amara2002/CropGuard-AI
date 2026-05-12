// server/_core/trpc.ts
// CropGuard AI - tRPC Configuration
// 
// Purpose: Configure tRPC (TypeScript Remote Procedure Call) for type-safe API communication
//          between frontend and backend. Defines procedure types with authentication levels.
//
// Procedure Types:
// - publicProcedure: Accessible without authentication
// - protectedProcedure: Requires valid JWT token
// - adminProcedure: Requires admin role (reserved for future use)
//
// Why tRPC? 
// - End-to-end type safety (shared types between client and server)
// - No code generation needed
// - Built on HTTP, works with existing infrastructure

import { initTRPC, TRPCError } from "@trpc/server";
import type { TrpcContext } from "./context.js";

// ============================================================================
// tRPC Server Initialization
// ============================================================================

/**
 * Initialize tRPC with our custom context type
 * The context provides request, response, database, and user information
 * to every procedure handler
 */
const t = initTRPC.context<TrpcContext>().create();

// ============================================================================
// Core Router Components
// ============================================================================

/**
 * Base router builder - used to create all API routers
 * Example: export const userRouter = router({ ... })
 */
export const router = t.router;

/**
 * Public procedure - accessible without any authentication
 * Used for:
 * - Public statistics endpoint
 * - Login/register endpoints
 * - Public API endpoints
 */
export const publicProcedure = t.procedure;

// ============================================================================
// Authentication Middleware
// ============================================================================

/**
 * Protected procedure - requires authenticated user
 * 
 * How it works:
 * 1. Middleware checks if user exists in context
 * 2. If not, throws UNAUTHORIZED error
 * 3. If authenticated, passes user data to procedure
 * 
 * @throws {TRPCError} with code "UNAUTHORIZED" if not logged in
 * 
 * @example
 * // In router
 * export const getUserProfile = protectedProcedure
 *   .query(async ({ ctx }) => {
 *     // ctx.user is guaranteed to exist here
 *     return ctx.user;
 *   });
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in.",
    });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

/**
 * Admin procedure - requires admin role (future use)
 * 
 * Reserved for administrative functions like:
 * - User management
 * - System monitoring
 * - Analytics across all users
 * - Model management
 * 
 * @throws {TRPCError} with code "FORBIDDEN" if not admin
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