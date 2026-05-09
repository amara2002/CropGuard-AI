import { z } from "zod/v4";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc.js";
import { users } from "../db/schema.js";

export const userRouter = router({
  /**
   * updateProfile  — called from Signup, ProfileSettings, AccountSettings.
   */
  updateProfile: protectedProcedure
    .input(z.object({
      name:              z.string().min(1).optional(),
      farmLocation:      z.string().optional(),
      cropTypes:         z.string().optional(), // JSON-stringified: '["Tomato","Maize"]'
      preferredLanguage: z.enum(["en", "hi", "es", "sw", "lg", "fr"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(users)
        .set({
          ...(input.name              !== undefined && { name: input.name }),
          ...(input.farmLocation      !== undefined && { farmLocation: input.farmLocation }),
          ...(input.cropTypes         !== undefined && { cropTypes: input.cropTypes }),
          ...(input.preferredLanguage !== undefined && { preferredLanguage: input.preferredLanguage }),
        })
        .where(eq(users.id, ctx.user.id))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      }

      return { success: true };
    }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),
});