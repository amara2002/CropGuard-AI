// NotFound.tsx - 404 page for CropGuard AI
// Created: May 2026
// Purpose: Display a user-friendly error page when someone tries to access
//          a route that doesn't exist in the application. Provides clear
//          navigation back to the home page.

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home, Sprout } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  // Navigate user back to the home/dashboard page
  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      
      {/* Error Card - Centered with glassmorphism effect */}
      <Card className="w-full max-w-lg mx-4 shadow-xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardContent className="pt-10 pb-10 text-center">
          
          {/* Animated Alert Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* Pulsing background effect */}
              <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-75" />
              <div className="relative bg-white rounded-full p-4 shadow-lg">
                <AlertCircle className="h-16 w-16 text-red-500" />
              </div>
            </div>
          </div>

          {/* Error Code */}
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
            404
          </h1>

          {/* Error Message */}
          <h2 className="text-xl md:text-2xl font-semibold text-slate-800 mb-3">
            Page Not Found
          </h2>

          {/* Helpful Description */}
          <p className="text-slate-500 mb-8 leading-relaxed max-w-sm mx-auto">
            Sorry, the page you are looking for doesn't exist.
            <br />
            It may have been moved, deleted, or you might have typed the wrong URL.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleGoHome}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-2.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Home className="w-4 h-4 mr-2" />
              Return to Dashboard
            </Button>
          </div>

          {/* Subtle Branding */}
          <div className="mt-8 flex items-center justify-center gap-2 text-slate-400 text-xs">
            <Sprout className="w-3 h-3" />
            <span>CropGuard AI v2.1</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}