'use client';

import * as React from 'react';
import { cn } from '../utils/cn';
import { Card, CardContent } from '../primitives/card';

export interface PropertyCardProps {
  id?: string;
  title: string;
  price: number;
  priceLabel?: string;
  propertyType?: string;
  listingType: string;
  city?: string;
  district?: string;
  address?: string;
  area?: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  floor?: number;
  totalFloors?: number;
  imageUrl?: string;
  featured?: boolean;
  verified?: boolean;
  rating?: number;
  reviewCount?: number;
  href?: string;
  onClick?: () => void;
  className?: string;
}

function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)}M`;
  }
  if (price >= 1000) {
    return `${(price / 1000).toFixed(0)}K`;
  }
  return price.toString();
}

function getListingTypeLabel(type: string): string {
  switch (type) {
    case 'SALE':
      return '';
    case 'RENT_LONG':
      return '/мес';
    case 'RENT_DAILY':
      return '/сутки';
    default:
      return '';
  }
}

function getListingTypeBadge(type: string): { label: string; color: string } {
  switch (type) {
    case 'SALE':
      return { label: 'Продажа', color: 'bg-green-500' };
    case 'RENT_LONG':
      return { label: 'Аренда', color: 'bg-blue-500' };
    case 'RENT_DAILY':
      return { label: 'Посуточно', color: 'bg-purple-500' };
    default:
      return { label: type, color: 'bg-gray-500' };
  }
}

function getPropertyTypeLabel(type: string): string {
  switch (type) {
    case 'APARTMENT':
      return 'Квартира';
    case 'HOUSE':
      return 'Дом';
    case 'CONDO':
      return 'Кондо';
    case 'TOWNHOUSE':
      return 'Таунхаус';
    case 'LAND':
      return 'Участок';
    case 'COMMERCIAL':
      return 'Коммерция';
    default:
      return type;
  }
}

export function PropertyCard({
  title,
  price,
  priceLabel,
  propertyType,
  listingType,
  city,
  district,
  address,
  area,
  rooms,
  bedrooms,
  bathrooms: _bathrooms,
  floor,
  totalFloors,
  imageUrl,
  featured,
  verified,
  rating,
  reviewCount: _reviewCount,
  href,
  onClick,
  className,
}: PropertyCardProps) {
  const [imageError, setImageError] = React.useState(false);
  const displayRooms = rooms || bedrooms;
  const displayLocation = address || (city ? (district ? `${city}, ${district}` : city) : '');
  const CardWrapper = href ? 'a' : 'div';
  const wrapperProps = href ? { href } : { onClick };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all hover:shadow-lg cursor-pointer group',
        featured && 'ring-2 ring-yellow-400',
        className,
      )}
    >
      <CardWrapper {...wrapperProps} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={title}
              className="object-cover w-full h-full transition-transform group-hover:scale-105"
              onError={handleImageError}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
              <svg
                className="w-16 h-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 22V12h6v10"
                />
              </svg>
            </div>
          )}

          <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
            {(() => {
              const badge = getListingTypeBadge(listingType);
              return (
                <span className={cn("px-2 py-0.5 text-xs font-semibold text-white rounded shadow-sm", badge.color)}>
                  {badge.label}
                </span>
              );
            })()}
            {featured && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-yellow-400 text-yellow-900 rounded shadow-sm">
                TOP
              </span>
            )}
            {verified && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-green-500 text-white rounded shadow-sm">
                ✓
              </span>
            )}
          </div>

          <div className="absolute bottom-2 right-2 flex gap-1">
            {rating !== undefined && rating > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-yellow-400 text-yellow-900 rounded flex items-center gap-1">
                <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {rating.toFixed(1)}
              </span>
            )}
            {propertyType && (
              <span className="px-2 py-1 text-xs font-medium bg-black/70 text-white rounded">
                {getPropertyTypeLabel(propertyType)}
              </span>
            )}
          </div>
        </div>

        <CardContent className="p-4">
          {/* Price - Large and prominent with better contrast */}
          <div className="mb-2">
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
              {formatPrice(price)} у.е.
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 ml-1">
                {priceLabel || getListingTypeLabel(listingType)}
              </span>
            </div>
            {area && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {Math.round(price / area).toLocaleString()} у.е./м²
              </div>
            )}
          </div>

          {/* Title - Compact */}
          <h3 className="font-semibold text-sm line-clamp-1 mb-2 text-gray-800 dark:text-gray-200">{title}</h3>

          {/* Location + Details - Inline with bullet separators for better scannability */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {displayLocation && (
              <>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{displayLocation}</span>
                </div>
                {(displayRooms || area || (floor && totalFloors)) && <span>•</span>}
              </>
            )}
            {displayRooms && (
              <>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>{displayRooms} комн.</span>
                </div>
                {(area || (floor && totalFloors)) && <span>•</span>}
              </>
            )}
            {area && (
              <>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  <span>{area} м²</span>
                </div>
                {floor && totalFloors && <span>•</span>}
              </>
            )}
            {floor && totalFloors && (
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
                </svg>
                <span>{floor}/{totalFloors} эт.</span>
              </div>
            )}
          </div>
        </CardContent>
      </CardWrapper>
    </Card>
  );
}
