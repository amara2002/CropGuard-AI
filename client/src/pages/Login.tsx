// Login.tsx - Authentication page for CropGuard AI
// Purpose: Provide secure login functionality with email/password and Google OAuth.
//          Handles credential validation, error messages, and redirects to dashboard.

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc, setToken } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Leaf,
  Loader2,
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getSignupUrl } from "@/const";

export default function Login() {
  const [, setLocation] = useLocation();
  
  // Form state management
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);    // Toggle password visibility
  const [loading, setLoading] = useState(false);               // Loading state for form submission
  const [errors, setErrors] = useState<Record<string, string>>({}); // Validation errors
  const [isOAuthAccount, setIsOAuthAccount] = useState(false); // Flag for Google OAuth accounts

  // tRPC mutation for email/password login
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      // Store the JWT token for authenticated requests
      setToken(data.token);
      toast.success("Signed in successfully!");
      // Force full page reload to dashboard - ensures useAuth hook picks up the new token
      window.location.href = "/dashboard";
    },
    onError: (err) => {
      // Special handling for Google OAuth accounts - they need to use Google button
      if (err.message.includes("Google Sign-In")) {
        setIsOAuthAccount(true);
        toast.error("This account uses Google Sign‑In. Please use the Google button below.");
      } else {
        toast.error(err.message || "Login failed");
      }
      setLoading(false);
    },
  });

  // Validate email format and required fields
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle email/password form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setIsOAuthAccount(false);
    try {
      await loginMutation.mutateAsync({ email, password });
    } catch {
      setLoading(false);
    }
  };

  // Redirect to Google OAuth flow
  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 antialiased">
      
      {/* Brand Logo Section */}
      <div className="mb-6 flex items-center gap-2.5">
        <div className="bg-emerald-600 p-1.5 rounded-lg">
          <Leaf className="w-4 h-4 text-white" />
        </div>
        <span className="text-xs font-black text-slate-900 uppercase tracking-widest">
          CropGuard <span className="text-emerald-600">v2.1</span>
        </span>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-8">
        
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to access your farm dashboard
          </p>
        </div>

        {/* OAuth Account Notice - Shows when user tries email login with Google account */}
        {isOAuthAccount && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>This email is linked to a Google account. Please sign in with Google.</span>
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Email Field */}
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: "" });
                  setIsOAuthAccount(false);
                }}
                placeholder="farmer@example.com"
                className={`pl-11 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:border-emerald-500 focus:bg-white transition-all outline-none ${
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

          {/* Password Field with Visibility Toggle */}
          <div className="space-y-1">
            <Label htmlFor="password" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: "" });
                }}
                placeholder="••••••••"
                className={`pl-11 pr-12 py-2.5 bg-slate-50 border rounded-xl text-sm focus:border-emerald-500 focus:bg-white transition-all outline-none ${
                  errors.password ? "border-red-300" : "border-slate-100"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {errors.password}
              </p>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <button
              type="button"
              className="text-[10px] font-bold text-slate-400 hover:text-emerald-600 uppercase tracking-widest"
              onClick={() => setLocation("/forgot-password")}
            >
              Forgot Password?
            </button>
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
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </>
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-slate-400 font-bold tracking-widest">
              Or continue with
            </span>
          </div>
        </div>

        {/* Google OAuth Button */}
        <Button
          variant="outline"
          className="w-full border-slate-200 text-slate-700 py-6 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50"
          onClick={handleGoogleLogin}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
            />
          </svg>
          Google
        </Button>

        {/* Sign Up Link */}
        <p className="mt-6 text-center text-sm">
          Don't have an account?{" "}
          <button
            onClick={() => setLocation(getSignupUrl())}
            className="text-emerald-600 hover:underline font-medium"
          >
            Sign up
          </button>
        </p>
      </div>

      {/* Security Footer */}
      <p className="mt-8 text-[9px] text-slate-400 font-bold uppercase tracking-[0.4em]">
        Secured by CropGuard Identity Layer
      </p>
    </div>
  );
}