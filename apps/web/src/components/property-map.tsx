'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { LatLngExpression, LatLngBoundsExpression, Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface PropertyMapMarker {
  id: string;
  title: string;
  price: number;
  listingType: 'SALE' | 'RENT_LONG' | 'RENT_DAILY';
  latitude: number;
  longitude: number;
  imageUrl?: string;
}

interface PropertyMapProps {
  properties: PropertyMapMarker[];
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (propertyId: string) => void;
  selectedPropertyId?: string;
  className?: string;
}

// Lazy load the map components to avoid SSR issues
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

function formatPrice(price: number, listingType: string): string {
  const formatted = new Intl.NumberFormat('ru-RU').format(price);
  if (listingType === 'SALE') {
    return `$${formatted}`;
  }
  return `$${formatted}/мес`;
}

export function PropertyMap({
  properties,
  center = [41.3111, 69.2797], // Default: Tashkent
  zoom = 12,
  onMarkerClick,
  selectedPropertyId,
  className = '',
}: PropertyMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`} style={{ minHeight: '400px' }}>
        <div className="text-gray-500">Загрузка карты...</div>
      </div>
    );
  }

  // Calculate center and bounds from properties if available
  const mapCenter: [number, number] = properties.length > 0
    ? [
        properties.reduce((sum, p) => sum + p.latitude, 0) / properties.length,
        properties.reduce((sum, p) => sum + p.longitude, 0) / properties.length,
      ]
    : center;

  // Calculate appropriate zoom level based on property spread
  let mapZoom = zoom;
  if (properties.length > 1) {
    const lats = properties.map(p => p.latitude);
    const lngs = properties.map(p => p.longitude);
    const latDiff = Math.max(...lats) - Math.min(...lats);
    const lngDiff = Math.max(...lngs) - Math.min(...lngs);
    const maxDiff = Math.max(latDiff, lngDiff);

    // Adjust zoom based on spread
    if (maxDiff > 0.5) mapZoom = 10;
    else if (maxDiff > 0.2) mapZoom = 11;
    else if (maxDiff > 0.1) mapZoom = 12;
    else if (maxDiff > 0.05) mapZoom = 13;
    else mapZoom = 14;
  } else if (properties.length === 1) {
    mapZoom = 15; // Single property - zoom in close
  }

  // Use a key to force remount when properties change significantly
  const mapKey = properties.length > 0 ? `${properties.length}-${mapCenter[0].toFixed(2)}-${mapCenter[1].toFixed(2)}` : 'empty';

  return (
    <MapContainer
      key={mapKey}
      center={mapCenter as LatLngExpression}
      zoom={mapZoom}
      className={`rounded-lg ${className}`}
      style={{ height: '100%', width: '100%', minHeight: '400px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {properties.map((property) => (
        <Marker
          key={property.id}
          position={[property.latitude, property.longitude] as LatLngExpression}
          eventHandlers={{
            click: () => onMarkerClick?.(property.id),
            mouseover: (e) => {
              e.target.openPopup();
            },
            mouseout: (e) => {
              e.target.closePopup();
            },
          }}
        >
          <Popup closeButton={false} autoClose={false}>
            <div className="min-w-[200px]">
              {property.imageUrl && (
                <img
                  src={property.imageUrl}
                  alt={property.title}
                  className="w-full h-24 object-cover rounded mb-2"
                />
              )}
              <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                {property.title}
              </h3>
              <p className="text-blue-600 font-bold">
                {formatPrice(property.price, property.listingType)}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export type { PropertyMapMarker, PropertyMapProps };
