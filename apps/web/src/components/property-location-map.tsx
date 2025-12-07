'use client';

import { Card, CardContent } from '@repo/ui';
import { MapPin, Bus, GraduationCap, Baby, Expand } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import type { Icon as LeafletIcon } from 'leaflet';

// Dynamically import the map to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface PropertyLocationMapProps {
  address: string;
  city: string;
  district?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  nearestMetro?: string | null;
  metroDistance?: number | null;
}

export function PropertyLocationMap({
  address,
  city,
  district,
  latitude,
  longitude,
  nearestMetro,
  metroDistance,
}: PropertyLocationMapProps) {
  const [showAdditional, setShowAdditional] = useState(false);
  const [customIcon, setCustomIcon] = useState<LeafletIcon | null>(null);

  // Default to a location if coordinates are not available
  const lat = latitude || 41.311081; // Default to Tashkent
  const lng = longitude || 69.240562;

  // Create custom icon on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        const icon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });
        setCustomIcon(icon);
      });
    }
  }, []);

  return (
    <Card>
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold mb-2">Расположение</h2>
          <div className="flex items-start gap-2 text-gray-700">
            <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-600" />
            <div>
              <div className="font-medium">{address}</div>
              {district && <div className="text-sm text-gray-600">{district}, {city}</div>}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="relative h-96 w-full">
          {typeof window !== 'undefined' && (
            <MapContainer
              center={[lat, lng]}
              zoom={15}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {customIcon && (
                <Marker position={[lat, lng]} icon={customIcon}>
                  <Popup>
                    {address}
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          )}

          {/* Expand button */}
          <button className="absolute top-4 right-4 z-[1000] bg-white hover:bg-gray-50 p-2 rounded-lg shadow-md transition-colors">
            <Expand className="h-5 w-5 text-gray-700" />
          </button>
        </div>

        {/* Additional Info */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={() => setShowAdditional(!showAdditional)}
            className="flex items-center justify-between w-full mb-4"
          >
            <h3 className="font-semibold">Дополнительно</h3>
            <svg
              className={`h-5 w-5 text-gray-600 transition-transform ${showAdditional ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showAdditional && (
            <div className="space-y-4">
              {/* Metro/Transport */}
              {nearestMetro && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-blue-50 rounded-lg">
                    <Bus className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Ближайшее метро</div>
                    <div className="font-medium">{nearestMetro}</div>
                    {metroDistance && (
                      <div className="text-sm text-gray-500">{metroDistance} м пешком</div>
                    )}
                  </div>
                </div>
              )}

              {/* Future routes placeholder */}
              <div className="flex items-start gap-3 opacity-50">
                <div className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-lg">
                  <Bus className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Маршруты</div>
                  <div className="text-sm text-gray-400">Информация появится позже</div>
                </div>
              </div>

              {/* Schools placeholder */}
              <div className="flex items-start gap-3 opacity-50">
                <div className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-lg">
                  <GraduationCap className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Школы</div>
                  <div className="text-sm text-gray-400">Информация появится позже</div>
                </div>
              </div>

              {/* Kindergartens placeholder */}
              <div className="flex items-start gap-3 opacity-50">
                <div className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-lg">
                  <Baby className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Детские сады</div>
                  <div className="text-sm text-gray-400">Информация появится позже</div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom tabs */}
          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm whitespace-nowrap">
              <MapPin className="h-4 w-4" />
              Похожие объявления
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm whitespace-nowrap">
              <Bus className="h-4 w-4" />
              Метро
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm whitespace-nowrap">
              <Bus className="h-4 w-4" />
              Школы
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm whitespace-nowrap">
              <Baby className="h-4 w-4" />
              Детские сады
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
