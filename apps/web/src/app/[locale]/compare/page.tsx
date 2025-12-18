'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { useRouter } from '@/i18n/routing';
import { Button, Badge } from '@repo/ui';
import { useComparison } from '@/context/ComparisonContext';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  X,
  Check,
  Minus,
  Home,
  Bed,
  Bath,
  Maximize,
  MapPin,
  Calendar,
  Building2,
  Loader2,
  Download,
  TrendingUp,
  TrendingDown,
  Info,
} from 'lucide-react';

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: 'Квартира',
  HOUSE: 'Дом',
  TOWNHOUSE: 'Таунхаус',
  COMMERCIAL: 'Коммерческая',
  LAND: 'Участок',
  OFFICE: 'Офис',
  WAREHOUSE: 'Склад',
};

const LISTING_TYPE_LABELS: Record<string, string> = {
  SALE: 'Продажа',
  RENT_LONG: 'Аренда',
  RENT_DAILY: 'Посуточно',
};

const BUILDING_CLASS_LABELS: Record<string, string> = {
  ECONOMY: 'Эконом',
  COMFORT: 'Комфорт',
  BUSINESS: 'Бизнес',
  ELITE: 'Элит',
};

const RENOVATION_LABELS: Record<string, string> = {
  NO_RENOVATION: 'Без ремонта',
  COSMETIC: 'Косметический',
  EURO: 'Евроремонт',
  DESIGNER: 'Дизайнерский',
};

interface PropertyDetails {
  id: string;
  title: string;
  description: string;
  price: number;
  priceUsd: number;
  currency: string;
  listingType: string;
  propertyType: string;
  status: string;
  address: string;
  city: string;
  district: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  rooms: number | null;
  area: number | null;
  livingArea: number | null;
  kitchenArea: number | null;
  floor: number | null;
  totalFloors: number | null;
  yearBuilt: number | null;
  parking: number | null;
  balcony: number | null;
  buildingType: string | null;
  buildingClass: string | null;
  renovation: string | null;
  ceilingHeight: number | null;
  images: Array<{ url: string }>;
  amenities: Array<{ amenity: string }>;
  createdAt: string;
}

