'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { Building, Users, UserPlus, FileText, Settings, Loader2, Edit, Search, Plus, Eye, Trash2, MapPin, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface AgencyStats {
  leads: {
    total: number;
    active: number;
  };
  members: {
    total: number;
    active: number;
  };
}

interface Agency {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  _count: {
    members: number;
    agents: number;
    leads: number;
  };
}

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

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  SOLD: 'bg-gray-100 text-gray-800',
  RENTED: 'bg-gray-100 text-gray-800',
  INACTIVE: 'bg-red-100 text-red-800',
};

export default function AgencyDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [stats, setStats] = useState<AgencyStats | null>(null);
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  // Check if user is a developer (should not access agency dashboard)
  const isDeveloper = user?.role === 'DEVELOPER_ADMIN' || user?.role === 'DEVELOPER_SALES_AGENT';

  useEffect(() => {
    if (!authLoading && user && !isDeveloper) {
      fetchAgencyData();
      fetchMyProperties();
    }
  }, [authLoading, user, isDeveloper]);

  const fetchAgencyData = async () => {
    try {
      const [profileRes, statsRes] = await Promise.all([
        api.get<any>('/agency/profile'),
        api.get<AgencyStats>('/agency/stats'),
      ]);
      setAgency(profileRes.agency);
      setRole(profileRes.role);
      setStats(statsRes);
    } catch (error) {
      console.error('Error fetching agency data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyProperties = async () => {
    setPropertiesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await fetch(`${apiUrl}/properties/my`, {
        headers,
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setProperties(data.items || data);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setPropertiesLoading(false);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить это объявление?')) return;
    setDeletingId(id);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/properties/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setProperties((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error('Error deleting property:', error);
    } finally {
      setDeletingId(null);
    }
  };

  // Show loading while checking auth
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Require login
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <ShieldAlert className="h-16 w-16 text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Требуется авторизация</h2>
        <p className="text-gray-600 mb-4">Войдите в систему для доступа к панели агентства</p>
        <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Войти
        </Link>
      </div>
    );
  }

  // Developers should not access agency dashboard
  if (isDeveloper) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Доступ запрещен</h2>
        <p className="text-gray-600 mb-4">
          У вас нет доступа к панели агентства.
          Эта страница доступна только для агентов.
        </p>
        <Link href="/developer" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Перейти в панель застройщика
        </Link>
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">Вы не привязаны ни к одному агентству</p>
          <Link href="/dashboard" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Перейти в личный кабинет
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {agency.logo && (
              <img
                src={agency.logo}
                alt={agency.name}
                className="h-16 w-16 rounded-lg object-cover border border-gray-200"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{agency.name}</h1>
              <p className="mt-1 text-sm text-gray-500">
                {role === 'OWNER' ? 'Agency Owner' : role}
              </p>
            </div>
          </div>
          <Link href="/agency/settings">
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              <Settings className="h-5 w-5" />
              Settings
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Members */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <Link href="/developer/crm/members" className="text-sm text-blue-600 hover:text-blue-700">
              View all →
            </Link>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {stats?.members.active || 0}
            </p>
            <p className="text-sm text-gray-500">Active Team Members</p>
            <p className="text-xs text-gray-400 mt-1">
              {stats?.members.total || 0} total
            </p>
          </div>
        </div>

        {/* Total Leads */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <Link href="/developer/crm/leads" className="text-sm text-green-600 hover:text-green-700">
              View all →
            </Link>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {stats?.leads.active || 0}
            </p>
            <p className="text-sm text-gray-500">Active Leads</p>
            <p className="text-xs text-gray-400 mt-1">
              {stats?.leads.total || 0} total
            </p>
          </div>
        </div>

        {/* Agents */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <UserPlus className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {agency._count.agents || 0}
            </p>
            <p className="text-sm text-gray-500">Agents</p>
          </div>
        </div>
      </div>

      {/* Agency Information */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Agency Information</h2>
          <Link href="/agency/settings">
            <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <Edit className="h-4 w-4" />
              Edit
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {agency.description && (
            <div className="col-span-2">
              <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
              <p className="text-gray-900">{agency.description}</p>
            </div>
          )}

          {agency.email && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
              <p className="text-gray-900">{agency.email}</p>
            </div>
          )}

          {agency.phone && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Phone</p>
              <p className="text-gray-900">{agency.phone}</p>
            </div>
          )}

          {agency.website && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Website</p>
              <a
                href={agency.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700"
              >
                {agency.website}
              </a>
            </div>
          )}

          {agency.address && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Address</p>
              <p className="text-gray-900">{agency.address}</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href="/properties">
            <button className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Search className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Browse Properties</p>
                <p className="text-sm text-gray-500">View all listings</p>
              </div>
            </button>
          </Link>

          <Link href="/developer/crm/members/new">
            <button className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserPlus className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Add Team Member</p>
                <p className="text-sm text-gray-500">Invite a new member</p>
              </div>
            </button>
          </Link>

          <Link href="/developer/crm/leads/new">
            <button className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Add Lead</p>
                <p className="text-sm text-gray-500">Create new lead</p>
              </div>
            </button>
          </Link>

          <Link href="/agency/settings">
            <button className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Settings className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Agency Settings</p>
                <p className="text-sm text-gray-500">Update profile</p>
              </div>
            </button>
          </Link>
        </div>
      </div>

      {/* My Properties Section */}
      <div className="bg-white rounded-lg shadow p-6 mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Мои объявления</h2>
          <Link href="/properties/new">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              Создать
            </button>
          </Link>
        </div>

        {propertiesLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-8">
            <Building className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">У вас пока нет объявлений</p>
            <Link href="/properties/new">
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                Создать объявление
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {properties.slice(0, 5).map((property) => (
              <div key={property.id} className="flex items-start gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                  {property.images?.[0]?.url ? (
                    <img src={property.images[0].url} alt={property.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building className="h-6 w-6 sm:h-8 sm:w-8 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className={`px-1.5 sm:px-2 py-0.5 text-xs font-medium rounded ${STATUS_COLORS[property.status] || 'bg-gray-100 text-gray-800'}`}>
                        {property.status}
                      </span>
                      <span className="hidden sm:inline text-xs text-gray-500">
                        {LISTING_TYPE_LABELS[property.listingType] || property.listingType}
                      </span>
                    </div>
                    {/* Price - visible on all screens */}
                    <p className="text-sm sm:text-lg font-bold text-blue-600 whitespace-nowrap">{property.price.toLocaleString()} у.е.</p>
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base line-clamp-1 sm:truncate">{property.title}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">{property.views} просмотров</p>
                    {/* Mobile action buttons */}
                    <div className="flex sm:hidden items-center gap-1">
                      <Link href={`/properties/${property.id}`}>
                        <button className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </Link>
                      <Link href={`/properties/${property.id}/edit`}>
                        <button className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded">
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDeleteProperty(property.id)}
                        disabled={deletingId === property.id}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                      >
                        {deletingId === property.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center text-sm text-gray-500 mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span className="truncate">{property.address}, {property.city}</span>
                  </div>
                </div>
                {/* Desktop action buttons */}
                <div className="hidden sm:flex items-center gap-2">
                  <Link href={`/properties/${property.id}`}>
                    <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Eye className="h-4 w-4" />
                    </button>
                  </Link>
                  <Link href={`/properties/${property.id}/edit`}>
                    <button className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg">
                      <Edit className="h-4 w-4" />
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDeleteProperty(property.id)}
                    disabled={deletingId === property.id}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                  >
                    {deletingId === property.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
            {properties.length > 5 && (
              <div className="text-center pt-4">
                <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Показать все ({properties.length}) →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
