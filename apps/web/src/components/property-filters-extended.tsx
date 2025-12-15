'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Heart, SlidersHorizontal, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@repo/ui';

// City name mapping: Russian (UI) -> English (Database)
const CITY_NAME_MAP: Record<string, string> = {
  'Ташкент': 'Tashkent',
  'Самарканд': 'Samarkand',
  'Бухара': 'Bukhara',
  'Андижан': 'Andijan',
  'Фергана': 'Fergana',
  'Навои': 'Navoiy',
  'Наманган': 'Namangan',
  'Карши': 'Karshi',
  'Термез': 'Termez',
};

// Reverse mapping: English (Database) -> Russian (UI)
const REVERSE_CITY_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(CITY_NAME_MAP).map(([ru, en]) => [en, ru])
);

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
  const [showPropertyTypeDropdown, setShowPropertyTypeDropdown] = useState(false);
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [showMetroDropdown, setShowMetroDropdown] = useState(false);

  // Mobile-specific modal states (Cian-style individual modals)
  const [showMobilePropertyTypeModal, setShowMobilePropertyTypeModal] = useState(false);
  const [showMobileRoomsModal, setShowMobileRoomsModal] = useState(false);
  const [showMobilePriceModal, setShowMobilePriceModal] = useState(false);
  const [showMobileRegionModal, setShowMobileRegionModal] = useState(false);

  // Helper function to close all dropdowns
  const closeAllDropdowns = () => {
    // Note: Don't close showMoreFilters - mobile modal should only close via X or Apply button
    setShowPriceDropdown(false);
    setShowPropertyTypeDropdown(false);
    setShowRegionDropdown(false);
    setShowDistrictDropdown(false);
    setShowMetroDropdown(false);
  };

  // Local state for bedrooms to handle rapid clicks without race conditions
  const [localBedrooms, setLocalBedrooms] = useState<number[]>(values.bedrooms || []);

  // Refs for click-outside detection
  const bedroomsRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const propertyTypeRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const districtRef = useRef<HTMLDivElement>(null);
  const metroRef = useRef<HTMLDivElement>(null);

  // Sync local state with props only when values actually differ (deep comparison)
  // Use ref to track previous values to prevent unnecessary updates
  const prevBedroomsRef = useRef<number[]>([]);

  useEffect(() => {
    const currentBedrooms = values.bedrooms || [];
    const prevBedrooms = prevBedroomsRef.current;

    // Only update if values actually changed (deep comparison)
    const hasChanged = currentBedrooms.length !== prevBedrooms.length ||
      currentBedrooms.some(b => !prevBedrooms.includes(b)) ||
      prevBedrooms.some(b => !currentBedrooms.includes(b));

    if (hasChanged) {
      setLocalBedrooms(currentBedrooms);
      prevBedroomsRef.current = currentBedrooms;
    }
  }, [values.bedrooms]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Note: Don't close showMoreFilters here - mobile modal should only close via X or Apply button
      if (priceRef.current && !priceRef.current.contains(event.target as Node)) {
        setShowPriceDropdown(false);
      }
      if (propertyTypeRef.current && !propertyTypeRef.current.contains(event.target as Node)) {
        setShowPropertyTypeDropdown(false);
      }
      if (regionRef.current && !regionRef.current.contains(event.target as Node)) {
        setShowRegionDropdown(false);
      }
      if (districtRef.current && !districtRef.current.contains(event.target as Node)) {
        setShowDistrictDropdown(false);
      }
      if (metroRef.current && !metroRef.current.contains(event.target as Node)) {
        setShowMetroDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleListingTypeChange = (type: 'SALE' | 'RENT_LONG' | 'RENT_DAILY') => {
    onChange({ ...values, listingType: type });
  };

  const handlePropertyTypeChange = (type: 'NEW_BUILDING' | 'SECONDARY' | 'ALL') => {
    onChange({ ...values, propertyType: type });
  };

  const toggleBedroom = (count: number) => {
    // Use functional setState to get the latest state on rapid clicks
    setLocalBedrooms((prev) => {
      const bedrooms = prev.includes(count)
        ? prev.filter((b) => b !== count)
        : [...prev, count];
      // Call onChange with the new bedrooms array
      onChange({ ...values, bedrooms });
      return bedrooms;
    });
  };

  const clearFilters = () => {
    setLocalBedrooms([]); // Reset local state
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
    if (localBedrooms.length > 0) count++;
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
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          {/* Listing Type Tabs - Enhanced mobile UX */}
          <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
            <button
              onClick={() => handleListingTypeChange('SALE')}
              className={`flex-1 sm:flex-none px-4 sm:px-5 py-3 min-h-[44px] rounded-md text-sm sm:text-base font-medium transition-colors ${
                values.listingType === 'SALE'
                  ? 'bg-white text-blue-600 shadow-sm font-bold border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('buy')}
            </button>
            <button
              onClick={() => handleListingTypeChange('RENT_LONG')}
              className={`flex-1 sm:flex-none px-4 sm:px-5 py-3 min-h-[44px] rounded-md text-sm sm:text-base font-medium transition-colors ${
                values.listingType === 'RENT_LONG'
                  ? 'bg-white text-blue-600 shadow-sm font-bold border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('rentLong')}
            </button>
            <button
              onClick={() => handleListingTypeChange('RENT_DAILY')}
              className={`flex-1 sm:flex-none px-4 sm:px-5 py-3 min-h-[44px] rounded-md text-sm sm:text-base font-medium transition-colors ${
                values.listingType === 'RENT_DAILY'
                  ? 'bg-white text-blue-600 shadow-sm font-bold border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('rentDaily')}
            </button>
          </div>

          {/* Mobile: Horizontal Scrollable Filter Chips (Cian-style) */}
          <div className="w-full md:hidden">
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {/* Property Type Chip */}
              <button
                onClick={() => setShowMobilePropertyTypeModal(true)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full border-2 font-medium text-sm transition-all ${
                  values.propertyType && values.propertyType !== 'ALL'
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-300 bg-white text-gray-700'
                }`}
              >
                <span>
                  {values.propertyType === 'NEW_BUILDING'
                    ? t('newBuilding')
                    : values.propertyType === 'SECONDARY'
                      ? t('secondary')
                      : t('propertyType')}
                </span>
                {values.propertyType && values.propertyType !== 'ALL' && (
                  <X
                    className="h-4 w-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange({ ...values, propertyType: 'ALL' });
                    }}
                  />
                )}
                {(!values.propertyType || values.propertyType === 'ALL') && (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {/* Rooms Chip */}
              <button
                onClick={() => setShowMobileRoomsModal(true)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full border-2 font-medium text-sm transition-all ${
                  localBedrooms.length > 0
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-300 bg-white text-gray-700'
                }`}
              >
                <span>
                  {localBedrooms.length === 0
                    ? t('rooms')
                    : localBedrooms.length === 1
                      ? `${localBedrooms[0] === 0 ? t('studio') : localBedrooms[0]}`
                      : `${localBedrooms.length} комн.`}
                </span>
                {localBedrooms.length > 0 && (
                  <X
                    className="h-4 w-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocalBedrooms([]);
                      onChange({ ...values, bedrooms: [] });
                    }}
                  />
                )}
                {localBedrooms.length === 0 && <ChevronDown className="h-4 w-4" />}
              </button>

              {/* Price Chip */}
              <button
                onClick={() => setShowMobilePriceModal(true)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full border-2 font-medium text-sm transition-all ${
                  values.minPrice || values.maxPrice
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-300 bg-white text-gray-700'
                }`}
              >
                <span className="whitespace-nowrap">
                  {values.minPrice || values.maxPrice
                    ? `${values.minPrice ? `$${(values.minPrice / 1000).toFixed(0)}k` : '0'} - ${values.maxPrice ? `$${(values.maxPrice / 1000).toFixed(0)}k` : '∞'}`
                    : t('price')}
                </span>
                {(values.minPrice || values.maxPrice) && (
                  <X
                    className="h-4 w-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange({ ...values, minPrice: undefined, maxPrice: undefined });
                    }}
                  />
                )}
                {!values.minPrice && !values.maxPrice && <ChevronDown className="h-4 w-4" />}
              </button>

              {/* Region Chip */}
              <button
                onClick={() => setShowMobileRegionModal(true)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full border-2 font-medium text-sm transition-all ${
                  values.city
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-300 bg-white text-gray-700'
                }`}
              >
                <span>
                  {values.city ? (REVERSE_CITY_MAP[values.city] || values.city) : t('region')}
                </span>
                {values.city && (
                  <X
                    className="h-4 w-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange({ ...values, city: undefined, district: undefined, metro: undefined });
                    }}
                  />
                )}
                {!values.city && <ChevronDown className="h-4 w-4" />}
              </button>

              {/* Clear All (only show if filters active) */}
              {activeFiltersCount() > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full border-2 border-red-300 bg-white text-red-600 font-medium text-sm"
                >
                  <X className="h-4 w-4" />
                  <span>Очистить</span>
                </button>
              )}
            </div>
          </div>

          {/* Property Type Dropdown - Hidden on mobile, shown in More Filters */}
          <div ref={propertyTypeRef} className="relative hidden sm:block">
            <button
              className="flex items-center gap-2 px-4 md:px-5 py-3 min-h-[44px] border border-gray-300 rounded-lg hover:border-gray-400 bg-white text-sm md:text-base"
              onClick={() => {
                closeAllDropdowns();
                setShowPropertyTypeDropdown(!showPropertyTypeDropdown);
              }}
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
            {showPropertyTypeDropdown && (
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

          {/* Number of Rooms - Hidden on mobile */}
          <div ref={bedroomsRef} className="relative hidden md:block">
            <button
              className="flex items-center gap-2 px-4 md:px-5 py-3 min-h-[44px] border border-gray-300 rounded-lg hover:border-gray-400 bg-white text-sm md:text-base"
              onClick={() => {
                closeAllDropdowns();
                setShowMoreFilters(!showMoreFilters);
              }}
            >
              <span>
                {localBedrooms.length === 0
                  ? t('rooms')
                  : localBedrooms.length === 1
                    ? `${localBedrooms[0]} ${t('room')}`
                    : `${localBedrooms.length} ${t('selected')}`}
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
                        checked={localBedrooms.includes(option.value)}
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

          {/* Price Range - Hidden on mobile */}
          <div ref={priceRef} className="relative hidden md:block">
            <button
              className="flex items-center gap-2 px-4 md:px-5 py-3 min-h-[44px] border border-gray-300 rounded-lg hover:border-gray-400 bg-white text-sm md:text-base"
              onClick={() => {
                closeAllDropdowns();
                setShowPriceDropdown(!showPriceDropdown);
              }}
            >
              <span className="whitespace-nowrap">
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

          {/* Desktop: More Filters Button */}
          <button
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className="hidden md:flex items-center gap-2 px-4 md:px-5 py-3 min-h-[44px] border-2 border-blue-600 rounded-lg hover:bg-blue-50 bg-white text-sm md:text-base font-medium text-blue-600"
          >
            <SlidersHorizontal className="h-5 w-5" />
            <span>{t('moreFilters')}</span>
            {activeFiltersCount() > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                {activeFiltersCount()}
              </span>
            )}
          </button>

          {/* Search Box - Shorter placeholder on mobile */}
          <div className="flex-1 min-w-[200px] md:min-w-[300px] hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
              <input
                type="text"
                value={values.searchQuery || ''}
                onChange={(e) => onChange({ ...values, searchQuery: e.target.value })}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-10 pr-4 py-3 min-h-[44px] border border-gray-300 rounded-lg text-sm md:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Location Filters - Hidden on mobile */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Region */}
            <div ref={regionRef} className="relative">
              <button
                className="flex items-center gap-1 px-4 py-3 min-h-[44px] text-sm md:text-base text-blue-600 hover:text-blue-700 font-medium"
                onClick={() => {
                  closeAllDropdowns();
                  setShowRegionDropdown(!showRegionDropdown);
                }}
              >
                {values.city ? (REVERSE_CITY_MAP[values.city] || values.city) : t('region')}
                <ChevronDown className="h-4 w-4" />
              </button>
              {showRegionDropdown && (
                <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px] z-50">
                  {['Ташкент', 'Самарканд', 'Бухара', 'Андижан', 'Фергана', 'Навои', 'Наманган', 'Карши', 'Термез'].map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        const englishCity = CITY_NAME_MAP[city] || city;
                        onChange({ ...values, city: englishCity, district: undefined, metro: undefined });
                        setShowRegionDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm ${values.city === (CITY_NAME_MAP[city] || city) ? 'bg-blue-50 text-blue-600' : ''}`}
                    >
                      {city}
                    </button>
                  ))}
                  {values.city && (
                    <button
                      onClick={() => {
                        onChange({ ...values, city: undefined, district: undefined, metro: undefined });
                        setShowRegionDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm text-red-600 border-t mt-1"
                    >
                      Сбросить
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* District */}
            <div ref={districtRef} className="relative">
              <button
                className="flex items-center gap-1 px-4 py-3 min-h-[44px] text-sm md:text-base text-blue-600 hover:text-blue-700 font-medium"
                onClick={() => {
                  closeAllDropdowns();
                  setShowDistrictDropdown(!showDistrictDropdown);
                }}
              >
                {values.district || t('district')}
                <ChevronDown className="h-4 w-4" />
              </button>
              {showDistrictDropdown && (
                <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px] z-50">
                  {values.city === 'Ташкент' ? (
                    ['Юнусабад', 'Чиланзар', 'Сергели', 'Мирзо-Улугбек', 'Яккасарай', 'Алмазар', 'Шайхантахур', 'Учтепа', 'Бектемир', 'Мирабад', 'Яшнабад'].map((district) => (
                      <button
                        key={district}
                        onClick={() => {
                          onChange({ ...values, district });
                          setShowDistrictDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm ${values.district === district ? 'bg-blue-50 text-blue-600' : ''}`}
                      >
                        {district}
                      </button>
                    ))
                  ) : values.city ? (
                    <div className="px-3 py-2 text-sm text-gray-500">Районы доступны только для Ташкента</div>
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">Сначала выберите город</div>
                  )}
                  {values.district && (
                    <button
                      onClick={() => {
                        onChange({ ...values, district: undefined });
                        setShowDistrictDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm text-red-600 border-t mt-1"
                    >
                      Сбросить
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Metro */}
            <div ref={metroRef} className="relative">
              <button
                className="flex items-center gap-1 px-4 py-3 min-h-[44px] text-sm md:text-base text-blue-600 hover:text-blue-700 font-medium"
                onClick={() => {
                  closeAllDropdowns();
                  setShowMetroDropdown(!showMetroDropdown);
                }}
              >
                {values.metro || t('metro')}
                <ChevronDown className="h-4 w-4" />
              </button>
              {showMetroDropdown && (
                <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px] z-50 max-h-[400px] overflow-y-auto">
                  {values.city === 'Ташкент' ? (
                    ['Алайский базар', 'Амир Темур', 'Буюк Ипак Йули', 'Чиланзар', 'Космонавтов', 'Минг Урик', 'Мустакиллик Майдони', 'Новза', 'Олмазор', 'Паксу', 'Пушкин', 'Сергели', 'Ташкент', 'Тинчлик', 'Хамид Алимжан', 'Юнус Раджаби'].map((station) => (
                      <button
                        key={station}
                        onClick={() => {
                          onChange({ ...values, metro: station });
                          setShowMetroDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm ${values.metro === station ? 'bg-blue-50 text-blue-600' : ''}`}
                      >
                        {station}
                      </button>
                    ))
                  ) : values.city ? (
                    <div className="px-3 py-2 text-sm text-gray-500">Метро только в Ташкенте</div>
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">Сначала выберите город</div>
                  )}
                  {values.metro && (
                    <button
                      onClick={() => {
                        onChange({ ...values, metro: undefined });
                        setShowMetroDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm text-red-600 border-t mt-1"
                    >
                      Сбросить
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Save Search Button - Hidden on small mobile */}
          {isAuthenticated && onSaveSearch && (
            <button
              onClick={onSaveSearch}
              className="hidden sm:flex items-center gap-2 px-4 md:px-5 py-3 min-h-[44px] text-blue-600 hover:bg-blue-50 rounded-lg text-sm md:text-base font-medium"
            >
              <Heart className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden md:inline">{t('saveSearch')}</span>
            </button>
          )}

          {/* Clear Filters - Improved touch target */}
          {activeFiltersCount() > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 md:px-4 py-3 min-h-[44px] text-sm md:text-base text-gray-600 hover:text-gray-900 font-medium"
            >
              <X className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">{t('clear')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Filters Pills */}
      {(localBedrooms.length > 0 || values.minPrice || values.maxPrice || (values.propertyType && values.propertyType !== 'ALL')) && (
        <div className="container mx-auto px-4 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {localBedrooms.map((bedroom) => (
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

      {/* Mobile Bottom Sheet Modal */}
      {showMoreFilters && (
        <>
          {/* Backdrop - No click handler to prevent accidental closes */}
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden pointer-events-none" />

          {/* Bottom Sheet */}
          <div
            className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto md:hidden animate-slide-up pointer-events-auto"
          >
            {/* Swipe Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{t('filters')}</h3>
              <button
                onClick={() => setShowMoreFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Filter Content */}
            <div className="px-4 py-4 space-y-5">
              {/* Region */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📍 {t('region')}
                </label>
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowRegionDropdown(!showRegionDropdown);
                      setShowDistrictDropdown(false);
                      setShowMetroDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg hover:border-gray-400 flex items-center justify-between"
                  >
                    <span className={values.city ? 'text-gray-900' : 'text-gray-500'}>
                      {values.city ? (REVERSE_CITY_MAP[values.city] || values.city) : t('selectCity')}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  </button>
                  {showRegionDropdown && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-[60] max-h-[300px] overflow-y-auto">
                      {['Ташкент', 'Самарканд', 'Бухара', 'Андижан', 'Фергана', 'Навои', 'Наманган', 'Карши', 'Термез'].map((city) => (
                        <button
                          key={city}
                          onClick={() => {
                            const englishCity = CITY_NAME_MAP[city] || city;
                            onChange({ ...values, city: englishCity, district: undefined, metro: undefined });
                            setShowRegionDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm ${values.city === (CITY_NAME_MAP[city] || city) ? 'bg-blue-50 text-blue-600 font-medium' : ''}`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* District */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🏘️ {t('district')}
                </label>
                <div className="relative">
                  <button
                    onClick={() => {
                      if (!values.city) return;
                      setShowDistrictDropdown(!showDistrictDropdown);
                      setShowRegionDropdown(false);
                      setShowMetroDropdown(false);
                    }}
                    disabled={!values.city}
                    className={`w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg hover:border-gray-400 flex items-center justify-between ${!values.city ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className={values.district ? 'text-gray-900' : 'text-gray-500'}>
                      {values.district || t('selectDistrict')}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  </button>
                  {showDistrictDropdown && values.city === 'Tashkent' && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-[60] max-h-[300px] overflow-y-auto">
                      {['Юнусабад', 'Чиланзар', 'Сергели', 'Мирзо-Улугбек', 'Яшнабад', 'Алмазар', 'Шайхантахур', 'Яккасарай', 'Бектемир', 'Учтепа', 'Мирабад'].map((district) => (
                        <button
                          key={district}
                          onClick={() => {
                            onChange({ ...values, district });
                            setShowDistrictDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm ${values.district === district ? 'bg-blue-50 text-blue-600 font-medium' : ''}`}
                        >
                          {district}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {!values.city && (
                  <p className="text-xs text-gray-500 mt-1">Сначала выберите город</p>
                )}
              </div>

              {/* Metro */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🚇 {t('metro')}
                </label>
                <div className="relative">
                  <button
                    onClick={() => {
                      if (values.city !== 'Tashkent') return;
                      setShowMetroDropdown(!showMetroDropdown);
                      setShowRegionDropdown(false);
                      setShowDistrictDropdown(false);
                    }}
                    disabled={values.city !== 'Tashkent'}
                    className={`w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg hover:border-gray-400 flex items-center justify-between ${values.city !== 'Tashkent' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className={values.metro ? 'text-gray-900' : 'text-gray-500'}>
                      {values.metro || t('selectStation')}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  </button>
                  {showMetroDropdown && values.city === 'Tashkent' && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-[60] max-h-[300px] overflow-y-auto">
                      {['Алайский базар', 'Амир Темур', 'Буюк Ипак Йули', 'Чиланзар', 'Космонавтов', 'Минг Урик', 'Мустакиллик Майдони', 'Новза', 'Олмазор', 'Паксу', 'Пушкин', 'Сергели', 'Ташкент', 'Тинчлик', 'Хамид Алимжан', 'Юнус Раджаби'].map((station) => (
                        <button
                          key={station}
                          onClick={() => {
                            onChange({ ...values, metro: station });
                            setShowMetroDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm ${values.metro === station ? 'bg-blue-50 text-blue-600 font-medium' : ''}`}
                        >
                          {station}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {values.city !== 'Tashkent' && (
                  <p className="text-xs text-gray-500 mt-1">
                    {values.city ? 'Метро только в Ташкенте' : 'Сначала выберите Ташкент'}
                  </p>
                )}
              </div>

              {/* Bedrooms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🛏️ {t('rooms')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 0, label: t('studio') },
                    { value: 1, label: '1' },
                    { value: 2, label: '2' },
                    { value: 3, label: '3' },
                    { value: 4, label: '4' },
                    { value: 5, label: '5+' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => toggleBedroom(option.value)}
                      className={`flex-1 min-w-[60px] px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        localBedrooms.includes(option.value)
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💰 {t('priceRange')}
                </label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder={t('from')}
                      value={values.minPrice || ''}
                      onChange={(e) =>
                        onChange({
                          ...values,
                          minPrice: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder={t('to')}
                      value={values.maxPrice || ''}
                      onChange={(e) =>
                        onChange({
                          ...values,
                          maxPrice: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Property Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🏢 {t('propertyType')}
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'ALL', label: t('all') },
                    { value: 'NEW_BUILDING', label: t('newBuilding') },
                    { value: 'SECONDARY', label: t('secondary') },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        onChange({
                          ...values,
                          propertyType: option.value as 'NEW_BUILDING' | 'SECONDARY' | 'ALL',
                        })
                      }
                      className={`flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        values.propertyType === option.value
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔍 {t('search')}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={values.searchQuery || ''}
                    onChange={(e) => onChange({ ...values, searchQuery: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-4 flex gap-3">
              <button
                onClick={clearFilters}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                {t('reset')}
              </button>
              <button
                onClick={() => setShowMoreFilters(false)}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                {t('apply')} {activeFiltersCount() > 0 && `(${activeFiltersCount()})`}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Mobile Individual Modals (Cian-style) */}

      {/* Property Type Modal */}
      {showMobilePropertyTypeModal && (
        <div className="fixed inset-0 bg-white z-50 md:hidden">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{t('propertyType')}</h2>
              <button
                onClick={() => setShowMobilePropertyTypeModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
              {/* Section: All */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Все типы</h3>
                <label className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer">
                  <span className="text-base text-gray-900">{t('all')}</span>
                  <input
                    type="radio"
                    name="propertyType"
                    checked={values.propertyType === 'ALL'}
                    onChange={() => onChange({ ...values, propertyType: 'ALL' })}
                    className="w-5 h-5 text-blue-600"
                  />
                </label>
              </div>

              {/* Section: Property Types */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Квартиры</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer">
                    <span className="text-base text-gray-900">{t('newBuilding')}</span>
                    <input
                      type="radio"
                      name="propertyType"
                      checked={values.propertyType === 'NEW_BUILDING'}
                      onChange={() => onChange({ ...values, propertyType: 'NEW_BUILDING' })}
                      className="w-5 h-5 text-blue-600"
                    />
                  </label>
                  <label className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer">
                    <span className="text-base text-gray-900">{t('secondary')}</span>
                    <input
                      type="radio"
                      name="propertyType"
                      checked={values.propertyType === 'SECONDARY'}
                      onChange={() => onChange({ ...values, propertyType: 'SECONDARY' })}
                      className="w-5 h-5 text-blue-600"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Apply Button - Fixed at bottom with safe area */}
            <div className="mt-auto border-t border-gray-200 p-4 pb-20 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
              <button
                onClick={() => setShowMobilePropertyTypeModal(false)}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 active:bg-blue-800 shadow-lg"
              >
                Применить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rooms Modal */}
      {showMobileRoomsModal && (
        <div className="fixed inset-0 bg-white z-50 md:hidden">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{t('rooms')}</h2>
              <button
                onClick={() => setShowMobileRoomsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 0, label: t('studio') },
                  { value: 1, label: '1' },
                  { value: 2, label: '2' },
                  { value: 3, label: '3' },
                  { value: 4, label: '4' },
                  { value: 5, label: '5+' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleBedroom(option.value)}
                    className={`p-6 rounded-lg border-2 text-lg font-semibold transition-all ${
                      localBedrooms.includes(option.value)
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Apply Button - Fixed at bottom with safe area */}
            <div className="mt-auto border-t border-gray-200 p-4 pb-20 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
              <button
                onClick={() => setShowMobileRoomsModal(false)}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 active:bg-blue-800 shadow-lg"
              >
                Применить {localBedrooms.length > 0 && `(${localBedrooms.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price Modal */}
      {showMobilePriceModal && (
        <div className="fixed inset-0 bg-white z-50 md:hidden">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{t('priceRange')}</h2>
              <button
                onClick={() => setShowMobilePriceModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-3">
                  Цена от ($)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={values.minPrice || ''}
                  onChange={(e) =>
                    onChange({
                      ...values,
                      minPrice: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-base font-medium text-gray-700 mb-3">
                  Цена до ($)
                </label>
                <input
                  type="number"
                  placeholder="∞"
                  value={values.maxPrice || ''}
                  onChange={(e) =>
                    onChange({
                      ...values,
                      maxPrice: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Quick Price Ranges */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Быстрый выбор</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'До $50k', min: 0, max: 50000 },
                    { label: '$50k - $100k', min: 50000, max: 100000 },
                    { label: '$100k - $200k', min: 100000, max: 200000 },
                    { label: 'Более $200k', min: 200000, max: undefined },
                  ].map((range) => (
                    <button
                      key={range.label}
                      onClick={() =>
                        onChange({
                          ...values,
                          minPrice: range.min,
                          maxPrice: range.max,
                        })
                      }
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        values.minPrice === range.min && values.maxPrice === range.max
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Apply Button - Fixed at bottom with safe area */}
            <div className="mt-auto border-t border-gray-200 p-4 pb-20 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
              <button
                onClick={() => setShowMobilePriceModal(false)}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 active:bg-blue-800 shadow-lg"
              >
                Применить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Region Modal */}
      {showMobileRegionModal && (
        <div className="fixed inset-0 bg-white z-50 md:hidden">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Регион</h2>
              <button
                onClick={() => setShowMobileRegionModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
              {/* Cities */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Город</h3>
                <div className="space-y-2">
                  {['Ташкент', 'Самарканд', 'Бухара', 'Андижан', 'Фергана', 'Навои', 'Наманган', 'Карши', 'Термез'].map((city) => (
                    <label
                      key={city}
                      className={`flex items-center justify-between p-4 bg-white border-2 rounded-lg hover:border-blue-300 cursor-pointer ${
                        values.city === (CITY_NAME_MAP[city] || city)
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <span className={`text-base ${
                        values.city === (CITY_NAME_MAP[city] || city)
                          ? 'text-blue-600 font-semibold'
                          : 'text-gray-900'
                      }`}>
                        {city}
                      </span>
                      <input
                        type="radio"
                        name="city"
                        checked={values.city === (CITY_NAME_MAP[city] || city)}
                        onChange={() => {
                          const englishCity = CITY_NAME_MAP[city] || city;
                          onChange({ ...values, city: englishCity, district: undefined, metro: undefined });
                        }}
                        className="w-5 h-5 text-blue-600"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Districts (if Tashkent selected) */}
              {values.city === 'Tashkent' && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Район</h3>
                  <div className="space-y-2">
                    {['Юнусабад', 'Чиланзар', 'Сергели', 'Мирзо-Улугбек', 'Яшнабад', 'Алмазар', 'Шайхантахур', 'Яккасарай', 'Бектемир', 'Учтепа', 'Мирабад'].map((district) => (
                      <label
                        key={district}
                        className={`flex items-center justify-between p-4 bg-white border-2 rounded-lg hover:border-blue-300 cursor-pointer ${
                          values.district === district
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <span className={`text-base ${
                          values.district === district
                            ? 'text-blue-600 font-semibold'
                            : 'text-gray-900'
                        }`}>
                          {district}
                        </span>
                        <input
                          type="checkbox"
                          checked={values.district === district}
                          onChange={() => {
                            onChange({
                              ...values,
                              district: values.district === district ? undefined : district,
                            });
                          }}
                          className="w-5 h-5 text-blue-600 rounded"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Metro (if Tashkent selected) */}
              {values.city === 'Tashkent' && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Метро</h3>
                  <div className="space-y-2">
                    {['Алайский базар', 'Амир Темур', 'Буюк Ипак Йули', 'Чиланзар', 'Космонавтов', 'Минг Урик', 'Мустакиллик Майдони', 'Новза', 'Олмазор', 'Паксу', 'Пушкин', 'Сергели', 'Ташкент', 'Тинчлик', 'Хамид Алимжан', 'Юнус Раджаби'].map((station) => (
                      <label
                        key={station}
                        className={`flex items-center justify-between p-4 bg-white border-2 rounded-lg hover:border-blue-300 cursor-pointer ${
                          values.metro === station
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <span className={`text-base ${
                          values.metro === station
                            ? 'text-blue-600 font-semibold'
                            : 'text-gray-900'
                        }`}>
                          {station}
                        </span>
                        <input
                          type="checkbox"
                          checked={values.metro === station}
                          onChange={() => {
                            onChange({
                              ...values,
                              metro: values.metro === station ? undefined : station,
                            });
                          }}
                          className="w-5 h-5 text-blue-600 rounded"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Apply Button - Fixed at bottom with safe area */}
            <div className="mt-auto border-t border-gray-200 p-4 pb-20 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
              <button
                onClick={() => setShowMobileRegionModal(false)}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 active:bg-blue-800 shadow-lg"
              >
                Применить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
