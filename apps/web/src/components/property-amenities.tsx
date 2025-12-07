'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@repo/ui';
import {
  Train,
  Bus,
  GraduationCap,
  Baby,
  Hospital,
  ShoppingCart,
  ShoppingBag,
  Coffee,
  UtensilsCrossed,
  Trees,
  Dumbbell,
  Building2,
  MapPin,
  ChevronDown,
  ChevronUp,
  Pill,
  Navigation,
} from 'lucide-react';

interface NearbyAmenity {
  id: string;
  name: string;
  type: string;
  distance: number;
  walkingTime: number;
  latitude: number;
  longitude: number;
  address?: string;
}

interface WalkingScore {
  score: number;
  description: string;
  breakdown: {
    transport: number;
    education: number;
    healthcare: number;
    shopping: number;
    recreation: number;
  };
}

interface LocationData {
  walkingScore: WalkingScore;
  nearbyAmenities: {
    transport: NearbyAmenity[];
    schools: NearbyAmenity[];
    kindergartens: NearbyAmenity[];
    hospitals: NearbyAmenity[];
    pharmacies: NearbyAmenity[];
    supermarkets: NearbyAmenity[];
    shoppingMalls: NearbyAmenity[];
    restaurants: NearbyAmenity[];
    cafes: NearbyAmenity[];
    parks: NearbyAmenity[];
    gyms: NearbyAmenity[];
    banks: NearbyAmenity[];
  };
}

interface PropertyAmenitiesProps {
  propertyId: string;
}

