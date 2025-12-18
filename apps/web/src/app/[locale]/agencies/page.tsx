'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { Button, Card, CardContent, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui';
import { useTranslations } from 'next-intl';
import {
  Loader2,
  Building2,
  Star,
  Verified,
  Search,
  X,
  Users,
  Award,
} from 'lucide-react';

interface Agency {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  city: string | null;
  yearsOnPlatform: number;
  verified: boolean;
  createdAt: string;
  _count: {
    agents: number;
  };
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const SORT_OPTIONS = [
  { value: 'verified:desc', label: 'Проверенные первыми' },
  { value: 'agents:desc', label: 'По количеству агентов' },
  { value: 'years:desc', label: 'По стажу' },
  { value: 'createdAt:desc', label: 'Сначала новые' },
];

const CITIES = [
  'Ташкент',
  'Самарканд',
  'Бухара',
  'Андижан',
  'Фергана',
  'Наманган',
  'Навои',
  'Карши',
  'Термез',
  'Ургенч',
];

export default function AgenciesPage() {
  const t = useTranslations('agencies');
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [sortBy, setSortBy] = useState('verified:desc');
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    fetchAgencies();
  }, [selectedCity, verifiedOnly, sortBy, currentPage]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchAgencies();
      } else {
        setCurrentPage(1);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchAgencies = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
      });

      if (selectedCity) params.append('city', selectedCity);
      if (verifiedOnly) params.append('verified', 'true');

      const response = await fetch(`${apiUrl}/agencies?${params.toString()}`);

      if (!response.ok) {
        throw new Error(t('errors.loadError'));
      }

      const data = await response.json();

      // Filter by search query locally
      let filteredAgencies = data.agencies || [];
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredAgencies = filteredAgencies.filter((agency: Agency) =>
          agency.name.toLowerCase().includes(query) ||
          agency.description?.toLowerCase().includes(query)
        );
      }

      // Filter by premium locally
      if (premiumOnly) {
        filteredAgencies = filteredAgencies.filter(
          (agency: Agency) => agency.yearsOnPlatform >= 3
        );
      }

      setAgencies(filteredAgencies);
      setPagination({
        total: data.total,
        page: data.page,
        limit: data.limit,
        totalPages: data.totalPages,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCity('');
    setVerifiedOnly(false);
    setPremiumOnly(false);
    setSortBy('verified:desc');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || selectedCity || verifiedOnly || premiumOnly;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
          <p className="text-gray-600">
            {pagination ? `${pagination.total} ${t('allAgencies').toLowerCase()}` : ''}
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('findAgency')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              {/* City Filter */}
              <Select value={selectedCity} onValueChange={(value) => {
                setSelectedCity(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={t('filter.city')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">{t('filter.city')}</SelectItem>
                  {CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Quick Filters */}
              <div className="flex gap-2">
                <Button
                  variant={verifiedOnly ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setVerifiedOnly(!verifiedOnly);
                    setCurrentPage(1);
                  }}
                  className="flex-1"
                >
                  <Verified className="h-4 w-4 mr-1" />
                  {t('verified')}
                </Button>
                <Button
                  variant={premiumOnly ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setPremiumOnly(!premiumOnly);
                    setCurrentPage(1);
                  }}
                  className="flex-1"
                >
                  <Star className="h-4 w-4 mr-1" />
                  {t('premium')}
                </Button>
              </div>
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-sm text-gray-600">
                  Активные фильтры: {[searchQuery && 'поиск', selectedCity && 'город', verifiedOnly && 'проверенные', premiumOnly && 'премиум'].filter(Boolean).join(', ')}
                </span>
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Сбросить
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

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
        {!loading && !error && agencies.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('empty.title')}</h3>
              <p className="text-gray-600 mb-6">{t('empty.description')}</p>
              {hasActiveFilters && (
                <Button onClick={resetFilters}>
                  {t('empty.button')}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Agencies Grid */}
        {!loading && !error && agencies.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {agencies.map((agency) => (
                <Link key={agency.id} href={`/agencies/${agency.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      {/* Logo and Info */}
                      <div className="flex items-start gap-4 mb-4">
                        {agency.logo ? (
                          <img
                            src={agency.logo}
                            alt={agency.name}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Building2 className="h-10 w-10 text-gray-400" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1 truncate">
                            {agency.name}
                          </h3>

                          <div className="flex flex-wrap gap-1 mb-2">
                            {agency.verified && (
                              <Badge variant="default" className="text-xs">
                                <Verified className="h-3 w-3 mr-1" />
                                {t('verified')}
                              </Badge>
                            )}
                            {agency.yearsOnPlatform >= 3 && (
                              <Badge variant="default" className="bg-amber-600 text-xs">
                                <Star className="h-3 w-3 mr-1 fill-white" />
                                {t('premium')}
                              </Badge>
                            )}
                          </div>

                          {agency.city && (
                            <p className="text-sm text-gray-600">{agency.city}</p>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      {agency.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                          {agency.description}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                            <Users className="h-3 w-3" />
                            <span>{t('agents')}</span>
                          </div>
                          <div className="font-semibold">{agency._count.agents}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                            <Award className="h-3 w-3" />
                            <span>{t('founded')}</span>
                          </div>
                          <div className="font-semibold">
                            {new Date(agency.createdAt).getFullYear()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Предыдущая
                </Button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      return (
                        page === 1 ||
                        page === pagination.totalPages ||
                        Math.abs(page - currentPage) <= 1
                      );
                    })
                    .map((page, idx, arr) => {
                      const showEllipsisBefore = idx > 0 && page - arr[idx - 1] > 1;

                      return (
                        <div key={page} className="flex items-center gap-2">
                          {showEllipsisBefore && <span className="text-gray-400">...</span>}
                          <Button
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        </div>
                      );
                    })}
                </div>

                <Button
                  variant="outline"
                  disabled={currentPage === pagination.totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                >
                  Следующая
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
