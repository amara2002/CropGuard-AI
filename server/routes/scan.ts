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

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for local disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/upload
// ─────────────────────────────────────────────────────────────────────────────
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image provided" });

    const imageUrl = `http://localhost:3001/uploads/${req.file.filename}`;
    const imageKey = req.file.filename;

    return res.status(200).json({ imageUrl, imageKey });
  } catch (err: any) {
    console.error("❌ Upload error:", err.message);
    return res.status(500).json({ error: "Upload failed", details: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/scan/analyze
// ─────────────────────────────────────────────────────────────────────────────
router.post("/scan/analyze", async (req, res) => {
  const { scanId, imageUrl, cropType, language = "en" } = req.body as {
    scanId: number;
    imageUrl: string;
    cropType: string;
    language: string;
  };

  if (!scanId || !imageUrl || !cropType) {
    return res.status(400).json({ error: "scanId, imageUrl, and cropType are required" });
  }

  try {
    const imgResponse = await axios.get<ArrayBuffer>(imageUrl, { responseType: "arraybuffer" });
    const imgBuffer = Buffer.from(imgResponse.data);

    const form = new FormData();
    form.append("file", imgBuffer, { filename: "scan.jpg", contentType: "image/jpeg" });

    const pyResponse = await axios.post<{
      disease: string;
      confidence: string;
    }>(ENV.fastapiUrl, form, { headers: form.getHeaders() });

    const diagnosis = pyResponse.data;
    const confidenceScore = Math.round(parseFloat(diagnosis.confidence.replace("%", "")));
    console.log(`🧠 MobileNet: ${diagnosis.disease} (${diagnosis.confidence}) — scan ${scanId}`);

    // Pass language to Gemini
    const advice = await getSmartRecommendations(diagnosis.disease, cropType, language);

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

    await db
      .update(scans)
      .set({ status: "failed", errorMessage: err.message })
      .where(eq(scans.id, scanId))
      .catch(() => {});

    return res.status(500).json({ error: "Analysis failed", details: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/scan/analyze-guest
// ─────────────────────────────────────────────────────────────────────────────
router.post("/scan/analyze-guest", async (req, res) => {
  const { imageUrl, cropType } = req.body as {
    imageUrl: string;
    cropType: string;
  };

  if (!imageUrl || !cropType) {
    return res.status(400).json({ error: "imageUrl and cropType are required" });
  }

  try {
    const imgResponse = await axios.get<ArrayBuffer>(imageUrl, { responseType: "arraybuffer" });
    const imgBuffer = Buffer.from(imgResponse.data);

    const form = new FormData();
    form.append("file", imgBuffer, { filename: "scan.jpg", contentType: "image/jpeg" });

    const pyResponse = await axios.post<{
      disease: string;
      confidence: string;
    }>(ENV.fastapiUrl, form, { headers: form.getHeaders() });

    const diagnosis = pyResponse.data;
    const confidenceScore = Math.round(parseFloat(diagnosis.confidence.replace("%", "")));
    console.log(`🧠 MobileNet (Guest): ${diagnosis.disease} (${diagnosis.confidence})`);

    // Guests default to English
    const advice = await getSmartRecommendations(diagnosis.disease, cropType, "en");

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