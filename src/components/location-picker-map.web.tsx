import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';

import type { Coordinates } from '@/lib/geo';

// Finland-centered default view so the map is useful even before a location
// is picked.
const DEFAULT_CENTER: Coordinates = { lat: 64.5, lon: 26 };
const DEFAULT_ZOOM = 5;
const SELECTED_ZOOM = 6;
const MAP_HEIGHT = 260;

// A plain divIcon avoids bundling Leaflet's default marker PNGs, which don't
// reliably resolve through Metro's web asset pipeline for node_modules assets.
const pinIcon = L.divIcon({
  className: 'location-picker-pin',
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#208AEF;border:2px solid #ffffff;box-shadow:0 0 4px rgba(0,0,0,0.45);"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export type LocationPickerMapProps = {
  value: Coordinates | null;
  onChange: (coords: Coordinates) => void;
};

function ClickHandler({ onChange }: { onChange: (coords: Coordinates) => void }) {
  useMapEvents({
    click(event) {
      onChange({ lat: event.latlng.lat, lon: event.latlng.lng });
    },
  });
  return null;
}

// This module (and its Leaflet imports) is only ever loaded lazily on the
// client from location-picker.web.tsx, so it's safe for it to reference
// `window` at import time.
export default function LocationPickerMap({ value, onChange }: LocationPickerMapProps) {
  const center = value ?? DEFAULT_CENTER;

  return (
    <MapContainer
      center={[center.lat, center.lon]}
      zoom={value ? SELECTED_ZOOM : DEFAULT_ZOOM}
      style={{ height: MAP_HEIGHT, width: '100%' }}
      attributionControl>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {value && <Marker position={[value.lat, value.lon]} icon={pinIcon} />}
      <ClickHandler onChange={onChange} />
    </MapContainer>
  );
}
