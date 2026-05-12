// GuestScanResult.tsx - Results page for anonymous (guest) quick scans
// Purpose: Display disease detection results for users who are not logged in.
//          Results are temporary and cannot be saved without creating an account.
//          Includes a single, professional call-to-action to encourage signup.

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle, ArrowLeft, Leaf, Lock, TrendingUp, Shield } from "lucide-react";

// Multilingual translations for guest page - supports 4 languages
const t = {
  analyzing: {
    en: "Analyzing your image...",
    fr: "Analyse de votre image en cours...",
    sw: "Inachambua picha yako...",
    lg: "Okukebera ekifaananyi kyo...",
  },
  missing: {
    en: "Missing image or crop type.",
    fr: "Image ou type de culture manquant.",
    sw: "Picha au aina ya zao haipo.",
    lg: "Ekifaananyi oba ekika ky'ekirime tebiriwo.",
  },
  analysisFailed: {
    en: "Analysis failed. Please try again.",
    fr: "L'analyse a échoué. Veuillez réessayer.",
    sw: "Uchambuzi umeshindwa. Tafadhali jaribu tena.",
    lg: "Okukebera kulemye. Nsaba ogezeeko oluvanyuma.",
  },
  goHome: {
    en: "Go Home",
    fr: "Aller à l'Accueil",
    sw: "Nenda Nyumbani",
    lg: "Genda Awaka",
  },
  backToHome: {
    en: "Back to Home",
    fr: "Retour à l'Accueil",
    sw: "Rudi Nyumbani",
    lg: "Ddayo Awaka",
  },
  quickScanResults: {
    en: "Quick Scan Results",
    fr: "Résultats de l'Analyse Rapide",
    sw: "Matokeo ya Uchunguzi wa Haraka",
    lg: "Ebivaamu mu Kukebera Okw'angu",
  },
  guestMode: {
    en: "Guest mode – results are temporary.",
    fr: "Mode invité – les résultats sont temporaires.",
    sw: "Hali ya mgeni – matokeo ni ya muda.",
    lg: "Embeera y'omugenyi – ebivaamu bya kaseera.",
  },
  createAccount: {
    en: "Create a free account to save your scans",
    fr: "Créez un compte gratuit pour sauvegarder vos analyses",
    sw: "Tengeneza akaunti ya bure kuhifadhi uchunguzi wako",
    lg: "Tondawo akawunti eya bwerere okuwanirira okukebera kwo",
  },
  diseaseDetected: {
    en: "Disease Detected",
    fr: "Maladie Détectée",
    sw: "Ugonjwa Umegunduliwa",
    lg: "Endwadde Ezuuliddwa",
  },
  detectionConfidence: {
    en: "Detection Confidence",
    fr: "Confiance de Détection",
    sw: "Uhakika wa Ugunduzi",
    lg: "Obwesige bw'Okuzuula",
  },
  description: {
    en: "Description",
    fr: "Description",
    sw: "Maelezo",
    lg: "Okunnyonnyola",
  },
  unknown: {
    en: "Unknown",
    fr: "Inconnu",
    sw: "Haijulikani",
    lg: "Tekimanyiddwa",
  },
  saveScans: {
    en: "Save your scan history, get personalized treatment plans, and receive AI-powered prevention recommendations.",
    fr: "Sauvegardez votre historique d'analyses, obtenez des plans de traitement personnalisés et recevez des recommandations de prévention basées sur l'IA.",
    sw: "Hifadhi historia yako ya uchunguzi, pata mipango ya matibabu ya kibinafsi, na upokee mapendekezo ya kuzuia yanayotokana na AI.",
    lg: "Wanirira eby'okukebera kwo, funa enteekateeka z'okujjanjaba ez'omwena, era ofune ebiragiro by'okuziyiza ebyava mu AI.",
  },
  createFreeAccount: {
    en: "Create Free Account",
    fr: "Créer un Compte Gratuit",
    sw: "Tengeneza Akaunti ya Bure",
    lg: "Tondawo Akawunti eya Bwerere",
  },
  treatmentRecommendations: {
    en: "Treatment Recommendations",
    fr: "Recommandations de Traitement",
    sw: "Mapendekezo ya Matibabu",
    lg: "Ebiragiro by'Okujjanjaba",
  },
  preventionMeasures: {
    en: "Prevention Measures",
    fr: "Mesures de Prévention",
    sw: "Hatua za Kukinga",
    lg: "Emikutu gy'Okuziyiza",
  },
};

