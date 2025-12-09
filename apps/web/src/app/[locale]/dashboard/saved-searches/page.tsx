'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, Badge } from '@repo/ui';
import { useAuth } from '@/context/AuthContext';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Loader2,
  Trash2,
  Bell,
  BellOff,
  Search,
  Home,
  MapPin,
  DollarSign,
  Bed,
  Calendar,
} from 'lucide-react';

interface SavedSearchFilters {
  city?: string;
  district?: string;
  propertyType?: string;
  listingType?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bedrooms?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  buildingClass?: string;
  [key: string]: any;
}

interface SavedSearch {
  id: string;
  name: string;
  filters: SavedSearchFilters;
  notificationsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SavedSearchesPage() {
  const t = useTranslations('dashboard.savedSearches');
  const tProperty = useTranslations('property');
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingNotificationId, setTogglingNotificationId] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSavedSearches();
    }
  }, [isAuthenticated]);

  const fetchSavedSearches = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/saved-searches`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(t('errors.loadError'));
      }

      const data = await response.json();
      setSearches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) {
      return;
    }

    setDeletingId(id);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/saved-searches/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(t('errors.deleteError'));
      }

      setSearches((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : t('errors.deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleNotifications = async (id: string, enabled: boolean) => {
    setTogglingNotificationId(id);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/saved-searches/${id}/notifications`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        throw new Error(t('errors.toggleError'));
      }

      const updatedSearch = await response.json();
      setSearches((prev) =>
        prev.map((s) => (s.id === id ? updatedSearch : s))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : t('errors.toggleError'));
    } finally {
      setTogglingNotificationId(null);
    }
  };

  const buildSearchUrl = (filters: SavedSearchFilters): string => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    return `/properties?${params.toString()}`;
  };

  const renderFilterSummary = (filters: SavedSearchFilters) => {
    const summary: string[] = [];

    if (filters.city) summary.push(filters.city);
    if (filters.district) summary.push(filters.district);
    if (filters.propertyType)
      summary.push(tProperty(`propertyTypes.${filters.propertyType}` as any) || filters.propertyType);
    if (filters.listingType)
      summary.push(tProperty(`listingTypes.${filters.listingType}` as any) || filters.listingType);

    if (filters.minPrice || filters.maxPrice) {
      const priceRange = [];
      if (filters.minPrice) priceRange.push(`от ${filters.minPrice.toLocaleString()} $`);
      if (filters.maxPrice) priceRange.push(`до ${filters.maxPrice.toLocaleString()} $`);
      summary.push(priceRange.join(' '));
    }

    if (filters.minArea || filters.maxArea) {
      const areaRange = [];
      if (filters.minArea) areaRange.push(`от ${filters.minArea} м²`);
      if (filters.maxArea) areaRange.push(`до ${filters.maxArea} м²`);
      summary.push(areaRange.join(' '));
    }

    if (filters.bedrooms) {
      summary.push(`${filters.bedrooms} ${t('bedrooms')}`);
    } else if (filters.minBedrooms || filters.maxBedrooms) {
      const bedroomsRange = [];
      if (filters.minBedrooms) bedroomsRange.push(`от ${filters.minBedrooms}`);
      if (filters.maxBedrooms) bedroomsRange.push(`до ${filters.maxBedrooms}`);
      summary.push(`${bedroomsRange.join(' ')} ${t('bedrooms')}`);
    }

    if (filters.buildingClass)
      summary.push(tProperty(`buildingClass.${filters.buildingClass}` as any) || filters.buildingClass);

    return summary.length > 0 ? summary.join(' • ') : t('allParameters');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('back')}
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              {t('title')}
            </h1>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <p className="text-gray-600">
            {t('description')}
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && searches.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {t('empty.title')}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('empty.description')}
              </p>
              <Link href="/properties">
                <Button>
                  <Search className="h-4 w-4 mr-2" />
                  {t('empty.button')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Saved Searches List */}
        {!loading && !error && searches.length > 0 && (
          <div className="space-y-4">
            {searches.map((search) => (
              <Card key={search.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{search.name}</h3>
                        {search.notificationsEnabled && (
                          <Badge variant="default">
                            <Bell className="h-3 w-3 mr-1" />
                            {t('notificationsEnabled')}
                          </Badge>
                        )}
                      </div>

                      <p className="text-gray-600 text-sm mb-4">
                        {renderFilterSummary(search.filters)}
                      </p>

                      <div className="text-xs text-gray-500">
                        {t('created')}: {new Date(search.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Link href={buildSearchUrl(search.filters)}>
                        <Button variant="outline" size="sm">
                          <Search className="h-4 w-4 mr-2" />
                          {t('openSearch')}
                        </Button>
                      </Link>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleToggleNotifications(search.id, !search.notificationsEnabled)
                        }
                        disabled={togglingNotificationId === search.id}
                      >
                        {togglingNotificationId === search.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : search.notificationsEnabled ? (
                          <BellOff className="h-4 w-4" />
                        ) : (
                          <Bell className="h-4 w-4" />
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(search.id)}
                        disabled={deletingId === search.id}
                      >
                        {deletingId === search.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
