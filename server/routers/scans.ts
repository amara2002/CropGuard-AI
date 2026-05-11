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

      triggerAnalysis(scan.id, input.imageUrl, input.cropType, input.language ?? "en")
        .catch((err) =>
          console.error(`[scans.create] Analysis failed for scan ${scan.id}:`, err)
        );

      return { scanId: scan.id, id: scan.id };
    }),

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
        .orderBy(desc(scans.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return rows.map(formatScan);
    }),

  // NEW: Count endpoint for dashboard statistics
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

      await ctx.db
        .update(scans)
        .set({ status: "pending", errorMessage: null })
        .where(eq(scans.id, input.scanId));

      triggerAnalysis(scan.id, scan.imageUrl, scan.cropType, scan.language ?? "en")
        .catch((err) =>
          console.error(`[scans.retry] Analysis failed for scan ${scan.id}:`, err)
        );

      return { success: true, scanId: scan.id };
    }),

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

      const imagePath = path.join(process.cwd(), "uploads", scan.imageKey);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log(`🗑️ Deleted image: ${imagePath}`);
      }

      await ctx.db.delete(scans).where(eq(scans.id, input.scanId));

      return { success: true };
    }),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

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

async function triggerAnalysis(
  scanId:   number,
  imageUrl: string,
  cropType: string,
  language: string,
) {
  const baseUrl = process.env.RENDER_EXTERNAL_URL || 
                  process.env.RAILWAY_PUBLIC_DOMAIN ||
                  `http://localhost:${process.env.PORT || 3001}`;
  const url = `${baseUrl}/api/scan/analyze`;
  const res = await fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ scanId, imageUrl, cropType, language }),
  });
  if (!res.ok) throw new Error(`Analysis endpoint returned ${res.status}`);
}