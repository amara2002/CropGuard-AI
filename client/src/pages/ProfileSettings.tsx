// ProfileSettings.tsx - User profile management page
// Purpose: Allow farmers to update their personal information, farm location,
//          and crop preferences. Changes are saved to the database and reflected
//          across the platform.

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save, Loader2, AlertCircle, User, MapPin, Sprout, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function ProfileSettings() {
  // Get current user from authentication context
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Form state management
  const [formData, setFormData] = useState({
    name: "",
    farmLocation: "",
    cropTypes: [] as string[],
  });

  // Sync form data when user object loads from auth
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        farmLocation: user.farmLocation || "",
        cropTypes: Array.isArray(user.cropTypes) 
          ? user.cropTypes 
          : user.cropTypes 
            ? JSON.parse(user.cropTypes) 
            : [],
      });
    }
  }, [user]);

  // Validation and UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  // Available crop options with emoji icons for visual appeal
  const cropOptions = [
    { name: "Bean", icon: "🫘" },
    { name: "Cassava", icon: "🌿" },
    { name: "Maize", icon: "🌽" },
    { name: "Potato", icon: "🥔" },
    { name: "Tomato", icon: "🍅" },
  ];

  // tRPC mutation to update user profile
  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      // Redirect to dashboard after successful update
      setTimeout(() => setLocation("/dashboard"), 1000);
    },
    onError: (error: any) => {
      toast.error(`Failed: ${error.message}`);
      setLoading(false);
    },
  });

  // Handle field value changes with proper typing
  const handleFieldChange = (field: keyof typeof formData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field if it was previously touched
    if (touched[field as string]) {
      setErrors((prev) => ({ ...prev, [field as string]: "" }));
    }
  };

  // Mark field as touched when user leaves the input
  const handleFieldBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Toggle crop selection (add/remove from list)
  const handleCropToggle = (crop: string) => {
    const newCrops = formData.cropTypes.includes(crop)
      ? formData.cropTypes.filter((c) => c !== crop)
      : [...formData.cropTypes, crop];
    
    handleFieldChange("cropTypes", newCrops);
  };

  // Submit form to update profile
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfileMutation.mutateAsync({
        ...formData,
        cropTypes: JSON.stringify(formData.cropTypes), // Convert to JSON string for backend storage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6 md:space-y-8">
        
        {/* Back button to dashboard */}
        <button 
          onClick={() => setLocation("/dashboard")} 
          className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        
        {/* Profile Settings Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 md:p-8 space-y-6">
          
          {/* Page Title */}
          <div className="border-b border-slate-100 pb-4">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Profile Settings
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Update your personal information and farming preferences
            </p>
          </div>
          
          {/* Full Name Field */}
          <div>
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-emerald-600" />
              Full Name
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
              value={formData.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              onBlur={() => handleFieldBlur("name")}
              placeholder="Enter your full name"
            />
          </div>

          {/* Farm Location Field */}
          <div>
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Farm Location
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
              value={formData.farmLocation}
              onChange={(e) => handleFieldChange("farmLocation", e.target.value)}
              onBlur={() => handleFieldBlur("farmLocation")}
              placeholder="City, District, or Region"
            />
          </div>

          {/* Crop Selection Grid */}
          <div>
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
              <Sprout className="w-4 h-4 text-emerald-600" />
              Crops You Grow
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {cropOptions.map((crop) => (
                <button
                  key={crop.name}
                  type="button"
                  onClick={() => handleCropToggle(crop.name)}
                  className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all flex items-center justify-center gap-2
                    ${formData.cropTypes.includes(crop.name) 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' 
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/50'
                    }`}
                >
                  <span className="text-lg">{crop.icon}</span>
                  {crop.name}
                  {formData.cropTypes.includes(crop.name) && (
                    <Check className="w-3 h-3 text-emerald-600" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Select all crops you currently grow on your farm
            </p>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 py-6 rounded-xl text-sm font-bold shadow-md" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2 w-4 h-4" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="mr-2 w-4 h-4" />
                Save Profile Changes
              </>
            )}
          </Button>

          {/* Help Text */}
          <p className="text-center text-xs text-slate-400 pt-4">
            Your profile information helps us provide personalized disease detection and recommendations
          </p>
        </form>
      </div>
    </div>
  );
}