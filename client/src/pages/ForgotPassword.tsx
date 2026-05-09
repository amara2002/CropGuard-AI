import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const forgotMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: (data) => {
      setSent(true);
      toast.success(data.message);
      if (data.demoToken) {
        console.log("📧 Reset Token (demo):", data.demoToken);
      }
    },
    onError: (err) => {
      toast.error(err.message || "Something went wrong");
      setLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <button
        onClick={() => setLocation("/login")}
        className="absolute top-4 left-4 text-xs font-bold text-slate-400 hover:text-emerald-600 uppercase tracking-widest flex items-center gap-1 transition-colors"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to Login
      </button>

      <div className="mb-6 flex items-center gap-2.5">
        <div className="bg-emerald-600 p-1.5 rounded-lg">
          <Leaf className="w-4 h-4 text-white" />
        </div>
        <span className="text-xs font-black text-slate-900 uppercase tracking-widest">
          CropGuard <span className="text-emerald-600">v2.1</span>
        </span>
      </div>

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-8">
        {sent ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Check Your Email</h2>
            <p className="text-sm text-muted-foreground mb-6">
              If an account exists for {email}, you'll receive a password reset link shortly.
            </p>
            <Button onClick={() => setLocation("/login")} variant="outline" className="w-full">
              Return to Login
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Forgot Password</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter your email address and we'll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
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

              <Button
                type="submit"
                className="w-full bg-slate-900 hover:bg-black py-6 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Reset Link"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm">
              Remember your password?{" "}
              <button onClick={() => setLocation("/login")} className="text-emerald-600 hover:underline font-medium">
                Sign in
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}