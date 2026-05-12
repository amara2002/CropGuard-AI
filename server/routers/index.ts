// server/routers/index.ts
// CropGuard AI - Main Router Aggregator
// 
// Purpose: Combine all feature routers into a single AppRouter
//          This is the main entry point for tRPC API
// 
// The AppRouter type is exported for frontend type safety

import { router } from "../_core/trpc.js";
import { authRouter  } from "./auth.js";
import { userRouter  } from "./user.js";
import { scansRouter } from "./scans.js";

/**
 * Main application router
 * 
 * Combines all feature routers under namespaced keys:
 * - auth: Authentication operations (login, register, reset password)
 * - user: User profile operations (update profile, get profile)
 * - scans: Crop scan operations (create, list, delete, retry)
 */
export const appRouter = router({
  auth:  authRouter,
  user:  userRouter,
  scans: scansRouter,
});

/**
 * Type definition for the entire API
 * 
 * Used by frontend to get full type safety when calling tRPC procedures
 * Example: type T = typeof appRouter
 */
export type AppRouter = typeof appRouter;