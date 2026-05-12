// client/src/components/DiseaseTrends.tsx
// CropGuard AI - Disease Trends Visualization
// 
// Purpose: Display interactive charts showing disease detection patterns.
//          Helps farmers understand:
//          - Which crops are most frequently scanned
//          - Most common diseases detected
//          - Recent scanning activity trends
//
// Charts are powered by Recharts library for smooth, responsive visualizations

import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

// ============================================================================
// Type Definitions
// ============================================================================

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

// ============================================================================
// Chart Colors - Emerald color palette for consistent branding
// ============================================================================

const COLORS = [
  "#059669", // Emerald-600 (primary)
  "#10b981", // Emerald-500
  "#34d399", // Emerald-400
  "#6ee7b7", // Emerald-300
  "#a7f3d0", // Emerald-200
  "#047857", // Emerald-700
  "#065f46", // Emerald-800
  "#064e3b", // Emerald-900
];

// ============================================================================
// Main Component
// ============================================================================

export default function DiseaseTrends({ scans, className = "" }: DiseaseTrendsProps) {
  
  // ==========================================================================
  // Data Processing - Memoized for performance
  // ==========================================================================
  
  /**
   * Process scans by crop type (only completed scans)
   * Groups scans by crop and counts occurrences
   */
  const cropData = useMemo(() => {
    const completed = scans.filter((s) => s.status === "completed");
    const grouped: Record<string, number> = {};
    completed.forEach((scan) => {
      grouped[scan.cropType] = (grouped[scan.cropType] || 0) + 1;
    });
    return Object.entries(grouped).map(([name, count]) => ({ name, count }));
  }, [scans]);

  /**
   * Process scans by disease type (only completed scans)
   * Groups by disease name, counts occurrences, sorts by frequency
   * Limits to top 8 diseases for chart readability
   */
  const diseaseData = useMemo(() => {
    const completed = scans.filter((s) => s.status === "completed");
    const grouped: Record<string, number> = {};
    completed.forEach((scan) => {
      // Convert disease names like "Cassava_Mosaic_Disease" to "Cassava Mosaic Disease"
      const name = scan.detectedDisease?.split("_").join(" ") || "Unknown";
      grouped[name] = (grouped[name] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)  // Most common first
      .slice(0, 8);                       // Limit to 8 for readability
  }, [scans]);

  /**
   * Process scans by date (time series)
   * Groups scans by date (MMM DD format), counts occurrences
   * Shows last 14 days of activity
   */
  const timeData = useMemo(() => {
    const grouped: Record<string, number> = {};
    scans.forEach((scan) => {
      const date = new Date(scan.createdAt).toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric" 
      });
      grouped[date] = (grouped[date] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([date, scans]) => ({ date, scans }))
      .slice(-14);  // Last 14 days
  }, [scans]);

  // ==========================================================================
  // Empty State
  // ==========================================================================
  
  if (scans.length === 0) {
    return (
      <div className="card-elevated p-6 text-center text-muted-foreground">
        Upload scans to see trends
      </div>
    );
  }

  // ==========================================================================
  // Render Charts
  // ==========================================================================
  
  return (
    <div className="space-y-6">
      
      {/* Chart 1: Scans by Crop Type (Bar Chart) */}
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

      {/* Chart 2: Common Diseases (Pie Chart) */}
      <div className="card-elevated p-6">
        <h3 className="text-lg font-semibold mb-4">Common Diseases</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={diseaseData}
              cx="50%"
              cy="50%"
              innerRadius={50}      // Creates a donut chart effect
              outerRadius={90}
              paddingAngle={3}       // Small gap between slices
              dataKey="value"
            >
              {diseaseData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 3: Recent Activity (Time Series Bar Chart) - Only show if data exists */}
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