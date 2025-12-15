"use client";

import { YandexMap } from "./yandex-map";
import { useEffect, useState } from "react";

interface PropertyDetailMapProps {
  latitude: number;
  longitude: number;
  title: string;
  locale?: string;
}

interface MetroStation {
  id: string;
  nameRu: string;
  nameUz: string;
  latitude: number;
  longitude: number;
  line: string;
  distance: number;
}

const LINE_COLORS = {
  CHILANZAR: "#EF4444",
  UZBEKISTAN: "#3B82F6",
  YUNUSABAD: "#10B981",
};

export function PropertyDetailMap({
  latitude,
  longitude,
  title,
  locale = "ru",
}: PropertyDetailMapProps) {
  const [nearbyMetro, setNearbyMetro] = useState<MetroStation[]>([]);

  useEffect(() => {
    // Fetch nearby metro stations
    fetch(`/api/metro/within-radius?lat=${latitude}&lng=${longitude}&radius=3000`)
      .then((res) => res.json())
      .then((data) => setNearbyMetro(data))
      .catch((err) => console.error("Error fetching nearby metro:", err));
  }, [latitude, longitude]);

  const handleMapLoad = (map: any) => {
    const ymaps = (window as any).ymaps;
    if (!ymaps) return;

    // Add property marker
    const propertyMarker = new ymaps.Placemark(
      [latitude, longitude],
      {
        balloonContentHeader: title,
        balloonContentBody: "<p>Расположение объекта</p>",
      },
      {
        preset: "islands#redHomeIcon",
      }
    );
    map.geoObjects.add(propertyMarker);

    // Add nearby metro markers
    nearbyMetro.forEach((station) => {
      const lineColor = LINE_COLORS[station.line as keyof typeof LINE_COLORS] || "#6B7280";
      const distanceKm = (station.distance / 1000).toFixed(1);

      const placemark = new ymaps.Placemark(
        [station.latitude, station.longitude],
        {
          balloonContentHeader: locale === "uz" ? station.nameUz : station.nameRu,
          balloonContentBody: `
            <div>
              <p style="color: ${lineColor}; font-weight: bold; margin: 4px 0;">Станция метро</p>
              <p style="font-size: 14px; color: #666; margin: 4px 0;">Расстояние: ~${distanceKm} км</p>
            </div>
          `,
        },
        {
          preset: "islands#circleDotIcon",
          iconColor: lineColor,
        }
      );

      map.geoObjects.add(placemark);

      // Draw line from property to metro
      const polyline = new ymaps.Polyline(
        [[latitude, longitude], [station.latitude, station.longitude]],
        {},
        {
          strokeColor: lineColor,
          strokeWidth: 2,
          strokeOpacity: 0.5,
          strokeStyle: "dash",
        }
      );
      map.geoObjects.add(polyline);
    });

    // Fit bounds to show all markers
    if (nearbyMetro.length > 0) {
      map.setBounds(map.geoObjects.getBounds(), { checkZoomRange: true, zoomMargin: 100 });
    }
  };

  return (
    <div className="space-y-4">
      <YandexMap
        center={[latitude, longitude]}
        zoom={14}
        height="450px"
        className="rounded-lg shadow-lg"
        onLoad={handleMapLoad}
      />

      {nearbyMetro.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <h3 className="text-lg font-semibold mb-3">
            {locale === "uz" ? "Yaqin atrofdagi metro bekatlari" : "Ближайшие станции метро"}
          </h3>
          <div className="space-y-2">
            {nearbyMetro.slice(0, 3).map((station) => (
              <div key={station.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: LINE_COLORS[station.line as keyof typeof LINE_COLORS] }}
                  />
                  <span className="text-sm font-medium">
                    {locale === "uz" ? station.nameUz : station.nameRu}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  ~{(station.distance / 1000).toFixed(1)} км
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
