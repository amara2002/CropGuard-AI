// Dashboard.tsx - Main farmer dashboard for CropGuard AI
// Purpose: Central hub for crop disease scanning, viewing recent activity, and accessing AI features

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import AIChatBox from "@/components/AIChatBox";
import { formatLocalDate } from "@/lib/dateUtils";
import { trpc } from "@/lib/trpc";
import {
  Upload,
  Loader2,
  LogOut,
  User,
  Settings,
  TrendingUp,
  Sprout,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Camera,
  MessageCircle,
  X,
  Menu,
  Home,
  Scan,
  BarChart3,
  Image,
  Trash2,
  ChevronDown,
  Zap,
  Shield,
  Leaf,
  Search,
  Sparkles,
  Activity,
  Calendar,
  FolderTree,
  Globe,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Dashboard() {
  // Get current user and auth functions
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for managing the scan upload process
  const [uploading, setUploading] = useState(false);
  const [cropType, setCropType] = useState("");
  const [cropVariety, setCropVariety] = useState("");
  const [language, setLanguage] = useState<"en" | "fr" | "sw" | "lg">("en");
  const [chatOpen, setChatOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Drag and drop state for image upload
  const [dragActive, setDragActive] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Detect mobile screen size for responsive layout
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch user's recent scans (limited to 10 for dashboard view)
  const { data: scans, isLoading: scansLoading } = trpc.scans.list.useQuery({
    limit: 10,
    offset: 0,
  });

  // Fetch scan statistics counts
  const { data: counts } = trpc.scans.count.useQuery();

  // Create new scan mutation - sends image to backend for analysis
  const createScanMutation = trpc.scans.create.useMutation({
    onSuccess: (data) => {
      toast.success("Scan created! Processing your image...");
      setLocation(`/scan/${data.scanId}`);
    },
    onError: (error) => {
      toast.error(`Failed to create scan: ${error.message}`);
    },
  });

  // Handle user logout
  const handleLogout = async () => {
    toast.success("Logged out successfully!");
    await logout();
  };

  // Drag and drop event handlers for image upload
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  // Validate and process selected image file
  const handleFile = (file: File) => {
    // Check if crop type is selected first
    if (!cropType) {
      toast.error("Please select a crop type first");
      return;
    }

    // Validate file type - only images allowed
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    // Check file size limit (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    const preview = URL.createObjectURL(file);
    setPreviewImage(preview);
  };

  // Handle file selection from file picker
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  // Clear selected image from preview
  const clearSelectedImage = () => {
    setSelectedFile(null);
    setPreviewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Submit scan for AI analysis
  const handleSubmitScan = async () => {
    // Validation checks
    if (!cropType) {
      toast.error("Please select a crop type");
      return;
    }

    if (!selectedFile) {
      toast.error("Please select an image to upload");
      return;
    }

    setUploading(true);
    try {
      // Prepare form data for image upload
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Get API URL from environment (works locally and in production)
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const uploadResponse = await fetch(`${apiUrl}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error("Failed to upload image");

      // Get the uploaded image URL from response
      const { imageUrl, imageKey } = await uploadResponse.json();

      // Create the scan record in database
      await createScanMutation.mutateAsync({
        imageUrl,
        imageKey,
        cropType,
        cropVariety: cropVariety || undefined,
        language,
      });

      // Reset form after successful submission
      setCropType("");
      setCropVariety("");
      clearSelectedImage();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  // Get scan statistics for dashboard cards
  const totalScans = counts?.total || 0;
  const completedScans = counts?.completed || 0;
  const pendingScans = counts?.pending || 0;
  const failedScans = counts?.failed || 0;

  // Animation settings for motion components
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
  };

  // Navigation items for mobile sidebar menu
  const menuItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: Scan, label: "Quick Scan", path: "/scanner" },
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
    { icon: Settings, label: "Settings", path: "/profile-settings" },
  ];

  // Available crop options for selection
  const cropOptions = [
    { value: "Bean", label: "Bean", icon: Leaf },
    { value: "Cassava", label: "Cassava", icon: Leaf },
    { value: "Corn", label: "Corn", icon: Leaf },
    { value: "Potato", label: "Potato", icon: Leaf },
    { value: "Tomato", label: "Tomato", icon: Leaf },
  ];

  // Language options with flags for better UX
  const languageOptions = [
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "sw", name: "Kiswahili", flag: "🇰🇪" },
    { code: "lg", name: "Luganda", flag: "🇺🇬" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      {/* Main Header - Sticky with blur effect */}
      <div className="border-b border-slate-200/80 bg-white/80 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
        <div className="container px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Mobile hamburger menu - only visible on small screens */}
            {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <div className="flex flex-col h-full bg-gradient-to-b from-emerald-50 to-white">
                    <div className="p-6 border-b border-emerald-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                          <Sprout className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <span className="font-bold text-lg text-slate-800">CropGuard AI</span>
                          <p className="text-xs text-emerald-600">Smart Farming</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 p-4 space-y-1">
                      {menuItems.map((item) => (
                        <button
                          key={item.path}
                          onClick={() => setLocation(item.path)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-emerald-50 transition-all duration-200 group"
                        >
                          <item.icon className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
                          <span className="text-slate-700 group-hover:text-emerald-700 font-medium">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}
            
            {/* Logo and welcome message */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                <Sprout className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm md:text-lg font-semibold text-slate-800">
                  Welcome back, <span className="text-emerald-600">{user?.name?.split(" ")[0] || "Farmer"}</span>
                </h1>
                <p className="hidden md:block text-xs text-slate-500">
                  Monitor your crops and detect diseases instantly
                </p>
              </div>
            </div>
          </div>

          {/* Header Actions - AI Assistant, Quick Scan, User Menu */}
          <div className="flex items-center gap-2">
            {/* AI Assistant Button - Hidden on mobile */}
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex gap-2 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
              onClick={() => setChatOpen(!chatOpen)}
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-slate-700">AI Assistant</span>
            </Button>

            {/* Quick Scan Button - Hidden on mobile */}
            <Button
              variant="default"
              size="sm"
              className="hidden md:flex gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md"
              onClick={() => setLocation("/scanner")}
            >
              <Camera className="w-4 h-4" />
              <span>Quick Scan</span>
            </Button>

            {/* User Profile Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="rounded-full h-9 w-9 md:h-10 md:w-10 p-0 hover:bg-emerald-50">
                  <Avatar className="h-8 w-8 md:h-9 md:w-9">
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-semibold text-sm">
                      {user?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email || "farmer@cropguard.local"}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/profile-settings")}>
                  <User className="w-4 h-4 mr-2" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/account-settings")}>
                  <Settings className="w-4 h-4 mr-2" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container px-4 py-6 md:py-8">
        {/* Welcome Banner - Shows key stats and app description */}
        <motion.div {...fadeIn} className="mb-8">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-2">AI-Powered Crop Disease Detection</h2>
                <p className="text-emerald-100 text-sm md:text-base max-w-lg">
                  Upload a photo of your crop and get instant disease diagnosis with treatment recommendations
                </p>
              </div>
              {/* Quick stats preview */}
              <div className="flex gap-2">
                <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2 text-center">
                  <div className="text-2xl font-bold">{totalScans}</div>
                  <div className="text-xs text-emerald-100">Total Scans</div>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2 text-center">
                  <div className="text-2xl font-bold">{completedScans}</div>
                  <div className="text-xs text-emerald-100">Completed</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - New Scan Form */}
          <div className="lg:col-span-1">
            <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
              <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden sticky top-24">
                {/* Card Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-4">
                  <h2 className="text-white font-bold flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    New Crop Scan
                  </h2>
                  <p className="text-emerald-100 text-xs mt-1">Upload an image for AI analysis</p>
                </div>

                <div className="p-5 space-y-4">
                  {/* Crop Type Selection Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <FolderTree className="w-3.5 h-3.5" />
                      Crop Type
                    </label>
                    <select
                      value={cropType}
                      onChange={(e) => setCropType(e.target.value)}
                      className="w-full h-11 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
                    >
                      <option value="">Select a crop...</option>
                      {cropOptions.map((crop) => (
                        <option key={crop.value} value={crop.value}>
                          {crop.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Optional Crop Variety Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5" />
                      Variety (Optional)
                    </label>
                    <input
                      type="text"
                      value={cropVariety}
                      onChange={(e) => setCropVariety(e.target.value)}
                      placeholder="e.g., Hybrid F1, Local variety..."
                      className="w-full h-11 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
                    />
                  </div>

                  {/* Language Selection with Flag Buttons */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5" />
                      Report Language
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {languageOptions.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => setLanguage(lang.code as any)}
                          className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                            language === lang.code
                              ? "bg-emerald-500 text-white shadow-md"
                              : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-2 border-slate-200"
                          }`}
                        >
                          <span className="mr-1">{lang.flag}</span> {lang.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Image Upload Area - Supports drag & drop and click */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <Image className="w-3.5 h-3.5" />
                      Crop Image
                    </label>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {/* Upload Zone - Shows preview when image selected */}
                    {!previewImage ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                          dragActive
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/30"
                        }`}
                      >
                        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                          <Upload className="w-6 h-6 text-emerald-600" />
                        </div>
                        <p className="font-medium text-slate-700 text-sm">Click or drag to upload</p>
                        <p className="text-xs text-slate-400 mt-1">JPG, PNG, WebP up to 5MB</p>
                      </div>
                    ) : (
                      // Image Preview with delete option
                      <div className="relative rounded-xl overflow-hidden border-2 border-emerald-200">
                        <img src={previewImage} alt="Preview" className="w-full h-48 object-cover" />
                        <button
                          onClick={clearSelectedImage}
                          className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/80 rounded-full transition backdrop-blur-sm"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                        {selectedFile && (
                          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded-lg text-white text-xs backdrop-blur-sm">
                            {selectedFile.name}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Submit Button - Disabled until valid inputs */}
                  <Button
                    onClick={handleSubmitScan}
                    disabled={uploading || !cropType || !selectedFile}
                    className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5 mr-2" />
                        Analyze Crop
                      </>
                    )}
                  </Button>

                  {/* Model Info Footer */}
                  <p className="text-[11px] text-slate-400 text-center">
                    AI-powered disease detection • 86% accuracy • 16 disease classes
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Stats and Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Statistics Cards - Shows scan counts */}
            <motion.div {...fadeIn} transition={{ delay: 0.15 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Sprout className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-2xl font-bold text-emerald-600">{totalScans}</span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Total Scans</p>
              </div>

              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-2xl font-bold text-emerald-600">{completedScans}</span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Completed</p>
              </div>

              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-2xl font-bold text-amber-600">{pendingScans}</span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Pending</p>
              </div>

              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-2xl font-bold text-red-600">{failedScans}</span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Failed</p>
              </div>
            </motion.div>

            {/* Recent Activity Section - Shows latest scans */}
            <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    Recent Activity
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Your latest crop scans</p>
                </div>
                {scans && scans.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setLocation("/scans")} className="text-emerald-600 hover:text-emerald-700">
                    View All <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>

              <div className="p-4">
                {/* Loading State */}
                {scansLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                  </div>
                ) : !scans || scans.length === 0 ? (
                  // Empty State - No scans yet
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <Camera className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-500 mb-3">No scans yet</p>
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="border-emerald-200 text-emerald-600">
                      Start Your First Scan
                    </Button>
                  </div>
                ) : (
                  // List of recent scans with animations
                  <div className="space-y-2">
                    {scans.slice(0, 5).map((scan, index) => (
                      <motion.div
                        key={scan.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => setLocation(`/scan/${scan.id}`)}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all cursor-pointer border border-transparent hover:border-slate-200"
                      >
                        {/* Status Icon */}
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                          {scan.status === "completed" ? (
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          ) : scan.status === "pending" ? (
                            <Clock className="w-5 h-5 text-amber-500" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                        
                        {/* Scan Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-slate-800 text-sm truncate">
                              {scan.cropType}
                              {scan.cropVariety && ` (${scan.cropVariety})`}
                            </p>
                            {/* Disease Badge for completed scans */}
                            {scan.status === "completed" && scan.detectedDisease && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                                {scan.detectedDisease?.split("_").slice(0, 2).join(" ")}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatLocalDate(scan.createdAt)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Arrow indicator */}
                        <ChevronDown className="w-4 h-4 text-slate-400 rotate-[-90deg]" />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Quick Actions - Shortcut buttons */}
            <motion.div {...fadeIn} transition={{ delay: 0.25 }} className="grid grid-cols-3 gap-3">
              <button onClick={() => setLocation("/scanner")} className="bg-white rounded-xl p-3 text-center hover:shadow-md transition-all border border-slate-100 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-2 shadow-md group-hover:scale-110 transition">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <p className="font-medium text-slate-700 text-xs">Quick Scan</p>
                <p className="text-[10px] text-slate-400 hidden sm:block">Instant analysis</p>
              </button>

              <button onClick={() => setLocation("/analytics")} className="bg-white rounded-xl p-3 text-center hover:shadow-md transition-all border border-slate-100 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-2 shadow-md group-hover:scale-110 transition">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <p className="font-medium text-slate-700 text-xs">Analytics</p>
                <p className="text-[10px] text-slate-400 hidden sm:block">View trends</p>
              </button>

              <button onClick={() => setChatOpen(true)} className="bg-white rounded-xl p-3 text-center hover:shadow-md transition-all border border-slate-100 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mx-auto mb-2 shadow-md group-hover:scale-110 transition">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <p className="font-medium text-slate-700 text-xs">AI Chat</p>
                <p className="text-[10px] text-slate-400 hidden sm:block">Ask anything</p>
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Slide-out AI Chat Panel */}
      <AnimatePresence>
        {chatOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={() => setChatOpen(false)}
            />

            {/* Chat Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 z-50 h-full w-full sm:w-[450px] bg-white shadow-2xl"
            >
              {/* Close button */}
              <button
                onClick={() => setChatOpen(false)}
                className="absolute top-4 left-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>

              {/* Chat component */}
              <div className="h-full pt-16">
                <AIChatBox language={user?.preferredLanguage || "en"} embedded />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}