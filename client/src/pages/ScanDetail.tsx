// ScanDetail.tsx - Detailed view for individual crop scan results
// Purpose: Display comprehensive disease analysis results with treatment recommendations,
//          PDF export, text-to-speech accessibility, and action buttons

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
  Calendar,
  Clock,
  Activity,
  Zap,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { motion } from "framer-motion";

// Import date utilities for East Africa Time formatting
import { formatLocalDate, formatLocalDateTime, formatLocalTime } from "@/lib/dateUtils";

interface ScanDetailProps {
  scanId: number;
}

export default function ScanDetail({ scanId }: ScanDetailProps) {
  // Get current user from auth context
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // State for text-to-speech and mobile detection
  const [speaking, setSpeaking] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size for responsive layout
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch scan details with auto-refresh for pending scans (polls every 2 seconds)
  const { data: scan, isLoading } = trpc.scans.getById.useQuery(
    { scanId },
    {
      refetchInterval: (query) => {
        const data = query.state.data;
        if (data?.status === "pending") {
          return 2000; // Poll every 2 seconds while analyzing
        }
        return false; // Stop polling once completed or failed
      },
    }
  );

  // Clean up speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  // Mutation for retrying failed scans
  const retryMutation = trpc.scans.retry.useMutation({
    onSuccess: () => {
      toast.success("Re-running analysis...");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to retry");
    },
  });

  // Mutation for deleting a scan
  const deleteMutation = trpc.scans.delete.useMutation({
    onSuccess: () => {
      toast.success("Scan deleted successfully!");
      setLocation("/dashboard");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete scan");
    },
  });

  // Handle text-to-speech for any text content
  const handleSpeak = (text: string) => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
    } else {
      speak(text, scan?.language || "en");
      setSpeaking(true);
      // Monitor speech end to reset speaking state
      const checkSpeaking = setInterval(() => {
        if (!window.speechSynthesis?.speaking) {
          setSpeaking(false);
          clearInterval(checkSpeaking);
        }
      }, 500);
    }
  };

  // Read the entire report aloud (combines disease, confidence, treatments, etc.)
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

  // Animation configuration for motion components
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
  };

  // Loading state while fetching scan data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-slate-500 text-sm md:text-base">Loading scan details...</p>
        </div>
      </div>
    );
  }

  // Error state - scan not found
  if (!scan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 md:w-16 md:h-16 text-red-500 mx-auto mb-4" />
          <p className="text-slate-800 font-semibold mb-4">Scan not found</p>
          <Button onClick={() => setLocation("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Handlers for retry and delete actions
  const handleRetry = () => {
    retryMutation.mutate({ scanId });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to permanently delete this scan?")) {
      deleteMutation.mutate({ scanId });
    }
  };

  // Generate and download professional PDF report
  const handleDownloadReport = () => {
    if (!scan) return;

    // Helper to get current East Africa Time for report timestamp
    const getEATDate = () => {
      return new Date().toLocaleString('en-GB', {
        timeZone: 'Africa/Nairobi',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    };

    // Initialize PDF document
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = margin;

    // Helper: Add main title with underline
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

    // Helper: Add section header with light underline
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

    // Helper: Add regular text with word wrap
    const addText = (text: string, size = 10, color: number[] = [51, 51, 51]) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(size);
      doc.setTextColor(color[0], color[1], color[2]);
      const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 2;
    };

    // Helper: Add bullet point text with indentation
    const addBullet = (text: string, indent = 5) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(51, 51, 51);
      const bullet = "\u2022  ";
      const lines = doc.splitTextToSize(bullet + text, pageWidth - margin * 2 - indent);
      doc.text(lines, margin + indent, y);
      y += lines.length * 5 + 1;
    };

    // Helper: Check if we need a new page
    const checkPageBreak = (needed: number) => {
      if (y + needed > 270) {
        doc.addPage();
        y = margin;
      }
    };

    // Build the PDF content
    addTitle("CropGuard Disease Analysis Report");

    // Report metadata
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Report Generated: ${getEATDate()}`, margin, y);
    y += 5;
    doc.text(`Report ID: CG-${scan.id}-${new Date().toISOString().split("T")[0]}`, margin, y);
    y += 5;
    doc.text(`Scan Date: ${formatLocalDate(scan.createdAt)} at ${formatLocalTime(scan.createdAt)}`, margin, y);
    y += 8;

    // Crop Information Section
    checkPageBreak(25);
    addSectionHeader("Crop Information");
    addText(`Crop Type: ${scan.cropType}${scan.cropVariety ? ` (${scan.cropVariety})` : ""}`);
    addText(`Status: ${scan.status.charAt(0).toUpperCase() + scan.status.slice(1)}`);

    // Disease Detection Results (only for completed scans)
    if (scan.status === "completed") {
      checkPageBreak(30);
      addSectionHeader("Disease Detection Results");
      addText(`Detected Disease: ${scan.detectedDisease?.split("_").join(" ") || "N/A"}`, 12, [6, 95, 70]);
      addText(`Confidence Score: ${scan.confidenceScore}%`, 14, [6, 95, 70]);

      // Disease Description
      if (scan.diseaseDescription) {
        checkPageBreak(20);
        addSectionHeader("Disease Description");
        addText(scan.diseaseDescription);
      }

      // Treatment Recommendations
      if (Array.isArray(scan.treatmentRecommendations) && scan.treatmentRecommendations.length > 0) {
        checkPageBreak(20);
        addSectionHeader("Treatment Recommendations");
        (scan.treatmentRecommendations as any[]).forEach((t: any, i: number) => {
          checkPageBreak(10);
          addText(`${i + 1}. ${t.name || "Treatment " + (i + 1)}`, 11, [6, 95, 70]);
          if (t.description) addBullet(t.description);
          if (t.duration) addBullet(`Duration: ${t.duration}`);
          y += 2;
        });
      }

      // Fertilizer Suggestions
      if (Array.isArray(scan.fertilizerSuggestions) && scan.fertilizerSuggestions.length > 0) {
        checkPageBreak(20);
        addSectionHeader("Fertilizer Suggestions");
        (scan.fertilizerSuggestions as any[]).forEach((f: any, i: number) => {
          checkPageBreak(10);
          addText(`${i + 1}. ${f.name || "Fertilizer " + (i + 1)}`, 11, [6, 95, 70]);
          if (f.npkRatio) addBullet(`NPK Ratio: ${f.npkRatio}`);
          if (f.applicationRate) addBullet(`Application Rate: ${f.applicationRate}`);
          y += 2;
        });
      }

      // Prevention Measures
      if (Array.isArray(scan.preventionMeasures) && scan.preventionMeasures.length > 0) {
        checkPageBreak(20);
        addSectionHeader("Prevention Measures");
        (scan.preventionMeasures as any[]).forEach((p: any, i: number) => {
          checkPageBreak(10);
          addText(`${i + 1}. ${p.name || "Prevention " + (i + 1)}`, 11, [6, 95, 70]);
          if (p.description) addBullet(p.description);
          y += 2;
        });
      }
    } else if (scan.status === "failed") {
      // Failed analysis message
      addSectionHeader("Analysis Status: Failed");
      addText(scan.errorMessage || "The analysis could not be completed. Please try again.");
    } else {
      // Pending analysis message
      addSectionHeader("Analysis Status: Pending");
      addText("The image is currently being analyzed. Please check back shortly.");
    }

    // Footer
    y += 10;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("This report was generated by CropGuard AI. For more information, visit your dashboard.", margin, y);
    y += 4;
    doc.text(`CropGuard v2.1 | ${new Date().getFullYear()}`, margin, y);

    // Save the PDF with a descriptive filename
    const fileName = `CropGuard_Report_${scan.cropType}_${new Date(scan.createdAt).toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
    toast.success("PDF report downloaded successfully!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      {/* Header with back button and report metadata */}
      <div className="border-b border-slate-200/80 bg-white/80 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
        <div className="container px-4 py-4 md:py-6">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => setLocation("/dashboard")}
            className="mb-3 md:mb-4 -ml-3 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          {/* Report title and date info */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Disease Analysis Report
              </h1>
              <div className="flex items-center gap-3 mt-1 text-xs md:text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                  {formatLocalDate(scan.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 md:w-4 md:h-4" />
                  {formatLocalTime(scan.createdAt)}
                </span>
              </div>
            </div>
            
            {/* Action buttons - Read Aloud and Download PDF */}
            <div className={`flex gap-2 ${isMobile ? "flex-wrap" : ""}`}>
              {scan.status === "completed" && (
                <>
                  <Button
                    size={isMobile ? "sm" : "default"}
                    variant="outline"
                    onClick={handleReadFullReport}
                    className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                  >
                    {speaking ? <VolumeX className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" /> : <Volume2 className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />}
                    {speaking ? "Stop" : "Read Aloud"}
                  </Button>
                  <Button
                    size={isMobile ? "sm" : "default"}
                    onClick={handleDownloadReport}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                  >
                    <Download className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    PDF
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 py-4 md:py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content - Left Column (2/3 width on desktop) */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            
            {/* Crop Information Card */}
            <motion.div {...fadeIn} className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6">
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <Activity className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                <h2 className="text-base md:text-xl font-bold text-slate-800">Crop Information</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Basic crop details */}
                <div>
                  <p className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wide">Crop Type</p>
                  <p className="text-sm md:text-base font-semibold text-slate-800 mt-1">{scan.cropType}</p>
                </div>
                {scan.cropVariety && (
                  <div>
                    <p className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wide">Variety</p>
                    <p className="text-sm md:text-base font-semibold text-slate-800 mt-1">{scan.cropVariety}</p>
                  </div>
                )}
                {/* Status badge with appropriate color */}
                <div>
                  <p className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wide">Status</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium mt-1 ${
                    scan.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                    scan.status === "pending" ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {scan.status === "completed" && <CheckCircle className="w-3 h-3" />}
                    {scan.status === "pending" && <Clock className="w-3 h-3" />}
                    {scan.status === "failed" && <AlertCircle className="w-3 h-3" />}
                    {scan.status.charAt(0).toUpperCase() + scan.status.slice(1)}
                  </span>
                </div>
                {/* Language used for the report */}
                <div>
                  <p className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wide">Language</p>
                  <p className="text-sm md:text-base font-semibold text-slate-800 mt-1">
                    {scan.language === "en" ? "English" :
                     scan.language === "fr" ? "French" :
                     scan.language === "sw" ? "Swahili" :
                     scan.language === "lg" ? "Luganda" : "English"}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Disease Detection Results - Only for completed scans */}
            {scan.status === "completed" ? (
              <>
                {/* Main Disease Card with confidence score */}
                <motion.div {...fadeIn} transition={{ delay: 0.05 }} className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6 border-l-4 border-l-emerald-500">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-4">
                    <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-emerald-600 flex-shrink-0" />
                    <div>
                      <h2 className="text-lg md:text-2xl font-bold text-slate-800">
                        {scan.detectedDisease?.split("_").join(" ") || "Unknown"}
                      </h2>
                      <p className="text-xs md:text-sm text-slate-500 mt-1">Disease Detected</p>
                    </div>
                  </div>

                  {/* Confidence Score Progress Bar */}
                  <div className="mb-4 md:mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs md:text-sm font-medium text-slate-700">Detection Confidence</p>
                      <p className="text-xl md:text-2xl font-bold text-emerald-600">{scan.confidenceScore}%</p>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full transition-all"
                        style={{ width: `${scan.confidenceScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Disease Description with Listen button */}
                  {scan.diseaseDescription && (
                    <div className="mt-4 p-3 md:p-4 bg-emerald-50/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <p className="text-xs md:text-sm text-slate-500 font-medium">Description</p>
                        <button
                          onClick={() => handleSpeak(scan.diseaseDescription!)}
                          className="text-[10px] md:text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition"
                        >
                          {speaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                          {speaking ? "Stop" : "Listen"}
                        </button>
                      </div>
                      <p className="text-sm md:text-base text-slate-700">{scan.diseaseDescription}</p>
                    </div>
                  )}
                </motion.div>

                {/* Treatment Recommendations Section */}
                {scan.treatmentRecommendations && Array.isArray(scan.treatmentRecommendations) && scan.treatmentRecommendations.length > 0 && (
                  <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6">
                    <div className="flex items-center justify-between mb-3 md:mb-4 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                        <h3 className="text-base md:text-xl font-bold text-slate-800">Treatment Recommendations</h3>
                      </div>
                      <button
                        onClick={() => {
                          const text = (scan.treatmentRecommendations as any[])
                            .map((t: any) => `${t.name}. ${t.description || ""}`)
                            .join(". ");
                          handleSpeak(text);
                        }}
                        className="text-[10px] md:text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition"
                      >
                        <Volume2 className="w-3 h-3" /> Listen All
                      </button>
                    </div>
                    <div className="space-y-3">
                      {(scan.treatmentRecommendations as any[]).map((treatment: any, idx: number) => (
                        <div key={idx} className="p-3 md:p-4 bg-emerald-50/20 rounded-lg border border-emerald-100">
                          <p className="font-semibold text-slate-800 text-sm md:text-base">{treatment.name || `Treatment ${idx + 1}`}</p>
                          {treatment.description && (
                            <p className="text-xs md:text-sm text-slate-600 mt-1">{treatment.description}</p>
                          )}
                          {treatment.duration && (
                            <p className="text-[10px] md:text-xs text-slate-400 mt-2">Duration: {treatment.duration}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Fertilizer Suggestions Section */}
                {scan.fertilizerSuggestions && Array.isArray(scan.fertilizerSuggestions) && scan.fertilizerSuggestions.length > 0 && (
                  <motion.div {...fadeIn} transition={{ delay: 0.15 }} className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6">
                    <div className="flex items-center justify-between mb-3 md:mb-4 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Leaf className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                        <h3 className="text-base md:text-xl font-bold text-slate-800">Fertilizer Suggestions</h3>
                      </div>
                      <button
                        onClick={() => {
                          const text = (scan.fertilizerSuggestions as any[])
                            .map((f: any) => `${f.name}. NPK ${f.npkRatio}. ${f.applicationRate || ""}`)
                            .join(". ");
                          handleSpeak(text);
                        }}
                        className="text-[10px] md:text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition"
                      >
                        <Volume2 className="w-3 h-3" /> Listen All
                      </button>
                    </div>
                    <div className="space-y-3">
                      {(scan.fertilizerSuggestions as any[]).map((fertilizer: any, idx: number) => (
                        <div key={idx} className="p-3 md:p-4 bg-green-50/20 rounded-lg border border-green-100">
                          <p className="font-semibold text-slate-800 text-sm md:text-base">{fertilizer.name || `Fertilizer ${idx + 1}`}</p>
                          {fertilizer.npkRatio && (
                            <p className="text-xs md:text-sm text-slate-600 mt-1">NPK Ratio: {fertilizer.npkRatio}</p>
                          )}
                          {fertilizer.applicationRate && (
                            <p className="text-xs md:text-sm text-slate-600 mt-1">Application: {fertilizer.applicationRate}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Prevention Measures Section */}
                {scan.preventionMeasures && Array.isArray(scan.preventionMeasures) && scan.preventionMeasures.length > 0 && (
                  <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6">
                    <div className="flex items-center justify-between mb-3 md:mb-4 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                        <h3 className="text-base md:text-xl font-bold text-slate-800">Prevention Measures</h3>
                      </div>
                      <button
                        onClick={() => {
                          const text = (scan.preventionMeasures as any[])
                            .map((p: any) => `${p.name}. ${p.description || ""}`)
                            .join(". ");
                          handleSpeak(text);
                        }}
                        className="text-[10px] md:text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition"
                      >
                        <Volume2 className="w-3 h-3" /> Listen All
                      </button>
                    </div>
                    <div className="space-y-3">
                      {(scan.preventionMeasures as any[]).map((measure: any, idx: number) => (
                        <div key={idx} className="p-3 md:p-4 bg-blue-50/20 rounded-lg border border-blue-100">
                          <p className="font-semibold text-slate-800 text-sm md:text-base">{measure.name || `Prevention ${idx + 1}`}</p>
                          {measure.description && (
                            <p className="text-xs md:text-sm text-slate-600 mt-1">{measure.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </>
            ) : scan.status === "pending" ? (
              // Pending Analysis State - Shows spinner while AI processes
              <motion.div {...fadeIn} className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12 text-center">
                <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin text-emerald-600 mx-auto mb-4" />
                <p className="text-slate-800 font-semibold text-sm md:text-base">Analyzing your image...</p>
                <p className="text-slate-500 text-xs md:text-sm mt-2">This may take a few moments</p>
              </motion.div>
            ) : (
              // Failed Analysis State - Shows error and retry options
              <motion.div {...fadeIn} className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12 text-center border-l-4 border-l-red-500">
                <AlertCircle className="w-10 h-10 md:w-12 md:h-12 text-red-500 mx-auto mb-4" />
                <p className="text-slate-800 font-semibold text-sm md:text-base">Analysis Failed</p>
                {scan.errorMessage && (
                  <p className="text-slate-500 text-xs md:text-sm mt-2">{scan.errorMessage}</p>
                )}
                <div className="flex gap-3 justify-center mt-6">
                  <Button onClick={handleRetry} disabled={retryMutation.isPending} size={isMobile ? "sm" : "default"}>
                    {retryMutation.isPending ? <Loader2 className="w-3 h-3 md:w-4 md:h-4 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 md:w-4 md:h-4 mr-1" />}
                    Retry
                  </Button>
                  <Button variant="outline" onClick={() => setLocation("/dashboard")} size={isMobile ? "sm" : "default"}>
                    New Scan
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar - Right Column (1/3 width on desktop) - Action Buttons */}
          <div className="lg:col-span-1">
            <motion.div {...fadeIn} transition={{ delay: 0.25 }} className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6 sticky top-24 space-y-3 md:space-y-4">
              <h3 className="text-base md:text-lg font-bold text-slate-800">Actions</h3>

              {/* Action buttons based on scan status */}
              {scan.status === "completed" && (
                <>
                  <Button
                    onClick={() => setLocation("/dashboard")}
                    variant="outline"
                    className="w-full"
                    size={isMobile ? "sm" : "default"}
                  >
                    New Scan
                  </Button>
                </>
              )}

              {scan.status === "pending" && (
                <p className="text-xs md:text-sm text-slate-500 text-center py-4">
                  Please wait while we analyze your image...
                </p>
              )}

              {/* Delete Scan Button - Always visible */}
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="w-full"
                size={isMobile ? "sm" : "default"}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="w-3 h-3 md:w-4 md:h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                )}
                Delete Scan
              </Button>

              {/* Scan Metadata Section */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div>
                  <p className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wide">Scan ID</p>
                  <p className="text-xs md:text-sm font-mono text-slate-600 mt-1">#{scan.id}</p>
                </div>
                <div>
                  <p className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wide">Analyzed On</p>
                  <p className="text-xs md:text-sm text-slate-700 mt-1">{formatLocalDateTime(scan.createdAt)}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}