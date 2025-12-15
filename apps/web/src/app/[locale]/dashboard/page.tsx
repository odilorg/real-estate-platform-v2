'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, Badge } from '@repo/ui';
import { useAuth } from '@/context/AuthContext';
import {
  Plus,
  Loader2,
  Edit,
  Trash2,
  Eye,
  Building2,
  MapPin,
  Calendar,
  Heart,
  User,
  Settings,
  MessageSquare,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  BookmarkCheck,
  FileText,
  CheckCircle,
  Star,
  Mail,
} from 'lucide-react';

interface PropertyImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface Property {
  id: string;
  title: string;
  price: number;
  listingType: 'SALE' | 'RENT_LONG' | 'RENT_DAILY';
  propertyType: string;
  status: string;
  address: string;
  city: string;
  views: number;
  images: PropertyImage[];
  createdAt: string;
}

interface Analytics {
  totalViews: number;
  totalFavorites: number;
  totalContacts: number;
  viewsTrend: number;
  favoritesTrend: number;
  contactsTrend: number;
}

const LISTING_TYPE_LABELS: Record<string, string> = {
  SALE: 'Продажа',
  RENT_LONG: 'Аренда',
  RENT_DAILY: 'Посуточно',
};

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  ACTIVE: { label: 'Активно', variant: 'default' },
  PENDING: { label: 'На модерации', variant: 'secondary' },
  SOLD: { label: 'Продано', variant: 'outline' },
  RENTED: { label: 'Сдано', variant: 'outline' },
  INACTIVE: { label: 'Неактивно', variant: 'outline' },
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyProperties();
      fetchUnreadCount();
      fetchAnalytics();
    }
  }, [isAuthenticated]);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${apiUrl}/messages/unread`, {
        headers,
        credentials: 'include', // Include cookies for OAuth authentication
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      // Silently fail
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${apiUrl}/properties/my/analytics?days=30`, {
        headers,
        credentials: 'include', // Include cookies for OAuth authentication
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      // Silently fail
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchMyProperties = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};

      // Add Authorization header if token exists (phone/email login)
      // For OAuth logins, authentication works via HTTP-only cookies
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${apiUrl}/properties/my`, {
        headers,
        credentials: 'include', // Include cookies for OAuth authentication
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки объявлений');
      }

      const data = await response.json();
      setProperties(data.items || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить это объявление?')) {
      return;
    }

    setDeletingId(id);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/properties/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Ошибка удаления');
      }

      setProperties((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка удаления');
    } finally {
      setDeletingId(null);
    }
  };

  const renderTrend = (trend: number) => {
    if (trend > 0) {
      return (
        <div className="flex items-center text-green-600 text-sm mt-2">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span className="font-medium">+{trend.toFixed(1)}%</span>
          <span className="text-xs text-gray-500 ml-1">vs прошлый период</span>
        </div>
      );
    } else if (trend < 0) {
      return (
        <div className="flex items-center text-red-600 text-sm mt-2">
          <TrendingDown className="h-4 w-4 mr-1" />
          <span className="font-medium">{trend.toFixed(1)}%</span>
          <span className="text-xs text-gray-500 ml-1">vs прошлый период</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-gray-500 text-sm mt-2">
          <Minus className="h-4 w-4 mr-1" />
          <span className="font-medium">0%</span>
          <span className="text-xs text-gray-500 ml-1">без изменений</span>
        </div>
      );
    }
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
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <main className="container mx-auto px-4 py-8">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Личный кабинет</h1>
          <Link href="/properties/new">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-5 w-5 mr-2" />
              Создать объявление
            </Button>
          </Link>
        </div>

        {/* Welcome Message */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">
            Добро пожаловать, <span className="text-blue-600">{user?.firstName}</span>!
          </h2>
          <p className="text-base text-gray-600">
            Здесь вы можете управлять своими объявлениями и отслеживать статистику
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link href="/dashboard/messages">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg relative">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Сообщения</div>
                  {unreadCount > 0 && (
                    <div className="text-xs text-blue-600">{unreadCount} новых</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/favorites">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 bg-pink-100 rounded-lg">
                  <Heart className="h-6 w-6 text-pink-600" />
                </div>
                <div className="font-semibold text-gray-900">Избранное</div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/saved-searches">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <BookmarkCheck className="h-6 w-6 text-purple-600" />
                </div>
                <div className="font-semibold text-gray-900">Сохраненные</div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/profile">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Settings className="h-6 w-6 text-gray-600" />
                </div>
                <div className="font-semibold text-gray-900">Настройки</div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
          {/* Total Listings */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-1">
                {properties.length}
              </div>
              <div className="text-sm font-medium text-gray-600">Всего объявлений</div>
            </CardContent>
          </Card>

          {/* Active Listings */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-1">
                {properties.filter((p) => p.status === 'ACTIVE').length}
              </div>
              <div className="text-sm font-medium text-gray-600">Активных</div>
            </CardContent>
          </Card>

          {/* Views */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              {analyticsLoading ? (
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Eye className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-gray-900 mb-1">
                    {analytics?.totalViews.toLocaleString() || 0}
                  </div>
                  <div className="text-sm font-medium text-gray-600">Просмотров (30 дн)</div>
                  {analytics && renderTrend(analytics.viewsTrend)}
                </>
              )}
            </CardContent>
          </Card>

          {/* Favorites */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              {analyticsLoading ? (
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-pink-100 rounded-lg">
                      <Star className="h-6 w-6 text-pink-600" />
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-gray-900 mb-1">
                    {analytics?.totalFavorites.toLocaleString() || 0}
                  </div>
                  <div className="text-sm font-medium text-gray-600">Избранное (30 дн)</div>
                  {analytics && renderTrend(analytics.favoritesTrend)}
                </>
              )}
            </CardContent>
          </Card>

          {/* Contacts */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              {analyticsLoading ? (
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <Mail className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-gray-900 mb-1">
                    {analytics?.totalContacts.toLocaleString() || 0}
                  </div>
                  <div className="text-sm font-medium text-gray-600">Обращений (30 дн)</div>
                  {analytics && renderTrend(analytics.contactsTrend)}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Properties Section Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Мои объявления</h2>
          <div className="text-sm text-gray-500">
            {properties.length} {properties.length === 1 ? 'объявление' : 'объявлений'}
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

        {/* Empty State */}
        {!loading && !error && properties.length === 0 && (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                <Building2 className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                У вас пока нет объявлений
              </h3>
              <p className="text-base text-gray-600 mb-8 max-w-md mx-auto">
                Создайте своё первое объявление прямо сейчас и начните получать запросы от клиентов
              </p>
              <Link href="/properties/new">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-5 w-5 mr-2" />
                  Создать объявление
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Properties List */}
        {!loading && !error && properties.length > 0 && (
          <div className="space-y-4">
            {properties.map((property) => (
              <Card key={property.id} className="overflow-hidden">
                <div className="flex">
                  {/* Image */}
                  <div className="w-48 h-36 flex-shrink-0 bg-gray-100">
                    {property.images?.[0]?.url ? (
                      <img
                        src={property.images[0].url}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <CardContent className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={
                              STATUS_LABELS[property.status]?.variant || 'default'
                            }
                          >
                            {STATUS_LABELS[property.status]?.label ||
                              property.status}
                          </Badge>
                          <Badge variant="outline">
                            {LISTING_TYPE_LABELS[property.listingType] ||
                              property.listingType}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-base mb-2 text-gray-900 line-clamp-2">
                          {property.title}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600 mb-3">
                          <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span className="line-clamp-1">{property.address}, {property.city}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            {property.views}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(property.createdAt).toLocaleDateString(
                              'ru-RU'
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end">
                        <div className="text-2xl font-bold text-blue-600 mb-4">
                          {property.price.toLocaleString()} <span className="text-sm font-normal text-gray-500">у.е.</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/properties/${property.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/properties/${property.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(property.id)}
                            disabled={deletingId === property.id}
                          >
                            {deletingId === property.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-red-500" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