function tl(key: keyof typeof t, lang: string): string {
  const translations = t[key] as Record<string, string>;
  return translations[lang] || translations.en;
}

export default function GuestScanResult() {
  const [, setLocation] = useLocation();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState("en");

  const apiUrl = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const imageUrl = params.get("img");
    const cropType = params.get("crop");
    const lang = params.get("lang") || "en";
    setLanguage(lang);

    if (!imageUrl || !cropType) {
      setError(tl("missing", lang));
      setLoading(false);
      return;
    }

    fetch(`${apiUrl}/api/scan/analyze-guest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        imageUrl: decodeURIComponent(imageUrl), 
        cropType, 
        language: lang 
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setResult(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Guest analysis error:", err);
        setError(tl("analysisFailed", lang));
        setLoading(false);
      });
  }, [apiUrl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600">{tl("analyzing", language)}</p>
          <p className="text-xs text-slate-400 mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <p className="text-slate-800 font-semibold text-lg mb-3">{error || tl("analysisFailed", language)}</p>
          <p className="text-slate-500 text-sm mb-6">
            The AI service might be starting up. Please wait a moment and try again.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setLocation("/")} variant="outline">
              {tl("goHome", language)}
            </Button>
            <Button onClick={() => window.location.reload()} className="bg-emerald-600 hover:bg-emerald-700">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      {/* Header */}
      <div className="border-b border-slate-200/80 bg-white/80 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
        <div className="container px-4 py-4 md:py-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="mb-3 md:mb-4 -ml-3 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {tl("backToHome", language)}
          </Button>

          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              {tl("quickScanResults", language)}
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              {tl("guestMode", language)}
            </p>
          </div>
        </div>
      </div>

      <div className="container px-4 py-6 md:py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* Disease Detection Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-6 md:p-8 border-l-4 border-l-emerald-500">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
                    {result.detectedDisease?.split("_").join(" ") || tl("unknown", language)}
                  </h2>
                  <p className="text-slate-500 mt-1">{tl("diseaseDetected", language)}</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-700">{tl("detectionConfidence", language)}</p>
                  <p className="text-2xl font-bold text-emerald-600">{result.confidenceScore}%</p>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full transition-all"
                    style={{ width: `${result.confidenceScore}%` }}
                  />
                </div>
              </div>

              {result.diseaseDescription && (
                <div className="mt-6 p-4 bg-emerald-50/30 rounded-xl">
                  <p className="text-sm text-slate-500 font-medium mb-2">{tl("description", language)}</p>
                  <p className="text-slate-700">{result.diseaseDescription}</p>
                </div>
              )}
            </div>
          </div>

          {/* Locked Premium Content */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden relative">
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="text-center p-6 max-w-sm">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Unlock Full Report</h3>
                <p className="text-sm text-slate-600 mb-4">
                  {tl("saveScans", language)}
                </p>
                <Button
                  onClick={() => setLocation("/signup")}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 w-full"
                >
                  {tl("createFreeAccount", language)}
                </Button>
                <p className="text-xs text-slate-500 mt-3">
                  Already have an account?{" "}
                  <button onClick={() => setLocation("/login")} className="text-emerald-600 hover:underline">
                    Sign in
                  </button>
                </p>
              </div>
            </div>

            {/* Blurred preview of what's locked */}
            <div className="p-6 md:p-8 opacity-30 blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h3 className="text-xl font-bold text-slate-800">{tl("treatmentRecommendations", language)}</h3>
              </div>
              <div className="p-4 bg-emerald-50/20 rounded-lg border border-emerald-100 mb-6">
                <p className="font-semibold text-slate-800">Professional treatment plan</p>
                <p className="text-sm text-slate-600 mt-1">Step-by-step instructions for disease management</p>
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-emerald-600" />
                <h3 className="text-xl font-bold text-slate-800">{tl("preventionMeasures", language)}</h3>
              </div>
              <div className="p-4 bg-blue-50/20 rounded-lg border border-blue-100">
                <p className="font-semibold text-slate-800">Prevention strategies</p>
                <p className="text-sm text-slate-600 mt-1">Long-term crop protection methods</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}