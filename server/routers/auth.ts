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
  /**
   * me – returns the current user's profile or null.
   */
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;

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
      onboarded: Boolean(ctx.user.farmLocation),
    };
  }),

  /**
   * register – email/password signup
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
      const existing = await getUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already registered",
        });
      }

      const passwordHash = await hashPassword(input.password);
      const user = await createUser({
        email: input.email,
        passwordHash,
        name: input.name,
        openId: null,
        lastSignedIn: new Date(),
      });

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        ENV.jwtSecret,
        { expiresIn: "7d" }
      );

      return { token, userId: user.id };
    }),

  /**
   * login – email/password signin
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

      if (!user.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Account uses OAuth. Please sign in with Google.",
        });
      }

      const valid = await verifyPassword(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      await db
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, user.id));

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        ENV.jwtSecret,
        { expiresIn: "7d" }
      );

      return { token, userId: user.id };
    }),

  /**
   * forgotPassword – sends a password reset token
   * (For demo: returns the reset token directly instead of emailing it)
   */
  forgotPassword: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      const user = await getUserByEmail(input.email);

      if (!user) {
        return {
          success: true,
          message: "If the email exists, a reset link has been sent.",
          demoToken: null,
        };
      }

      const resetToken = jwt.sign(
        { userId: user.id, email: user.email, type: "password_reset" },
        ENV.jwtSecret,
        { expiresIn: "15m" }
      );

      console.log(`🔑 Password reset token for ${input.email}: ${resetToken}`);

      return {
        success: true,
        message: "If the email exists, a reset link has been sent.",
        demoToken: resetToken,
      };
    }),

  /**
   * resetPassword – verifies token and updates password
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

        if (payload.type !== "password_reset") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid reset token",
          });
        }

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

  /**
   * oauthUpsert – called by OAuth callback handler to sync user
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

  /**
   * logout – stateless JWT: client discards token
   */
  logout: protectedProcedure.mutation(() => {
    return { success: true };
  }),
});