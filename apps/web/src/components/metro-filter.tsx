'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Train, MapPin } from 'lucide-react';

interface MetroStation {
  id: string;
  nameRu: string;
  nameUz: string;
  line: 'CHILANZAR' | 'UZBEKISTAN' | 'YUNUSABAD';
  lineNameRu: string;
  lineNameUz: string;
  latitude: number;
  longitude: number;
  order: number;
}

interface MetroLine {
  line: string;
  lineNameRu: string;
  lineNameUz: string;
  color: string;
  stations: MetroStation[];
}

interface MetroFilterProps {
  selectedStationId?: string;
  maxDistance?: number; // in kilometers
  onChange: (stationId?: string, maxDistance?: number) => void;
  locale?: string;
}

export function MetroFilter({
  selectedStationId,
  maxDistance = 1,
  onChange,
  locale = 'ru',
}: MetroFilterProps) {
  const t = useTranslations('filters');
  const [metroLines, setMetroLines] = useState<MetroLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchMetroStations();
  }, []);

  const fetchMetroStations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/metro/stations');

      if (!response.ok) {
        throw new Error('Failed to fetch metro stations');
      }

      const data = await response.json();
      setMetroLines(data.lines || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching metro stations:', err);
      setError('Failed to load metro stations');
    } finally {
      setLoading(false);
    }
  };

  const getLineColor = (line: string) => {
    switch (line) {
      case 'CHILANZAR':
        return '#EF4444'; // Red
      case 'UZBEKISTAN':
        return '#3B82F6'; // Blue
      case 'YUNUSABAD':
        return '#10B981'; // Green
      default:
        return '#6B7280'; // Gray
    }
  };

  const selectedStation = metroLines
    .flatMap((line) => line.stations)
    .find((station) => station.id === selectedStationId);

  const distanceOptions = [
    { value: 0.5, label: '500м' },
    { value: 1, label: '1км' },
    { value: 1.5, label: '1.5км' },
    { value: 2, label: '2км' },
    { value: 3, label: '3км' },
  ];

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Train className="w-4 h-4 animate-pulse" />
        <span>Загрузка станций метро...</span>
      </div>
    );
  }

  if (error) {
    return null; // Hide if error
  }

  return (
    <div className="space-y-3">
      {/* Metro Station Selector */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          <Train className="w-4 h-4 inline mr-1.5" />
          {locale === 'uz' ? 'Metro bekati' : 'Станция метро'}
        </label>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-3 py-2 text-left bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            {selectedStation ? (
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getLineColor(selectedStation.line) }}
                />
                <span className="text-sm">
                  {locale === 'uz' ? selectedStation.nameUz : selectedStation.nameRu}
                </span>
              </div>
            ) : (
              <span className="text-sm text-gray-500">
                {locale === 'uz' ? 'Tanlang' : 'Выберите станцию'}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-96 overflow-y-auto">
              {/* Clear selection option */}
              <button
                type="button"
                onClick={() => {
                  onChange(undefined, undefined);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {locale === 'uz' ? 'Tozalash' : 'Очистить'}
              </button>

              <div className="border-t border-gray-200 dark:border-gray-700" />

              {/* Metro lines and stations */}
              {metroLines.map((line) => (
                <div key={line.line} className="py-2">
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getLineColor(line.line) }}
                      />
                      {locale === 'uz' ? line.lineNameUz : line.lineNameRu}
                    </div>
                  </div>

                  {line.stations.map((station) => (
                    <button
                      key={station.id}
                      type="button"
                      onClick={() => {
                        onChange(station.id, maxDistance);
                        setIsOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        selectedStationId === station.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {locale === 'uz' ? station.nameUz : station.nameRu}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Distance Slider (only show when station is selected) */}
      {selectedStationId && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            <MapPin className="w-4 h-4 inline mr-1.5" />
            {locale === 'uz' ? 'Masofa' : 'Расстояние'}
          </label>

          <div className="flex gap-2">
            {distanceOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(selectedStationId, option.value)}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  maxDistance === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            {locale === 'uz'
              ? `Metro bekati atrofida ${maxDistance} km ichida`
              : `В пределах ${maxDistance} км от метро`}
          </p>
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
