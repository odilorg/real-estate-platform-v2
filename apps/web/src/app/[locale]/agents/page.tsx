'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, CardContent, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui';
import { useTranslations } from 'next-intl';
import {
  Loader2,
  Award,
  Star,
  Building2,
  Verified,
  Search,
  Filter,
  X,
} from 'lucide-react';

interface Agent {
  id: string;
  userId: string;
  photo: string | null;
  phone: string | null;
  email: string | null;
  bio: string | null;
  yearsExperience: number;
  totalDeals: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  superAgent: boolean;
  specializations: string[];
  languages: string[];
  areasServed: string[];
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
  agency: {
    id: string;
    name: string;
    logo: string | null;
    slug: string;
  } | null;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const SORT_OPTIONS = [
  { value: 'rating:desc', label: 'По рейтингу' },
  { value: 'experience:desc', label: 'По опыту' },
  { value: 'deals:desc', label: 'По сделкам' },
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

export default function AgentsPage() {
  const t = useTranslations('agents');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [superAgentOnly, setSuperAgentOnly] = useState(false);
  const [sortBy, setSortBy] = useState('rating:desc');
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    fetchAgents();
  }, [searchQuery, selectedCity, verifiedOnly, superAgentOnly, sortBy, currentPage]);

  const fetchAgents = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
      });

      if (searchQuery) params.append('search', searchQuery);
      if (selectedCity) params.append('city', selectedCity);
      if (verifiedOnly) params.append('verified', 'true');
      if (superAgentOnly) params.append('superAgent', 'true');

      const [sortField, sortOrder] = sortBy.split(':');
      params.append('sortBy', sortField);
      params.append('sortOrder', sortOrder);

      const response = await fetch(`${apiUrl}/agents?${params.toString()}`);

      if (!response.ok) {
        throw new Error(t('errors.loadError'));
      }

      const data = await response.json();
      setAgents(data.agents || []);
      setPagination({
        total: data.total,
        page: data.page,
        limit: data.limit,
        pages: data.totalPages,
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
    setSuperAgentOnly(false);
    setSortBy('rating:desc');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || selectedCity || verifiedOnly || superAgentOnly;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
          <p className="text-gray-600">
            {pagination ? `${pagination.total} ${t('allAgents').toLowerCase()}` : ''}
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
                  placeholder={t('findAgent')}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
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
                  variant={superAgentOnly ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSuperAgentOnly(!superAgentOnly);
                    setCurrentPage(1);
                  }}
                  className="flex-1"
                >
                  <Star className="h-4 w-4 mr-1" />
                  {t('superAgent')}
                </Button>
              </div>
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-sm text-gray-600">
                  Активные фильтры: {[searchQuery && 'поиск', selectedCity && 'город', verifiedOnly && 'проверенные', superAgentOnly && 'супер-агенты'].filter(Boolean).join(', ')}
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
        {!loading && !error && agents.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Award className="h-16 w-16 mx-auto text-gray-300 mb-4" />
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

        {/* Agents Grid */}
        {!loading && !error && agents.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {agents.map((agent) => (
                <Link key={agent.id} href={`/agents/${agent.id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      {/* Photo and Badges */}
                      <div className="flex items-start gap-4 mb-4">
                        {agent.photo ? (
                          <img
                            src={agent.photo}
                            alt={`${agent.user.firstName} ${agent.user.lastName}`}
                            className="w-20 h-20 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                            <Award className="h-10 w-10 text-gray-400" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1 truncate">
                            {agent.user.firstName} {agent.user.lastName}
                          </h3>

                          <div className="flex flex-wrap gap-1 mb-2">
                            {agent.verified && (
                              <Badge variant="default" className="text-xs">
                                <Verified className="h-3 w-3 mr-1" />
                                {t('verified')}
                              </Badge>
                            )}
                            {agent.superAgent && (
                              <Badge variant="default" className="bg-amber-600 text-xs">
                                <Star className="h-3 w-3 mr-1 fill-white" />
                                {t('superAgent')}
                              </Badge>
                            )}
                          </div>

                          {agent.agency && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Building2 className="h-3 w-3" />
                              <span className="truncate">{agent.agency.name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Rating */}
                      {agent.reviewCount > 0 && (
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold">{agent.rating.toFixed(1)}</span>
                          </div>
                          <span className="text-sm text-gray-600">
                            ({agent.reviewCount} {t('reviews')})
                          </span>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-600 mb-1">{t('experience')}</div>
                          <div className="font-semibold">
                            {agent.yearsExperience} {t('years')}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-600 mb-1">{t('totalDeals')}</div>
                          <div className="font-semibold">{agent.totalDeals}</div>
                        </div>
                      </div>

                      {/* Bio */}
                      {agent.bio && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                          {agent.bio}
                        </p>
                      )}

                      {/* Specializations */}
                      {agent.specializations.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {agent.specializations.slice(0, 3).map((spec) => (
                            <Badge key={spec} variant="outline" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                          {agent.specializations.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{agent.specializations.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Contact Buttons */}
                      <div className="flex gap-2 mt-4">
                        {agent.phone && (
                          <a
                            href={`tel:${agent.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            📞 {t('contact.call')}
                          </a>
                        )}
                        {agent.email && (
                          <a
                            href={`mailto:${agent.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            📧 {t('contact.email')}
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Предыдущая
                </Button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                    .filter((page) => {
                      // Show first page, last page, current page, and pages around current
                      return (
                        page === 1 ||
                        page === pagination.pages ||
                        Math.abs(page - currentPage) <= 1
                      );
                    })
                    .map((page, idx, arr) => {
                      // Add ellipsis if there's a gap
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
                  disabled={currentPage === pagination.pages}
                  onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
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
