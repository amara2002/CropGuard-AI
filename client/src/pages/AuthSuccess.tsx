// AuthSuccess.tsx - OAuth callback handler for Google authentication
// Created: May 2026
// Purpose: Handle the redirect from Google OAuth after successful authentication.
//          Extracts the JWT token from URL parameters, stores it in localStorage,
//          and redirects the user to the dashboard.

import { useEffect } from "react";
import { useLocation } from "wouter";
import { setToken } from "@/lib/trpc";
import { Loader2, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function AuthSuccess() {
  const [, setLocation] = useLocation();

  // Process the OAuth callback when component mounts
  useEffect(() => {
    // Parse URL parameters to get the authentication token
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      // Store the JWT token in localStorage for authenticated API calls
      setToken(token);
      
      // Small delay to ensure token is stored before redirect
      // This prevents any race conditions with the auth hook
      setTimeout(() => setLocation("/dashboard"), 500);
    } else {
      // No token found - something went wrong with OAuth
      // Redirect to login page with error handling
      setLocation("/login");
    }
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex flex-col items-center justify-center">
      
      {/* Animated loading spinner with fade in effect */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        {/* Spinner icon */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-75" />
          <Loader2 className="relative w-12 h-12 animate-spin text-emerald-600 mb-4" />
        </div>
        
        {/* Status message */}
        <p className="text-sm text-slate-600 font-medium">Completing sign in...</p>
        <p className="text-xs text-slate-400 mt-2">Please wait while we redirect you</p>
        
        {/* Subtle progress indicator */}
        <div className="mt-6 w-48 h-1 bg-slate-100 rounded-full overflow-hidden mx-auto">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.5, ease: "linear" }}
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"
          />
        </div>
      </motion.div>
    </div>
  );
}