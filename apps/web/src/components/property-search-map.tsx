"use client";

import YandexMap from "./yandex-map";
import { useEffect, useRef } from "react";

interface Property {
  id: string;
  title: string;
  latitude?: number | null;
  longitude?: number | null;
  price: number;
  images?: Array<{ url: string }>;
}

interface MetroStation {
  id: string;
  nameRu: string;
  nameUz: string;
  latitude: number;
  longitude: number;
  line: string;
}

interface PropertySearchMapProps {
  properties: Property[];
  metroStations?: MetroStation[];
  selectedMetroId?: string;
  onPropertyClick?: (propertyId: string) => void;
  locale?: string;
}

const LINE_COLORS = {
  CHILANZAR: "#EF4444",
  UZBEKISTAN: "#3B82F6",
  YUNUSABAD: "#10B981",
};

export function PropertySearchMap({
  properties,
  metroStations = [],
  selectedMetroId,
  onPropertyClick,
  locale = "ru",
}: PropertySearchMapProps) {
  const markersRef = useRef<any[]>([]);

  // Note: Custom marker handling for metro stations removed temporarily
  // Will be added back when YandexMap component supports additional custom markers

  // Calculate map center
  const getMapCenter = (): [number, number] => {
    if (selectedMetroId && metroStations.length > 0) {
      const station = metroStations.find((s) => s.id === selectedMetroId);
      if (station) {
        return [station.latitude, station.longitude];
      }
    }

    if (properties.length > 0) {
      const validProps = properties.filter((p) => p.latitude && p.longitude);
      if (validProps.length > 0) {
        const avgLat = validProps.reduce((sum, p) => sum + (p.latitude || 0), 0) / validProps.length;
        const avgLng = validProps.reduce((sum, p) => sum + (p.longitude || 0), 0) / validProps.length;
        return [avgLat, avgLng];
      }
    }

    return [41.3111, 69.2797];
  };

  return (
    <div style={{ height: '600px' }}>
      <YandexMap
        properties={properties
          .filter((p) => p.latitude && p.longitude)
          .map((p) => ({
            id: p.id,
            title: p.title,
            price: p.price,
            listingType: 'SALE' as const, // Default since not provided
            latitude: p.latitude!,
            longitude: p.longitude!,
            imageUrl: p.images?.[0]?.url,
          }))}
        center={getMapCenter()}
        zoom={12}
        className="rounded-lg shadow-lg"
        onMarkerClick={onPropertyClick}
      />
    </div>
  );
}
