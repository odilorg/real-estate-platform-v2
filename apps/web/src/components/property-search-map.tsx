"use client";

import { YandexMap } from "./yandex-map";
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

  const handleMapLoad = (map: any) => {
    const ymaps = (window as any).ymaps;
    if (!ymaps) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => map.geoObjects.remove(marker));
    markersRef.current = [];

    // Add property markers
    properties.forEach((property) => {
      if (!property.latitude || !property.longitude) return;

      const placemark = new ymaps.Placemark(
        [property.latitude, property.longitude],
        {
          balloonContentHeader: property.title,
          balloonContentBody: `
            <div style="max-width: 200px;">
              ${property.images?.[0] ? `<img src="${property.images[0].url}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />` : ""}
              <p style="font-size: 16px; font-weight: bold; margin: 4px 0;">${property.price.toLocaleString()} UZS</p>
              <a href="/properties/${property.id}" style="color: #3B82F6; text-decoration: none;">Подробнее →</a>
            </div>
          `,
        },
        {
          preset: "islands#redDotIcon",
          iconColor: "#EF4444",
        }
      );

      if (onPropertyClick) {
        placemark.events.add("click", () => onPropertyClick(property.id));
      }

      map.geoObjects.add(placemark);
      markersRef.current.push(placemark);
    });

    // Add metro station markers
    metroStations.forEach((station) => {
      const isSelected = station.id === selectedMetroId;
      const lineColor = LINE_COLORS[station.line as keyof typeof LINE_COLORS] || "#6B7280";

      const placemark = new ymaps.Placemark(
        [station.latitude, station.longitude],
        {
          balloonContentHeader: locale === "uz" ? station.nameUz : station.nameRu,
          balloonContentBody: `<p style="color: ${lineColor}; font-weight: bold;">Станция метро</p>`,
        },
        {
          preset: "islands#circleDotIcon",
          iconColor: lineColor,
          iconImageSize: isSelected ? [40, 40] : [30, 30],
        }
      );

      map.geoObjects.add(placemark);
      markersRef.current.push(placemark);
    });

    // Auto-fit bounds to show all markers
    if (markersRef.current.length > 0) {
      map.setBounds(map.geoObjects.getBounds(), { checkZoomRange: true, zoomMargin: 50 });
    }
  };

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
    <YandexMap
      center={getMapCenter()}
      zoom={12}
      height="600px"
      className="rounded-lg shadow-lg"
      onLoad={handleMapLoad}
    />
  );
}