const AMENITY_CONFIG = {
  transport: {
    icon: Train,
    label: 'Транспорт',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  schools: {
    icon: GraduationCap,
    label: 'Школы',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  kindergartens: {
    icon: Baby,
    label: 'Детские сады',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
  },
  hospitals: {
    icon: Hospital,
    label: 'Больницы',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  pharmacies: {
    icon: Pill,
    label: 'Аптеки',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
  },
  supermarkets: {
    icon: ShoppingCart,
    label: 'Супермаркеты',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  shoppingMalls: {
    icon: ShoppingBag,
    label: 'Торговые центры',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  restaurants: {
    icon: UtensilsCrossed,
    label: 'Рестораны',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  cafes: {
    icon: Coffee,
    label: 'Кафе',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  parks: {
    icon: Trees,
    label: 'Парки',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  gyms: {
    icon: Dumbbell,
    label: 'Спортзалы',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
  },
  banks: {
    icon: Building2,
    label: 'Банки',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
  },
};

export function PropertyAmenities({ propertyId }: PropertyAmenitiesProps) {
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['transport', 'schools'])
  );

  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(
          `${apiUrl}/properties/${propertyId}/location-data`
        );

        if (!response.ok) {
          if (response.status === 404) {
            setError('No location data');
            return;
          }
          throw new Error('Failed to fetch location data');
        }

        const data = await response.json();
        setLocationData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchLocationData();
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

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-lime-600';
    if (score >= 50) return 'text-yellow-600';
    if (score >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'from-green-500 to-green-600';
    if (score >= 70) return 'from-lime-500 to-lime-600';
    if (score >= 50) return 'from-yellow-500 to-yellow-600';
    if (score >= 25) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)} м`;
    }
    return `${(meters / 1000).toFixed(1)} км`;
  };

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-40 bg-gray-200 rounded-xl" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !locationData) {
    return null;
  }

  const hasAnyAmenities = Object.values(locationData.nearbyAmenities).some(
    (amenities) => amenities.length > 0
  );

  return (
    <div className="space-y-6">
      {/* Walking Score Card */}
      <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-gray-50">
        <CardContent className="p-8">
          <div className="flex items-start gap-2 mb-6">
            <Navigation className="h-6 w-6 text-blue-600 mt-0.5" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Пешая доступность</h2>
              <p className="text-sm text-gray-500 mt-1">
                Оценка удобства расположения на основе близости к объектам
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8 mb-6">
            {/* Score Circle */}
            <div className="flex-shrink-0">
              <div className="relative w-32 h-32">
                <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${getScoreBgColor(locationData.walkingScore.score)} opacity-10`} />
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="url(#gradient)"
                    strokeWidth="10"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${(locationData.walkingScore.score / 100) * 351.86} 351.86`}
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" className={getScoreColor(locationData.walkingScore.score)} />
                      <stop offset="100%" className={getScoreColor(locationData.walkingScore.score)} style={{ stopOpacity: 0.7 }} />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-bold ${getScoreColor(locationData.walkingScore.score)}`}>
                    {locationData.walkingScore.score}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">из 100</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="flex-1 text-center md:text-left">
              <p className="text-lg font-medium text-gray-900 mb-2">
                {locationData.walkingScore.description}
              </p>
              <p className="text-sm text-gray-600">
                {locationData.walkingScore.score >= 90 && 'Отличное расположение! Большинство объектов в пешей доступности.'}
                {locationData.walkingScore.score >= 70 && locationData.walkingScore.score < 90 && 'Хорошее расположение. Многие объекты доступны пешком.'}
                {locationData.walkingScore.score >= 50 && locationData.walkingScore.score < 70 && 'Неплохое расположение. Некоторые объекты в пешей доступности.'}
                {locationData.walkingScore.score >= 25 && locationData.walkingScore.score < 50 && 'Для большинства поездок потребуется транспорт.'}
                {locationData.walkingScore.score < 25 && 'Практически для всех поездок необходим автомобиль.'}
              </p>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-blue-100">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {locationData.walkingScore.breakdown.transport}
              </div>
              <div className="text-xs font-medium text-gray-600">Транспорт</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-green-100">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {locationData.walkingScore.breakdown.education}
              </div>
              <div className="text-xs font-medium text-gray-600">Образование</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-red-100">
              <div className="text-3xl font-bold text-red-600 mb-1">
                {locationData.walkingScore.breakdown.healthcare}
              </div>
              <div className="text-xs font-medium text-gray-600">Здоровье</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-orange-100">
              <div className="text-3xl font-bold text-orange-600 mb-1">
                {locationData.walkingScore.breakdown.shopping}
              </div>
              <div className="text-xs font-medium text-gray-600">Магазины</div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-emerald-100">
              <div className="text-3xl font-bold text-emerald-600 mb-1">
                {locationData.walkingScore.breakdown.recreation}
              </div>
              <div className="text-xs font-medium text-gray-600">Отдых</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nearby Amenities */}
      {hasAnyAmenities && (
        <Card className="shadow-sm border-0">
          <CardContent className="p-8">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Что рядом</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(locationData.nearbyAmenities).map(([category, amenities]) => {
                if (amenities.length === 0) return null;

                const config = AMENITY_CONFIG[category as keyof typeof AMENITY_CONFIG];
                const Icon = config.icon;
                const isExpanded = expandedCategories.has(category);
                const closest = amenities[0];

                return (
                  <div
                    key={category}
                    className={`border-2 ${config.borderColor} rounded-xl overflow-hidden bg-white hover:shadow-md transition-all duration-200`}
                  >
                    <button
                      onClick={() => toggleCategory(category)}
                      className={`w-full px-5 py-4 flex items-center justify-between ${config.bgColor} hover:opacity-80 transition-opacity`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm`}>
                          <Icon className={`h-6 w-6 ${config.color}`} />
                        </div>
                        <div className="text-left flex-1">
                          <div className="font-semibold text-gray-900 text-base mb-1">
                            {config.label}
                          </div>
                          <div className="text-sm text-gray-700 flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{closest.name}</span>
                            <span className="text-gray-400">•</span>
                            <span className={`font-semibold ${config.color}`}>
                              {formatDistance(closest.distance)}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600">
                              {closest.walkingTime} мин пешком
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <div className="bg-white rounded-full px-3 py-1 shadow-sm">
                          <span className="text-sm font-semibold text-gray-700">
                            {amenities.length}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-600" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-5 py-4 bg-gray-50 border-t-2 border-gray-100">
                        <div className="space-y-3">
                          {amenities.map((amenity, index) => (
                            <div
                              key={amenity.id}
                              className={`flex items-start justify-between py-3 ${
                                index !== amenities.length - 1 ? 'border-b border-gray-200' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3 flex-1">
                                <div className="mt-1">
                                  <MapPin className={`h-4 w-4 ${config.color}`} />
                                </div>
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900 mb-1">
                                    {amenity.name}
                                  </div>
                                  {amenity.address && (
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                      <span>{amenity.address}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-4">
                                <div className={`text-base font-bold ${config.color} mb-0.5`}>
                                  {formatDistance(amenity.distance)}
                                </div>
                                <div className="text-xs text-gray-600 font-medium">
                                  {amenity.walkingTime} мин
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
