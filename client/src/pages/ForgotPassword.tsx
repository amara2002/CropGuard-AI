// ForgotPassword.tsx - Password recovery page for CropGuard AI
// Created: May 2026
// Purpose: Allow users to request a password reset link when they forget their password.
//          Sends a secure reset token to the user's email address for verification.

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, Loader2, Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  
  // Form state management
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);  // Track if email was sent successfully

  // tRPC mutation to request password reset
  const forgotMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: (data) => {
      setSent(true);
      toast.success(data.message);
      // In development, log the token to console for testing
      if (data.demoToken) {
        console.log("📧 Reset Token (demo):", data.demoToken);
      }
    },
    onError: (err) => {
      toast.error(err.message || "Something went wrong");
      setLoading(false);
    },
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    
    setLoading(true);
    await forgotMutation.mutateAsync({ email });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 antialiased">
      
      {/* Back button to login page */}
      <button
        onClick={() => setLocation("/login")}
        className="absolute top-4 left-4 text-xs font-bold text-slate-400 hover:text-emerald-600 uppercase tracking-widest flex items-center gap-1 transition-colors"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to Login
      </button>

      {/* Brand Logo Section */}
      <div className="mb-6 flex items-center gap-2.5">
        <div className="bg-emerald-600 p-1.5 rounded-lg">
          <Leaf className="w-4 h-4 text-white" />
        </div>
        <span className="text-xs font-black text-slate-900 uppercase tracking-widest">
          CropGuard <span className="text-emerald-600">v2.1</span>
        </span>
      </div>

      {/* Main Forgot Password Card */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-8">
        
        {/* Success State - Show confirmation after request sent */}
        {sent ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Check Your Email</h2>
            <p className="text-sm text-muted-foreground mb-4">
              If an account exists for <strong className="text-slate-800">{email}</strong>, 
              you'll receive a password reset link shortly.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 text-left">
              <p className="text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>For testing purposes, check the browser console for the reset token.</span>
              </p>
            </div>
            <Button onClick={() => setLocation("/login")} variant="outline" className="w-full">
              Return to Login
            </Button>
          </div>
        ) : (
          // Form State - Collect email address for reset
          <>
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Forgot Password</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter your email address and we'll send you a reset link.
              </p>
            </div>

            {/* Reset Request Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Email Input Field */}
              <div className="space-y-1">
                <Label htmlFor="email" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="farmer@example.com"
                    className="pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:border-emerald-500 focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-slate-900 hover:bg-black py-6 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>

            {/* Back to Login Link */}
            <p className="mt-6 text-center text-sm">
              Remember your password?{" "}
              <button onClick={() => setLocation("/login")} className="text-emerald-600 hover:underline font-medium">
                Sign in
              </button>
            </p>
          </>
        )}
      </div>

      {/* Security Footer */}
      <p className="mt-8 text-[9px] text-slate-400 font-bold uppercase tracking-[0.4em]">
        Secured by CropGuard Identity Layer
      </p>
    </div>
  );
}