export default function ComparePage() {
  const t = useTranslations('compare');
  const tProperty = useTranslations('property');
  const router = useRouter();
  const { comparisonIds, removeFromComparison, clearComparison } = useComparison();
  const [properties, setProperties] = useState<PropertyDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightDifferences, setHighlightDifferences] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    if (comparisonIds.length === 0) {
      setLoading(false);
      return;
    }

    fetchProperties();
  }, [comparisonIds]);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);

    try {
      const promises = comparisonIds.map((id) =>
        fetch(`${apiUrl}/properties/${id}`).then((res) => {
          if (!res.ok) throw new Error('Failed to fetch property');
          return res.json();
        })
      );

      const results = await Promise.all(promises);
      setProperties(results);
    } catch (err) {
      setError(t('errors.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    const formatted = new Intl.NumberFormat('ru-RU').format(price);
    if (currency === 'USD') return `$${formatted}`;
    if (currency === 'UZS') return `${formatted} сум`;
    return `${formatted} у.е.`;
  };

  const renderValue = (value: any, unit?: string) => {
    if (value === null || value === undefined) {
      return <Minus className="h-4 w-4 text-gray-400 mx-auto" />;
    }
    return (
      <span>
        {value}
        {unit && <span className="text-gray-500 ml-1">{unit}</span>}
      </span>
    );
  };

  const renderBoolean = (value: boolean | null | undefined) => {
    if (value === null || value === undefined) {
      return <Minus className="h-4 w-4 text-gray-400 mx-auto" />;
    }
    return value ? (
      <Check className="h-5 w-5 text-green-600 mx-auto" />
    ) : (
      <X className="h-5 w-5 text-red-600 mx-auto" />
    );
  };

  const getBestValue = (field: keyof PropertyDetails, isHigherBetter: boolean = true) => {
    const values = properties
      .map((p) => p[field])
      .filter((v) => v !== null && v !== undefined) as number[];

    if (values.length === 0) return null;

    return isHigherBetter ? Math.max(...values) : Math.min(...values);
  };

  const isValueBest = (value: any, field: keyof PropertyDetails, isHigherBetter: boolean = true) => {
    if (value === null || value === undefined) return false;
    const bestValue = getBestValue(field, isHigherBetter);
    return value === bestValue;
  };

  const exportComparison = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `property-comparison-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateCSV = () => {
    const headers = ['Характеристика', ...properties.map((p) => p.title)];
    const rows = [
      ['Цена', ...properties.map((p) => formatPrice(p.price, p.currency))],
      ['Цена за м²', ...properties.map((p) => p.area ? Math.round(p.priceUsd / p.area) : '-')],
      ['Тип недвижимости', ...properties.map((p) => PROPERTY_TYPE_LABELS[p.propertyType] || p.propertyType)],
      ['Тип сделки', ...properties.map((p) => LISTING_TYPE_LABELS[p.listingType] || p.listingType)],
      ['Общая площадь (м²)', ...properties.map((p) => p.area || '-')],
      ['Спальни', ...properties.map((p) => p.bedrooms || '-')],
      ['Санузлы', ...properties.map((p) => p.bathrooms || '-')],
      ['Этаж', ...properties.map((p) => p.floor && p.totalFloors ? `${p.floor} из ${p.totalFloors}` : p.floor || '-')],
      ['Год постройки', ...properties.map((p) => p.yearBuilt || '-')],
      ['Класс здания', ...properties.map((p) => p.buildingClass ? BUILDING_CLASS_LABELS[p.buildingClass] : '-')],
      ['Город', ...properties.map((p) => p.city)],
    ];

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (comparisonIds.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link href="/properties">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('back')}
              </Button>
            </Link>
          </div>

          <div className="text-center py-20">
            <Home className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">{t('empty.title')}</h2>
            <p className="text-gray-600 mb-6">
              {t('empty.description')}
            </p>
            <Link href="/properties">
              <Button>{t('empty.button')}</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link href="/properties">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('back')}
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">
              {t('title')} ({properties.length})
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHighlightDifferences(!highlightDifferences)}
            >
              <Info className="h-4 w-4 mr-2" />
              {highlightDifferences ? 'Скрыть выделение' : 'Выделить различия'}
            </Button>

            <Button variant="outline" size="sm" onClick={exportComparison}>
              <Download className="h-4 w-4 mr-2" />
              Экспорт CSV
            </Button>

            <Button variant="outline" onClick={clearComparison}>
              {t('clearAll')}
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Cheapest Property */}
          {(() => {
            const cheapest = properties.reduce((min, p) =>
              p.priceUsd < min.priceUsd ? p : min
            , properties[0]);
            return (
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold">Лучшая цена</h3>
                </div>
                <p className="text-sm text-gray-600 truncate">{cheapest.title}</p>
                <p className="text-lg font-bold text-green-600">
                  {formatPrice(cheapest.price, cheapest.currency)}
                </p>
              </div>
            );
          })()}

          {/* Largest Area */}
          {(() => {
            const largest = properties.reduce((max, p) =>
              (p.area || 0) > (max.area || 0) ? p : max
            , properties[0]);
            return (
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                <div className="flex items-center gap-2 mb-2">
                  <Maximize className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">Наибольшая площадь</h3>
                </div>
                <p className="text-sm text-gray-600 truncate">{largest.title}</p>
                <p className="text-lg font-bold text-blue-600">
                  {largest.area} м²
                </p>
              </div>
            );
          })()}

          {/* Best Price per m² */}
          {(() => {
            const bestValue = properties
              .filter((p) => p.area)
              .reduce((best, p) => {
                const pricePerSqm = p.priceUsd / (p.area || 1);
                const bestPricePerSqm = best.priceUsd / (best.area || 1);
                return pricePerSqm < bestPricePerSqm ? p : best;
              }, properties.find((p) => p.area) || properties[0]);
            const pricePerSqm = bestValue.area ? Math.round(bestValue.priceUsd / bestValue.area) : 0;
            return (
              <div className="bg-white p-4 rounded-lg shadow border-l-4 border-amber-500">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                  <h3 className="font-semibold">Лучшая цена/м²</h3>
                </div>
                <p className="text-sm text-gray-600 truncate">{bestValue.title}</p>
                <p className="text-lg font-bold text-amber-600">
                  ${pricePerSqm}/м²
                </p>
              </div>
            );
          })()}
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left font-semibold w-48 sticky left-0 bg-gray-50 z-10">
                    Характеристика
                  </th>
                  {properties.map((property) => (
                    <th key={property.id} className="px-4 py-3 w-64 min-w-[16rem]">
                      <div className="relative">
                        <button
                          onClick={() => removeFromComparison(property.id)}
                          className="absolute top-0 right-0 p-1 rounded-full hover:bg-gray-200"
                        >
                          <X className="h-4 w-4" />
                        </button>

                        <Link href={`/properties/${property.id}`}>
                          <div className="cursor-pointer">
                            {property.images[0] && (
                              <img
                                src={property.images[0].url}
                                alt={property.title}
                                className="w-full h-32 object-cover rounded mb-2"
                              />
                            )}
                            <h3 className="font-semibold text-sm mb-1 line-clamp-2 text-left">
                              {property.title}
                            </h3>
                            <p className="text-blue-600 font-bold text-left">
                              {formatPrice(property.price, property.currency)}
                            </p>
                          </div>
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y">
                {/* Price per m² */}
                <tr>
                  <td className="px-4 py-3 font-medium bg-white sticky left-0">
                    Цена за м²
                  </td>
                  {properties.map((property) => {
                    const pricePerSqm = property.area ? property.priceUsd / property.area : null;
                    const isBest = pricePerSqm && highlightDifferences && properties.length > 1 &&
                      pricePerSqm === Math.min(...properties.filter(p => p.area).map(p => p.priceUsd / p.area!));
                    return (
                      <td
                        key={property.id}
                        className={`px-4 py-3 text-center ${isBest ? 'bg-green-50 font-semibold' : ''}`}
                      >
                        {property.area
                          ? formatPrice(
                              Math.round(property.priceUsd / property.area),
                              'USD'
                            )
                          : '-'}
                      </td>
                    );
                  })}
                </tr>

                {/* Property Type */}
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 font-medium bg-gray-50 sticky left-0">
                    Тип недвижимости
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-4 py-3 text-center">
                      {PROPERTY_TYPE_LABELS[property.propertyType] || property.propertyType}
                    </td>
                  ))}
                </tr>

                {/* Listing Type */}
                <tr>
                  <td className="px-4 py-3 font-medium bg-white sticky left-0">
                    Тип сделки
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-4 py-3 text-center">
                      <Badge variant="outline">
                        {LISTING_TYPE_LABELS[property.listingType] || property.listingType}
                      </Badge>
                    </td>
                  ))}
                </tr>

                {/* Area */}
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 font-medium bg-gray-50 sticky left-0">
                    Общая площадь
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-4 py-3 text-center">
                      {renderValue(property.area, 'м²')}
                    </td>
                  ))}
                </tr>

                {/* Living Area */}
                <tr>
                  <td className="px-4 py-3 font-medium bg-white sticky left-0">
                    Жилая площадь
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-4 py-3 text-center">
                      {renderValue(property.livingArea, 'м²')}
                    </td>
                  ))}
                </tr>

                {/* Kitchen Area */}
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 font-medium bg-gray-50 sticky left-0">
                    Площадь кухни
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-4 py-3 text-center">
                      {renderValue(property.kitchenArea, 'м²')}
                    </td>
                  ))}
                </tr>

                {/* Bedrooms */}
                <tr>
                  <td className="px-4 py-3 font-medium bg-white sticky left-0">
                    Спальни
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-4 py-3 text-center">
                      {renderValue(property.bedrooms)}
                    </td>
                  ))}
                </tr>

                {/* Bathrooms */}
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 font-medium bg-gray-50 sticky left-0">
                    Санузлы
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-4 py-3 text-center">
                      {renderValue(property.bathrooms)}
                    </td>
                  ))}
                </tr>

                {/* Rooms */}
                <tr>
                  <td className="px-4 py-3 font-medium bg-white sticky left-0">
                    Комнаты
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-4 py-3 text-center">
                      {renderValue(property.rooms)}
                    </td>
                  ))}
                </tr>

                {/* Floor */}
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 font-medium bg-gray-50 sticky left-0">
                    Этаж
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-4 py-3 text-center">
                      {property.floor && property.totalFloors
                        ? `${property.floor} из ${property.totalFloors}`
                        : renderValue(property.floor)}
                    </td>
                  ))}
                </tr>

                {/* Ceiling Height */}
                <tr>
                  <td className="px-4 py-3 font-medium bg-white sticky left-0">
                    Высота потолков
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-4 py-3 text-center">
                      {renderValue(property.ceilingHeight, 'м')}
                    </td>
                  ))}
                </tr>

                {/* Year Built */}
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 font-medium bg-gray-50 sticky left-0">
                    Год постройки
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-4 py-3 text-center">
                      {renderValue(property.yearBuilt)}
                    </td>
                  ))}
                </tr>

                {/* Building Class */}
                <tr>
                  <td className="px-4 py-3 font-medium bg-white sticky left-0">
                    Класс здания
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-4 py-3 text-center">
                      {property.buildingClass
                        ? BUILDING_CLASS_LABELS[property.buildingClass] ||
                          property.buildingClass
                        : '-'}
                    </td>
                  ))}
                </tr>

                {/* Renovation */}
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 font-medium bg-gray-50 sticky left-0">
                    Ремонт
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-4 py-3 text-center">
                      {property.renovation
                        ? RENOVATION_LABELS[property.renovation] || property.renovation
                        : '-'}
                    </td>
                  ))}
                </tr>

                {/* Parking */}
                <tr>
                  <td className="px-4 py-3 font-medium bg-white sticky left-0">
                    Парковка
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-4 py-3 text-center">
                      {renderValue(property.parking, 'мест')}
                    </td>
                  ))}
                </tr>

                {/* Balcony */}
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 font-medium bg-gray-50 sticky left-0">
                    Балкон
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-4 py-3 text-center">
                      {renderValue(property.balcony)}
                    </td>
                  ))}
                </tr>

                {/* Location */}
                <tr>
                  <td className="px-4 py-3 font-medium bg-white sticky left-0">
                    Расположение
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-4 py-3 text-sm">
                      <div className="flex items-start gap-1">
                        <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span>
                          {property.city}
                          {property.district && `, ${property.district}`}
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Amenities Count */}
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 font-medium bg-gray-50 sticky left-0">
                    Удобства
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="px-4 py-3 text-center">
                      {property.amenities.length > 0
                        ? `${property.amenities.length} удобств`
                        : 'Не указаны'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4 justify-center">
          {properties.map((property) => (
            <Link key={property.id} href={`/properties/${property.id}`}>
              <Button>Подробнее</Button>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
