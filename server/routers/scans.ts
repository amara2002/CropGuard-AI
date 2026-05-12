// server/routers/scans.ts
// CropGuard AI - Scans Management Router (tRPC)
// 
// Purpose: Handle all crop scan operations including:
// - Creating new scans (uploads image, triggers AI analysis)
// - Listing user's scan history
// - Getting detailed scan results
// - Retrying failed scans
// - Deleting scans
// - Scan statistics for dashboard

import { sql } from "drizzle-orm";
import { z } from "zod/v4";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc.js";
import { scans } from "../db/schema.js";
import { ENV } from "../_core/env.js";
import fs from "fs";
import path from "path";

export const scansRouter = router({
  // ============================================================================
  // Create Scan
  // ============================================================================

  /**
   * create – Create a new scan record and trigger AI analysis
   * 
   * Workflow:
   * 1. Insert scan record with status "pending"
   * 2. Fire-and-forget triggerAnalysis (async, non-blocking)
   * 3. Return scan ID to frontend immediately
   * 
   * Frontend polls the scan status via getById
   * 
   * @param imageUrl - URL of uploaded image
   * @param imageKey - Local filename for deletion
   * @param cropType - Type of crop (Bean, Cassava, etc.)
   * @param cropVariety - Optional variety name
   * @param language - User's preferred language for recommendations
   * @returns { scanId, id }
   */
  create: protectedProcedure
    .input(z.object({
      imageUrl:    z.string().url(),
      imageKey:    z.string(),
      cropType:    z.string().min(1),
      cropVariety: z.string().optional(),
      language:    z.enum(["en", "hi", "es", "sw", "lg", "fr"]).default("en"),
    }))
    .mutation(async ({ ctx, input }) => {
      const [scan] = await ctx.db
        .insert(scans)
        .values({
          userId:      ctx.user.id,
          imageUrl:    input.imageUrl,
          imageKey:    input.imageKey,
          cropType:    input.cropType,
          cropVariety: input.cropVariety,
          language:    input.language,
          status:      "pending",
        })
        .returning();

      // Trigger analysis asynchronously (don't await)
      triggerAnalysis(scan.id, input.imageUrl, input.cropType, input.language ?? "en")
        .catch((err) =>
          console.error(`[scans.create] Analysis failed for scan ${scan.id}:`, err)
        );

      return { scanId: scan.id, id: scan.id };
    }),

  // ============================================================================
  // List Scans (History)
  // ============================================================================

  /**
   * list – Get paginated list of user's scans
   * 
   * @param limit - Number of records to return (1-100, default 20)
   * @param offset - Pagination offset (default 0)
   * @returns Array of formatted scan objects
   */
  list: protectedProcedure
    .input(z.object({
      limit:  z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select()
        .from(scans)
        .where(eq(scans.userId, ctx.user.id))
        .orderBy(desc(scans.createdAt))  // Newest first
        .limit(input.limit)
        .offset(input.offset);

      return rows.map(formatScan);
    }),

  // ============================================================================
  // Scan Statistics (Dashboard Cards)
  // ============================================================================

  /**
   * count – Get scan statistics for dashboard
   * 
   * Returns counts for:
   * - Total scans
   * - Completed scans
   * - Pending scans
   * - Failed scans
   * 
   * Used for the statistics cards on the dashboard
   */
  count: protectedProcedure
    .query(async ({ ctx }) => {
      // Total scans
      const totalResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(scans)
        .where(eq(scans.userId, ctx.user.id));
      const total = totalResult[0].count;

      // Completed scans
      const completedResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(scans)
        .where(
          sql`${scans.userId} = ${ctx.user.id} AND ${scans.status} = 'completed'`
        );
      const completed = completedResult[0].count;

      // Pending scans
      const pendingResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(scans)
        .where(
          sql`${scans.userId} = ${ctx.user.id} AND ${scans.status} = 'pending'`
        );
      const pending = pendingResult[0].count;

      // Failed scans
      const failedResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(scans)
        .where(
          sql`${scans.userId} = ${ctx.user.id} AND ${scans.status} = 'failed'`
        );
      const failed = failedResult[0].count;

      return { total, completed, pending, failed };
    }),

  // ============================================================================
  // Get Single Scan
  // ============================================================================

  /**
   * getById – Get detailed information for a specific scan
   * 
   * Includes all AI-generated content:
   * - Detected disease
   * - Confidence score
   * - Treatment recommendations
   * - Fertilizer suggestions
   * - Prevention measures
   * 
   * @throws NOT_FOUND if scan doesn't exist or doesn't belong to user
   */
  getById: protectedProcedure
    .input(z.object({ scanId: z.number() }))
    .query(async ({ ctx, input }) => {
      const [scan] = await ctx.db
        .select()
        .from(scans)
        .where(eq(scans.id, input.scanId))
        .limit(1);

      if (!scan || scan.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Scan not found." });
      }

      return formatScan(scan);
    }),

  // ============================================================================
  // Retry Failed Scan
  // ============================================================================

  /**
   * retry – Re-run analysis on a failed scan
   * 
   * Resets status to "pending" and triggers analysis again
   * Useful if AI service was temporarily unavailable
   */
  retry: protectedProcedure
    .input(z.object({ scanId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [scan] = await ctx.db
        .select()
        .from(scans)
        .where(eq(scans.id, input.scanId))
        .limit(1);

      if (!scan || scan.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Scan not found." });
      }

      // Reset status and clear error message
      await ctx.db
        .update(scans)
        .set({ status: "pending", errorMessage: null })
        .where(eq(scans.id, input.scanId));

      // Trigger analysis again
      triggerAnalysis(scan.id, scan.imageUrl, scan.cropType, scan.language ?? "en")
        .catch((err) =>
          console.error(`[scans.retry] Analysis failed for scan ${scan.id}:`, err)
        );

      return { success: true, scanId: scan.id };
    }),

  // ============================================================================
  // Delete Scan
  // ============================================================================

  /**
   * delete – Permanently delete a scan and its associated image
   * 
   * Also deletes the physical image file from uploads directory
   * This action is irreversible
   * 
   * @throws NOT_FOUND if scan doesn't exist or doesn't belong to user
   */
  delete: protectedProcedure
    .input(z.object({ scanId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [scan] = await ctx.db
        .select()
        .from(scans)
        .where(eq(scans.id, input.scanId))
        .limit(1);

      if (!scan || scan.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Scan not found." });
      }

      // Delete physical image file from server
      const imagePath = path.join(process.cwd(), "uploads", scan.imageKey);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log(`🗑️ Deleted image: ${imagePath}`);
      }

      // Delete database record
      await ctx.db.delete(scans).where(eq(scans.id, input.scanId));

      return { success: true };
    }),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format scan object for frontend consumption
 * 
 * Ensures consistent defaults for optional fields
 * Converts JSON arrays to proper TypeScript arrays
 * Handles null/undefined gracefully
 */
function formatScan(scan: typeof scans.$inferSelect) {
  return {
    ...scan,
    cropVariety:               scan.cropVariety               ?? "",
    detectedDisease:           scan.detectedDisease           ?? "",
    diseaseDescription:        scan.diseaseDescription        ?? "",
    confidenceScore:           scan.confidenceScore           ?? 0,
    treatmentPlan:             scan.treatmentPlan             ?? "",
    treatmentRecommendations:  scan.treatmentRecommendations  ?? [],
    fertilizerSuggestions:     scan.fertilizerSuggestions     ?? [],
    preventionMeasures:        scan.preventionMeasures        ?? [],
    language:                  scan.language                  ?? "en",
    status:                    scan.status                    ?? "pending",
    createdAt:                 scan.createdAt?.toISOString()  ?? new Date().toISOString(),
  };
}

/**
 * Trigger AI analysis for a scan
 * 
 * Makes HTTP call to our own /api/scan/analyze endpoint
 * This allows the analysis to be processed asynchronously
 * 
 * Uses RENDER_EXTERNAL_URL in production, localhost in development
 * 
 * @param scanId - ID of the scan to analyze
 * @param imageUrl - URL of the uploaded image
 * @param cropType - Type of crop being analyzed
 * @param language - User's preferred language
 * @throws Error if analysis endpoint returns non-OK status
 */
async function triggerAnalysis(
  scanId: number,
  imageUrl: string,
  cropType: string,
  language: string,
) {
  // Determine base URL (Render production vs local development)
  const baseUrl = process.env.RENDER_EXTERNAL_URL || 
                  process.env.RAILWAY_PUBLIC_DOMAIN ||
                  `http://localhost:${process.env.PORT || 3001}`;
  const url = `${baseUrl}/api/scan/analyze`;
  
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scanId, imageUrl, cropType, language }),
  });
  
  if (!res.ok) throw new Error(`Analysis endpoint returned ${res.status}`);
}