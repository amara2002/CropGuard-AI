/**
 * client/src/lib/trpc.ts
 * 
 * CropGuard AI - tRPC Client Configuration
 * 
 * Purpose: Configure the tRPC client for type-safe API communication with the backend.
 *          Handles authentication token storage and automatic injection into requests.
 * 
 * Auth flow:
 *  1. User logs in → receives JWT token from backend
 *  2. Store token: localStorage.setItem('cropguard_token', token)
 *  3. Every tRPC call automatically sends: Authorization: Bearer <token>
 *  4. Backend verifies token and populates ctx.user for the request
 * 
 * This file replaces the previous mock tRPC implementation with a real client.
 */

import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../../../server/routers/index";

// ============================================================================
// tRPC Client Setup
// ============================================================================

/**
 * Main tRPC React client for making type-safe API calls throughout the app
 * The AppRouter type ensures type safety between frontend and backend
 */
export const trpc = createTRPCReact<AppRouter>();

// ============================================================================
// Token Management (JWT Authentication)
// ============================================================================

/** Local storage key for storing the authentication token */
const TOKEN_KEY = "cropguard_token";

/**
 * Get the current authentication token from local storage
 * @returns JWT token or null if not authenticated
 */
export const getToken = () => localStorage.getItem(TOKEN_KEY);

/**
 * Store authentication token after successful login
 * @param token - JWT token from backend
 */
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);

/**
 * Remove authentication token on logout
 * Clears user session from local storage
 */
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// ============================================================================
// tRPC Client Factory
// ============================================================================

/**
 * Creates and configures a new tRPC client instance
 * 
 * Features:
 * - Automatically adds Authorization header with token
 * - Handles both development and production URLs
 * - Uses HTTP batch links for efficient requests
 * 
 * @returns Configured tRPC client
 */
export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        // Determine API URL based on environment
        // Uses VITE_API_URL in production, falls back to localhost for development
        url: import.meta.env.VITE_API_URL
          ? `${import.meta.env.VITE_API_URL}/api/trpc`
          : "http://localhost:3001/api/trpc",
        
        // Add authorization header to every request if token exists
        headers() {
          const token = getToken();
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}

// Re-export AppRouter type for use in other files
export type { AppRouter };