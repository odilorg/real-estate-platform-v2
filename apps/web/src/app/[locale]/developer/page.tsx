'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DeveloperStats } from './components/DeveloperStats';
import { Search, FolderPlus, Users, FileText, Building, Plus, Eye, Edit, Trash2, MapPin, Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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

export default function DeveloperDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  // Check if user has developer role
  const isDeveloper = user?.role === 'DEVELOPER_ADMIN' || user?.role === 'DEVELOPER_SALES_AGENT';

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Redirect or show access denied if not a developer
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <ShieldAlert className="h-16 w-16 text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Требуется авторизация</h2>
        <p className="text-gray-600 mb-4">Войдите в систему для доступа к панели застройщика</p>
        <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Войти
        </Link>
      </div>
    );
  }

  if (!isDeveloper) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Доступ запрещен</h2>
        <p className="text-gray-600 mb-4">
          У вас нет доступа к панели застройщика.
          Эта страница доступна только для застройщиков.
        </p>
        <Link href="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Перейти в личный кабинет
        </Link>
      </div>
    );
  }

  // TODO: Fetch developer data from API
  const stats = {
    totalProjects: 3,
    totalUnits: 450,
    unitsAvailable: 280,
    unitsSold: 170,
    activeLeads: 42,
    salesThisMonth: 12,
  };

  useEffect(() => {
    fetchMyProperties();
  }, []);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your projects and sales
        </p>
      </div>

      <DeveloperStats stats={stats} />

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href="/properties" className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Search className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Browse Properties</p>
              <p className="text-sm text-gray-500">View all listings</p>
            </div>
          </Link>

          <Link href="/developer/projects/new" className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FolderPlus className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">New Project</p>
              <p className="text-sm text-gray-500">Create a project</p>
            </div>
          </Link>

          <Link href="/developer/crm/leads" className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">View Leads</p>
              <p className="text-sm text-gray-500">Manage leads</p>
            </div>
          </Link>

          <Link href="/developer/crm/members" className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Team Members</p>
              <p className="text-sm text-gray-500">Manage team</p>
            </div>
          </Link>
        </div>
      </div>

      {/* My Properties Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900">Мои объявления</h2>
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
              <div key={property.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                  {property.images?.[0]?.url ? (
                    <img src={property.images[0].url} alt={property.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${STATUS_COLORS[property.status] || 'bg-gray-100 text-gray-800'}`}>
                      {property.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {LISTING_TYPE_LABELS[property.listingType] || property.listingType}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 truncate">{property.title}</h3>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span className="truncate">{property.address}, {property.city}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">{property.price.toLocaleString()} у.е.</p>
                  <p className="text-xs text-gray-500">{property.views} просмотров</p>
                </div>
                <div className="flex items-center gap-2">
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

      {/* Projects Overview */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Recent Projects</h2>
        <p className="text-sm text-gray-500">No projects yet. Create your first project!</p>
      </div>

      {/* Recent Leads */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Recent Leads</h2>
        <p className="text-sm text-gray-500">No leads yet.</p>
      </div>
    </div>
  );
}
