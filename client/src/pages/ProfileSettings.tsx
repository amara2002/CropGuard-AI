import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function ProfileSettings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // 1. Fixed Initialization Logic
  const [formData, setFormData] = useState({
    name: "",
    farmLocation: "",
    cropTypes: [] as string[],
  });

  // Sync user data when it loads
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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const cropOptions = [
  { name: "Bean", icon: "🫘" },
  { name: "Cassava", icon: "🌿" },
  { name: "Maize", icon: "🌽" },
  { name: "Potato", icon: "🥔" },
  { name: "Tomato", icon: "🍅" },
];

  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      setTimeout(() => setLocation("/dashboard"), 1000);
    },
    onError: (error: any) => {
      toast.error(`Failed: ${error.message}`);
      setLoading(false);
    },
  });

  // 2. Fixed Strict Typing for Field Changes
  const handleFieldChange = (field: keyof typeof formData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field as string]) {
      setErrors((prev) => ({ ...prev, [field as string]: "" }));
    }
  };

  const handleFieldBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleCropToggle = (crop: string) => {
    const newCrops = formData.cropTypes.includes(crop)
      ? formData.cropTypes.filter((c) => c !== crop)
      : [...formData.cropTypes, crop];
    
    handleFieldChange("cropTypes", newCrops);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfileMutation.mutateAsync({
        ...formData,
        cropTypes: JSON.stringify(formData.cropTypes), // Stringify for "backend"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <button onClick={() => setLocation("/dashboard")} className="flex items-center gap-2 text-primary">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        
        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-xl border">
          <h1 className="text-2xl font-bold">Profile Settings</h1>
          
          <div>
            <label className="text-sm font-medium">Full Name</label>
            <input
              className="w-full p-2 rounded border bg-background mt-1"
              value={formData.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Farm Location</label>
            <input
              className="w-full p-2 rounded border bg-background mt-1"
              value={formData.farmLocation}
              onChange={(e) => handleFieldChange("farmLocation", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Crops</label>
            <div className="grid grid-cols-3 gap-2">
              {cropOptions.map((crop) => (
                <button
                  key={crop.name}
                  type="button"
                  onClick={() => handleCropToggle(crop.name)}
                  className={`p-2 border rounded ${formData.cropTypes.includes(crop.name) ? 'bg-primary/20 border-primary' : ''}`}
                >
                  {crop.icon} {crop.name}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
            Save Changes
          </Button>
        </form>
      </div>
    </div>
  );
}