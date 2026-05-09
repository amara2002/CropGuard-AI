import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, Loader2, Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
      toast.success("Password has been reset!");
    },
    onError: (err) => {
      toast.error(err.message || "Invalid or expired reset token");
      setLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return toast.error("Please enter the reset token");
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    await resetMutation.mutateAsync({ token, newPassword });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 antialiased">
      <button
        onClick={() => setLocation("/login")}
        className="absolute top-4 left-4 text-xs font-bold text-slate-400 hover:text-emerald-600 uppercase tracking-widest flex items-center gap-1 transition-colors"
      >
        <ArrowLeft className="w-3 h-3" /> Back to Login
      </button>

      <div className="mb-6 flex items-center gap-2.5">
        <div className="bg-emerald-600 p-1.5 rounded-lg"><Leaf className="w-4 h-4 text-white" /></div>
        <span className="text-xs font-black text-slate-900 uppercase tracking-widest">CropGuard <span className="text-emerald-600">v2.1</span></span>
      </div>

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-8">
        {success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Password Reset!</h2>
            <p className="text-sm text-muted-foreground mb-6">Your password has been successfully reset.</p>
            <Button onClick={() => setLocation("/login")} variant="outline" className="w-full">Go to Login</Button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Reset Password</h2>
              <p className="text-sm text-muted-foreground mt-1">Enter the reset token and your new password.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Reset Token</Label>
                <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste reset token here" className="text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <Input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" className="pl-11 pr-12 text-sm" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full bg-slate-900 hover:bg-black py-6 rounded-xl text-[10px] font-bold uppercase tracking-widest" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Reset Password"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}