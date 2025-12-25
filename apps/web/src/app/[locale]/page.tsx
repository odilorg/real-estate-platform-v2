'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Button, PropertyCard } from '@repo/ui';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useAuth } from '@/context/AuthContext';
import { CianSearchForm } from '@/components/search/CianSearchForm';
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
  Plus,
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

const CITY_KEYS = [
  'tashkent',
  'samarkand',
  'bukhara',
  'navoi',
  'andijan',
  'fergana',
];

// Map translation keys to English city names (as stored in database)
const CITY_NAME_MAP: Record<string, string> = {
  'tashkent': 'Tashkent',
  'samarkand': 'Samarkand',
  'bukhara': 'Bukhara',
  'navoi': 'Navoi',
  'andijan': 'Andijan',
  'fergana': 'Fergana',
};

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
      {/* Hero Section - Compact Mobile Design */}
      <section className="bg-gradient-to-r from-blue-800 to-blue-900 text-white py-6 md:py-10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl md:text-4xl font-bold mb-2 text-center">
              {t('title')}
            </h1>
            <p className="text-sm md:text-lg text-blue-100 mb-4 md:mb-6 text-center">
              {t('description')}
            </p>

            {/* Cian-Style Search Form */}
            <CianSearchForm />

            {/* Quick City Links */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {CITY_KEYS.map((cityKey) => (
                <Link
                  key={cityKey}
                  href={`/properties?city=${encodeURIComponent(CITY_NAME_MAP[cityKey])}`}
                  className="px-3 py-1.5 min-h-[36px] flex items-center bg-white/20 hover:bg-white/30 border border-white/30 hover:border-white/50 rounded-full text-xs md:text-sm font-medium transition-all"
                >
                  {t(`cities.${cityKey}` as any)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-6 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-6 md:gap-12">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">
                {recentProperties.length > 0 ? `${Math.max(100, recentProperties.length * 10)}+` : '100+'}
              </div>
              <div className="text-sm text-gray-600">{t('stats.properties')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">50+</div>
              <div className="text-sm text-gray-600">{t('stats.agents')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">20+</div>
              <div className="text-sm text-gray-600">{t('stats.developers')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">
                <Shield className="h-6 w-6 md:h-8 md:w-8 inline-block mb-1" />
              </div>
              <div className="text-sm text-gray-600">{t('stats.verified')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Могут подойти - Cian Style Recommendations */}
      {featuredProperties.length > 0 && (
        <section className="py-6 md:py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-xl md:text-2xl font-bold mb-4">Могут подойти</h2>

            {/* 2-column grid on mobile, 4-column on desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {featuredProperties.map((property) => (
                <Link key={property.id} href={`/properties/${property.id}`} className="block">
                  <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    {/* Property Image with Heart Icon */}
                    <div className="relative aspect-[4/3] bg-gray-200">
                      {property.images?.[0]?.url ? (
                        <img
                          src={property.images[0].url}
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      {/* Favorite Heart Icon */}
                      <button
                        onClick={(e) => { e.preventDefault(); /* TODO: Add to favorites */ }}
                        className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
                      >
                        <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>

                    {/* Property Info */}
                    <div className="p-3">
                      {/* Price - Large & Bold */}
                      <div className="text-lg md:text-xl font-bold text-gray-900 mb-1">
                        {property.price.toLocaleString('ru-RU')} {property.listingType === 'RENT_LONG' ? '₽/мес.' : '₽'}
                      </div>

                      {/* Property Specs - One Line */}
                      <div className="text-xs md:text-sm text-gray-600 mb-1">
                        {property.bedrooms && `${property.bedrooms}-комн. `}
                        {property.propertyType === 'APARTMENT' ? 'кв.' : property.propertyType.toLowerCase()} · {property.area} m²
                      </div>

                      {/* Address */}
                      <div className="text-xs text-gray-500 truncate">
                        {property.address}
                      </div>
                    </div>
                  </div>
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
            {t('propertyTypesTitle')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/properties?propertyType=APARTMENT"
              className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition text-center"
            >
              <Building2 className="h-10 w-10 mx-auto mb-3 text-blue-600" />
              <h3 className="font-semibold mb-1">{t('propertyTypes.apartments')}</h3>
              <p className="text-sm text-gray-500">{t('propertyTypes.apartmentsDesc')}</p>
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
              <h3 className="font-semibold mb-1">{t('propertyTypes.houses')}</h3>
              <p className="text-sm text-gray-500">{t('propertyTypes.housesDesc')}</p>
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
              <h3 className="font-semibold mb-1">{t('propertyTypes.commercial')}</h3>
              <p className="text-sm text-gray-500">{t('propertyTypes.commercialDesc')}</p>
            </Link>
            <Link
              href="/properties?propertyType=LAND"
              className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition text-center"
            >
              <MapPin className="h-10 w-10 mx-auto mb-3 text-blue-600" />
              <h3 className="font-semibold mb-1">{t('propertyTypes.land')}</h3>
              <p className="text-sm text-gray-500">{t('propertyTypes.landDesc')}</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Post Listing CTA - Mobile Sticky */}
      <div className="sticky bottom-4 z-10 md:hidden px-4">
        <Link href={isAuthenticated ? '/properties/new' : '/auth/register'}>
          <button className="w-full px-6 py-3.5 bg-green-600 text-white rounded-lg shadow-lg hover:shadow-xl hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2 font-semibold">
            <Plus className="h-5 w-5" />
            {t('footer.postListing')}
          </button>
        </Link>
      </div>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">
            {t('whyUsTitle')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('features.verified')}</h3>
              <p className="text-gray-600">
                {t('features.verifiedDesc')}
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('features.pricing')}</h3>
              <p className="text-gray-600">
                {t('features.pricingDesc')}
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('features.support')}</h3>
              <p className="text-gray-600">
                {t('features.supportDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {t('ctaTitle')}
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            {t('ctaSubtitle')}
          </p>
          <Link href={isAuthenticated ? '/properties/new' : '/auth/register'}>
            <Button size="lg" variant="secondary">
              {isAuthenticated ? t('ctaButtonAuth') : t('ctaButtonGuest')}
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
                {t('footer.description')}
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{t('footer.buyers')}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/properties?listingType=SALE" className="hover:text-white">
                    {t('footer.buyApartment')}
                  </Link>
                </li>
                <li>
                  <Link href="/properties?listingType=RENT_LONG" className="hover:text-white">
                    {t('footer.rentApartment')}
                  </Link>
                </li>
                <li>
                  <Link href="/properties?propertyType=HOUSE" className="hover:text-white">
                    {t('footer.houses')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{t('footer.sellers')}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/properties/new" className="hover:text-white">
                    {t('footer.postListing')}
                  </Link>
                </li>
                <li>
                  <Link href="/agents" className="hover:text-white">
                    {t('footer.agents')}
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-white">
                    {t('footer.dashboard')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{t('footer.contacts')}</h4>
              <p className="text-sm">support@realestate.uz</p>
              <p className="text-sm">+998 71 123 45 67</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 RealEstate. {t('footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
