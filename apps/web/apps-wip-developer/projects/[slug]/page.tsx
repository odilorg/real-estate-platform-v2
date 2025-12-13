'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  Package,
  DollarSign,
  Users,
  Edit,
  Image,
  FileText,
  BarChart3,
  Home,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Mail,
  Plus,
  Loader2,
} from 'lucide-react';

export default function ProjectDetailPage({ params }: { params: { slug: string; locale: string } }) {
  const t = useTranslations('developer.projectDetail');
  const [activeTab, setActiveTab] = useState<'details' | 'units' | 'leads' | 'media' | 'analytics'>('details');
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/developer-projects/slug/${params.slug}`);

        if (!response.ok) {
          throw new Error('Failed to fetch project');
        }

        const data = await response.json();
        setProject(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [params.slug]);

  const statusConfig: Record<string, { label: string; color: string; labelUz: string }> = {
    PLANNING: {
      label: 'Планируется',
      labelUz: 'Rejalashtirilmoqda',
      color: 'bg-yellow-100 text-yellow-800',
    },
    UNDER_CONSTRUCTION: {
      label: 'Строится',
      labelUz: 'Qurilmoqda',
      color: 'bg-blue-100 text-blue-800',
    },
    COMPLETED: {
      label: 'Завершено',
      labelUz: 'Tugallangan',
      color: 'bg-green-100 text-green-800',
    },
    HANDED_OVER: {
      label: 'Сдано',
      labelUz: 'Topshirilgan',
      color: 'bg-gray-100 text-gray-800',
    },
    CANCELLED: {
      label: 'Отменено',
      labelUz: 'Bekor qilingan',
      color: 'bg-red-100 text-red-800',
    },
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !project) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-red-900">{t('error.title')}</h3>
            <p className="text-red-700 mt-1">{error || t('error.notFound')}</p>
            <Link
              href="/developer/projects"
              className="inline-flex items-center gap-2 mt-4 text-sm text-red-600 hover:text-red-800 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('actions.backToProjects')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // TODO: Fetch units from API
  const units: any[] = project.properties || [];

  // TODO: Fetch leads from API
  const leads: any[] = [];

  const completionDate = new Date(project.completionDate);
  const formattedDate = completionDate.toLocaleDateString(params.locale === 'uz' ? 'uz-UZ' : 'ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const tabs = [
    { id: 'details' as const, label: t('tabs.details'), icon: FileText },
    { id: 'units' as const, label: t('tabs.units'), icon: Home },
    { id: 'leads' as const, label: t('tabs.leads'), icon: Users },
    { id: 'media' as const, label: t('tabs.media'), icon: Image },
    { id: 'analytics' as const, label: t('tabs.analytics'), icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/developer/projects"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {params.locale === 'uz' && project.nameUz ? project.nameUz : project.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-500">
                {params.locale === 'uz' ? project.city.nameUz : project.city.nameRu},{' '}
                {params.locale === 'uz' ? project.district.nameUz : project.district.nameRu}
              </p>
            </div>
          </div>
        </div>
        <Link
          href={`/developer/projects/${project.slug}/edit`}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Edit className="w-4 h-4 mr-2" />
          {t('actions.edit')}
        </Link>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            statusConfig[project.status]?.color || 'bg-gray-100 text-gray-800'
          }`}
        >
          {params.locale === 'uz'
            ? statusConfig[project.status]?.labelUz
            : statusConfig[project.status]?.label}
        </span>
        <span className="text-sm text-gray-500">
          {t('completionDate')}: {formattedDate}
        </span>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Units */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('stats.totalUnits')}</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">
                {project.totalUnits}
              </p>
            </div>
            <div className="bg-blue-100 rounded-lg p-3">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Units Sold */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('stats.unitsSold')}</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">
                {project.unitsSold}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {Math.round((project.unitsSold / project.totalUnits) * 100)}% {t('stats.sold')}
              </p>
            </div>
            <div className="bg-green-100 rounded-lg p-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Units Available */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('stats.unitsAvailable')}</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">
                {project.unitsAvailable}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {Math.round((project.unitsAvailable / project.totalUnits) * 100)}% {t('stats.available')}
              </p>
            </div>
            <div className="bg-purple-100 rounded-lg p-3">
              <Home className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('stats.revenue')}</p>
              <p className="text-2xl font-semibold text-gray-900 mt-2">
                ${project.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="bg-orange-100 rounded-lg p-3">
              <DollarSign className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow rounded-lg p-6">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">{t('details.title')}</h2>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">{t('details.description')}</h3>
                <p className="text-sm text-gray-600">
                  {params.locale === 'uz' && project.descriptionUz
                    ? project.descriptionUz
                    : project.description}
                </p>
              </div>

              {/* Project Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">{t('details.address')}</h3>
                  <p className="text-sm text-gray-600">
                    {params.locale === 'uz' && project.addressUz ? project.addressUz : project.address}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">{t('details.priceRange')}</h3>
                  <p className="text-sm text-gray-600">
                    ${project.priceFrom.toLocaleString()} - ${project.priceTo.toLocaleString()}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">{t('details.floors')}</h3>
                  <p className="text-sm text-gray-600">{project.floors}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">{t('details.entrances')}</h3>
                  <p className="text-sm text-gray-600">{project.entrances}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">{t('details.parking')}</h3>
                  <p className="text-sm text-gray-600">{project.parkingSpaces}</p>
                </div>
              </div>

              {/* Amenities */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">{t('details.amenities')}</h3>
                <div className="flex flex-wrap gap-2">
                  {(params.locale === 'uz' ? project.amenitiesUz : project.amenities).map((amenity, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Units Tab */}
        {activeTab === 'units' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">{t('units.title')}</h2>
              <Link
                href={`/developer/projects/${project.slug}/units/new`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('units.addUnit')}
              </Link>
            </div>

            {units.length === 0 ? (
              <div className="text-center py-12">
                <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('units.noUnits')}</h3>
                <p className="text-sm text-gray-500 mb-4">{t('units.noUnitsDescription')}</p>
                <Link
                  href={`/developer/projects/${project.slug}/units/new`}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('units.addFirstUnit')}
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('units.table.number')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('units.table.type')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('units.table.floor')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('units.table.area')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('units.table.price')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('units.table.status')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {units.map((unit: any) => (
                      <tr key={unit.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {unit.number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {unit.rooms} {t('units.table.rooms')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {unit.floor}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {unit.area} {t('units.table.sqm')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${unit.price.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            unit.status === 'AVAILABLE'
                              ? 'bg-green-100 text-green-800'
                              : unit.status === 'RESERVED'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {unit.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Leads Tab */}
        {activeTab === 'leads' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">{t('leads.title')}</h2>
            </div>

            {leads.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('leads.noLeads')}</h3>
                <p className="text-sm text-gray-500">{t('leads.noLeadsDescription')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('leads.table.contact')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('leads.table.status')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('leads.table.source')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('leads.table.date')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leads.map((lead: any) => (
                      <tr key={lead.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                          <div className="text-sm text-gray-500">{lead.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {lead.source}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Media Tab */}
        {activeTab === 'media' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">{t('media.title')}</h2>
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('media.uploadMedia')}
              </button>
            </div>

            <div className="text-center py-12">
              <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('media.noMedia')}</h3>
              <p className="text-sm text-gray-500 mb-4">{t('media.noMediaDescription')}</p>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-6">{t('analytics.title')}</h2>

            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('analytics.comingSoon')}</h3>
              <p className="text-sm text-gray-500">{t('analytics.comingSoonDescription')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
