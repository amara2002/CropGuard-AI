import { useEffect } from "react";
import { useLocation } from "wouter";
import { setToken } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

export default function AuthSuccess() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      setToken(token);
      // Redirect to dashboard after a brief delay to ensure token is stored
      setTimeout(() => setLocation("/dashboard"), 500);
    } else {
      // No token found, redirect to login
      setLocation("/login");
    }
  }, [setLocation]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-4" />
      <p className="text-sm text-slate-600">Completing sign in...</p>
    </div>
  );
}
