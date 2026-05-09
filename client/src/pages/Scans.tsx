import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Scans() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: scans, isLoading } = trpc.scans.list.useQuery({
    limit: 50,
    offset: 0,
  });

  const deleteMutation = trpc.scans.delete.useMutation({
    onSuccess: () => {
      toast.success("Scan deleted");
      utils.scans.list.invalidate();
      utils.scans.count.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete scan");
    },
  });

  const handleDelete = (scanId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to permanently delete this scan?")) {
      deleteMutation.mutate({ scanId });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container py-8">
          <Button
            variant="outline"
            onClick={() => setLocation("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-foreground">All Scans</h1>
          <p className="text-muted-foreground mt-2">
            Your complete disease detection history
          </p>
        </div>
      </div>

      <div className="container py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : !scans || scans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No scans yet. Upload your first crop image to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {scans.map((scan) => (
              <div
                key={scan.id}
                onClick={() => setLocation(`/scan/${scan.id}`)}
                className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
                  {scan.status === "completed" ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : scan.status === "pending" ? (
                    <Clock className="w-5 h-5 text-amber-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {scan.cropType}
                    {scan.cropVariety && ` (${scan.cropVariety})`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(scan.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right flex items-center gap-3">
                  {scan.status === "completed" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                      {scan.detectedDisease?.split("_").join(" ") || "Healthy"}
                    </span>
                  ) : scan.status === "pending" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-xs">
                      Processing...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-700 text-xs">
                      Failed
                    </span>
                  )}

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(scan.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-2 bg-red-50 hover:bg-red-100 rounded-full transition-all"
                    title="Delete scan"
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-red-500" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}