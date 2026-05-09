import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

interface Scan {
  id: number;
  cropType: string;
  detectedDisease: string;
  status: string;
  createdAt: string;
}

interface DiseaseTrendsProps {
  scans: Scan[];
  className?: string;
}

const COLORS = ["#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#047857", "#065f46", "#064e3b"];

export default function DiseaseTrends({ scans, className = "" }: DiseaseTrendsProps) {
  const cropData = useMemo(() => {
    const completed = scans.filter((s) => s.status === "completed");
    const grouped: Record<string, number> = {};
    completed.forEach((scan) => {
      grouped[scan.cropType] = (grouped[scan.cropType] || 0) + 1;
    });
    return Object.entries(grouped).map(([name, count]) => ({ name, count }));
  }, [scans]);

  const diseaseData = useMemo(() => {
    const completed = scans.filter((s) => s.status === "completed");
    const grouped: Record<string, number> = {};
    completed.forEach((scan) => {
      const name = scan.detectedDisease?.split("_").join(" ") || "Unknown";
      grouped[name] = (grouped[name] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [scans]);

  const timeData = useMemo(() => {
    const grouped: Record<string, number> = {};
    scans.forEach((scan) => {
      const date = new Date(scan.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      grouped[date] = (grouped[date] || 0) + 1;
    });
    return Object.entries(grouped).map(([date, scans]) => ({ date, scans })).slice(-14);
  }, [scans]);

  if (scans.length === 0) {
    return <div className="card-elevated p-6 text-center text-muted-foreground">Upload scans to see trends</div>;
  }

  return (
    <div className="space-y-6">
      <div className="card-elevated p-6">
        <h3 className="text-lg font-semibold mb-4">Scans by Crop</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={cropData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#059669" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card-elevated p-6">
        <h3 className="text-lg font-semibold mb-4">Common Diseases</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={diseaseData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value">
              {diseaseData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {timeData.length > 1 && (
        <div className="card-elevated p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={timeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="scans" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}