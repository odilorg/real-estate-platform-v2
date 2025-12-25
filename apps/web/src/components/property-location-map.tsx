'use client';

import { Card, CardContent } from '@repo/ui';
import { MapPin, Bus, Expand } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';

// Dynamically import YandexMap to avoid SSR issues
const YandexMap = dynamic(() => import('./yandex-map'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-gray-100 flex items-center justify-center">
      <div className="text-gray-500 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-2"></div>
        <p>Загрузка карты...</p>
      </div>
    </div>
  )
});

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

  // Default to a location if coordinates are not available
  const lat = latitude || 41.311081; // Default to Tashkent
  const lng = longitude || 69.240562;

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
          <YandexMap
            properties={[{
              id: 'property-location',
              title: address,
              price: 0, // Not showing price for location view
              listingType: 'SALE' as const,
              latitude: lat,
              longitude: lng,
            }]}
            center={[lat, lng]}
            zoom={15}
            className="h-full w-full"
          />

          {/* Expand button */}
          <button className="absolute top-4 right-4 z-[1000] bg-white hover:bg-gray-50 p-2 rounded-lg shadow-md transition-colors">
            <Expand className="h-5 w-5 text-gray-700" />
          </button>
        </div>

        {/* Additional Info - Only show if there's metro information */}
        {nearestMetro && (
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
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
