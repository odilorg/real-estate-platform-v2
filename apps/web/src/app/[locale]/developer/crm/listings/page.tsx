'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Building, Home, MapPin, DollarSign, Grid, List, Calendar } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { api } from '@/lib/api';
import { useTranslations } from 'next-intl';

interface Listing {
  id: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  propertyType: 'APARTMENT' | 'HOUSE' | 'TOWNHOUSE' | 'LAND' | 'COMMERCIAL';
  listingType: 'SALE' | 'RENT_LONG' | 'RENT_DAILY';
  status: 'ACTIVE' | 'PENDING' | 'SOLD' | 'RENTED' | 'INACTIVE';
  address: string;
  city: string;
  district?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  floor?: number;
  totalFloors?: number;
  images?: string[];
  member: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  SOLD: 'bg-blue-100 text-blue-800',
  RENTED: 'bg-purple-100 text-purple-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
};

export default function ListingsPage() {
  const t = useTranslations('crm.listings');
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterListingType, setFilterListingType] = useState<string>('ALL');

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    filterListings();
  }, [listings, searchQuery, filterStatus, filterType, filterListingType]);

  const fetchListings = async () => {
    try {
      const data = await api.get<Listing[]>('/developer-crm/listings');
      setListings(data);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterListings = () => {
    let filtered = [...listings];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (listing) =>
          listing.title.toLowerCase().includes(query) ||
          listing.address.toLowerCase().includes(query) ||
          listing.city.toLowerCase().includes(query) ||
          listing.district?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter((listing) => listing.status === filterStatus);
    }

    // Property type filter
    if (filterType !== 'ALL') {
      filtered = filtered.filter((listing) => listing.propertyType === filterType);
    }

    // Listing type filter
    if (filterListingType !== 'ALL') {
      filtered = filtered.filter((listing) => listing.listingType === filterListingType);
    }

    setFilteredListings(filtered);
  };

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'UZS') {
      return new Intl.NumberFormat('ru-RU').format(price) + ' сум';
    }
    return '$' + new Intl.NumberFormat('en-US').format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Statistics
  const stats = {
    total: listings.length,
    active: listings.filter((l) => l.status === 'ACTIVE').length,
    pending: listings.filter((l) => l.status === 'PENDING').length,
    sold: listings.filter((l) => l.status === 'SOLD' || l.status === 'RENTED').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-24 md:pb-6 w-full">
      {/* Header */}
      <div className="space-y-4 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
          </div>
          <Link href="/developer/crm/listings/new">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors">
              <Plus className="h-5 w-5" />
              <span>{t('addListing')}</span>
            </button>
          </Link>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">{t('stats.total')}</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">{t('stats.active')}</div>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">{t('stats.pending')}</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">{t('stats.closed')}</div>
            <div className="text-2xl font-bold text-blue-600">{stats.sold}</div>
          </div>
        </div>

        {/* Search and filters */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">{t('filters.allStatuses')}</option>
              <option value="ACTIVE">{t('status.ACTIVE')}</option>
              <option value="PENDING">{t('status.PENDING')}</option>
              <option value="SOLD">{t('status.SOLD')}</option>
              <option value="RENTED">{t('status.RENTED')}</option>
              <option value="INACTIVE">{t('status.INACTIVE')}</option>
            </select>

            {/* Property type filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">{t('filters.allTypes')}</option>
              <option value="APARTMENT">{t('propertyType.APARTMENT')}</option>
              <option value="HOUSE">{t('propertyType.HOUSE')}</option>
              <option value="COMMERCIAL">{t('propertyType.COMMERCIAL')}</option>
              <option value="LAND">{t('propertyType.LAND')}</option>
            </select>

            {/* Listing type filter */}
            <select
              value={filterListingType}
              onChange={(e) => setFilterListingType(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">{t('filters.allDeals')}</option>
              <option value="SALE">{t('listingType.SALE')}</option>
              <option value="RENT_LONG">{t('listingType.RENT_LONG')}</option>
              <option value="RENT_DAILY">{t('listingType.RENT_DAILY')}</option>
            </select>

            {/* View mode toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-600'}`}
                aria-label="Grid view"
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 border-l ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-600'}`}
                aria-label="List view"
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Listings */}
      {filteredListings.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noListings')}</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || filterStatus !== 'ALL' || filterType !== 'ALL'
              ? t('noListingsSearch')
              : t('noListingsHint')}
          </p>
          {!searchQuery && filterStatus === 'ALL' && filterType === 'ALL' && (
            <Link href="/developer/crm/listings/new">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
                {t('addFirst')}
              </button>
            </Link>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredListings.map((listing) => (
            <Link key={listing.id} href={`/developer/crm/listings/${listing.id}`}>
              <div className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden">
                {/* Image */}
                <div className="h-48 bg-gray-100 relative">
                  {listing.images && listing.images.length > 0 ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Building className="h-16 w-16 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[listing.status]}`}>
                      {t(`status.${listing.status}` as any)}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {t(`listingType.${listing.listingType}` as any)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{listing.title}</h3>

                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-xl font-bold text-gray-900">
                      {formatPrice(listing.price, listing.currency)}
                    </span>
                    {listing.area && (
                      <span className="text-sm text-gray-500">
                        ({Math.round(listing.price / listing.area)} {t('perSqm')})
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{listing.address}, {listing.city}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 flex-shrink-0" />
                      <span>{t(`propertyType.${listing.propertyType}` as any)}</span>
                      {listing.bedrooms && <span>• {listing.bedrooms} {t('rooms')}</span>}
                      {listing.area && <span>• {listing.area} м²</span>}
                    </div>

                    {listing.floor && (
                      <div className="text-xs text-gray-500">
                        {t('floor')} {listing.floor}
                        {listing.totalFloors && ` ${t('floorOf')} ${listing.totalFloors}`}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                    <span>{listing.member.user.firstName} {listing.member.user.lastName}</span>
                    <span>{formatDate(listing.createdAt)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredListings.map((listing) => (
            <Link key={listing.id} href={`/developer/crm/listings/${listing.id}`}>
              <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow p-4">
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    {listing.images && listing.images.length > 0 ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Building className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{listing.title}</h3>
                      <div className="flex gap-2 flex-shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[listing.status]}`}>
                          {t(`status.${listing.status}` as any)}
                        </span>
                      </div>
                    </div>

                    <div className="text-xl font-bold text-gray-900 mb-3">
                      {formatPrice(listing.price, listing.currency)}
                      {listing.area && (
                        <span className="text-sm font-normal text-gray-500 ml-2">
                          ({Math.round(listing.price / listing.area)} {t('perSqm')})
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{listing.city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 flex-shrink-0" />
                        <span>{t(`propertyType.${listing.propertyType}` as any)}</span>
                      </div>
                      {listing.bedrooms && (
                        <div>{listing.bedrooms} {t('rooms')}</div>
                      )}
                      {listing.area && (
                        <div>{listing.area} м²</div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                      <span>{listing.member.user.firstName} {listing.member.user.lastName}</span>
                      <div className="flex items-center gap-4">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                          {t(`listingType.${listing.listingType}` as any)}
                        </span>
                        <span>{formatDate(listing.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
