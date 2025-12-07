'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@repo/ui';
import {
  MapPin,
  Train,
  Baby,
  GraduationCap,
  Hospital,
  Pill,
  ShoppingCart,
  Utensils,
  ShoppingBag,
  Trees,
  Dumbbell,
  Building2,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';

interface POI {
  id: string;
  name: string;
  type: string;
  category: string;
  distance: number;
  latitude: number;
  longitude: number;
  address?: string;
}

interface POICategory {
  category: string;
  icon: string;
  color: string;
  items: POI[];
  totalCount: number;
}

interface NearbyPOIsProps {
  propertyId: string;
}

const ICON_MAP: Record<string, any> = {
  train: Train,
  baby: Baby,
  school: GraduationCap,
  hospital: Hospital,
  pill: Pill,
  'shopping-cart': ShoppingCart,
  utensils: Utensils,
  'shopping-bag': ShoppingBag,
  tree: Trees,
  dumbbell: Dumbbell,
  'building-columns': Building2,
};

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  pink: 'bg-pink-50 text-pink-600',
  purple: 'bg-purple-50 text-purple-600',
  red: 'bg-red-50 text-red-600',
  green: 'bg-green-50 text-green-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  orange: 'bg-orange-50 text-orange-600',
  indigo: 'bg-indigo-50 text-indigo-600',
};

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} м`;
  }
  return `${(meters / 1000).toFixed(1)} км`;
}

function calculateWalkingTime(meters: number): string {
  const minutes = Math.round((meters / 1000) * 12); // 12 min per km
  if (minutes < 1) return '< 1 мин';
  return `${minutes} мин пешком`;
}

export function NearbyPOIs({ propertyId }: NearbyPOIsProps) {
  const [poiCategories, setPOICategories] = useState<POICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadPOIs = async () => {
      try {
        setLoading(true);
        setError(null);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiUrl}/properties/${propertyId}/pois`);

        if (!response.ok) {
          throw new Error('Failed to load POIs');
        }

        const data = await response.json();
        setPOICategories(data);
      } catch (err) {
        console.error('Error loading POIs:', err);
        setError('Не удалось загрузить информацию об окрестностях');
      } finally {
        setLoading(false);
      }
    };

    loadPOIs();
  }, [propertyId]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Загрузка окрестностей...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-600">
            <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const categoriesWithPOIs = poiCategories.filter((cat) => cat.items.length > 0);

  if (categoriesWithPOIs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-600">
            <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>Нет данных об окрестностях для этого местоположения</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Что рядом</h2>
          <p className="text-sm text-gray-600 mt-1">
            Места в радиусе 1 км
          </p>
        </div>

        {/* POI Categories */}
        <div className="divide-y divide-gray-200">
          {categoriesWithPOIs.map((category) => {
            const Icon = ICON_MAP[category.icon] || MapPin;
            const isExpanded = expandedCategories.has(category.category);
            const displayCount = Math.min(category.items.length, 3);
            const hasMore = category.items.length > 3;

            return (
              <div key={category.category} className="p-6">
                {/* Category Header */}
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => hasMore && toggleCategory(category.category)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${COLOR_MAP[category.color] || 'bg-gray-50 text-gray-600'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold">{category.category}</div>
                      <div className="text-sm text-gray-500">
                        {category.totalCount > 0
                          ? `${category.totalCount} ${category.totalCount === 1 ? 'место' : category.totalCount < 5 ? 'места' : 'мест'}`
                          : 'Не найдено'}
                      </div>
                    </div>
                  </div>
                  {hasMore && (
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                      {isExpanded ? (
                        <>
                          Скрыть <ChevronUp className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Показать все <ChevronDown className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* POI List */}
                {category.items.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {(isExpanded ? category.items : category.items.slice(0, displayCount)).map((poi) => (
                      <POIItem key={poi.id} poi={poi} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function POIItem({ poi }: { poi: POI }) {
  return (
    <div className="flex items-start justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate">{poi.name}</div>
        {poi.address && (
          <div className="text-xs text-gray-500 truncate mt-0.5">{poi.address}</div>
        )}
      </div>
      <div className="ml-4 text-right flex-shrink-0">
        <div className="text-sm font-semibold text-gray-900">{formatDistance(poi.distance)}</div>
        <div className="text-xs text-gray-500">{calculateWalkingTime(poi.distance)}</div>
      </div>
    </div>
  );
}
