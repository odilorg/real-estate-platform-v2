'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Loader2, Navigation, Search } from 'lucide-react';
import { Button } from '@repo/ui';

// Dynamically import the entire map component to avoid SSR issues
const InteractiveMap = dynamic(() => import('@/components/interactive-map'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  ),
});

interface LocationPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationChange: (lat: number, lng: number, address?: string) => void;
  onAddressSelect?: (address: string) => void;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    house_number?: string;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

// Default center: Tashkent, Uzbekistan
const DEFAULT_CENTER: [number, number] = [41.311081, 69.240562];
const DEFAULT_ZOOM = 13;

export function LocationPicker({
  latitude,
  longitude,
  onLocationChange,
  onAddressSelect,
}: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number] | null>(
    latitude && longitude ? [latitude, longitude] : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Update position when props change
  useEffect(() => {
    if (latitude && longitude) {
      setPosition([latitude, longitude]);
    }
  }, [latitude, longitude]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
            new URLSearchParams({
              q: searchQuery,
              format: 'json',
              addressdetails: '1',
              countrycodes: 'uz',
              limit: '5',
            })
        );
        const data = await response.json();
        setSearchResults(data);
        setShowResults(true);
      } catch (error) {
        // Silently fail - user can try again or use map
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSearchSelect = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setPosition([lat, lng]);
    onLocationChange(lat, lng, result.display_name);
    if (onAddressSelect) {
      onAddressSelect(result.display_name);
    }
    setSearchQuery('');
    setShowResults(false);
    setSearchResults([]);
  };

  const getCurrentLocation = () => {
    setGettingLocation(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setPosition([lat, lng]);

          // Reverse geocode to get address
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?` +
                new URLSearchParams({
                  lat: lat.toString(),
                  lon: lng.toString(),
                  format: 'json',
                  addressdetails: '1',
                })
            );
            const data = await response.json();
            onLocationChange(lat, lng, data.display_name);
            if (onAddressSelect) {
              onAddressSelect(data.display_name);
            }
          } catch (error) {
            onLocationChange(lat, lng);
          }
          setGettingLocation(false);
        },
        (error) => {
          alert('Не удалось определить ваше местоположение');
          setGettingLocation(false);
        }
      );
    } else {
      alert('Геолокация не поддерживается вашим браузером');
      setGettingLocation(false);
    }
  };

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setPosition([lat, lng]);

    // Reverse geocode
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?` +
          new URLSearchParams({
            lat: lat.toString(),
            lon: lng.toString(),
            format: 'json',
            addressdetails: '1',
          })
      );
      const data = await response.json();
      onLocationChange(lat, lng, data.display_name);
      if (onAddressSelect) {
        onAddressSelect(data.display_name);
      }
    } catch (error) {
      onLocationChange(lat, lng);
    }
  }, [onLocationChange, onAddressSelect]);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по адресу (например: Ташкент, Мустақиллик 15)"
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searching && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => handleSearchSelect(result)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-900">
                    {result.display_name}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={getCurrentLocation}
          disabled={gettingLocation}
          className="gap-2"
        >
          {gettingLocation ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
          Моё местоположение
        </Button>
      </div>

      {/* Map */}
      <div className="relative rounded-lg overflow-hidden border border-gray-300">
        <div className="h-[400px] relative">
          <InteractiveMap
            center={position || DEFAULT_CENTER}
            zoom={position ? 15 : DEFAULT_ZOOM}
            position={position}
            onMapClick={handleMapClick}
          />
        </div>

        {/* Map Instructions Overlay */}
        {!position && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm px-6 py-4 rounded-lg shadow-lg border border-gray-200">
              <div className="flex items-center gap-3 text-gray-700">
                <MapPin className="h-6 w-6 text-blue-600" />
                <div className="text-sm">
                  <div className="font-semibold">Укажите местоположение</div>
                  <div className="text-gray-500">
                    Кликните на карте, перетащите маркер или используйте поиск
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Coordinates Display */}
      {position && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold text-green-900">
                Местоположение выбрано
              </div>
              <div className="text-green-700 text-xs mt-1">
                Координаты: {position[0].toFixed(6)}, {position[1].toFixed(6)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
