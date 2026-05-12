// server/routers/auth.ts
// CropGuard AI - Authentication Router (tRPC)
// 
// Purpose: Handle all authentication-related operations including:
// - User registration (email/password)
// - User login (email/password)
// - Password reset flow
// - OAuth user synchronization
// - Session management
//
// All procedures are type-safe and validated with Zod schemas

import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc.js";
import { db } from "../db/db.js";
import { users } from "../db/schema.js";
import { z } from "zod";
import {
  getUserByEmail,
  getUserById,
  createUser,
  hashPassword,
  verifyPassword,
  upsertUser,
} from "../db/index.js";
import { ENV } from "../_core/env.js";
import jwt from "jsonwebtoken";

export const authRouter = router({
  // ============================================================================
  // User Profile Query
  // ============================================================================

  /**
   * me – Returns the current authenticated user's profile
   * 
   * If no user is logged in, returns null (not an error)
   * Parses cropTypes from JSON string to array for frontend convenience
   * 
   * @returns User profile object or null
   */
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;

    // Parse cropTypes from JSON string (stored in DB as string)
    const cropTypes = (() => {
      try {
        return ctx.user.cropTypes ? JSON.parse(ctx.user.cropTypes) : [];
      } catch {
        return [];
      }
    })();

    return {
      id: ctx.user.id,
      name: ctx.user.name,
      email: ctx.user.email,
      farmLocation: ctx.user.farmLocation,
      preferredLanguage: ctx.user.preferredLanguage,
      cropTypes,
      role: ctx.user.role,
      createdAt: ctx.user.createdAt?.toISOString(),
      lastSignedIn: ctx.user.lastSignedIn?.toISOString(),
      onboarded: Boolean(ctx.user.farmLocation),  // Has user completed onboarding?
    };
  }),

  // ============================================================================
  // Registration (Email/Password)
  // ============================================================================

  /**
   * register – Create a new user account with email and password
   * 
   * Validation:
   * - Email must be valid format
   * - Password must be at least 6 characters
   * - Name cannot be empty
   * 
   * Flow:
   * 1. Check if email already exists
   * 2. Hash password with bcrypt
   * 3. Create user record
   * 4. Generate JWT token
   * 5. Return token to frontend
   * 
   * @throws CONFLICT if email already registered
   * @returns { token, userId }
   */
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      // Check for existing user
      const existing = await getUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already registered",
        });
      }

      // Create new user
      const passwordHash = await hashPassword(input.password);
      const user = await createUser({
        email: input.email,
        passwordHash,
        name: input.name,
        openId: null,
        lastSignedIn: new Date(),
      });

      // Generate JWT token (7-day expiration)
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        ENV.jwtSecret,
        { expiresIn: "7d" }
      );

      return { token, userId: user.id };
    }),

  // ============================================================================
  // Login (Email/Password)
  // ============================================================================

  /**
   * login – Authenticate user with email and password
   * 
   * Flow:
   * 1. Find user by email
   * 2. Check if password hash exists (not OAuth-only account)
   * 3. Verify password with bcrypt
   * 4. Update lastSignedIn timestamp
   * 5. Generate JWT token
   * 6. Return token to frontend
   * 
   * @throws UNAUTHORIZED for invalid credentials or OAuth accounts
   * @returns { token, userId }
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const user = await getUserByEmail(input.email);
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      // OAuth accounts don't have passwords
      if (!user.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Account uses OAuth. Please sign in with Google.",
        });
      }

      // Verify password
      const valid = await verifyPassword(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      // Update last sign-in time
      await db
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, user.id));

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        ENV.jwtSecret,
        { expiresIn: "7d" }
      );

      return { token, userId: user.id };
    }),

  // ============================================================================
  // Password Reset Flow
  // ============================================================================

  /**
   * forgotPassword – Send password reset token (demo version)
   * 
   * For security, we don't reveal whether email exists
   * Always returns success message even if email not found
   * 
   * Demo note: Token is logged to console instead of emailed
   * In production, would send actual email
   * 
   * @param email - User's email address
   * @returns Success message and demo token (for development)
   */
  forgotPassword: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      const user = await getUserByEmail(input.email);

      // Don't reveal if email exists (security best practice)
      if (!user) {
        return {
          success: true,
          message: "If the email exists, a reset link has been sent.",
          demoToken: null,
        };
      }

      // Generate reset token (15-minute expiration)
      const resetToken = jwt.sign(
        { userId: user.id, email: user.email, type: "password_reset" },
        ENV.jwtSecret,
        { expiresIn: "15m" }
      );

      // In development, log token to console
      console.log(`🔑 Password reset token for ${input.email}: ${resetToken}`);

      return {
        success: true,
        message: "If the email exists, a reset link has been sent.",
        demoToken: resetToken,
      };
    }),

  /**
   * resetPassword – Reset password using valid token
   * 
   * Flow:
   * 1. Verify JWT token signature and type
   * 2. Check token type is "password_reset"
   * 3. Hash new password
   * 4. Update user record
   * 
   * @throws BAD_REQUEST for invalid or expired token
   * @returns Success message
   */
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        newPassword: z.string().min(6),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const payload = jwt.verify(input.token, ENV.jwtSecret) as {
          userId: number;
          type: string;
        };

        // Ensure token is for password reset (not login or other)
        if (payload.type !== "password_reset") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid reset token",
          });
        }

        // Hash and save new password
        const passwordHash = await hashPassword(input.newPassword);
        await db
          .update(users)
          .set({ passwordHash })
          .where(eq(users.id, payload.userId));

        return {
          success: true,
          message: "Password has been reset successfully.",
        };
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired reset token",
        });
      }
    }),

  // ============================================================================
  // OAuth Integration
  // ============================================================================

  /**
   * oauthUpsert – Sync OAuth user with our database
   * 
   * Called by Google OAuth callback handler
   * Creates user if doesn't exist, updates if exists
   * 
   * @param openId - Google's unique user ID
   * @param name - User's full name from Google
   * @param email - User's email from Google
   * @returns JWT token for frontend authentication
   */
  oauthUpsert: publicProcedure
    .input(
      z.object({
        openId: z.string().min(1),
        name: z.string().optional(),
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      const user = await upsertUser({
        openId: input.openId,
        name: input.name,
        email: input.email,
        lastSignedIn: new Date(),
      });

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        ENV.jwtSecret,
        { expiresIn: "7d" }
      );

      return { token, userId: user.id };
    }),

  // ============================================================================
  // Logout
  // ============================================================================

  /**
   * logout – JWT is stateless, client discards token
   * 
   * No server-side session to invalidate
   * Client should remove token from localStorage
   * 
   * @returns Success message
   */
  logout: protectedProcedure.mutation(() => {
    return { success: true };
  }),
});