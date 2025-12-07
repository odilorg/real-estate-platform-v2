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

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyProperties();
    }
  }, [isAuthenticated]);

  const fetchMyProperties = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/properties/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
        {/* Dashboard Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Личный кабинет</h1>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/favorites">
              <Button variant="ghost" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                Избранное
              </Button>
            </Link>
            <Link href="/dashboard/messages">
              <Button variant="ghost" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Сообщения
              </Button>
            </Link>
            <Link href="/dashboard/profile">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Настройки
              </Button>
            </Link>
            {user?.role === 'ADMIN' && (
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Админ
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">
            Добро пожаловать, {user?.firstName}!
          </h1>
          <p className="text-gray-600">
            Здесь вы можете управлять своими объявлениями
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-blue-600">
                {properties.length}
              </div>
              <div className="text-sm text-gray-500">Всего объявлений</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-green-600">
                {properties.filter((p) => p.status === 'ACTIVE').length}
              </div>
              <div className="text-sm text-gray-500">Активных</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-gray-600">
                {properties.reduce((sum, p) => sum + p.views, 0)}
              </div>
              <div className="text-sm text-gray-500">Всего просмотров</div>
            </CardContent>
          </Card>
        </div>

        {/* Properties Section */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Мои объявления</h2>
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
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                У вас пока нет объявлений
              </h3>
              <p className="text-gray-600 mb-6">
                Создайте своё первое объявление прямо сейчас
              </p>
              <Link href="/properties/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
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
                        <h3 className="font-semibold text-lg mb-1">
                          {property.title}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          {property.address}, {property.city}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            {property.views} просмотров
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(property.createdAt).toLocaleDateString(
                              'ru-RU'
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-bold text-blue-600 mb-2">
                          {property.price.toLocaleString()} у.е.
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
