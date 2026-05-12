// client/src/components/FarmMap.tsx
// CropGuard AI - Interactive Disease Outbreak Map
// 
// Purpose: Display disease outbreak locations on an interactive map using Leaflet.
//          Shows farm location (green marker) and disease detection points (red markers).
//          Helps farmers visualize disease spread across their region.
//
// Features:
// - OpenStreetMap integration (free, no API key required)
// - Responsive container (adapts to parent height)
// - Popup information for each disease point
// - Automatic map recentering and resize handling

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// ============================================================================
// Leaflet Marker Icon Fix
// ============================================================================
// Leaflet's default marker icons don't work with Vite without this fix
// We override the icon URLs to use CDN-hosted images

// Fix for default marker icons (required for Vite)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom red marker for disease outbreaks
const diseaseIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// ============================================================================
// Helper Components
// ============================================================================

/**
 * MapRecenter - Programmatically centers the map on a location
 * Used when farm coordinates change
 */
function MapRecenter({ lat, lng, zoom }: { lat: number; lng: number; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom || map.getZoom());
  }, [lat, lng, zoom, map]);
  return null;
}

/**
 * MapResizeHandler - Handles window resize events
 * Leaflet maps need to be told when the container resizes
 */
function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const handleResize = () => {
      // Small delay ensures the DOM has updated before recalculating
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [map]);
  return null;
}

// ============================================================================
// Type Definitions
// ============================================================================

interface DiseasePoint {
  id: number;
  lat: number;
  lng: number;
  disease: string;
  crop: string;
  date: string;
}

interface FarmMapProps {
  farmLat?: number;
  farmLng?: number;
  farmName?: string;
  diseasePoints?: DiseasePoint[];
  className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export default function FarmMap({
  farmLat = 0.3476,        // Default: Kampala, Uganda
  farmLng = 32.5825,
  farmName = "Your Farm",
  diseasePoints = [],
  className = "",
}: FarmMapProps) {
  return (
    <div 
      className={`w-full h-full ${className}`} 
      style={{ position: "relative", isolation: "isolate" }}
    >
      <MapContainer
        center={[farmLat, farmLng]}
        zoom={8}
        scrollWheelZoom={false}      // Prevents accidental zoom while scrolling page
        style={{ 
          height: "100%", 
          width: "100%", 
          minHeight: "300px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Base Map Tiles - OpenStreetMap (free, no API key) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Utility Components */}
        <MapResizeHandler />
        <MapRecenter lat={farmLat} lng={farmLng} zoom={8} />
        
        {/* Farm Marker - Green (user's farm location) */}
        <Marker position={[farmLat, farmLng]}>
          <Popup>
            <div className="text-sm">
              <strong className="text-emerald-600">🏠 {farmName}</strong>
              <br />
              <span className="text-xs text-gray-500">Your farm location</span>
            </div>
          </Popup>
        </Marker>
        
        {/* Disease Markers - Red (disease detection points) */}
        {diseasePoints.map((point) => (
          <Marker key={point.id} position={[point.lat, point.lng]} icon={diseaseIcon}>
            <Popup>
              <div className="text-sm min-w-[150px]">
                <strong className="text-red-600">⚠️ {point.disease}</strong>
                <br />
                <span className="text-xs">🌾 Crop: {point.crop}</span>
                <br />
                <span className="text-xs text-gray-500">📅 {point.date}</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}