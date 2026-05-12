// Analytics.tsx - Farm analytics dashboard for CropGuard AI
// Purpose: Provide farmers with comprehensive analytics about their crop scans,
//          including disease trends, outbreak maps, confidence scores, and 
//          statistical insights to help make data-driven farming decisions.

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { formatLocalDate } from "@/lib/dateUtils";
import { 
  Loader2, 
  ArrowLeft, 
  MapPin, 
  TrendingUp, 
  PieChart, 
  BarChart3,
  Calendar,
  Leaf,
  AlertTriangle,
  CheckCircle,
  Activity,
  Zap,
  Shield,
  Download,
  RefreshCw,
  Clock,
} from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import FarmMap from "@/components/FarmMap";
import DiseaseTrends from "@/components/DiseaseTrends";
import { toast } from "sonner";

export default function Analytics() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // UI state management
  const [refreshing, setRefreshing] = useState(false);
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

  // Fetch all scans for analytics (up to 100 most recent)
  const { data: scans, isLoading, refetch } = trpc.scans.list.useQuery({
    limit: 100,
    offset: 0,
  });

  // Fetch scan statistics counts
  const { data: counts } = trpc.scans.count.useQuery();

  // Manual refresh handler for analytics data
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    toast.success("Analytics data refreshed");
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Calculate advanced statistics from scan data
  const completedScans = scans?.filter(s => s.status === "completed") || [];
  const uniqueDiseases = new Set(completedScans.map(s => s.detectedDisease)).size;
  const uniqueCrops = new Set(scans?.map(s => s.cropType)).size;
  const averageConfidence = completedScans.length > 0 
    ? Math.round(completedScans.reduce((acc, s) => acc + (s.confidenceScore || 0), 0) / completedScans.length)
    : 0;
  
  // Calculate disease distribution for top diseases display
  const diseaseCounts: Record<string, number> = {};
  completedScans.forEach(scan => {
    if (scan.detectedDisease) {
      const disease = scan.detectedDisease.split("_").join(" ");
      diseaseCounts[disease] = (diseaseCounts[disease] || 0) + 1;
    }
  });
  const topDiseases = Object.entries(diseaseCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Animation configuration for motion components
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
  };

  // Loading state while fetching analytics data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-slate-500">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      
      {/* Header Section with Back Button and Refresh */}
      <div className="border-b border-slate-200/80 bg-white/80 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
        <div className="container px-4 py-4 md:py-6">
          
          {/* Back to Dashboard button */}
          <Button
            variant="ghost"
            onClick={() => setLocation("/dashboard")}
            className="mb-3 md:mb-4 -ml-3 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* Page Title and Refresh Button */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Farm Analytics
              </h1>
              <p className="text-slate-500 mt-0.5 md:mt-1 text-xs md:text-sm">
                Disease trends and insights for your farm
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                size={isMobile ? "sm" : "default"}
                className="border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <RefreshCw
                  className={`w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                <span className="text-xs md:text-sm">Refresh</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 py-4 md:py-8">
        
        {/* Statistics Summary Cards - 2x2 grid on mobile */}
        <motion.div {...fadeIn} className="grid grid-cols-2 gap-2 md:gap-3 mb-4 md:mb-8">
          
          {/* Total Scans Card */}
          <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Activity className="w-3 h-3 md:w-4 md:h-4 text-emerald-600" />
              </div>
              <span className="text-lg md:text-2xl font-bold text-emerald-600">
                {counts?.total || 0}
              </span>
            </div>
            <p className="text-[10px] md:text-xs text-slate-500 font-medium">
              Total Scans
            </p>
          </div>

          {/* Completed Scans Card */}
          <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
              </div>
              <span className="text-lg md:text-2xl font-bold text-blue-600">
                {counts?.completed || 0}
              </span>
            </div>
            <p className="text-[10px] md:text-xs text-slate-500 font-medium">
              Completed
            </p>
          </div>

          {/* Unique Diseases Card */}
          <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <PieChart className="w-3 h-3 md:w-4 md:h-4 text-purple-600" />
              </div>
              <span className="text-lg md:text-2xl font-bold text-purple-600">
                {uniqueDiseases}
              </span>
            </div>
            <p className="text-[10px] md:text-xs text-slate-500 font-medium">
              Diseases
            </p>
          </div>

          {/* Unique Crops Card */}
          <div className="bg-white rounded-lg md:rounded-xl p-3 md:p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Leaf className="w-3 h-3 md:w-4 md:h-4 text-amber-600" />
              </div>
              <span className="text-lg md:text-2xl font-bold text-amber-600">
                {uniqueCrops}
              </span>
            </div>
            <p className="text-[10px] md:text-xs text-slate-500 font-medium">
              Crops
            </p>
          </div>
        </motion.div>

        {/* Additional Stats Row - Confidence, Detection Rate, Pending */}
        <motion.div
          {...fadeIn}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3 mb-4 md:mb-8"
        >
          {/* Average Confidence Card */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg md:rounded-xl p-3 md:p-4 border border-emerald-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] md:text-xs text-emerald-600 font-semibold uppercase tracking-wide">
                  Avg. Confidence
                </p>
                <p className="text-lg md:text-2xl font-bold text-emerald-700 mt-0.5 md:mt-1">
                  {averageConfidence}%
                </p>
              </div>
              <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-white/50 flex items-center justify-center">
                <Zap className="w-3 h-3 md:w-5 md:h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Detection Rate Card */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg md:rounded-xl p-3 md:p-4 border border-amber-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] md:text-xs text-amber-600 font-semibold uppercase tracking-wide">
                  Detection Rate
                </p>
                <p className="text-lg md:text-2xl font-bold text-amber-700 mt-0.5 md:mt-1">
                  {counts?.total
                    ? Math.round((counts.completed / counts.total) * 100)
                    : 0}
                  %
                </p>
              </div>
              <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-white/50 flex items-center justify-center">
                <Shield className="w-3 h-3 md:w-5 md:h-5 text-amber-600" />
              </div>
            </div>
          </div>

          {/* Pending Scans Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg md:rounded-xl p-3 md:p-4 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] md:text-xs text-blue-600 font-semibold uppercase tracking-wide">
                  Pending
                </p>
                <p className="text-lg md:text-2xl font-bold text-blue-700 mt-0.5 md:mt-1">
                  {counts?.pending || 0}
                </p>
              </div>
              <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-white/50 flex items-center justify-center">
                <Clock className="w-3 h-3 md:w-5 md:h-5 text-blue-600" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Top Diseases Section - Shows most common diseases detected */}
        {topDiseases.length > 0 && (
          <motion.div
            {...fadeIn}
            transition={{ delay: 0.08 }}
            className="mb-4 md:mb-8"
          >
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
              <h2 className="text-base md:text-xl font-bold text-slate-800">
                Top Diseases
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
              {topDiseases.map(([disease, count], idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg md:rounded-xl p-3 md:p-4 shadow-sm border border-slate-100"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 text-xs md:text-sm truncate max-w-[150px] md:max-w-none">
                        {disease}
                      </p>
                      <p className="text-[10px] md:text-xs text-slate-500 mt-1">
                        {count} occurrence{count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="w-3 h-3 md:w-4 h-4 text-red-500" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Farm Map - Disease outbreak visualization with fixed container to prevent overlap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4 md:mb-8"
        >
          <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Map Header */}
            <div className="px-4 py-3 md:px-5 md:py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                <h2 className="font-semibold text-slate-800 text-sm md:text-base">
                  Disease Outbreak Map
                </h2>
              </div>
              <p className="text-[10px] md:text-xs text-slate-500 mt-0.5 md:mt-1">
                Geographic distribution of detected diseases
              </p>
            </div>

            {/* Map Container - Fixed height to prevent layout shifts */}
            <div
              className="relative w-full overflow-hidden bg-slate-100"
              style={{
                height: isMobile ? "320px" : "400px",
                isolation: "isolate",
              }}
            >
              <FarmMap
                farmLat={0.3476}
                farmLng={32.5825}
                farmName={user?.farmLocation || "Your Farm"}
                diseasePoints={
                  scans
                    ?.filter((s) => s.status === "completed")
                    .map((s, i) => ({
                      id: s.id,
                      lat: 0.3476 + (Math.random() - 0.5) * 2,
                      lng: 32.5825 + (Math.random() - 0.5) * 2,
                      disease:
                        s.detectedDisease?.split("_").join(" ") || "Unknown",
                      crop: s.cropType,
                      date: formatLocalDate(s.createdAt),
                    })) || []
                }
                className="h-full w-full"
              />
            </div>
          </div>
        </motion.div>

        {/* Disease Trends Charts - Time-series visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Chart Header */}
            <div className="px-4 py-3 md:px-5 md:py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                <h2 className="font-semibold text-slate-800 text-sm md:text-base">
                  Disease Trends
                </h2>
              </div>
              <p className="text-[10px] md:text-xs text-slate-500 mt-0.5 md:mt-1">
                Monthly disease detection patterns
              </p>
            </div>
            {/* Chart Container - Scrollable on mobile for better viewing */}
            <div className="p-3 md:p-4 overflow-x-auto">
              <div className="min-w-[300px] md:min-w-0">
                <DiseaseTrends scans={scans || []} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Export Data Button - For future reporting feature */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-6 md:mt-8 text-center pb-8 md:pb-0"
        >
          <Button
            variant="outline"
            size={isMobile ? "sm" : "default"}
            className="text-slate-500 border-slate-200"
            onClick={() => {
              toast.info("Analytics report export coming soon!");
            }}
          >
            <Download className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            <span className="text-xs md:text-sm">Export Report</span>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}