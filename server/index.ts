/**
 * server/index.ts
 *
 * Express backend for CropGuard.
 * Vite proxies /api/* to this server on port 3001.
 * Uses local PostgreSQL and local file storage.
 */
import "dotenv/config";
import express from "express";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers/index.js";
import { createContext } from "./_core/context.js";
import scanRoutes from "./routes/scan.js";
import googleAuthRoutes from "./routes/googleAuth.js";
import chatRoutes from "./routes/chat.js";

import cors from "cors";
const app = express();

// CORS – allow Vite dev server
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true,
}));

// Body parsers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve uploaded images
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// tRPC – all endpoints under /api/trpc
app.use(
  "/api/trpc",
  createExpressMiddleware({ router: appRouter, createContext })
);

// REST routes for scans (/api/upload, /api/scan/analyze)
app.use("/api", scanRoutes);

// Google OAuth routes – mounted under /api/auth
app.use("/api/auth", googleAuthRoutes);
app.use("/api", chatRoutes);

// Public stats for home page
app.get("/api/stats", async (_req, res) => {
  try {
    const { db } = await import("./db/db.js");
    const { scans, users } = await import("./db/schema.js");
    const { sql } = await import("drizzle-orm");

    const [scanCount] = await db.select({ count: sql<number>`count(*)` }).from(scans);
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [diseaseCount] = await db
      .select({ count: sql<number>`count(DISTINCT detected_disease)` })
      .from(scans)
      .where(sql`${scans.status} = 'completed'`);

    res.json({
      scansPerformed: scanCount.count,
      farmersHelped: userCount.count,
      diseasesDetected: diseaseCount.count,
    });
  } catch (err) {
    console.error("❌ Stats error:", err);
    res.json({
      scansPerformed: 0,
      farmersHelped: 0,
      diseasesDetected: 0,
    });
  }
});

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server on fixed port (Vite proxies to this)
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🌿 CropGuard API    →  http://localhost:${PORT}`);
  console.log(`📡 tRPC endpoint    →  http://localhost:${PORT}/api/trpc`);
  console.log(`🔐 Google OAuth     →  http://localhost:${PORT}/api/auth/google`);
  console.log(`📁 Local uploads    →  http://localhost:${PORT}/uploads`);
  console.log(`💚 Health check     →  http://localhost:${PORT}/health\n`);
});

export type { AppRouter } from "./routers/index.js";