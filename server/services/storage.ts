// server/services/storage.ts
// CropGuard AI - Supabase Storage Integration
// 
// Purpose: Provide cloud storage for uploaded crop images using Supabase.
//          This is an alternative to local file storage, useful for:
//          - Production deployments where local storage isn't persistent
//          - Multi-server deployments (Render, Vercel, etc.)
//          - CDN delivery for faster image loading
//
// Note: Current implementation uses local file storage. This file is kept
//       for future cloud storage migration if needed.

import { createClient } from "@supabase/supabase-js";
import { ENV } from "../_core/env.js";

// ============================================================================
// Supabase Client Initialization
// ============================================================================

// Validate required environment variables
if (!ENV.supabaseUrl || !ENV.supabaseKey) {
  throw new Error("❌ SUPABASE_URL or SUPABASE_ANON_KEY missing from .env");
}

// Create Supabase client for storage operations
// Uses Anonymous Key - safe for client-side operations
export const supabase = createClient(ENV.supabaseUrl, ENV.supabaseKey);

// ============================================================================
// Image Upload Function
// ============================================================================

/**
 * Upload crop image to Supabase Storage
 * 
 * Workflow:
 * 1. Generate unique filename using timestamp + random string
 * 2. Upload to 'crop-scans' bucket
 * 3. Get public URL for the uploaded file
 * 
 * @param file - Multer file object from Express upload
 * @returns Object containing public URL and storage path
 * 
 * @throws Error if upload fails
 * 
 * @example
 * const { publicUrl, filePath } = await uploadCropImage(req.file);
 * // publicUrl: "https://project.supabase.co/storage/v1/object/public/crop-scans/scans/123456-abc.jpg"
 * // filePath: "scans/123456-abc.jpg"
 */
export async function uploadCropImage(file: Express.Multer.File) {
  // Generate unique filename to prevent collisions
  // Format: scans/{timestamp}-{randomString}.{extension}
  const ext = file.originalname.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = `scans/${fileName}`;

  // Upload file to Supabase Storage bucket
  const { error } = await supabase.storage
    .from("crop-scans")
    .upload(filePath, file.buffer, { 
      contentType: file.mimetype, 
      upsert: false  // Don't overwrite existing files
    });

  if (error) throw error;

  // Get public URL for uploaded file (no authentication required)
  const { data: { publicUrl } } = supabase.storage
    .from("crop-scans")
    .getPublicUrl(filePath);

  return { publicUrl, filePath };
}