'use client';

import { useState } from 'react';
import { Search, ChevronDown, Heart, SlidersHorizontal, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@repo/ui';

export interface ExtendedFilterValues {
  listingType: 'SALE' | 'RENT_LONG' | 'RENT_DAILY';
  propertyType: 'NEW_BUILDING' | 'SECONDARY' | 'ALL';
  bedrooms: number[];
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  district?: string;
  metro?: string;
  searchQuery?: string;
  amenities?: string[];
  buildingClass?: string;
  minArea?: number;
  maxArea?: number;
  minFloor?: number;
  maxFloor?: number;
}

interface PropertyFiltersExtendedProps {
  values: ExtendedFilterValues;
  onChange: (values: ExtendedFilterValues) => void;
  onSaveSearch?: () => void;
  isAuthenticated?: boolean;
}

export function PropertyFiltersExtended({
  values,
  onChange,
  onSaveSearch,
  isAuthenticated = false,
}: PropertyFiltersExtendedProps) {
  const t = useTranslations('filters');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [showMetroDropdown, setShowMetroDropdown] = useState(false);

  const handleListingTypeChange = (type: 'SALE' | 'RENT_LONG' | 'RENT_DAILY') => {
    onChange({ ...values, listingType: type });
  };

  const handlePropertyTypeChange = (type: 'NEW_BUILDING' | 'SECONDARY' | 'ALL') => {
    onChange({ ...values, propertyType: type });
  };

  const toggleBedroom = (count: number) => {
    const bedrooms = values.bedrooms.includes(count)
      ? values.bedrooms.filter((b) => b !== count)
      : [...values.bedrooms, count];
    onChange({ ...values, bedrooms });
  };

  const clearFilters = () => {
    onChange({
      listingType: 'SALE',
      propertyType: 'ALL',
      bedrooms: [],
      city: undefined,
      district: undefined,
      metro: undefined,
      searchQuery: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      amenities: [],
    });
  };

  const activeFiltersCount = () => {
    let count = 0;
    if (values.bedrooms.length > 0) count++;
    if (values.minPrice || values.maxPrice) count++;
    if (values.city) count++;
    if (values.district) count++;
    if (values.metro) count++;
    if (values.amenities && values.amenities.length > 0) count++;
    if (values.minArea || values.maxArea) count++;
    if (values.minFloor || values.maxFloor) count++;
    if (values.buildingClass) count++;
    return count;
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      {/* Main Filter Bar */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Listing Type Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleListingTypeChange('SALE')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                values.listingType === 'SALE'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('buy')}
            </button>
            <button
              onClick={() => handleListingTypeChange('RENT_LONG')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                values.listingType === 'RENT_LONG'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('rentLong')}
            </button>
            <button
              onClick={() => handleListingTypeChange('RENT_DAILY')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                values.listingType === 'RENT_DAILY'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('rentDaily')}
            </button>
          </div>

          {/* Property Type Dropdown */}
          <div className="relative">
            <button
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:border-gray-400 bg-white text-sm"
              onClick={() => setShowRegionDropdown(!showRegionDropdown)}
            >
              <span>
                {values.propertyType === 'NEW_BUILDING'
                  ? t('newBuilding')
                  : values.propertyType === 'SECONDARY'
                    ? t('secondary')
                    : t('allTypes')}
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>
            {showRegionDropdown && (
              <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px] z-50">
                <button
                  onClick={() => {
                    handlePropertyTypeChange('ALL');
                    setShowRegionDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                >
                  {t('allTypes')}
                </button>
                <button
                  onClick={() => {
                    handlePropertyTypeChange('NEW_BUILDING');
                    setShowRegionDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                >
                  {t('newBuilding')}
                </button>
                <button
                  onClick={() => {
                    handlePropertyTypeChange('SECONDARY');
                    setShowRegionDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                >
                  {t('secondary')}
                </button>
              </div>
            )}
          </div>

          {/* Number of Rooms */}
          <div className="relative">
            <button
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:border-gray-400 bg-white text-sm"
              onClick={() => setShowMoreFilters(!showMoreFilters)}
            >
              <span>
                {values.bedrooms.length === 0
                  ? t('rooms')
                  : values.bedrooms.length === 1
                    ? `${values.bedrooms[0]} ${t('room')}`
                    : `${values.bedrooms.length} ${t('selected')}`}
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>
            {showMoreFilters && (
              <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[250px] z-50">
                <div className="space-y-2">
                  {[
                    { value: 0, label: t('studio') },
                    { value: 1, label: `1-${t('room')}` },
                    { value: 2, label: `2-${t('room')}` },
                    { value: 3, label: `3-${t('room')}` },
                    { value: 4, label: `4-${t('room')}` },
                    { value: 5, label: `5+-${t('room')}` },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={values.bedrooms.includes(option.value)}
                        onChange={() => toggleBedroom(option.value)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Price Range */}
          <div className="relative">
            <button
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:border-gray-400 bg-white text-sm"
              onClick={() => setShowPriceDropdown(!showPriceDropdown)}
            >
              <span>
                {values.minPrice || values.maxPrice
                  ? `${values.minPrice ? `$${values.minPrice.toLocaleString()}` : ''} - ${values.maxPrice ? `$${values.maxPrice.toLocaleString()}` : ''}`
                  : t('price')}
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>
            {showPriceDropdown && (
              <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[300px] z-50">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      {t('from')}
                    </label>
                    <input
                      type="number"
                      value={values.minPrice || ''}
                      onChange={(e) =>
                        onChange({
                          ...values,
                          minPrice: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      {t('to')}
                    </label>
                    <input
                      type="number"
                      value={values.maxPrice || ''}
                      onChange={(e) =>
                        onChange({
                          ...values,
                          maxPrice: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      placeholder="∞"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <button
                    onClick={() => setShowPriceDropdown(false)}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    {t('apply')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* More Filters Button */}
          <button
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:border-gray-400 bg-white text-sm"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>{t('moreFilters')}</span>
            {activeFiltersCount() > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                {activeFiltersCount()}
              </span>
            )}
          </button>

          {/* Search Box */}
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={values.searchQuery || ''}
                onChange={(e) => onChange({ ...values, searchQuery: e.target.value })}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Location Filters */}
          <div className="flex items-center gap-2">
            {/* Region */}
            <div className="relative">
              <button
                className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                onClick={() => setShowRegionDropdown(!showRegionDropdown)}
              >
                {values.city || t('region')}
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* District */}
            <div className="relative">
              <button
                className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                onClick={() => setShowDistrictDropdown(!showDistrictDropdown)}
              >
                {values.district || t('district')}
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* Metro */}
            <div className="relative">
              <button
                className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                onClick={() => setShowMetroDropdown(!showMetroDropdown)}
              >
                {values.metro || t('metro')}
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Save Search Button */}
          {isAuthenticated && onSaveSearch && (
            <button
              onClick={onSaveSearch}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium"
            >
              <Heart className="h-4 w-4" />
              <span>{t('saveSearch')}</span>
            </button>
          )}

          {/* Clear Filters */}
          {activeFiltersCount() > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <X className="h-4 w-4" />
              {t('clear')}
            </button>
          )}
        </div>
      </div>

      {/* Active Filters Pills */}
      {(values.bedrooms.length > 0 || values.minPrice || values.maxPrice || (values.propertyType && values.propertyType !== 'ALL')) && (
        <div className="container mx-auto px-4 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {values.bedrooms.map((bedroom) => (
              <span
                key={bedroom}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
              >
                {bedroom === 0 ? t('studio') : `${bedroom}-${t('room')}`}
                <button
                  onClick={() => toggleBedroom(bedroom)}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {values.propertyType && values.propertyType !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {values.propertyType === 'NEW_BUILDING' ? t('newBuilding') : t('secondary')}
                <button
                  onClick={() => onChange({ ...values, propertyType: 'ALL' })}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {(values.minPrice || values.maxPrice) && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                ${values.minPrice?.toLocaleString() || '0'} - $
                {values.maxPrice?.toLocaleString() || '∞'}
                <button
                  onClick={() =>
                    onChange({ ...values, minPrice: undefined, maxPrice: undefined })
                  }
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
