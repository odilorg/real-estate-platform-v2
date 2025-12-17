'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { useRouter } from '@/i18n/routing';
import { Button, Card, CardContent, Badge } from '@repo/ui';
import { useAuth } from '@/context/AuthContext';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  MessageCircle,
  Calendar,
  BarChart3,
  Activity,
} from 'lucide-react';

interface PropertyPerformance {
  propertyId: string;
  title: string;
  totalViews: number;
  totalFavorites: number;
  totalContacts: number;
  avgViewsPerDay: number;
  lastViewedAt: string | null;
}

interface AnalyticsData {
  totalViews: number;
  totalFavorites: number;
  totalContacts: number;
  propertyPerformance: PropertyPerformance[];
}

export default function AnalyticsPage() {
  const t = useTranslations('dashboard.analytics');
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState(30);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalytics();
    }
  }, [isAuthenticated, selectedDays]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/properties/my/analytics?days=${selectedDays}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(t('errors.loadError'));
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t('never');
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
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
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('back')}
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
              <p className="text-gray-600 text-sm mt-1">{t('description')}</p>
            </div>
          </div>

          {/* Time Period Selector */}
          <div className="flex gap-2">
            {[7, 30, 90].map((days) => (
              <Button
                key={days}
                variant={selectedDays === days ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDays(days)}
              >
                {days} {t('days')}
              </Button>
            ))}
          </div>
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

        {/* Analytics Content */}
        {!loading && !error && analytics && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{t('totalViews')}</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {analytics.totalViews.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Eye className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{t('totalFavorites')}</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {analytics.totalFavorites.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-full">
                      <Heart className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{t('totalContacts')}</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {analytics.totalContacts.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <MessageCircle className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Property Performance Table */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6">{t('propertyPerformance')}</h2>

                {analytics.propertyPerformance.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">{t('noProperties.title')}</h3>
                    <p className="text-gray-600 mb-6">{t('noProperties.description')}</p>
                    <Link href="/dashboard/create">
                      <Button>
                        <Activity className="h-4 w-4 mr-2" />
                        {t('noProperties.button')}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">
                            {t('table.property')}
                          </th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">
                            {t('table.views')}
                          </th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">
                            {t('table.favorites')}
                          </th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">
                            {t('table.contacts')}
                          </th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">
                            {t('table.avgViewsPerDay')}
                          </th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">
                            {t('table.lastViewed')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.propertyPerformance.map((property) => (
                          <tr key={property.propertyId} className="border-b hover:bg-gray-50">
                            <td className="py-4 px-4">
                              <Link
                                href={`/properties/${property.propertyId}`}
                                className="text-blue-600 hover:underline font-medium"
                              >
                                {property.title}
                              </Link>
                            </td>
                            <td className="text-center py-4 px-4">
                              <span className="inline-flex items-center gap-1">
                                <Eye className="h-4 w-4 text-gray-400" />
                                {property.totalViews.toLocaleString()}
                              </span>
                            </td>
                            <td className="text-center py-4 px-4">
                              <span className="inline-flex items-center gap-1">
                                <Heart className="h-4 w-4 text-red-400" />
                                {property.totalFavorites.toLocaleString()}
                              </span>
                            </td>
                            <td className="text-center py-4 px-4">
                              <span className="inline-flex items-center gap-1">
                                <MessageCircle className="h-4 w-4 text-green-400" />
                                {property.totalContacts.toLocaleString()}
                              </span>
                            </td>
                            <td className="text-center py-4 px-4 text-gray-600">
                              {property.avgViewsPerDay.toFixed(1)}
                            </td>
                            <td className="text-center py-4 px-4 text-sm text-gray-600">
                              {formatDate(property.lastViewedAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Insights & Tips */}
            {analytics.propertyPerformance.length > 0 && (
              <Card className="mt-6">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    {t('insights.title')}
                  </h3>
                  <div className="space-y-3">
                    {analytics.totalViews > 0 && analytics.totalContacts > 0 && (
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">{t('insights.conversion.title')}</p>
                          <p className="text-sm text-gray-600">
                            {t('insights.conversion.description', {
                              rate: ((analytics.totalContacts / analytics.totalViews) * 100).toFixed(1),
                            })}
                          </p>
                        </div>
                      </div>
                    )}

                    {analytics.propertyPerformance.some((p) => p.avgViewsPerDay < 1) && (
                      <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                        <TrendingDown className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">{t('insights.lowViews.title')}</p>
                          <p className="text-sm text-gray-600">{t('insights.lowViews.description')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
