import React, { useState, useRef, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Camera,
  Upload,
  Leaf,
  ChevronRight,
  Info,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// ── Multilingual Translations ────────────────────────────────────────────
const t = {
  header: {
    en: "AI Diagnostic Terminal",
    fr: "Terminal de Diagnostic IA",
    sw: "Kituo cha Uchunguzi cha AI",
    lg: "Ekifo ky'Okukebera eby'AI",
  },
  subheader: {
    en: "Precision Pathology Engine v2.1",
    fr: "Moteur de Pathologie de Précision v2.1",
    sw: "Injini ya Patholojia ya Usahihi v2.1",
    lg: "Enzirukanya y'Endwadde ez'Amazima v2.1",
  },
  cropTarget: {
    en: "Crop Target",
    fr: "Culture Cible",
    sw: "Lengo la Zao",
    lg: "Ekigendererwa ky'Ebirime",
  },
  outputLang: {
    en: "Output Lang",
    fr: "Langue de Sortie",
    sw: "Lugha ya Matokeo",
    lg: "Olulimi lw'Ebivaamu",
  },
  processScan: {
    en: "Process Neural Scan",
    fr: "Traiter le Scan Neuronal",
    sw: "Chakata Uchunguzi wa Neural",
    lg: "Kola Okukebera kwa Neural",
  },
  runDiagnostics: {
    en: "Run Diagnostics",
    fr: "Lancer le Diagnostic",
    sw: "Anza Uchunguzi",
    lg: "Tandika Okukebera",
  },
  tapToCapture: {
    en: "Tap to Capture or Drag & Drop",
    fr: "Appuyez pour Capturer ou Glisser-Déposer",
    sw: "Gusa ili Kunasa au Buruta na Achia",
    lg: "Koona Okukwata oba Sika n'Osuula",
  },
  supportedFormats: {
    en: "Supports JPG, PNG, WebP (max 5MB)",
    fr: "Prend en charge JPG, PNG, WebP (max 5 Mo)",
    sw: "Inasaidia JPG, PNG, WebP (upeo wa MB 5)",
    lg: "Ewagira JPG, PNG, WebP (waggulu wa MB 5)",
  },
  guestNotice: {
    en: "Quick Scan Active: Results are volatile and will be purged upon session end.",
    fr: "Analyse Rapide Active : Les résultats sont temporaires et seront effacés à la fin de la session.",
    sw: "Uchunguzi wa Haraka Unaendelea: Matokeo ni ya muda na yatafutwa mwishoni mwa kipindi.",
    lg: "Okukebera Okw'angu Kuliwo: Ebivaamu bya kaseera era bijja kusangulwa olunaku luwedde.",
  },
  createProfile: {
    en: "Create Profile to Persist Data →",
    fr: "Créer un Profil pour Sauvegarder les Données →",
    sw: "Tengeneza Wasifu ili Kuhifadhi Data →",
    lg: "Tondawo Profayilo Okuwanirira Ebikwata →",
  },
  uploadFailed: {
    en: "Upload failed",
    fr: "Échec du téléchargement",
    sw: "Upakiaji umeshindwa",
    lg: "Okutikka kulemye",
  },
  pleaseUpload: {
    en: "Please upload an image first",
    fr: "Veuillez d'abord télécharger une image",
    sw: "Tafadhali pakia picha kwanza",
    lg: "Nsaba otikke ekifaananyi okusooka",
  },
  fileTooBig: {
    en: "File size must be under 5MB",
    fr: "La taille du fichier doit être inférieure à 5 Mo",
    sw: "Ukubwa wa faili lazima uwe chini ya MB 5",
    lg: "Obunene bwa fayiro bulina okuba wansi wa MB 5",
  },
  validImage: {
    en: "Please select a valid image",
    fr: "Veuillez sélectionner une image valide",
    sw: "Tafadhali chagua picha halali",
    lg: "Nsaba olonde ekifaananyi ekituufu",
  },
  analysisFailed: {
    en: "Analysis failed. Please try again.",
    fr: "L'analyse a échoué. Veuillez réessayer.",
    sw: "Uchambuzi umeshindwa. Tafadhali jaribu tena.",
    lg: "Okukebera kulemye. Nsaba ogezeeko oluvanyuma.",
  },
  scanCreated: {
    en: "Scan created! Processing your image...",
    fr: "Analyse créée ! Traitement de votre image...",
    sw: "Uchunguzi umeundwa! Inachakata picha yako...",
    lg: "Okukebera kutondeddwa! Okukola ku kifaananyi kyo...",
  },
  scanFailed: {
    en: "Failed to start analysis",
    fr: "Échec du démarrage de l'analyse",
    sw: "Imeshindwa kuanza uchambuzi",
    lg: "Kilemye okutandika okukebera",
  },
  guestComplete: {
    en: "Analysis complete (Guest Session)",
    fr: "Analyse terminée (Session Invité)",
    sw: "Uchambuzi umekamilika (Kipindi cha Mgeni)",
    lg: "Okukebera kuwedde (Olusessoni lw'Omugenyi)",
  },
};

function tl(key: keyof typeof t, lang: string): string {
  const translations = t[key] as Record<string, string>;
  return translations[lang] || translations.en;
}

export default function Scanner() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cropType, setCropType] = useState("Tomato");
  const [language, setLanguage] = useState("en");
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Get API URL from environment variable
  const apiUrl = import.meta.env.VITE_API_URL || "";

  const createScan = trpc.scans.create.useMutation({
    onSuccess: (data) => {
      console.log("✅ Scan created with ID:", data.scanId);
      toast.success(tl("scanCreated", language));
      setTimeout(() => setLocation(`/scan/${data.scanId}`), 300);
    },
    onError: (error) => {
      console.error("❌ Scan creation failed:", error.message);
      toast.error(tl("scanFailed", language));
      setIsUploading(false);
    },
  });

  const handleFile = useCallback((selectedFile: File) => {
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error(tl("fileTooBig", language));
      return;
    }
    if (!selectedFile.type.startsWith("image/")) {
      toast.error(tl("validImage", language));
      return;
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  }, [language]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleFile(selectedFile);
  };

  const handleStartAnalysis = async () => {
    if (!file) {
      toast.error(tl("pleaseUpload", language));
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Use absolute URL with apiUrl
      const res = await fetch(`${apiUrl}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Upload failed: ${res.status} ${errorText}`);
      }

      const { imageUrl, imageKey } = await res.json();
      console.log("📁 Image uploaded:", imageKey);

      if (isAuthenticated) {
        await createScan.mutateAsync({
          imageUrl,
          imageKey,
          cropType,
          language: language as "en" | "hi" | "es" | "sw" | "lg" | "fr",
        });
      } else {
        toast.success(tl("guestComplete", language));
        setLocation(
          `/guest-result?img=${encodeURIComponent(imageUrl)}&crop=${cropType}`
        );
      }
    } catch (error) {
      console.error("❌ Analysis failed:", error);
      toast.error(tl("analysisFailed", language));
      setIsUploading(false);
    }
  };

  const clearImage = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6 flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-8 py-8 md:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter">
            {tl("header", language)}
          </h1>
          <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
            {tl("subheader", language)}
          </p>
        </motion.div>

        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*"
          />

          <div
            onClick={() => !preview && fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              relative aspect-square w-full max-w-xl mx-auto rounded-[3rem] border-4 border-dashed 
              transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center
              ${dragActive ? "border-emerald-500 bg-emerald-50/50 scale-[1.02]" : ""}
              ${preview ? "border-emerald-500 bg-white" : "border-slate-200 bg-slate-50 hover:border-emerald-200"}
            `}
          >
            <AnimatePresence mode="wait">
              {preview ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative w-full h-full"
                >
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearImage();
                    }}
                    className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition"
                  >
                    <X className="w-5 h-5 text-slate-700" />
                  </button>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm inline-flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      {file?.name}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="upload-prompt"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center p-8 text-center"
                >
                  <div className="bg-white p-6 rounded-full shadow-xl shadow-slate-200 mb-6">
                    <Camera className="w-10 h-10 text-emerald-600" />
                  </div>
                  <span className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">
                    {tl("tapToCapture", language)}
                  </span>
                  <span className="text-xs text-slate-400">
                    {tl("supportedFormats", language)}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Settings Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4 max-w-xl mx-auto"
        >
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">
              {tl("cropTarget", language)}
            </label>
            <select
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
              className="w-full h-14 rounded-2xl border-2 border-slate-100 px-4 text-sm font-bold uppercase tracking-tight focus:border-emerald-500 outline-none bg-white"
            >
              <option>Bean</option>
              <option>Cassava</option>
              <option>Corn</option>
              <option>Potato</option>
              <option>Tomato</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase ml-2">
              {tl("outputLang", language)}
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full h-14 rounded-2xl border-2 border-slate-100 px-4 text-sm font-bold uppercase tracking-tight focus:border-emerald-500 outline-none bg-white"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="sw">Kiswahili</option>
              <option value="lg">Luganda</option>
            </select>
          </div>
        </motion.div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-xl mx-auto w-full"
        >
          <Button
            onClick={handleStartAnalysis}
            disabled={isUploading || !file}
            className="w-full h-20 rounded-[2rem] bg-slate-900 hover:bg-black text-white shadow-2xl shadow-slate-200 group transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <div className="flex items-center justify-between w-full px-6">
                <div className="flex items-center gap-4 text-left">
                  <div className="bg-emerald-500 p-2 rounded-lg">
                    <Leaf className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-black text-emerald-500 uppercase">
                      {tl("processScan", language)}
                    </span>
                    <span className="block text-base font-bold uppercase tracking-tight">
                      {tl("runDiagnostics", language)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            )}
          </Button>
        </motion.div>

        {/* Guest Notice */}
        <AnimatePresence>
          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-xl mx-auto"
            >
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-700 uppercase leading-relaxed tracking-wide">
                    {tl("guestNotice", language)}
                  </p>
                  <button
                    onClick={() => setLocation("/signup")}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline mt-2 inline-block"
                  >
                    {tl("createProfile", language)}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}