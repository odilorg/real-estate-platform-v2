'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PropertyCard, Button } from '@repo/ui';
import { AdvancedFilters, type AdvancedFilterValues } from '@/components';
import { Search, Plus, Loader2, User, LogOut } from 'lucide-react';
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
}

const defaultFilters: AdvancedFilterValues = {
  propertyTypes: [],
  listingTypes: [],
  amenities: [],
  buildingClasses: [],
  renovationTypes: [],
  parkingTypes: [],
};

export default function PropertiesPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AdvancedFilterValues>(defaultFilters);
  const [searchQuery, setSearchQuery] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (searchQuery) params.append('search', searchQuery);
      if (filters.propertyTypes.length > 0)
        params.append('propertyType', filters.propertyTypes.join(','));
      if (filters.listingTypes.length > 0)
        params.append('listingType', filters.listingTypes.join(','));
      if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
      if (filters.minBedrooms)
        params.append('minBedrooms', filters.minBedrooms.toString());
      if (filters.maxBedrooms)
        params.append('maxBedrooms', filters.maxBedrooms.toString());
      if (filters.minArea) params.append('minArea', filters.minArea.toString());
      if (filters.maxArea) params.append('maxArea', filters.maxArea.toString());
      if (filters.city) params.append('city', filters.city);

      const response = await fetch(`${apiUrl}/properties?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }

      const data = await response.json();
      setProperties(data.items || data.data || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleApplyFilters = () => {
    fetchProperties();
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
    setSearchQuery('');
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
                type="text"
                placeholder="Поиск по адресу, району..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchProperties()}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <Button onClick={fetchProperties} size="lg">
              Найти
            </Button>
          </div>
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

        {/* Results */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold">
            Недвижимость{' '}
            {!loading && (
              <span className="text-gray-500 font-normal text-lg">
                ({properties.length} объектов)
              </span>
            )}
          </h1>
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
        )}
      </main>
    </div>
  );
}
