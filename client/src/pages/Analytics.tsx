import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft, MapPin, TrendingUp, PieChart, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import FarmMap from "@/components/FarmMap";
import DiseaseTrends from "@/components/DiseaseTrends";

export default function Analytics() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch all scans for analytics
  const { data: scans, isLoading } = trpc.scans.list.useQuery({
    limit: 100,
    offset: 0,
  });

  // Fetch counts
  const { data: counts } = trpc.scans.count.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-foreground">Farm Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Disease trends, outbreak maps, and data‑driven insights for your farm
          </p>
        </div>
      </div>

      <div className="container py-12">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: BarChart3, label: "Total Scans", value: counts?.total || 0, color: "text-emerald-600" },
            { icon: TrendingUp, label: "Completed", value: counts?.completed || 0, color: "text-blue-600" },
            { icon: PieChart, label: "Unique Diseases", value: new Set(scans?.filter((s) => s.status === "completed").map((s) => s.detectedDisease)).size || 0, color: "text-purple-600" },
            { icon: MapPin, label: "Crops Tracked", value: new Set(scans?.map((s) => s.cropType)).size || 0, color: "text-amber-600" },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="card-elevated p-5"
            >
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs uppercase tracking-wide">{stat.label}</span>
              </div>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Farm Map */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-foreground">Disease Outbreak Map</h2>
          </div>
          <FarmMap
            farmLat={0.3476}
            farmLng={32.5825}
            farmName={user?.farmLocation || "Your Farm"}
            diseasePoints={
              scans
                ?.filter((s) => s.status === "completed")
                .map((s, i) => ({
                  id: s.id,
                  lat: 0.3476 + (Math.random() - 0.5) * 2,
                  lng: 32.5825 + (Math.random() - 0.5) * 2,
                  disease: s.detectedDisease?.split("_").join(" ") || "Unknown",
                  crop: s.cropType,
                  date: new Date(s.createdAt).toLocaleDateString(),
                })) || []
            }
            className="h-96"
          />
        </motion.div>

        {/* Disease Trends Charts */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-foreground">Disease Trends & Insights</h2>
          </div>
          <DiseaseTrends scans={scans || []} />
        </motion.div>
      </div>
    </div>
  );
}