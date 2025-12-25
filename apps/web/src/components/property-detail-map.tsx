"use client";

import YandexMap from "./yandex-map";
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

  // Note: Metro station markers functionality removed temporarily
  // Will be added back when YandexMap component supports custom markers

  return (
    <div className="space-y-4">
      <div style={{ height: '450px' }}>
        <YandexMap
          properties={[{
            id: 'main',
            title,
            price: 0,
            listingType: 'SALE' as const,
            latitude,
            longitude,
          }]}
          center={[latitude, longitude]}
          zoom={14}
          className="rounded-lg shadow-lg"
        />
      </div>

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
