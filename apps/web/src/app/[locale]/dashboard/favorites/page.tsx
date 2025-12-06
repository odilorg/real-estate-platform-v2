'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PropertyCard, Button } from '@repo/ui';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft,
  Heart,
  Loader2,
  Trash2,
} from 'lucide-react';

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
}

interface FavoriteItem {
  id: string;
  createdAt: string;
  property: Property;
}

export default function FavoritesPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!isAuthenticated) return;

      const token = getAuthToken();
      if (!token) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${apiUrl}/favorites`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Ошибка загрузки избранного');
        }

        const data = await response.json();
        setFavorites(data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [isAuthenticated, apiUrl]);

  const handleRemoveFavorite = async (propertyId: string) => {
    const token = getAuthToken();
    if (!token) return;

    setRemovingId(propertyId);
    try {
      const response = await fetch(`${apiUrl}/favorites/${propertyId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setFavorites((prev) =>
          prev.filter((f) => f.property.id !== propertyId)
        );
      }
    } catch {
      // Ignore errors
    } finally {
      setRemovingId(null);
    }
  };

  if (authLoading || loading) {
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
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Назад
                </Button>
              </Link>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Избранное
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && favorites.length === 0 && (
          <div className="text-center py-20">
            <div className="text-gray-400 mb-4">
              <Heart className="h-16 w-16 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              У вас пока нет избранных объектов
            </h2>
            <p className="text-gray-600 mb-6">
              Нажмите на сердечко на странице объекта, чтобы добавить его в
              избранное
            </p>
            <Link href="/properties">
              <Button>Смотреть объекты</Button>
            </Link>
          </div>
        )}

        {/* Favorites Grid */}
        {!loading && !error && favorites.length > 0 && (
          <>
            <div className="mb-4">
              <p className="text-gray-600">
                {favorites.length}{' '}
                {favorites.length === 1
                  ? 'объект'
                  : favorites.length < 5
                    ? 'объекта'
                    : 'объектов'}{' '}
                в избранном
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((favorite) => (
                <div key={favorite.id} className="relative group">
                  <Link href={`/properties/${favorite.property.id}`}>
                    <PropertyCard
                      title={favorite.property.title}
                      price={favorite.property.price}
                      listingType={favorite.property.listingType}
                      address={`${favorite.property.address}, ${favorite.property.city}`}
                      bedrooms={favorite.property.bedrooms ?? undefined}
                      bathrooms={favorite.property.bathrooms ?? undefined}
                      area={favorite.property.area}
                      imageUrl={favorite.property.images?.[0]?.url}
                    />
                  </Link>
                  <button
                    onClick={() => handleRemoveFavorite(favorite.property.id)}
                    disabled={removingId === favorite.property.id}
                    className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Удалить из избранного"
                  >
                    {removingId === favorite.property.id ? (
                      <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                    ) : (
                      <Trash2 className="h-5 w-5 text-red-500" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
