'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { PropertyCard, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui';
import { AdvancedFilters, type AdvancedFilterValues } from '@/components';
import { Search, Plus, Loader2, User, LogOut, MapPin, ArrowUpDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface PropertyImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  listingType: 'SALE' | 'RENT_LONG' | 'RENT_DAILY';
  propertyType: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number;
  address: string;
  city: string;
  images: PropertyImage[];
  createdAt: string;
  averageRating?: number | null;
  reviewCount?: number;
  distance?: number;
}

interface SearchSuggestion {
  type: 'city' | 'district' | 'metro' | 'property';
  value: string;
  label: string;
  count?: number;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const defaultFilters: AdvancedFilterValues = {
  propertyTypes: [],
  listingTypes: [],
  amenities: [],
  buildingClasses: [],
  renovationTypes: [],
  parkingTypes: [],
};

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Сначала новые' },
  { value: 'createdAt:asc', label: 'Сначала старые' },
  { value: 'price:asc', label: 'Сначала дешевые' },
  { value: 'price:desc', label: 'Сначала дорогие' },
  { value: 'area:desc', label: 'По площади (убыв.)' },
  { value: 'area:asc', label: 'По площади (возр.)' },
  { value: 'rating:desc', label: 'По рейтингу' },
];

export default function PropertiesPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AdvancedFilterValues>(defaultFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt:desc');
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const fetchProperties = useCallback(async (page = currentPage) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      // Full-text search
      if (searchQuery) params.append('search', searchQuery);

      // Property types
      if (filters.propertyTypes.length > 0)
        params.append('propertyType', filters.propertyTypes.join(','));
      if (filters.listingTypes.length > 0)
        params.append('listingType', filters.listingTypes.join(','));

      // Price range
      if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());

      // Bedrooms
      if (filters.minBedrooms)
        params.append('minBedrooms', filters.minBedrooms.toString());
      if (filters.maxBedrooms)
        params.append('maxBedrooms', filters.maxBedrooms.toString());

      // Area
      if (filters.minArea) params.append('minArea', filters.minArea.toString());
      if (filters.maxArea) params.append('maxArea', filters.maxArea.toString());

      // Location
      if (filters.city) params.append('city', filters.city);
      if (filters.district) params.append('district', filters.district);

      // Geo-location search
      if (userLocation && searchRadius) {
        params.append('latitude', userLocation.lat.toString());
        params.append('longitude', userLocation.lng.toString());
        params.append('radius', searchRadius.toString());
      }

      // Floor
      if (filters.minFloor) params.append('minFloor', filters.minFloor.toString());
      if (filters.maxFloor) params.append('maxFloor', filters.maxFloor.toString());

      // Building filters
      if (filters.buildingClasses?.length > 0)
        params.append('buildingClass', filters.buildingClasses[0]);
      if (filters.renovationTypes?.length > 0)
        params.append('renovation', filters.renovationTypes[0]);
      if (filters.parkingTypes?.length > 0)
        params.append('parkingType', filters.parkingTypes[0]);

      // Year built
      if (filters.minYearBuilt) params.append('minYearBuilt', filters.minYearBuilt.toString());
      if (filters.maxYearBuilt) params.append('maxYearBuilt', filters.maxYearBuilt.toString());

      // Amenities
      if (filters.amenities.length > 0)
        params.append('amenities', filters.amenities.join(','));

      // Boolean features
      if (filters.hasBalcony) params.append('hasBalcony', 'true');
      if (filters.hasConcierge) params.append('hasConcierge', 'true');
      if (filters.hasGatedArea) params.append('hasGatedArea', 'true');

      // Sorting
      const [sortField, sortOrder] = sortBy.split(':');
      params.append('sortBy', sortField);
      params.append('sortOrder', sortOrder);

      // Pagination
      params.append('page', page.toString());
      params.append('limit', '20');

      const response = await fetch(`${apiUrl}/properties?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }

      const data = await response.json();
      setProperties(data.items || data.data || data);
      if (data.meta) {
        setPagination(data.meta);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading properties');
    } finally {
      setLoading(false);
    }
  }, [apiUrl, searchQuery, filters, sortBy, currentPage, userLocation, searchRadius]);

  // Fetch search suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/properties/suggestions?q=${encodeURIComponent(query)}&limit=8`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      }
    } catch {
      // Silently fail for suggestions
    }
  }, [apiUrl]);

  // Debounced suggestions fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchSuggestions]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchProperties();
  }, []);

  // Refetch when sort changes
  useEffect(() => {
    if (!loading) {
      fetchProperties(1);
      setCurrentPage(1);
    }
  }, [sortBy]);

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchProperties(1);
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
    setSearchQuery('');
    setSearchRadius(null);
    setUserLocation(null);
    setCurrentPage(1);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'city') {
      setFilters({ ...filters, city: suggestion.value });
    } else if (suggestion.type === 'district') {
      setFilters({ ...filters, district: suggestion.value });
    } else {
      setSearchQuery(suggestion.value);
    }
    setShowSuggestions(false);
    setTimeout(() => fetchProperties(1), 100);
  };

  const handleGetUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setSearchRadius(5); // Default 5km radius
        },
        () => {
          setError('Не удалось определить местоположение');
        }
      );
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchProperties(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              RealEstate
            </Link>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost">
                      <User className="h-4 w-4 mr-2" />
                      {user?.firstName}
                    </Button>
                  </Link>
                  <Link href="/properties/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Разместить
                    </Button>
                  </Link>
                  <Button variant="ghost" onClick={logout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost">Войти</Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button>Регистрация</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Поиск по адресу, району, названию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setShowSuggestions(false);
                    fetchProperties(1);
                  }
                }}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              {/* Search Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
                >
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.type}-${suggestion.value}-${index}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b last:border-b-0"
                    >
                      <span className="text-gray-400">
                        {suggestion.type === 'city' && <MapPin className="h-4 w-4" />}
                        {suggestion.type === 'district' && <MapPin className="h-4 w-4" />}
                        {suggestion.type === 'metro' && <span className="text-lg">🚇</span>}
                        {suggestion.type === 'property' && <Search className="h-4 w-4" />}
                      </span>
                      <span className="flex-1">
                        <span className="font-medium">{suggestion.label}</span>
                        {suggestion.count !== undefined && (
                          <span className="text-gray-400 text-sm ml-2">({suggestion.count})</span>
                        )}
                      </span>
                      <span className="text-xs text-gray-400 capitalize">
                        {suggestion.type === 'city' && 'Город'}
                        {suggestion.type === 'district' && 'Район'}
                        {suggestion.type === 'metro' && 'Метро'}
                        {suggestion.type === 'property' && 'Объект'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Geo-location button */}
            <Button
              variant={userLocation ? 'default' : 'outline'}
              onClick={handleGetUserLocation}
              title="Искать рядом со мной"
            >
              <MapPin className="h-5 w-5" />
            </Button>

            <Button onClick={() => fetchProperties(1)} size="lg">
              Найти
            </Button>
          </div>

          {/* Geo-location radius selector */}
          {userLocation && (
            <div className="mt-3 flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">Поиск рядом с вами:</span>
              <Select
                value={searchRadius?.toString() || '5'}
                onValueChange={(val) => setSearchRadius(Number(val))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 км</SelectItem>
                  <SelectItem value="2">2 км</SelectItem>
                  <SelectItem value="5">5 км</SelectItem>
                  <SelectItem value="10">10 км</SelectItem>
                  <SelectItem value="20">20 км</SelectItem>
                  <SelectItem value="50">50 км</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setUserLocation(null);
                  setSearchRadius(null);
                }}
                className="text-blue-600"
              >
                Отменить
              </Button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mb-8">
          <AdvancedFilters
            values={filters}
            onChange={setFilters}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />
        </div>

        {/* Results Header with Sorting */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold">
            Недвижимость{' '}
            {!loading && (
              <span className="text-gray-500 font-normal text-lg">
                ({pagination?.total || properties.length} объектов)
              </span>
            )}
          </h1>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-gray-500" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Сортировка" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && properties.length === 0 && (
          <div className="text-center py-20">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Объекты не найдены</h2>
            <p className="text-gray-600 mb-6">
              Попробуйте изменить параметры поиска
            </p>
            <Button variant="outline" onClick={handleResetFilters}>
              Сбросить фильтры
            </Button>
          </div>
        )}

        {/* Property Grid */}
        {!loading && !error && properties.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <Link key={property.id} href={`/properties/${property.id}`}>
                  <PropertyCard
                    title={property.title}
                    price={property.price}
                    listingType={property.listingType}
                    address={`${property.address}, ${property.city}`}
                    bedrooms={property.bedrooms ?? undefined}
                    bathrooms={property.bathrooms ?? undefined}
                    area={property.area}
                    imageUrl={property.images?.[0]?.url}
                    rating={property.averageRating ?? undefined}
                    reviewCount={property.reviewCount}
                  />
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Назад
                  </Button>

                  <div className="flex gap-1">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                      .filter((page) => {
                        // Show first, last, current, and neighbors
                        return (
                          page === 1 ||
                          page === pagination.pages ||
                          Math.abs(page - currentPage) <= 2
                        );
                      })
                      .map((page, index, arr) => {
                        // Add ellipsis
                        const prevPage = arr[index - 1];
                        const showEllipsis = prevPage && page - prevPage > 1;

                        return (
                          <span key={page} className="flex items-center">
                            {showEllipsis && (
                              <span className="px-2 text-gray-400">...</span>
                            )}
                            <Button
                              variant={currentPage === page ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                              className="min-w-[40px]"
                            >
                              {page}
                            </Button>
                          </span>
                        );
                      })}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.pages}
                  >
                    Вперед
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
