import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc, setToken } from "@/lib/trpc";
import {
  ChevronRight,
  Search,
  Check,
  MapPin,
  User,
  Loader2,
  Leaf,
  ShieldCheck,
  Globe,
  Database,
  X,
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function Signup() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Redirect if already authenticated and onboarded
  useEffect(() => {
  if (isAuthenticated && (user as any)?.onboarded) {
    setLocation("/dashboard", { replace: true });
  }
}, [isAuthenticated, user, setLocation]);

// If user is authenticated via OAuth (no password) and hasn't onboarded, skip to Step 2
    useEffect(() => {
  if (isAuthenticated && user && !(user as any)?.onboarded && !(user as any)?.passwordHash) {
    setCurrentStep(2);
    setForm(prev => ({
      ...prev,
      fullName: user.name || "",
      email: user.email || "",
    }));
  }
}, [isAuthenticated, user]);

  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    password: "",
    confirmPassword: "",
    farmLocation: "",
    selectedCrops: [] as string[],
    interfaceLanguage: "en" as "en" | "fr" | "sw" | "lg",
  });

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ display_name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // tRPC mutations
  const registerMutation = trpc.auth.register.useMutation();
  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile Synchronized Successfully.");
      setTimeout(() => (window.location.href = "/dashboard"), 800);
    },
    onError: (err) => {
      toast.error(err.message || "Network Error: Failed to sync.");
      setIsSubmitting(false);
    },
  });

  // Click-outside dismissal
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced geo‑search
  useEffect(() => {
    if (searchQuery.length < 3 || searchQuery === form.farmLocation) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const abortController = new AbortController();
    setIsLoading(true);

    const fetchLocations = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery
          )}&limit=5`,
          { signal: abortController.signal }
        );
        const data = await res.json();
        setSuggestions(data);
        setShowDropdown(true);
      } catch (err: any) {
        if (err.name !== "AbortError") console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchLocations, 450);
    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [searchQuery, form.farmLocation]);

  // Validation logic
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    // Skip email/password validation for Google users (already authenticated)
    if (!isAuthenticated) {
      if (!form.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
        newErrors.email = "Invalid email format";
      }

      if (!form.password) {
        newErrors.password = "Password is required";
      } else if (form.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }

      if (form.password !== form.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handlers
  const handleSelect = (val: string) => {
    setForm((p) => ({ ...p, farmLocation: val }));
    setSearchQuery(val);
    setShowDropdown(false);
  };

  const toggleCrop = (crop: string) => {
    setForm((p) => ({
      ...p,
      selectedCrops: p.selectedCrops.includes(crop)
        ? p.selectedCrops.filter((c) => c !== crop)
        : [...p.selectedCrops, crop],
    }));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
    }
    if (currentStep === 2 && (!form.farmLocation || form.selectedCrops.length === 0)) {
      return toast.error("Location and at least one crop are required.");
    }
    setCurrentStep((s) => s + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // If user is already authenticated (from Google OAuth), skip registration
      if (isAuthenticated && user) {
        // Directly update profile
        await updateProfile.mutateAsync({
          name: form.fullName,
          farmLocation: form.farmLocation,
          cropTypes: JSON.stringify(form.selectedCrops),
          preferredLanguage: form.interfaceLanguage,
        });
      } else {
        // Step 1: Register user with email/password
        const authData = await registerMutation.mutateAsync({
          email: form.email,
          password: form.password,
          name: form.fullName,
        });

        // Step 2: Save token
        setToken(authData.token);

        // Step 3: Update profile details
        await updateProfile.mutateAsync({
          name: form.fullName,
          farmLocation: form.farmLocation,
          cropTypes: JSON.stringify(form.selectedCrops),
          preferredLanguage: form.interfaceLanguage,
        });
      }
    } catch (err: any) {
      console.error("Pipeline Error:", err);
      toast.error(
        err.message || "Deployment failed. Please check network connection."
      );
      setIsSubmitting(false);
    }
  };

  // Password strength (simple)
  const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return { label: "", color: "" };
    if (pwd.length < 6) return { label: "Weak", color: "bg-red-500" };
    if (pwd.length < 10) return { label: "Fair", color: "bg-yellow-500" };
    return { label: "Strong", color: "bg-green-500" };
  };
  const strength = getPasswordStrength(form.password);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 antialiased selection:bg-emerald-100">
      {/* Brand */}
      <div className="mb-6 flex items-center gap-2.5">
        <div className="bg-emerald-600 p-1.5 rounded-lg">
          <Leaf className="w-4 h-4 text-white" />
        </div>
        <span className="text-xs font-black text-slate-900 uppercase tracking-widest">
          CropGuard <span className="text-emerald-600">v2.1</span>
        </span>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-[440px] bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex justify-between items-end border-b border-slate-50">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
              Onboarding Pipeline
            </span>
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight">
              {currentStep === 1 && "Create Account"}
              {currentStep === 2 && "Farm Parameters"}
              {currentStep === 3 && "Environment Setup"}
            </h2>
          </div>
          <div className="text-[10px] font-bold text-slate-400">
            Step {currentStep}/3
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-6">
          {/* STEP 1: Identity + Email + Password */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-3 duration-300">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={e => {
                      setForm({ ...form, fullName: e.target.value });
                      if (errors.fullName)
                        setErrors({ ...errors, fullName: "" });
                    }}
                    placeholder="Enter official name"
                    className={`w-full pl-11 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:border-emerald-500 focus:bg-white transition-all outline-none ${
                      errors.fullName ? "border-red-300" : "border-slate-100"
                    }`}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" /> {errors.fullName}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => {
                      setForm({ ...form, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: "" });
                    }}
                    placeholder="farmer@example.com"
                    className={`w-full pl-11 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:border-emerald-500 focus:bg-white transition-all outline-none ${
                      errors.email ? "border-red-300" : "border-slate-100"
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" /> {errors.email}
                  </p>
                )}
              </div>

              {!isAuthenticated && (
                <>
                  {/* Password field */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={e => {
                          setForm({ ...form, password: e.target.value });
                          if (errors.password)
                            setErrors({ ...errors, password: "" });
                        }}
                        placeholder="At least 6 characters"
                        className={`w-full pl-11 pr-12 py-2.5 bg-slate-50 border rounded-xl text-sm focus:border-emerald-500 focus:bg-white transition-all outline-none ${
                          errors.password
                            ? "border-red-300"
                            : "border-slate-100"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {form.password && (
                      <div className="mt-1">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-1.5 w-full bg-slate-200 rounded-full overflow-hidden`}
                          >
                            <div
                              className={`h-full ${strength.color} transition-all duration-300`}
                              style={{
                                width: `${Math.min((form.password.length / 10) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase">
                            {strength.label}
                          </span>
                        </div>
                      </div>
                    )}
                    {errors.password && (
                      <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" /> {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password field */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={form.confirmPassword}
                        onChange={e => {
                          setForm({ ...form, confirmPassword: e.target.value });
                          if (errors.confirmPassword)
                            setErrors({ ...errors, confirmPassword: "" });
                        }}
                        placeholder="Re-enter password"
                        className={`w-full pl-11 pr-12 py-2.5 bg-slate-50 border rounded-xl text-sm focus:border-emerald-500 focus:bg-white transition-all outline-none ${
                          errors.confirmPassword
                            ? "border-red-300"
                            : "border-slate-100"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3" />{" "}
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </>
              )}

              <Button
                type="button"
                onClick={handleNext}
                className="w-full bg-slate-900 py-6 rounded-xl text-[10px] font-bold uppercase tracking-widest mt-2"
              >
                Proceed to Mapping <ChevronRight className="ml-2 w-3.5 h-3.5" />
              </Button>

              <div className="pt-4 border-t border-slate-50 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mb-3">
                  Already part of the network?
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => (window.location.href = getLoginUrl())}
                  className="w-full border-slate-200 text-slate-600 py-6 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors"
                >
                  <LogIn className="mr-2 w-3.5 h-3.5" /> Sign In to Existing
                  Profile
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Location + Crops */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-3 duration-300">
              {/* Location Search */}
              <div className="space-y-2 relative" ref={dropdownRef}>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Geospatial Region
                </label>
                <div className="relative group">
                  <Search
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                      isLoading
                        ? "text-emerald-500 animate-spin"
                        : "text-slate-300"
                    }`}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onFocus={() =>
                      searchQuery.length >= 3 && setShowDropdown(true)
                    }
                    placeholder="City or district search..."
                    className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:border-emerald-500 focus:bg-white transition-all outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setForm(p => ({ ...p, farmLocation: "" }));
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                    >
                      <X className="w-3 h-3 text-slate-400 hover:text-red-500" />
                    </button>
                  )}
                </div>

                {showDropdown && suggestions.length > 0 && (
                  <div className="absolute top-[105%] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-[9999] overflow-hidden py-1">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelect(s.display_name)}
                        className="w-full px-4 py-2.5 text-left text-[11px] font-medium hover:bg-emerald-50 flex items-center gap-3 border-b last:border-0 border-slate-50"
                      >
                        <MapPin className="w-3.5 h-3.5 text-slate-300" />
                        <span className="truncate">{s.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Manual fallback when offline or no results */}
                {!showDropdown &&
                  !isLoading &&
                  searchQuery.length >= 3 &&
                  suggestions.length === 0 && (
                    <div className="mt-2">
                      <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">
                        Or enter manually
                      </label>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onBlur={e => {
                          if (e.target.value.trim()) {
                            setForm(p => ({
                              ...p,
                              farmLocation: e.target.value,
                            }));
                          }
                        }}
                        placeholder="Type your location"
                        className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:border-emerald-500 outline-none"
                      />
                    </div>
                  )}
              </div>

              {/* Crop Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Crop Inventory
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["Bean", "Cassava", "Maize", "Potato", "Tomato"].map(
                    crop => (
                      <button
                        key={crop}
                        type="button"
                        onClick={() => toggleCrop(crop)}
                        className={`px-3 py-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-between transition-all
                        ${
                          form.selectedCrops.includes(crop)
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                            : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                        }
                      `}
                      >
                        {crop}
                        {form.selectedCrops.includes(crop) && (
                          <Check className="w-3 h-3 stroke-[3px]" />
                        )}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 text-[10px] py-6 font-bold uppercase tracking-widest"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex-[2] bg-slate-900 py-6 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                >
                  Confirm Assets
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Preferences & Submit */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-3 duration-300">
              <div className="bg-slate-900 rounded-2xl p-5 text-white space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest">
                    Ready for Deployment
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-[11px]">
                  <div className="space-y-1">
                    <span className="text-slate-500 uppercase font-bold text-[8px]">
                      Base
                    </span>
                    <p className="font-bold truncate">{form.farmLocation}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 uppercase font-bold text-[8px]">
                      Assets
                    </span>
                    <p className="font-bold">
                      {form.selectedCrops.length} Active
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  System Language
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { code: "en", label: "English" },
                    { code: "sw", label: "Swahili" },
                    { code: "lg", label: "Luganda" },
                    { code: "fr", label: "French" },
                  ].map(l => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() =>
                        setForm({ ...form, interfaceLanguage: l.code as any })
                      }
                      className={`py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all
                        ${
                          form.interfaceLanguage === l.code
                            ? "bg-emerald-600 text-white shadow-md"
                            : "bg-slate-50 text-slate-400 border border-transparent hover:border-slate-200"
                        }
                      `}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 text-[10px] py-6 font-bold uppercase tracking-widest"
                >
                  Edit
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] bg-emerald-600 hover:bg-emerald-700 py-6 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Start Monitoring"
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>

        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between opacity-40 grayscale">
          <div className="flex items-center gap-1.5">
            <Database className="w-3 h-3" />
            <span className="text-[8px] font-black uppercase tracking-widest">
              Cloud Sync
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="w-3 h-3" />
            <span className="text-[8px] font-black uppercase tracking-widest">
              Network Enabled
            </span>
          </div>
        </div>
      </div>

      <p className="mt-8 text-[9px] text-slate-400 font-bold uppercase tracking-[0.4em]">
        Secured by CropGuard Identity Layer
      </p>
      <div className="flex items-start gap-2 mt-4">
        <input type="checkbox" className="mt-1" />
        <span className="text-[10px] text-slate-400">
          I agree to the Terms of Service and Privacy Policy
        </span>
      </div>
    </div>
  );
}