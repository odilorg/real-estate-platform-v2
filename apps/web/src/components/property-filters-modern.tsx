'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface ModernFilterValues {
  bedrooms?: number;
  propertyTypes: string[];
  listingTypes: string[];
  amenities: string[];
  city?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  minFloor?: number;
  maxFloor?: number;
  userId?: string;
  buildingClasses?: string[];
  renovationTypes?: string[];
  parkingTypes?: string[];
  minYearBuilt?: number;
  maxYearBuilt?: number;
  hasBalcony?: boolean;
  hasConcierge?: boolean;
  hasGatedArea?: boolean;
  mahalla?: string;
}

interface PropertyFiltersModernProps {
  values: ModernFilterValues;
  onChange: (values: ModernFilterValues) => void;
  totalResults: number;
  viewMode?: string;
  onViewModeChange?: (mode: string) => void;
  sortBy?: string;
  onSortChange?: (value: string) => void;
  sortOptions?: Array<{ value: string; label: string }>;
}

interface QuickFilter {
  value: string;
  label: string;
  count: number;
  type: 'bedrooms';
}

interface FilterOptions {
  listingTypes: Array<{ type: string; count: number }>;
  bedrooms: Array<{ count: number; total: number }>;
}

export function PropertyFiltersModern({
  values,
  onChange,
  totalResults,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  sortOptions = [],
}: PropertyFiltersModernProps) {
  const t = useTranslations('filters');
  const tProperty = useTranslations('property');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [quickFilters, setQuickFilters] = useState<QuickFilter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFilterCounts = async () => {
      try {
        // Build query params from current filter context
        const params = new URLSearchParams();

        if (values.propertyTypes.length > 0) {
          params.append('propertyType', values.propertyTypes.join(','));
        }
        if (values.listingTypes.length > 0) {
          params.append('listingType', values.listingTypes.join(','));
        }
        if (values.city) {
          params.append('city', values.city);
        }
        if (values.district) {
          params.append('district', values.district);
        }
        if (values.minPrice) {
          params.append('minPrice', values.minPrice.toString());
        }
        if (values.maxPrice) {
          params.append('maxPrice', values.maxPrice.toString());
        }
        if (values.minArea) {
          params.append('minArea', values.minArea.toString());
        }
        if (values.maxArea) {
          params.append('maxArea', values.maxArea.toString());
        }

        const url = `${process.env.NEXT_PUBLIC_API_URL}/properties/filters${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch filter counts');

        const data: FilterOptions = await response.json();

        const filters: QuickFilter[] = [];

        // Add bedroom filters first (most popular)
        data.bedrooms
          .sort((a, b) => (b.total || 0) - (a.total || 0))
          .forEach((bedroom) => {
            const bedroomCount = bedroom.count || 0;
            // Labels will be set dynamically using translations
            if (bedroomCount === 0) {
              filters.push({
                value: 'studio',
                label: 'studio', // placeholder, will use translation
                count: bedroom.total,
                type: 'bedrooms',
              });
            } else if (bedroomCount >= 1 && bedroomCount <= 5) {
              filters.push({
                value: bedroomCount.toString(),
                label: bedroomCount.toString(), // placeholder, will use translation
                count: bedroom.total,
                type: 'bedrooms',
              });
            }
          });

        setQuickFilters(filters);
      } catch (error) {
        // Silent fail - will show filters without counts
      } finally {
        setLoading(false);
      }
    };

    fetchFilterCounts();
  }, [values]);

  const isFilterActive = (value: string, type: string) => {
    if (type === 'bedrooms') {
      return values.bedrooms?.toString() === value || (value === 'studio' && values.bedrooms === 0);
    }
    return activeFilters.includes(value);
  };

  const toggleFilter = (value: string, type: string) => {
    if (type === 'bedrooms') {
      const newValue = value === 'studio' ? 0 : parseInt(value);
      onChange({
        ...values,
        bedrooms: values.bedrooms === newValue ? undefined : newValue,
      });
    } else {
      const newActiveFilters = isFilterActive(value, type)
        ? activeFilters.filter((f) => f !== value)
        : [...activeFilters, value];
      setActiveFilters(newActiveFilters);
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-RU');
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">
            {t('found')} {formatNumber(totalResults)} {t('listings')}
          </h2>
          <div className="flex items-center gap-3">
            {onSortChange && sortOptions.length > 0 && (
              <select
                value={sortBy || ''}
                onChange={(e) => onSortChange(e.target.value)}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 bg-transparent border-none cursor-pointer focus:outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            {onViewModeChange && (
              <button
                onClick={() => onViewModeChange('map')}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                {t('onMap')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Recommended Filters Section */}
      <div className="px-6 py-5 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">{t('recommended')}</h3>
        <div className="flex flex-wrap gap-2">
          {loading ? (
            <div className="text-sm text-gray-500">{t('loading')}</div>
          ) : quickFilters.length === 0 ? (
            <div className="text-sm text-gray-500">{t('unavailable')}</div>
          ) : (
            quickFilters.map((filter) => {
              const isActive = isFilterActive(filter.value, filter.type);
              const label = filter.value === 'studio'
                ? tProperty('studio')
                : `${filter.value} ${tProperty('rooms')}`;

              return (
                <button
                  key={filter.value}
                  onClick={() => toggleFilter(filter.value, filter.type)}
                  className={`
                    inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                    ${
                      isActive
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  <span>{label}</span>
                  <span className="ml-2 text-xs opacity-75">
                    {formatNumber(filter.count)}
                  </span>
                  {isActive && (
                    <X className="ml-1.5 h-3.5 w-3.5" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Active Filters Bar (if any) */}
      {(values.bedrooms !== undefined || activeFilters.length > 0) && (
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">{t('selected')}</span>
              {values.bedrooms !== undefined && (
                <span className="inline-flex items-center px-2.5 py-1 rounded bg-blue-600 text-white text-sm">
                  {values.bedrooms === 0
                    ? tProperty('studio').charAt(0).toUpperCase() + tProperty('studio').slice(1)
                    : `${values.bedrooms} ${t('roomsShort')}`}
                  <button
                    onClick={() => onChange({ ...values, bedrooms: undefined })}
                    className="ml-1.5 hover:bg-blue-700 rounded-sm"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
              {activeFilters.map((filter) => {
                const filterData = quickFilters.find((f) => f.value === filter);
                const label = filterData?.value === 'studio'
                  ? tProperty('studio')
                  : tProperty('roomCount', { count: filterData?.value });

                return (
                  <span
                    key={filter}
                    className="inline-flex items-center px-2.5 py-1 rounded bg-blue-600 text-white text-sm"
                  >
                    {label}
                    <button
                      onClick={() => toggleFilter(filter, filterData?.type || '')}
                      className="ml-1.5 hover:bg-blue-700 rounded-sm"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                );
              })}
            </div>
            <button
              onClick={() => {
                setActiveFilters([]);
                onChange({ ...values, bedrooms: undefined });
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {t('clearAll')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
