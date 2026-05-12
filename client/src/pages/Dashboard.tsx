import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import AIChatBox from "@/components/AIChatBox";
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
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [cropType, setCropType] = useState("");
  const [cropVariety, setCropVariety] = useState("");
  const [language, setLanguage] = useState<"en" | "fr" | "sw" | "lg">("en");
  const [chatOpen, setChatOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch recent scans
  const { data: scans, isLoading: scansLoading } = trpc.scans.list.useQuery({
    limit: 10,
    offset: 0,
  });

  // Fetch counts
  const { data: counts } = trpc.scans.count.useQuery();

  const createScanMutation = trpc.scans.create.useMutation({
    onSuccess: (data) => {
      toast.success("Scan created! Processing your image...");
      setLocation(`/scan/${data.scanId}`);
    },
    onError: (error) => {
      toast.error(`Failed to create scan: ${error.message}`);
    },
  });

  const handleLogout = async () => {
    toast.success("Logged out successfully!");
    await logout();
  };

  const handleFileSelect = async (file: File) => {
    if (!cropType) {
      toast.error("Please select a crop type");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const apiUrl = import.meta.env.VITE_API_URL || "";
      const uploadResponse = await fetch(`${apiUrl}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error("Failed to upload image");

      const { imageUrl, imageKey } = await uploadResponse.json();

      await createScanMutation.mutateAsync({
        imageUrl,
        imageKey,
        cropType,
        cropVariety: cropVariety || undefined,
        language,
      });

      setCropType("");
      setCropVariety("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const totalScans = counts?.total || 0;
  const completedScans = counts?.completed || 0;
  const pendingScans = counts?.pending || 0;
  const failedScans = counts?.failed || 0;

  const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.2 },
  };

  const menuItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: Scan, label: "Quick Scan", path: "/scanner" },
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
    { icon: Settings, label: "Settings", path: "/profile-settings" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Mobile Optimized */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <div className="flex flex-col h-full">
                    <div className="p-4 border-b">
                      <div className="flex items-center gap-2">
                        <Sprout className="w-6 h-6 text-emerald-600" />
                        <span className="font-bold text-lg">CropGuard AI</span>
                      </div>
                    </div>
                    <div className="flex-1 p-4 space-y-2">
                      {menuItems.map((item) => (
                        <button
                          key={item.path}
                          onClick={() => {
                            setLocation(item.path);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-600/10 flex items-center justify-center">
                <Sprout className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-sm md:text-xl font-bold text-foreground">
                  Welcome back, {user?.name?.split(" ")[0] || "Farmer"}!
                </h1>
                <p className="hidden md:block text-xs text-muted-foreground">
                  Analyze crops and track disease history
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex"
              onClick={() => setChatOpen(!chatOpen)}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              AI Assistant
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex"
              onClick={() => setLocation("/scanner")}
            >
              <Camera className="w-4 h-4 mr-2" />
              Quick Scan
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 md:h-9 md:w-9">
                  <Avatar className="h-7 w-7 md:h-9 md:w-9">
                    <AvatarFallback className="bg-emerald-600 text-white font-bold text-xs md:text-sm">
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
                <div className="px-2 py-1.5">
                  <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email || "farmer@cropguard.local"}
                  </p>
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
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="container px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upload Card */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <motion.div {...fadeIn} className="card-elevated p-5 sticky top-20">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Upload className="w-4 h-5 text-emerald-600" />
                New Scan
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Crop Type</label>
                  <select
                    value={cropType}
                    onChange={(e) => setCropType(e.target.value)}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  >
                    <option value="">Select a crop...</option>
                    <option value="Bean">Bean</option>
                    <option value="Cassava">Cassava</option>
                    <option value="Corn">Corn</option>
                    <option value="Potato">Potato</option>
                    <option value="Tomato">Tomato</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Variety (Optional)</label>
                  <input
                    type="text"
                    value={cropVariety}
                    onChange={(e) => setCropVariety(e.target.value)}
                    placeholder="e.g., Hybrid F1"
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as "en" | "fr" | "sw" | "lg")}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  >
                    <option value="en">English</option>
                    <option value="fr">French</option>
                    <option value="lg">Luganda</option>
                    <option value="sw">Swahili</option>
                  </select>
                </div>

                <div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileSelect(file); }} className="hidden" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full border-2 border-dashed border-border rounded-xl p-5 text-center hover:border-emerald-500 transition-colors disabled:opacity-50 group"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin text-emerald-600" />
                        <p className="text-xs text-muted-foreground">Uploading...</p>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition">
                          <Upload className="w-5 h-5 text-emerald-600" />
                        </div>
                        <p className="font-medium text-foreground text-sm">Click to upload</p>
                        <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[10px] text-muted-foreground text-center">
                  JPG, PNG, WebP • Max 5MB
                </p>
              </div>
            </motion.div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-5 order-1 lg:order-2">
            {/* Stats Cards */}
            <motion.div {...fadeIn} transition={{ delay: 0.05 }} className="grid grid-cols-2 gap-3">
              <div className="card-elevated p-3">
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <Sprout className="w-3 h-3" />
                  <span className="text-[10px] uppercase tracking-wide">Total</span>
                </div>
                <div className="text-xl font-bold text-foreground">{totalScans}</div>
              </div>
              <div className="card-elevated p-3">
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  <span className="text-[10px] uppercase tracking-wide">Done</span>
                </div>
                <div className="text-xl font-bold text-foreground">{completedScans}</div>
              </div>
              <div className="card-elevated p-3">
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  <span className="text-[10px] uppercase tracking-wide">Pending</span>
                </div>
                <div className="text-xl font-bold text-foreground">{pendingScans}</div>
              </div>
              <div className="card-elevated p-3">
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                  <span className="text-[10px] uppercase tracking-wide">Failed</span>
                </div>
                <div className="text-xl font-bold text-foreground">{failedScans}</div>
              </div>
            </motion.div>

            {/* Recent Scans */}
            <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="card-elevated p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-foreground">Recent Scans</h3>
                {scans && scans.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setLocation("/scans")} className="text-xs">
                    View All <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>

              {scansLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                </div>
              ) : !scans || scans.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">No scans yet.</p>
                  <Button onClick={() => fileInputRef.current?.click()} size="sm">Start Scanning</Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {scans.slice(0, 5).map((scan) => (
                    <motion.div
                      key={scan.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setLocation(`/scan/${scan.id}`)}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center flex-shrink-0">
                        {scan.status === "completed" ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        ) : scan.status === "pending" ? (
                          <Clock className="w-4 h-4 text-amber-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">
                          {scan.cropType}{scan.cropVariety && ` (${scan.cropVariety})`}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(scan.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 max-w-[110px]">
                        {scan.status === "completed" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium truncate">
                            {scan.detectedDisease?.split("_").slice(0, 2).join(" ") || "Healthy"}
                          </span>
                        ) : scan.status === "pending" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px]">Processing...</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px]">Failed</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div {...fadeIn} transition={{ delay: 0.15 }} className="grid grid-cols-3 gap-3">
              <button onClick={() => setLocation("/scanner")} className="card-elevated p-3 text-left hover:border-emerald-500 transition group">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition">
                    <Camera className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-xs">Quick Scan</p>
                    <p className="hidden sm:block text-[10px] text-muted-foreground">Instant analysis</p>
                  </div>
                </div>
              </button>

              <button onClick={() => setLocation("/profile-settings")} className="card-elevated p-3 text-left hover:border-emerald-500 transition group">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition">
                    <Settings className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-xs">Profile</p>
                    <p className="hidden sm:block text-[10px] text-muted-foreground">Manage crops</p>
                  </div>
                </div>
              </button>

              <button onClick={() => setLocation("/analytics")} className="card-elevated p-3 text-left hover:border-emerald-500 transition group">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-xs">Analytics</p>
                    <p className="hidden sm:block text-[10px] text-muted-foreground">Disease trends</p>
                  </div>
                </div>
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* AI Chat Panel */}
      <AnimatePresence>
        {chatOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-50"
              onClick={() => setChatOpen(false)}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 z-50 h-full w-full sm:w-96 bg-white shadow-2xl border-l border-slate-200"
            >
              <button
                onClick={() => setChatOpen(false)}
                className="absolute top-4 left-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>

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