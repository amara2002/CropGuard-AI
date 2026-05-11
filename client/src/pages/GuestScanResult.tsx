import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";

// Multilingual translations for guest page
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
    en: "Create an account to save your scans →",
    fr: "Créer un compte pour sauvegarder vos analyses →",
    sw: "Tengeneza akaunti ili kuhifadhi uchunguzi wako →",
    lg: "Tondawo akawunti okuwanirira okukebera kwo →",
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
    en: "Save your scans and get personalized treatment plans.",
    fr: "Sauvegardez vos analyses et obtenez des plans de traitement personnalisés.",
    sw: "Hifadhi uchunguzi wako na upate mipango ya matibabu ya kibinafsi.",
    lg: "Wanirira okukebera kwo ofune enteekateeka z'okuvvuunuka ez'omwena.",
  },
  createFreeAccount: {
    en: "Create Free Account",
    fr: "Créer un Compte Gratuit",
    sw: "Tengeneza Akaunti ya Bure",
    lg: "Tondawo Akawunti eya Bwerere",
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

  // Get API URL from environment
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

    // Use absolute URL with apiUrl
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-muted-foreground">{tl("analyzing", language)}</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-6">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-foreground font-semibold mb-4">{error || tl("analysisFailed", language)}</p>
          <p className="text-muted-foreground text-sm mb-6">The AI service might be starting up. Please wait a moment and try again.</p>
          <Button onClick={() => setLocation("/")}>{tl("goHome", language)}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container py-8">
          <Button variant="outline" onClick={() => setLocation("/")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {tl("backToHome", language)}
          </Button>
          <h1 className="text-3xl font-bold text-foreground">{tl("quickScanResults", language)}</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {tl("guestMode", language)}{" "}
            <button onClick={() => setLocation("/signup")} className="text-emerald-600 hover:underline font-medium">
              {tl("createAccount", language)}
            </button>
          </p>
        </div>
      </div>

      <div className="container py-12">
        <div className="max-w-3xl mx-auto">
          <div className="card-elevated p-8 border-l-4 border-accent">
            <div className="flex items-start gap-4 mb-6">
              <CheckCircle className="w-8 h-8 text-accent flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {result.detectedDisease?.split("_").join(" ") || tl("unknown", language)}
                </h2>
                <p className="text-muted-foreground mt-2">{tl("diseaseDetected", language)}</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground">{tl("detectionConfidence", language)}</p>
                <p className="text-2xl font-bold text-accent">{result.confidenceScore}%</p>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-accent h-2 rounded-full"
                  style={{ width: `${result.confidenceScore}%` }}
                />
              </div>
            </div>

            {result.diseaseDescription && (
              <div className="mt-6 p-4 bg-accent/5 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">{tl("description", language)}</p>
                <p className="text-foreground">{result.diseaseDescription}</p>
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground mb-4">{tl("saveScans", language)}</p>
            <Button onClick={() => setLocation("/signup")} size="lg">
              {tl("createFreeAccount", language)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}