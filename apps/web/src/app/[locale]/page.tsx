'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Button, PropertyCard } from '@repo/ui';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useAuth } from '@/context/AuthContext';
import {
  Search,
  MapPin,
  Building2,
  TrendingUp,
  Shield,
  Clock,
  ChevronRight,
  User,
  LogOut,
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
  bedrooms: number | null;
  bathrooms: number | null;
  area: number;
  address: string;
  city: string;
  images: PropertyImage[];
}

const CITIES = [
  'Ташкент',
  'Самарканд',
  'Бухара',
  'Навои',
  'Андижан',
  'Фергана',
];

export default function Home() {
  const t = useTranslations('home');
  const { user, isAuthenticated, logout } = useAuth();
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [recentProperties, setRecentProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const [featuredRes, recentRes] = await Promise.all([
          fetch(`${apiUrl}/properties/featured?limit=6`),
          fetch(`${apiUrl}/properties/recent?limit=8`),
        ]);

        if (featuredRes.ok) {
          const data = await featuredRes.json();
          setFeaturedProperties(data);
        }

        if (recentRes.ok) {
          const data = await recentRes.json();
          setRecentProperties(data);
        }
      } catch {
        // Ignore errors
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [apiUrl]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `/properties?search=${encodeURIComponent(searchQuery)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t('title')}
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              {t('description')}
            </p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="bg-white rounded-lg p-2 flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск по адресу, району, городу..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button type="submit" size="lg">
                Найти
              </Button>
            </form>

            {/* Quick Links */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {CITIES.map((city) => (
                <Link
                  key={city}
                  href={`/properties?city=${encodeURIComponent(city)}`}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm transition"
                >
                  {city}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      {featuredProperties.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold mb-1">Рекомендуемые объекты</h2>
                <p className="text-gray-600">Лучшие предложения недели</p>
              </div>
              <Link href="/properties?featured=true">
                <Button variant="ghost">
                  Все объекты
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.map((property) => (
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
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Property Types */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">
            Найдите идеальную недвижимость
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/properties?propertyType=APARTMENT"
              className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition text-center"
            >
              <Building2 className="h-10 w-10 mx-auto mb-3 text-blue-600" />
              <h3 className="font-semibold mb-1">Квартиры</h3>
              <p className="text-sm text-gray-500">Все квартиры</p>
            </Link>
            <Link
              href="/properties?propertyType=HOUSE"
              className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition text-center"
            >
              <svg
                className="h-10 w-10 mx-auto mb-3 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <h3 className="font-semibold mb-1">Дома</h3>
              <p className="text-sm text-gray-500">Частные дома</p>
            </Link>
            <Link
              href="/properties?propertyType=COMMERCIAL"
              className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition text-center"
            >
              <svg
                className="h-10 w-10 mx-auto mb-3 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <h3 className="font-semibold mb-1">Коммерческая</h3>
              <p className="text-sm text-gray-500">Офисы, склады</p>
            </Link>
            <Link
              href="/properties?propertyType=LAND"
              className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition text-center"
            >
              <MapPin className="h-10 w-10 mx-auto mb-3 text-blue-600" />
              <h3 className="font-semibold mb-1">Участки</h3>
              <p className="text-sm text-gray-500">Земельные участки</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Properties */}
      {recentProperties.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold mb-1">Новые объявления</h2>
                <p className="text-gray-600">Свежие предложения на рынке</p>
              </div>
              <Link href="/properties?sortBy=createdAt&sortOrder=desc">
                <Button variant="ghost">
                  Все новые
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentProperties.map((property) => (
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
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">
            Почему выбирают нас
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Проверенные объявления</h3>
              <p className="text-gray-600">
                Все объявления проходят модерацию для вашей безопасности
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Актуальные цены</h3>
              <p className="text-gray-600">
                Реальные цены от собственников без накруток
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Быстрый отклик</h3>
              <p className="text-gray-600">
                Связывайтесь с продавцами напрямую через платформу
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Готовы разместить объявление?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Разместите свою недвижимость бесплатно и найдите покупателя или
            арендатора уже сегодня
          </p>
          <Link href={isAuthenticated ? '/properties/new' : '/auth/register'}>
            <Button size="lg" variant="secondary">
              {isAuthenticated ? 'Создать объявление' : 'Начать бесплатно'}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold text-xl mb-4">RealEstate</h3>
              <p className="text-sm">
                Ведущая платформа для поиска и продажи недвижимости в Узбекистане
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Для покупателей</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/properties?listingType=SALE" className="hover:text-white">
                    Купить квартиру
                  </Link>
                </li>
                <li>
                  <Link href="/properties?listingType=RENT_LONG" className="hover:text-white">
                    Снять квартиру
                  </Link>
                </li>
                <li>
                  <Link href="/properties?propertyType=HOUSE" className="hover:text-white">
                    Дома
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Для продавцов</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/properties/new" className="hover:text-white">
                    Разместить объявление
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-white">
                    Личный кабинет
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Контакты</h4>
              <p className="text-sm">support@realestate.uz</p>
              <p className="text-sm">+998 71 123 45 67</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 RealEstate. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
