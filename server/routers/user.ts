// server/routers/user.ts
// CropGuard AI - User Profile Management Router (tRPC)
// 
// Purpose: Handle user profile operations including:
// - Updating profile settings (name, location, crops, language)
// - Retrieving user profile
//
// Used by Signup, ProfileSettings, and AccountSettings pages

import { z } from "zod/v4";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc.js";
import { users } from "../db/schema.js";

export const userRouter = router({
  /**
   * updateProfile – Update user profile information
   * 
   * All fields are optional to support partial updates
   * Only provided fields are updated (keeps other fields unchanged)
   * 
   * Fields:
   * - name: Full name of the farmer
   * - farmLocation: City/district/region of the farm
   * - cropTypes: JSON string array of crops grown (e.g., '["Tomato","Maize"]')
   * - preferredLanguage: Interface and AI response language
   * 
   * Used by:
   * - Signup (step 2 & 3)
   * - ProfileSettings page
   * - AccountSettings page (language only)
   * 
   * @throws NOT_FOUND if user doesn't exist
   * @returns { success: true }
   */
  updateProfile: protectedProcedure
    .input(z.object({
      name:              z.string().min(1).optional(),
      farmLocation:      z.string().optional(),
      cropTypes:         z.string().optional(), // JSON-stringified array
      preferredLanguage: z.enum(["en", "hi", "es", "sw", "lg", "fr"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Build update object dynamically (only include provided fields)
      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.farmLocation !== undefined) updateData.farmLocation = input.farmLocation;
      if (input.cropTypes !== undefined) updateData.cropTypes = input.cropTypes;
      if (input.preferredLanguage !== undefined) updateData.preferredLanguage = input.preferredLanguage;

      const [updated] = await ctx.db
        .update(users)
        .set(updateData)
        .where(eq(users.id, ctx.user.id))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      }

      return { success: true };
    }),

  /**
   * getProfile – Get current user's profile
   * 
   * Returns the complete user object from database
   * Used by components that need fresh profile data
   * 
   * @returns User object from database
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),
});