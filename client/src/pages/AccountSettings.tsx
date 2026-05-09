import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save, Loader2, Globe, Bell, Shield } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function AccountSettings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    preferredLanguage: (user?.preferredLanguage as "en" | "hi" | "es") || "en",
    emailNotifications: true,
    diseaseAlerts: true,
  });

  const [loading, setLoading] = useState(false);

  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Account settings updated successfully!");
      setTimeout(() => {
        setLocation("/dashboard");
      }, 1000);
    },
    onError: (error) => {
      toast.error(`Failed to update settings: ${error.message}`);
      setLoading(false);
    },
  });

  const handleLanguageChange = (lang: "en" | "hi" | "es") => {
    setFormData((prev) => ({
      ...prev,
      preferredLanguage: lang,
    }));
  };

  const handleToggle = (field: "emailNotifications" | "diseaseAlerts") => {
    setFormData((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfileMutation.mutateAsync({
        preferredLanguage: formData.preferredLanguage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container py-6">
          <button
            onClick={() => setLocation("/dashboard")}
            className="flex items-center gap-2 text-accent hover:text-accent/80 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your preferences and account security
          </p>
        </div>
      </div>

      <div className="container py-12">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Language Preference */}
            <div className="card-elevated p-8">
              <div className="flex items-center gap-3 mb-6">
                <Globe className="w-6 h-6 text-accent" />
                <h2 className="text-xl font-semibold text-foreground">
                  Language Preference
                </h2>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Choose your preferred language for the CropGuard interface
              </p>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { code: "en", name: "English", flag: "🇬🇧" },
                  { code: "hi", name: "हिंदी", flag: "🇮🇳" },
                  { code: "es", name: "Español", flag: "🇪🇸" },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() =>
                      handleLanguageChange(lang.code as "en" | "hi" | "es")
                    }
                    className={`p-4 rounded-lg border-2 transition-all text-center ${
                      formData.preferredLanguage === lang.code
                        ? "border-accent bg-accent/10"
                        : "border-border bg-background hover:border-accent/50"
                    }`}
                  >
                    <div className="text-2xl mb-2">{lang.flag}</div>
                    <div className="text-sm font-medium">{lang.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="card-elevated p-8">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-6 h-6 text-accent" />
                <h2 className="text-xl font-semibold text-foreground">
                  Notification Preferences
                </h2>
              </div>

              <div className="space-y-4">
                {/* Email Notifications Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/5 transition-colors">
                  <div>
                    <h3 className="font-medium text-foreground">
                      Email Notifications
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about your scans and recommendations
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle("emailNotifications")}
                    className={`relative w-12 h-7 rounded-full transition-colors ${
                      formData.emailNotifications
                        ? "bg-accent"
                        : "bg-muted"
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                        formData.emailNotifications ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* Disease Alerts Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/5 transition-colors">
                  <div>
                    <h3 className="font-medium text-foreground">
                      Disease Detection Alerts
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Get notified immediately when diseases are detected
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle("diseaseAlerts")}
                    className={`relative w-12 h-7 rounded-full transition-colors ${
                      formData.diseaseAlerts ? "bg-accent" : "bg-muted"
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                        formData.diseaseAlerts ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="card-elevated p-8">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-6 h-6 text-accent" />
                <h2 className="text-xl font-semibold text-foreground">
                  Account Information
                </h2>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="font-medium text-foreground">
                    {user?.email || "farmer@cropguard.local"}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">
                    Account Created
                  </p>
                  <p className="font-medium text-foreground">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "Recently"}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">
                    Last Sign In
                  </p>
                  <p className="font-medium text-foreground">
                    {user?.lastSignedIn
                      ? new Date(user.lastSignedIn).toLocaleDateString()
                      : "Today"}
                  </p>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="card-elevated p-8 border-destructive/20">
              <h2 className="text-xl font-semibold text-destructive mb-4">
                Danger Zone
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button variant="destructive" disabled>
                Delete Account (Coming Soon)
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/dashboard")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="min-w-[200px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
