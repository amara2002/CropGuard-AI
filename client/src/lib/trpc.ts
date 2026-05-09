/**
 * client/src/lib/trpc.ts
 *
 * Real tRPC client wired to the Express backend at /api/trpc.
 * Replaces the previous mock object entirely.
 *
 * Auth flow:
 *  1. Call trpc.auth.loginOrRegister → get token
 *  2. Store: localStorage.setItem('cropguard_token', token)
 *  3. Every tRPC call automatically sends: Authorization: Bearer <token>
 *  4. Backend verifies and populates ctx.user
 */

import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../../../server/routers/index";

export const trpc = createTRPCReact<AppRouter>();

// ── Token helpers ─────────────────────────────────────────────────────────────
const TOKEN_KEY = "cropguard_token";

export const getToken    = ()    => localStorage.getItem(TOKEN_KEY);
export const setToken    = (t:string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken  = ()    => localStorage.removeItem(TOKEN_KEY);

// ── Client factory ────────────────────────────────────────────────────────────
export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: "http://localhost:3001/api/trpc",  // Direct connection
        headers() {
          const token = getToken();
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}

export type { AppRouter };