import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Red marker for disease outbreaks
const diseaseIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

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

export default function FarmMap({
  farmLat = 0.3476,
  farmLng = 32.5825,
  farmName = "Your Farm",
  diseasePoints = [],
  className = "",
}: FarmMapProps) {
  return (
    <div className={`rounded-xl overflow-hidden border border-border ${className}`}>
      <MapContainer
        center={[farmLat, farmLng]}
        zoom={8}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", minHeight: "300px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapRecenter lat={farmLat} lng={farmLng} />
        <Marker position={[farmLat, farmLng]}>
          <Popup>
            <strong>{farmName}</strong>
          </Popup>
        </Marker>
        {diseasePoints.map((point) => (
          <Marker key={point.id} position={[point.lat, point.lng]} icon={diseaseIcon}>
            <Popup>
              <strong className="text-red-600">{point.disease}</strong>
              <br />
              Crop: {point.crop}
              <br />
              {point.date}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}