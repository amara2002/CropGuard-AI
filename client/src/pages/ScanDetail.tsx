import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { speak, stopSpeaking } from "@/lib/tts";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Loader2,
  Download,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Leaf,
  Shield,
  RefreshCw,
  Trash2,
  ArrowLeft,
  FileText,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface ScanDetailProps {
  scanId: number;
}

export default function ScanDetail({ scanId }: ScanDetailProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [speaking, setSpeaking] = useState(false);

  const { data: scan, isLoading } = trpc.scans.getById.useQuery(
    { scanId },
    {
      // Poll every 2 seconds while the scan is pending
      refetchInterval: (query) => {
        const data = query.state.data;
        if (data?.status === "pending") {
          return 2000; // 2 seconds
        }
        return false; // Stop polling once completed or failed
      },
    }
  );

  useEffect(() => {
    // Stop any speech when component unmounts (user leaves the page)
    return () => {
      stopSpeaking();
    };
  }, []);

  const retryMutation = trpc.scans.retry.useMutation({
    onSuccess: () => {
      toast.success("Re-running analysis...");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to retry");
    },
  });

  const deleteMutation = trpc.scans.delete.useMutation({
    onSuccess: () => {
      toast.success("Scan deleted successfully!");
      setLocation("/dashboard");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete scan");
    },
  });

  // ── Text-to-Speech Handler ──────────────────────────────────────────────
  const handleSpeak = (text: string) => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
    } else {
      speak(text, scan?.language || "en");
      setSpeaking(true);
      // Reset when speech ends naturally
      const checkSpeaking = setInterval(() => {
        if (!window.speechSynthesis?.speaking) {
          setSpeaking(false);
          clearInterval(checkSpeaking);
        }
      }, 500);
    }
  };

  // ── Read full report aloud ──────────────────────────────────────────────
  const handleReadFullReport = () => {
    if (!scan) return;
    const parts: string[] = [];
    
    parts.push(`Disease detected: ${scan.detectedDisease?.split("_").join(" ") || "Unknown"}.`);
    parts.push(`Confidence: ${scan.confidenceScore} percent.`);
    
    if (scan.diseaseDescription) {
      parts.push(scan.diseaseDescription);
    }
    
    if (Array.isArray(scan.treatmentRecommendations)) {
      parts.push("Treatment recommendations:");
      scan.treatmentRecommendations.forEach((t: any) => {
        parts.push(`${t.name}. ${t.description || ""}`);
      });
    }
    
    if (Array.isArray(scan.preventionMeasures)) {
      parts.push("Prevention measures:");
      scan.preventionMeasures.forEach((p: any) => {
        parts.push(`${p.name}. ${p.description || ""}`);
      });
    }

    handleSpeak(parts.join(". "));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-accent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading scan details...</p>
        </div>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-foreground font-semibold mb-4">Scan not found</p>
          <Button onClick={() => setLocation("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleRetry = () => {
    retryMutation.mutate({ scanId });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to permanently delete this scan?")) {
      deleteMutation.mutate({ scanId });
    }
  };

  // ── PROFESSIONAL PDF DOWNLOAD ───────────────────────────────────────────
  const handleDownloadReport = () => {
    if (!scan) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = margin;

    const addTitle = (text: string) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(6, 95, 70);
      doc.text(text, margin, y);
      y += 8;
      doc.setDrawColor(6, 95, 70);
      doc.setLineWidth(0.8);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
    };

    const addSectionHeader = (text: string) => {
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(6, 95, 70);
      doc.text(text, margin, y);
      y += 5;
      doc.setDrawColor(200, 220, 210);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageWidth - margin, y);
      y += 4;
    };

    const addText = (
      text: string,
      size = 10,
      color: number[] = [51, 51, 51]
    ) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(size);
      doc.setTextColor(color[0], color[1], color[2]);
      const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 2;
    };

    const addBullet = (text: string, indent = 5) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(51, 51, 51);
      const bullet = "\u2022  ";
      const lines = doc.splitTextToSize(
        bullet + text,
        pageWidth - margin * 2 - indent
      );
      doc.text(lines, margin + indent, y);
      y += lines.length * 5 + 1;
    };

    const checkPageBreak = (needed: number) => {
      if (y + needed > 270) {
        doc.addPage();
        y = margin;
      }
    };

    // ── Header ──
    addTitle("CropGuard Disease Analysis Report");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);

    // Report generation time (NOW)
    doc.text(
      `Report Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
      margin,
      y
    );
    y += 5;

    // Report ID
    doc.text(
      `Report ID: CG-${scan.id}-${new Date().toISOString().split("T")[0]}`,
      margin,
      y
    );
    y += 5;

    // Scan date (when the image was analyzed)
    doc.text(
      `Scan Date: ${new Date(scan.createdAt).toLocaleDateString()} at ${new Date(scan.createdAt).toLocaleTimeString()}`,
      margin,
      y
    );
    y += 8;

    // ── Crop Information ──
    checkPageBreak(25);
    addSectionHeader("Crop Information");
    addText(
      `Crop Type: ${scan.cropType}${scan.cropVariety ? ` (${scan.cropVariety})` : ""}`
    );
    addText(
      `Scan Date: ${new Date(scan.createdAt).toLocaleDateString()} at ${new Date(scan.createdAt).toLocaleTimeString()}`
    );
    addText(
      `Status: ${scan.status.charAt(0).toUpperCase() + scan.status.slice(1)}`
    );
    addText(
      `Language: ${scan.language === "en" ? "English" : scan.language === "fr" ? "French" : scan.language === "sw" ? "Swahili" : scan.language === "lg" ? "Luganda" : scan.language === "hi" ? "Hindi" : "Spanish"}`
    );

    // ── Disease Detection ──
    if (scan.status === "completed") {
      checkPageBreak(30);
      addSectionHeader("Disease Detection Results");
      addText(
        `Detected Disease: ${scan.detectedDisease?.split("_").join(" ") || "N/A"}`,
        12,
        [6, 95, 70]
      );
      addText(`Confidence Score: ${scan.confidenceScore}%`, 14, [6, 95, 70]);

      if (scan.diseaseDescription) {
        checkPageBreak(20);
        addSectionHeader("Disease Description");
        addText(scan.diseaseDescription);
      }

      if (
        Array.isArray(scan.treatmentRecommendations) &&
        scan.treatmentRecommendations.length > 0
      ) {
        checkPageBreak(20);
        addSectionHeader("Treatment Recommendations");
        (scan.treatmentRecommendations as any[]).forEach(
          (t: any, i: number) => {
            checkPageBreak(10);
            addText(
              `${i + 1}. ${t.name || "Treatment " + (i + 1)}`,
              11,
              [6, 95, 70]
            );
            if (t.description) addBullet(t.description);
            if (t.duration) addBullet(`Duration: ${t.duration}`);
            y += 2;
          }
        );
      }

      if (
        Array.isArray(scan.fertilizerSuggestions) &&
        scan.fertilizerSuggestions.length > 0
      ) {
        checkPageBreak(20);
        addSectionHeader("Fertilizer Suggestions");
        (scan.fertilizerSuggestions as any[]).forEach((f: any, i: number) => {
          checkPageBreak(10);
          addText(
            `${i + 1}. ${f.name || "Fertilizer " + (i + 1)}`,
            11,
            [6, 95, 70]
          );
          if (f.npkRatio) addBullet(`NPK Ratio: ${f.npkRatio}`);
          if (f.applicationRate)
            addBullet(`Application Rate: ${f.applicationRate}`);
          y += 2;
        });
      }

      if (
        Array.isArray(scan.preventionMeasures) &&
        scan.preventionMeasures.length > 0
      ) {
        checkPageBreak(20);
        addSectionHeader("Prevention Measures");
        (scan.preventionMeasures as any[]).forEach((p: any, i: number) => {
          checkPageBreak(10);
          addText(
            `${i + 1}. ${p.name || "Prevention " + (i + 1)}`,
            11,
            [6, 95, 70]
          );
          if (p.description) addBullet(p.description);
          y += 2;
        });
      }
    } else if (scan.status === "failed") {
      addSectionHeader("Analysis Status: Failed");
      addText(
        scan.errorMessage ||
          "The analysis could not be completed. Please try again."
      );
    } else {
      addSectionHeader("Analysis Status: Pending");
      addText(
        "The image is currently being analyzed. Please check back shortly."
      );
    }

    y += 10;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      "This report was generated by CropGuard AI. For more information, visit your dashboard.",
      margin,
      y
    );
    y += 4;
    doc.text(`CropGuard v2.1 | ${new Date().getFullYear()}`, margin, y);

    const fileName = `CropGuard_Report_${scan.cropType}_${new Date(scan.createdAt).toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
    toast.success("PDF report downloaded successfully!");
  };;

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container py-8">
          <Button
            variant="outline"
            onClick={() => setLocation("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-foreground">
            Disease Analysis Report
          </h1>
          <p className="text-muted-foreground mt-2">
            {new Date(scan.createdAt).toLocaleDateString()} at{" "}
            {new Date(scan.createdAt).toLocaleTimeString()}
          </p>
        </div>
      </div>

      <div className="container py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Crop Information */}
            <div className="card-elevated p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Crop Information
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Crop Type</p>
                  <p className="text-lg font-semibold text-foreground">
                    {scan.cropType}
                  </p>
                </div>
                {scan.cropVariety && (
                  <div>
                    <p className="text-sm text-muted-foreground">Variety</p>
                    <p className="text-lg font-semibold text-foreground">
                      {scan.cropVariety}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Disease Detection Results */}
            {scan.status === "completed" ? (
              <>
                <div className="card-elevated p-8 border-l-4 border-accent">
                  <div className="flex items-start gap-4 mb-6">
                    <CheckCircle className="w-8 h-8 text-accent flex-shrink-0 mt-1" />
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">
                        {scan.detectedDisease?.split("_").join(" ") || "Unknown"}
                      </h2>
                      <p className="text-muted-foreground mt-2">
                        Disease Detected
                      </p>
                    </div>
                  </div>

                  {/* Confidence Score */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-foreground">
                        Detection Confidence
                      </p>
                      <p className="text-2xl font-bold text-accent">
                        {scan.confidenceScore}%
                      </p>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-accent h-2 rounded-full transition-all"
                        style={{ width: `${scan.confidenceScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Disease Description with Listen Button */}
                  {scan.diseaseDescription && (
                    <div className="mt-6 p-4 bg-accent/5 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Description</p>
                        <button
                          onClick={() => handleSpeak(scan.diseaseDescription!)}
                          className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition"
                          title={speaking ? "Stop listening" : "Listen to description"}
                        >
                          {speaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                          {speaking ? "Stop" : "Listen"}
                        </button>
                      </div>
                      <p className="text-foreground">{scan.diseaseDescription}</p>
                    </div>
                  )}
                </div>

                {/* Treatment Recommendations with Listen Button */}
                {scan.treatmentRecommendations && (
                  <div className="card-elevated p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-accent" />
                        <h3 className="text-2xl font-bold text-foreground">
                          Treatment Recommendations
                        </h3>
                      </div>
                      <button
                        onClick={() => {
                          const text = Array.isArray(scan.treatmentRecommendations)
                            ? (scan.treatmentRecommendations as any[])
                                .map((t: any) => `${t.name}. ${t.description || ""}`)
                                .join(". ")
                            : "";
                          handleSpeak(text);
                        }}
                        className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition"
                        title={speaking ? "Stop listening" : "Listen to treatments"}
                      >
                        {speaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        {speaking ? "Stop" : "Listen"}
                      </button>
                    </div>
                    <div className="space-y-4">
                      {Array.isArray(scan.treatmentRecommendations) ? (
                        (scan.treatmentRecommendations as any[]).map(
                          (treatment: any, idx: number) => (
                            <div
                              key={idx}
                              className="p-4 bg-accent/5 rounded-lg border border-accent/20"
                            >
                              <p className="font-semibold text-foreground">
                                {treatment.name || `Treatment ${idx + 1}`}
                              </p>
                              {treatment.description && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  {treatment.description}
                                </p>
                              )}
                              {treatment.duration && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Duration: {treatment.duration}
                                </p>
                              )}
                            </div>
                          )
                        )
                      ) : (
                        <p className="text-foreground">
                          {String(scan.treatmentRecommendations)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Fertilizer Suggestions with Listen Button */}
                {scan.fertilizerSuggestions && (
                  <div className="card-elevated p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <Leaf className="w-6 h-6 text-accent" />
                        <h3 className="text-2xl font-bold text-foreground">
                          Fertilizer Suggestions
                        </h3>
                      </div>
                      <button
                        onClick={() => {
                          const text = Array.isArray(scan.fertilizerSuggestions)
                            ? (scan.fertilizerSuggestions as any[])
                                .map((f: any) => `${f.name}. ${f.npkRatio ? "NPK " + f.npkRatio + ". " : ""}${f.applicationRate || ""}`)
                                .join(". ")
                            : "";
                          handleSpeak(text);
                        }}
                        className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition"
                        title={speaking ? "Stop listening" : "Listen to fertilizers"}
                      >
                        {speaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        {speaking ? "Stop" : "Listen"}
                      </button>
                    </div>
                    <div className="space-y-4">
                      {Array.isArray(scan.fertilizerSuggestions) ? (
                        (scan.fertilizerSuggestions as any[]).map(
                          (fertilizer: any, idx: number) => (
                            <div
                              key={idx}
                              className="p-4 bg-green-50 rounded-lg border border-green-200"
                            >
                              <p className="font-semibold text-foreground">
                                {fertilizer.name || `Fertilizer ${idx + 1}`}
                              </p>
                              {fertilizer.npkRatio && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  NPK Ratio: {fertilizer.npkRatio}
                                </p>
                              )}
                              {fertilizer.applicationRate && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  Application: {fertilizer.applicationRate}
                                </p>
                              )}
                            </div>
                          )
                        )
                      ) : (
                        <p className="text-foreground">
                          {String(scan.fertilizerSuggestions)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Prevention Measures with Listen Button */}
                {scan.preventionMeasures && (
                  <div className="card-elevated p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <Shield className="w-6 h-6 text-accent" />
                        <h3 className="text-2xl font-bold text-foreground">
                          Prevention Measures
                        </h3>
                      </div>
                      <button
                        onClick={() => {
                          const text = Array.isArray(scan.preventionMeasures)
                            ? (scan.preventionMeasures as any[])
                                .map((p: any) => `${p.name}. ${p.description || ""}`)
                                .join(". ")
                            : "";
                          handleSpeak(text);
                        }}
                        className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition"
                        title={speaking ? "Stop listening" : "Listen to prevention"}
                      >
                        {speaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        {speaking ? "Stop" : "Listen"}
                      </button>
                    </div>
                    <div className="space-y-4">
                      {Array.isArray(scan.preventionMeasures) ? (
                        (scan.preventionMeasures as any[]).map(
                          (measure: any, idx: number) => (
                            <div
                              key={idx}
                              className="p-4 bg-blue-50 rounded-lg border border-blue-200"
                            >
                              <p className="font-semibold text-foreground">
                                {measure.name || `Prevention ${idx + 1}`}
                              </p>
                              {measure.description && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  {measure.description}
                                </p>
                              )}
                            </div>
                          )
                        )
                      ) : (
                        <p className="text-foreground">
                          {String(scan.preventionMeasures)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : scan.status === "pending" ? (
              <div className="card-elevated p-12 text-center">
                <Loader2 className="w-12 h-12 animate-spin text-accent mx-auto mb-4" />
                <p className="text-foreground font-semibold">
                  Analyzing your image...
                </p>
                <p className="text-muted-foreground mt-2">
                  This may take a few moments
                </p>
              </div>
            ) : (
              <div className="card-elevated p-12 text-center border-l-4 border-destructive">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <p className="text-foreground font-semibold">
                  Analysis Failed
                </p>
                {scan.errorMessage && (
                  <p className="text-muted-foreground mt-2">
                    {scan.errorMessage}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card-elevated p-8 sticky top-20 space-y-4">
              <h3 className="text-lg font-bold text-foreground">Actions</h3>

              {scan.status === "completed" && (
                <>
                  {/* Read Full Report Aloud */}
                  <Button
                    onClick={handleReadFullReport}
                    className="w-full"
                    size="lg"
                    variant="outline"
                  >
                    {speaking ? <VolumeX className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
                    {speaking ? "Stop Reading" : "Read Aloud"}
                  </Button>

                  <Button
                    onClick={handleDownloadReport}
                    className="w-full"
                    size="lg"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Download PDF Report
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/dashboard")}
                    className="w-full"
                  >
                    New Scan
                  </Button>
                </>
              )}

              {scan.status === "pending" && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Please wait while we analyze your image...
                </p>
              )}

              {scan.status === "failed" && (
                <>
                  <Button
                    onClick={handleRetry}
                    className="w-full"
                    size="lg"
                    disabled={retryMutation.isPending}
                  >
                    {retryMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Retry Analysis
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/dashboard")}
                    className="w-full"
                  >
                    New Scan
                  </Button>
                </>
              )}

              {/* Delete Button */}
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="w-full"
                size="lg"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete Scan
              </Button>

              {/* Scan Info */}
              <div className="pt-6 border-t border-border space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Status
                  </p>
                  <p className="text-sm font-semibold text-foreground capitalize mt-1">
                    {scan.status}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Language
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-1">
                    {scan.language === "en"
                      ? "English"
                      : scan.language === "hi"
                        ? "Hindi"
                        : scan.language === "es"
                          ? "Spanish"
                          : scan.language === "fr"
                            ? "French"
                            : scan.language === "sw"
                              ? "Swahili"
                              : "Luganda"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}