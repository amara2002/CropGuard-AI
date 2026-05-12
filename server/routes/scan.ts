// server/routes/scan.ts
// CropGuard AI - Image Upload and Disease Analysis
// 
// Purpose: Handle crop image uploads and integrate with AI models for disease detection.
//          Coordinates between Express backend, FastAPI (MobileNet), and Gemini AI for recommendations.
//
// Architecture:
// 1. Frontend uploads image → Express saves locally
// 2. Express downloads image from own URL → sends to FastAPI
// 3. FastAPI returns disease prediction
// 4. Express calls Gemini AI for recommendations
// 5. Results saved to database and returned to frontend
//
// Endpoints:
// - POST /api/upload - Save image locally
// - POST /api/scan/analyze - Full analysis (authenticated)
// - POST /api/scan/analyze-guest - Analysis without saving (guest mode)

import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import { eq } from "drizzle-orm";
import { getSmartRecommendations } from "../services/ai.js";
import { db } from "../db/db.js";
import { scans } from "../db/schema.js";
import { ENV } from "../_core/env.js";

const router = express.Router();

// ============================================================================
// File Storage Configuration
// ============================================================================

// Ensure uploads directory exists (creates if missing)
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for local disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    // Generate unique filename to prevent collisions
    // Format: timestamp-randomString.extension
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// Multer upload middleware with validation
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },  // 5MB max file size
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

// ============================================================================
// Image Upload Endpoint
// ============================================================================

/**
 * POST /api/upload - Save uploaded crop image
 * 
 * @body file - Image file (multipart/form-data)
 * @returns { imageUrl: string, imageKey: string }
 * 
 * Uses RENDER_EXTERNAL_URL in production, localhost in development
 */
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image provided" });

    // Determine the correct host URL (Render production vs local development)
    const host = process.env.RENDER_EXTERNAL_URL ||
      `http://localhost:${process.env.PORT || 3001}`;
    
    const imageUrl = `${host}/uploads/${req.file.filename}`;
    const imageKey = req.file.filename;
    
    return res.status(200).json({ imageUrl, imageKey });
  } catch (err: any) {
    console.error("❌ Upload error:", err.message);
    return res.status(500).json({ error: "Upload failed", details: err.message });
  }
});

// ============================================================================
// Disease Analysis Endpoints
// ============================================================================

/**
 * POST /api/scan/analyze - Full disease analysis (authenticated users)
 * 
 * Workflow:
 * 1. Download image from our own URL
 * 2. Send to Hugging Face FastAPI (MobileNetV3)
 * 3. Get disease prediction
 * 4. Generate recommendations with Gemini AI
 * 5. Save results to database
 * 6. Return success response
 * 
 * Called indirectly by tRPC scans.create procedure
 */
router.post("/scan/analyze", async (req, res) => {
  const { scanId, imageUrl, cropType, language = "en" } = req.body;

  if (!scanId || !imageUrl || !cropType) {
    return res.status(400).json({ error: "scanId, imageUrl, and cropType are required" });
  }

  try {
    // ------------------------------------------------------------------------
    // Step 1: Download image from our server
    // ------------------------------------------------------------------------
    const imgResponse = await axios.get<ArrayBuffer>(imageUrl, { 
      responseType: "arraybuffer" 
    });
    const imgBuffer = Buffer.from(imgResponse.data);

    // ------------------------------------------------------------------------
    // Step 2: Send to Hugging Face FastAPI (MobileNetV3 model)
    // ------------------------------------------------------------------------
    const form = new FormData();
    form.append("file", imgBuffer, { 
      filename: "scan.jpg", 
      contentType: "image/jpeg" 
    });

    const pyResponse = await axios.post(ENV.fastapiUrl, form, { 
      headers: form.getHeaders() 
    });

    const diagnosis = pyResponse.data;
    const confidenceScore = Math.round(parseFloat(diagnosis.confidence.replace("%", "")));
    console.log(`🧠 MobileNet: ${diagnosis.disease} (${diagnosis.confidence}) — scan ${scanId}`);

    // ------------------------------------------------------------------------
    // Step 3: Generate AI recommendations with Gemini
    // ------------------------------------------------------------------------
    const advice = await getSmartRecommendations(diagnosis.disease, cropType, language);

    // ------------------------------------------------------------------------
    // Step 4: Save results to database
    // ------------------------------------------------------------------------
    await db
      .update(scans)
      .set({
        detectedDisease: diagnosis.disease,
        confidenceScore,
        diseaseDescription: advice.description,
        treatmentRecommendations: advice.treatments,
        fertilizerSuggestions: advice.fertilizer,
        preventionMeasures: advice.prevention,
        status: "completed",
      })
      .where(eq(scans.id, scanId));

    console.log(`✅ Scan ${scanId} completed.`);
    return res.status(200).json({ success: true, scanId });
    
  } catch (err: any) {
    console.error(`❌ Analysis failed for scan ${scanId}:`, err.message);

    // Update scan status to failed
    await db
      .update(scans)
      .set({ status: "failed", errorMessage: err.message })
      .where(eq(scans.id, scanId))
      .catch(() => {});

    return res.status(500).json({ error: "Analysis failed", details: err.message });
  }
});

/**
 * POST /api/scan/analyze-guest - Quick analysis for guest users
 * 
 * Same as above but doesn't save to database
 * Results are temporary and not persisted
 */
router.post("/scan/analyze-guest", async (req, res) => {
  const { imageUrl, cropType } = req.body;

  if (!imageUrl || !cropType) {
    return res.status(400).json({ error: "imageUrl and cropType are required" });
  }

  try {
    // Download image
    const imgResponse = await axios.get<ArrayBuffer>(imageUrl, { 
      responseType: "arraybuffer" 
    });
    const imgBuffer = Buffer.from(imgResponse.data);

    // Call FastAPI
    const form = new FormData();
    form.append("file", imgBuffer, { 
      filename: "scan.jpg", 
      contentType: "image/jpeg" 
    });

    const pyResponse = await axios.post(ENV.fastapiUrl, form, { 
      headers: form.getHeaders() 
    });

    const diagnosis = pyResponse.data;
    const confidenceScore = Math.round(parseFloat(diagnosis.confidence.replace("%", "")));
    console.log(`🧠 MobileNet (Guest): ${diagnosis.disease} (${diagnosis.confidence})`);

    // Generate recommendations (default to English for guests)
    const advice = await getSmartRecommendations(diagnosis.disease, cropType, "en");

    // Return results directly (no database storage)
    return res.status(200).json({
      detectedDisease: diagnosis.disease,
      confidenceScore,
      diseaseDescription: advice.description,
      treatmentRecommendations: advice.treatments,
      fertilizerSuggestions: advice.fertilizer,
      preventionMeasures: advice.prevention,
    });
    
  } catch (err: any) {
    console.error("❌ Guest analysis failed:", err.message);
    return res.status(500).json({ error: "Analysis failed", details: err.message });
  }
});

export default router;