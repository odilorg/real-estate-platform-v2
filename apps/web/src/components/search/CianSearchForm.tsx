'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { ChevronDown, MapPin, Map } from 'lucide-react';

export function CianSearchForm() {
  const t = useTranslations('home.search');
  const router = useRouter();

  const [dealType, setDealType] = useState<'RENT' | 'SALE'>('RENT');
  const [propertyType, setPropertyType] = useState<string>('APARTMENT');
  const [rooms, setRooms] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');
  const [location, setLocation] = useState<string>('');

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (dealType === 'RENT') {
      params.set('listingType', 'RENT_LONG');
    } else {
      params.set('listingType', 'SALE');
    }

    if (propertyType) params.set('propertyType', propertyType);
    if (rooms) params.set('bedrooms', rooms);
    if (priceMax) params.set('maxPrice', priceMax);
    if (location) params.set('search', location);

    router.push(`/properties?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-lg p-4 space-y-3">
      {/* Deal Type Selector */}
      <div className="relative">
        <button
          onClick={() => setDealType(dealType === 'RENT' ? 'SALE' : 'RENT')}
          className="w-auto px-4 py-2 bg-blue-50 text-blue-600 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-blue-100 transition-colors"
        >
          {dealType === 'RENT' ? t('rent') : t('buy')}
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {/* Property Type Dropdown */}
      <div className="relative">
        <select
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 text-sm appearance-none bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="APARTMENT">{t('propertyTypes.apartment')}</option>
          <option value="HOUSE">{t('propertyTypes.house')}</option>
          <option value="COMMERCIAL">{t('propertyTypes.commercial')}</option>
          <option value="LAND">{t('propertyTypes.land')}</option>
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Rooms + Price Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <select
            value={rooms}
            onChange={(e) => setRooms(e.target.value)}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg text-gray-800 text-sm appearance-none bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('rooms')}</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4+</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder={t('priceTo')}
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value.replace(/\D/g, ''))}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">₽</span>
        </div>
      </div>

      {/* Location Search */}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder={t('location')}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            const params = new URLSearchParams();
            params.set('view', 'map');

            if (dealType === 'RENT') {
              params.set('listingType', 'RENT_LONG');
            } else {
              params.set('listingType', 'SALE');
            }

            if (propertyType) params.set('propertyType', propertyType);
            if (rooms) params.set('bedrooms', rooms);
            if (priceMax) params.set('maxPrice', priceMax);
            if (location) params.set('search', location);

            const url = `/properties?${params.toString()}`;
            console.log('[CianSearchForm] Map button clicked, navigating to:', url);
            router.push(url);
          }}
          className="col-span-1 px-3 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg flex items-center justify-center gap-1 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <Map className="h-4 w-4" />
          <span className="hidden sm:inline">{t('onMap')}</span>
        </button>
        <button
          onClick={handleSearch}
          className="col-span-2 px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          {t('find')}
        </button>
      </div>
    </div>
  );
}
