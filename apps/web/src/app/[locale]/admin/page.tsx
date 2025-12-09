'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Input,
} from '@repo/ui';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft,
  Loader2,
  Users,
  Building2,
  Eye,
  Heart,
  Calendar,
  Ban,
  Check,
  X,
  Star,
  Trash2,
  Search,
  Shield,
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalProperties: number;
  activeProperties: number;
  pendingProperties: number;
  totalViewings: number;
  totalFavorites: number;
  recentRegistrations: number;
  recentProperties: number;
}

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  banned: boolean;
  banReason: string | null;
  createdAt: string;
  _count: { properties: number };
}

interface AdminProperty {
  id: string;
  title: string;
  price: number;
  status: string;
  city: string;
  featured: boolean;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  images: { url: string }[];
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'properties'>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyStatus, setPropertyStatus] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (!authLoading && user?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      fetchData();
    }
  }, [isAuthenticated, user, activeTab, searchQuery, propertyStatus]);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      if (activeTab === 'dashboard') {
        const response = await fetch(`${apiUrl}/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          setStats(await response.json());
        }
      } else if (activeTab === 'users') {
        const url = searchQuery
          ? `${apiUrl}/admin/users?search=${encodeURIComponent(searchQuery)}`
          : `${apiUrl}/admin/users`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setUsers(data.items);
        }
      } else if (activeTab === 'properties') {
        const url = propertyStatus
          ? `${apiUrl}/admin/properties?status=${propertyStatus}`
          : `${apiUrl}/admin/properties`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setProperties(data.items);
        }
      }
    } catch (error) {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string) => {
    const reason = prompt('Укажите причину бана:');
    if (!reason) return;

    const token = localStorage.getItem('token');
    try {
      await fetch(`${apiUrl}/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });
      fetchData();
    } catch (error) {
      alert('Ошибка при бане пользователя');
    }
  };

  const handleUnbanUser = async (userId: string) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`${apiUrl}/admin/users/${userId}/unban`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (error) {
      alert('Ошибка при разблокировке пользователя');
    }
  };

  const handleApproveProperty = async (propertyId: string) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`${apiUrl}/admin/properties/${propertyId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (error) {
      alert('Ошибка при одобрении объявления');
    }
  };

  const handleRejectProperty = async (propertyId: string) => {
    const reason = prompt('Укажите причину отклонения:');
    if (!reason) return;

    const token = localStorage.getItem('token');
    try {
      await fetch(`${apiUrl}/admin/properties/${propertyId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });
      fetchData();
    } catch (error) {
      alert('Ошибка при отклонении объявления');
    }
  };

  const handleFeatureProperty = async (propertyId: string, featured: boolean) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`${apiUrl}/admin/properties/${propertyId}/feature`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ featured }),
      });
      fetchData();
    } catch (error) {
      alert('Ошибка при изменении статуса объявления');
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Вы уверены, что хотите удалить это объявление?')) return;

    const token = localStorage.getItem('token');
    try {
      await fetch(`${apiUrl}/admin/properties/${propertyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (error) {
      alert('Ошибка при удалении объявления');
    }
  };

  if (authLoading || (user?.role !== 'ADMIN' && isAuthenticated)) {
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
        {/* Admin Header */}
        <div className="mb-6 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <h1 className="text-2xl font-bold">Панель администратора</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'dashboard' ? 'default' : 'outline'}
            onClick={() => setActiveTab('dashboard')}
          >
            Обзор
          </Button>
          <Button
            variant={activeTab === 'users' ? 'default' : 'outline'}
            onClick={() => setActiveTab('users')}
          >
            Пользователи
          </Button>
          <Button
            variant={activeTab === 'properties' ? 'default' : 'outline'}
            onClick={() => setActiveTab('properties')}
          >
            Объявления
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        <div className="text-sm text-gray-500">Пользователей</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-green-600">
                      +{stats.recentRegistrations} за 7 дней
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <Building2 className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{stats.totalProperties}</div>
                        <div className="text-sm text-gray-500">Объявлений</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-green-600">
                      +{stats.recentProperties} за 7 дней
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-yellow-100 rounded-lg">
                        <Eye className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{stats.pendingProperties}</div>
                        <div className="text-sm text-gray-500">На модерации</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <Calendar className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{stats.totalViewings}</div>
                        <div className="text-sm text-gray-500">Просмотров</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-red-100 rounded-lg">
                        <Heart className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{stats.totalFavorites}</div>
                        <div className="text-sm text-gray-500">В избранном</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-100 rounded-lg">
                        <Check className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{stats.activeProperties}</div>
                        <div className="text-sm text-gray-500">Активных</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Поиск по email или имени..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {users.map((adminUser) => (
                    <Card key={adminUser.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <Users className="h-5 w-5 text-gray-500" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {adminUser.firstName} {adminUser.lastName}
                                </span>
                                <Badge
                                  variant={
                                    adminUser.role === 'ADMIN'
                                      ? 'default'
                                      : adminUser.role === 'AGENT'
                                        ? 'secondary'
                                        : 'outline'
                                  }
                                >
                                  {adminUser.role}
                                </Badge>
                                {adminUser.banned && (
                                  <Badge variant="destructive">Забанен</Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">{adminUser.email}</div>
                              <div className="text-xs text-gray-400">
                                {adminUser._count.properties} объявлений
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {adminUser.banned ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnbanUser(adminUser.id)}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Разбанить
                              </Button>
                            ) : (
                              adminUser.role !== 'ADMIN' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleBanUser(adminUser.id)}
                                >
                                  <Ban className="h-4 w-4 mr-1" />
                                  Бан
                                </Button>
                              )
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Properties Tab */}
            {activeTab === 'properties' && (
              <div>
                <div className="mb-4 flex gap-2">
                  <Button
                    variant={propertyStatus === '' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPropertyStatus('')}
                  >
                    Все
                  </Button>
                  <Button
                    variant={propertyStatus === 'PENDING' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPropertyStatus('PENDING')}
                  >
                    На модерации
                  </Button>
                  <Button
                    variant={propertyStatus === 'ACTIVE' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPropertyStatus('ACTIVE')}
                  >
                    Активные
                  </Button>
                  <Button
                    variant={propertyStatus === 'INACTIVE' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPropertyStatus('INACTIVE')}
                  >
                    Отклоненные
                  </Button>
                </div>

                <div className="space-y-3">
                  {properties.map((property) => (
                    <Card key={property.id}>
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div className="w-24 h-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                            {property.images[0]?.url ? (
                              <img
                                src={property.images[0].url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Building2 className="h-8 w-8 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant={
                                  property.status === 'ACTIVE'
                                    ? 'default'
                                    : property.status === 'PENDING'
                                      ? 'secondary'
                                      : 'outline'
                                }
                              >
                                {property.status}
                              </Badge>
                              {property.featured && (
                                <Badge variant="default" className="bg-yellow-500">
                                  <Star className="h-3 w-3 mr-1" />
                                  Featured
                                </Badge>
                              )}
                            </div>
                            <Link
                              href={`/properties/${property.id}`}
                              className="font-medium hover:text-blue-600"
                            >
                              {property.title}
                            </Link>
                            <div className="text-sm text-gray-500">
                              {property.city} - {property.price.toLocaleString()} у.е.
                            </div>
                            <div className="text-xs text-gray-400">
                              {property.user.firstName} {property.user.lastName} ({property.user.email})
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {property.status === 'PENDING' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApproveProperty(property.id)}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Одобрить
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRejectProperty(property.id)}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Отклонить
                                </Button>
                              </>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleFeatureProperty(property.id, !property.featured)
                              }
                            >
                              <Star
                                className={`h-4 w-4 mr-1 ${property.featured ? 'fill-yellow-500 text-yellow-500' : ''}`}
                              />
                              {property.featured ? 'Убрать' : 'Featured'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteProperty(property.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1 text-red-500" />
                              Удалить
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
