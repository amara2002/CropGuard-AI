import { createClient } from "@supabase/supabase-js";
import { ENV } from "../_core/env.js";

if (!ENV.supabaseUrl || !ENV.supabaseKey) {
  throw new Error("❌ SUPABASE_URL or SUPABASE_ANON_KEY missing from .env");
}

export const supabase = createClient(ENV.supabaseUrl, ENV.supabaseKey);

export async function uploadCropImage(file: Express.Multer.File) {
  const ext      = file.originalname.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = `scans/${fileName}`;

  const { error } = await supabase.storage
    .from("crop-scans")
    .upload(filePath, file.buffer, { contentType: file.mimetype, upsert: false });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from("crop-scans")
    .getPublicUrl(filePath);

  return { publicUrl, filePath };
}