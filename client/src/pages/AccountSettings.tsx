// AccountSettings.tsx - User account preferences management page
// Created: May 2026
// Purpose: Allow farmers to customize their account settings including language
//          preferences, notification options, and view account information.
//          Provides a centralized place for all account-related configurations.

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save, Loader2, Globe, Bell, Shield, AlertTriangle, Check } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function AccountSettings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Form state for user preferences
  const [formData, setFormData] = useState({
    preferredLanguage: (user?.preferredLanguage as "en" | "fr" | "sw" | "lg") || "en",
    emailNotifications: true,
    diseaseAlerts: true,
  });

  const [loading, setLoading] = useState(false);

  // tRPC mutation to update user profile settings
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

  // Handle language selection change
  const handleLanguageChange = (lang: "en" | "fr" | "sw" | "lg") => {
    setFormData((prev) => ({
      ...prev,
      preferredLanguage: lang,
    }));
  };

  // Toggle notification settings
  const handleToggle = (field: "emailNotifications" | "diseaseAlerts") => {
    setFormData((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // Submit form to save settings
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

  // Language options with flags for better UX
  const languageOptions = [
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "sw", name: "Kiswahili", flag: "🇰🇪" },
    { code: "lg", name: "Luganda", flag: "🇺🇬" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      
      {/* Header Section */}
      <div className="border-b border-slate-200/80 bg-white/80 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
        <div className="container px-4 py-4 md:py-6">
          
          {/* Back button to dashboard */}
          <button
            onClick={() => setLocation("/dashboard")}
            className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium text-sm">Back to Dashboard</span>
          </button>
          
          {/* Page title */}
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Account Settings
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Manage your preferences and account security
          </p>
        </div>
      </div>

      <div className="container px-4 py-6 md:py-8">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Language Preference Section */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      Language Preference
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Choose your preferred language for the interface
                    </p>
                  </div>
                </div>

                {/* Language selection grid with flags */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {languageOptions.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleLanguageChange(lang.code as any)}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${
                        formData.preferredLanguage === lang.code
                          ? "border-emerald-500 bg-emerald-50 shadow-sm"
                          : "border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50/30"
                      }`}
                    >
                      <div className="text-3xl mb-2">{lang.flag}</div>
                      <div className="text-sm font-medium text-slate-700">
                        {lang.name}
                      </div>
                      {formData.preferredLanguage === lang.code && (
                        <Check className="w-3 h-3 text-emerald-600 mx-auto mt-1" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notification Preferences Section */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      Notification Preferences
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Control how you receive updates and alerts
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  
                  {/* Email Notifications Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:bg-emerald-50/20 transition-colors">
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        Email Notifications
                      </h3>
                      <p className="text-sm text-slate-500">
                        Receive updates about your scans and recommendations
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle("emailNotifications")}
                      className={`relative w-12 h-7 rounded-full transition-colors ${
                        formData.emailNotifications
                          ? "bg-emerald-500"
                          : "bg-slate-300"
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                          formData.emailNotifications ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {/* Disease Alerts Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:bg-emerald-50/20 transition-colors">
                    <div>
                      <h3 className="font-semibold text-slate-800">
                        Disease Detection Alerts
                      </h3>
                      <p className="text-sm text-slate-500">
                        Get notified immediately when diseases are detected in your crops
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle("diseaseAlerts")}
                      className={`relative w-12 h-7 rounded-full transition-colors ${
                        formData.diseaseAlerts
                          ? "bg-emerald-500"
                          : "bg-slate-300"
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                          formData.diseaseAlerts ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information Section */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      Account Information
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Your account details and history
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Email Display */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                      Email Address
                    </p>
                    <p className="font-medium text-slate-800">
                      {user?.email || "farmer@cropguard.local"}
                    </p>
                  </div>

                  {/* Account Creation Date */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                      Account Created
                    </p>
                    <p className="font-medium text-slate-800">
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "Recently"}
                    </p>
                  </div>

                  {/* Last Sign In Date */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                      Last Sign In
                    </p>
                    <p className="font-medium text-slate-800">
                      {user?.lastSignedIn
                        ? new Date(user.lastSignedIn).toLocaleDateString()
                        : "Today"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Danger Zone - Account Deletion (Coming Soon) */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-red-200 overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <h2 className="text-xl font-bold text-red-600">
                    Danger Zone
                  </h2>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Permanently delete your account and all associated data. 
                  This action cannot be undone and will remove all your scan history.
                </p>
                <Button variant="destructive" disabled className="opacity-50">
                  Delete Account (Coming Soon)
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/dashboard")}
                className="order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 order-1 sm:order-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving Changes...
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