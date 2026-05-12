// Scans.tsx - Complete scan history management page
// Purpose: Display all user scans with filtering, search, and delete capabilities.
//          Provides a comprehensive overview of all crop disease detection history.

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { formatLocalDate } from "@/lib/dateUtils";
import { trpc } from "@/lib/trpc";
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertTriangle,
  Trash2,
  Calendar,
  Sprout,
  Search,
  Activity,
  Leaf,
  TrendingUp,
  Download,
  Filter,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Scans() {
  // Get current user from auth context
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  
  // State for filtering and search functionality
  const [filter, setFilter] = useState<"all" | "completed" | "pending" | "failed">("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all scans (limit to 50 most recent)
  const { data: scans, isLoading } = trpc.scans.list.useQuery({
    limit: 50,
    offset: 0,
  });

  // Delete mutation with automatic cache invalidation
  const deleteMutation = trpc.scans.delete.useMutation({
    onSuccess: () => {
      toast.success("Scan deleted successfully");
      // Refresh both lists and counts after deletion
      utils.scans.list.invalidate();
      utils.scans.count.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete scan");
    },
  });

  // Handle scan deletion with confirmation dialog
  const handleDelete = (scanId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation to scan detail
    if (confirm("Are you sure you want to permanently delete this scan? This action cannot be undone.")) {
      deleteMutation.mutate({ scanId });
    }
  };

  // Apply filters and search to the scans list
  const filteredScans = scans?.filter((scan) => {
    // Status filter
    if (filter !== "all" && scan.status !== filter) return false;
    
    // Search term filter (crop name, variety, or disease)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        scan.cropType.toLowerCase().includes(searchLower) ||
        (scan.cropVariety?.toLowerCase().includes(searchLower)) ||
        (scan.detectedDisease?.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  // Helper: Get appropriate status icon based on scan status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case "pending":
        return <Clock className="w-5 h-5 text-amber-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
  };

  // Helper: Get styled status badge with appropriate colors
  const getStatusBadge = (status: string, disease?: string) => {
    if (status === "completed") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
          <CheckCircle className="w-3 h-3" />
          {disease?.split("_").slice(0, 2).join(" ") || "Healthy"}
        </span>
      );
    }
    if (status === "pending") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
          <Clock className="w-3 h-3" />
          Processing...
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold">
        <AlertTriangle className="w-3 h-3" />
        Failed
      </span>
    );
  };

  // Calculate statistics for summary cards
  const stats = {
    total: scans?.length || 0,
    completed: scans?.filter(s => s.status === "completed").length || 0,
    pending: scans?.filter(s => s.status === "pending").length || 0,
    failed: scans?.filter(s => s.status === "failed").length || 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      
      {/* Header Section with Back Button and Title */}
      <div className="border-b border-slate-200/80 bg-white/80 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
        <div className="container px-4 py-6 md:py-8">
          {/* Back to Dashboard button */}
          <Button
            variant="ghost"
            onClick={() => setLocation("/dashboard")}
            className="mb-4 -ml-3 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          {/* Page Title and New Scan Button */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Scan History
              </h1>
              <p className="text-slate-500 mt-1 text-sm">
                View and manage all your crop disease detection records
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setLocation("/scanner")}
                className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
              >
                <Sprout className="w-4 h-4 mr-2" />
                New Scan
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 py-6 md:py-8">
        
        {/* Statistics Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
        >
          {/* Total Scans Card */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Activity className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-2xl font-bold text-emerald-600">{stats.total}</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Total Scans</p>
          </div>
          
          {/* Completed Scans Card */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-2xl font-bold text-emerald-600">{stats.completed}</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Completed</p>
          </div>
          
          {/* Pending Scans Card */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-2xl font-bold text-amber-600">{stats.pending}</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Pending</p>
          </div>
          
          {/* Failed Scans Card */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <span className="text-2xl font-bold text-red-600">{stats.failed}</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Failed</p>
          </div>
        </motion.div>

        {/* Search and Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by crop, variety, or disease..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all text-sm"
              />
            </div>
            
            {/* Filter Buttons */}
            <div className="flex gap-2">
              <Filter className="w-4 h-4 text-slate-400 self-center" />
              <div className="flex gap-1">
                {(["all", "completed", "pending", "failed"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                      filter === f
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Scans List - Loading, Empty, or Results */}
        {isLoading ? (
          // Loading State
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : !filteredScans || filteredScans.length === 0 ? (
          // Empty State - No scans match criteria
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100"
          >
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 mb-2">No scans found</p>
            <p className="text-sm text-slate-400">
              {searchTerm || filter !== "all" 
                ? "Try adjusting your filters or search term"
                : "Upload your first crop image to get started"}
            </p>
            {!searchTerm && filter === "all" && (
              <Button
                onClick={() => setLocation("/scanner")}
                variant="outline"
                className="mt-4 border-emerald-200 text-emerald-600"
              >
                <Sprout className="w-4 h-4 mr-2" />
                Start Your First Scan
              </Button>
            )}
          </motion.div>
        ) : (
          // Results List - Display all matching scans
          <div className="space-y-3">
            <AnimatePresence>
              {filteredScans.map((scan, index) => (
                <motion.div
                  key={scan.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }} // Staggered animation
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setLocation(`/scan/${scan.id}`)}
                  className="group bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    
                    {/* Status Icon Circle */}
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                      {getStatusIcon(scan.status)}
                    </div>
                    
                    {/* Scan Details Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {/* Crop Name */}
                        <h3 className="font-semibold text-slate-800 text-sm md:text-base">
                          {scan.cropType}
                          {scan.cropVariety && (
                            <span className="text-slate-500 font-normal ml-1">
                              ({scan.cropVariety})
                            </span>
                          )}
                        </h3>
                        {/* Status Badge */}
                        {getStatusBadge(scan.status, scan.detectedDisease)}
                      </div>
                      
                      {/* Metadata - Date and Confidence Score */}
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatLocalDate(scan.createdAt)} {/* East Africa Time format */}
                        </span>
                        {scan.status === "completed" && scan.confidenceScore && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {scan.confidenceScore}% confidence
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {/* Delete Button - Visible on hover */}
                      <button
                        onClick={(e) => handleDelete(scan.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-2 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
                        title="Delete scan"
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-red-500" />
                        )}
                      </button>
                      {/* Right Arrow Indicator */}
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                        <ArrowLeft className="w-3 h-3 text-slate-400 rotate-180" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Export Data Button - Only show when there are scans */}
        {filteredScans && filteredScans.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center"
          >
            <Button
              variant="outline"
              size="sm"
              className="text-slate-500"
              onClick={() => {
                toast.info("Export feature coming soon!");
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}