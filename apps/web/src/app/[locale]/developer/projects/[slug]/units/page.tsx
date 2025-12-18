'use client';

import { useState, useEffect, use } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Plus, Upload, Loader2 } from 'lucide-react';
import UnitTable from './components/UnitTable';
import UnitFilters from './components/UnitFilters';
import CreateUnitModal from './components/CreateUnitModal';
import BulkUploadModal from './components/BulkUploadModal';
import { useUnits } from './hooks/useUnits';

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export default function UnitsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const t = useTranslations('developer.units');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [projectLoading, setProjectLoading] = useState(true);

  // Filters state
  const [filters, setFilters] = useState({
    status: '',
    floorMin: '',
    floorMax: '',
    bedrooms: [] as number[],
    priceMin: '',
    priceMax: '',
    search: '',
  });

  // Pagination state
  const [page, setPage] = useState(1);
  const limit = 50;

  // Fetch project details
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setProjectLoading(true);
        const response = await fetch(`/api/developer-projects/slug/${resolvedParams.slug}`);
        if (!response.ok) throw new Error('Failed to fetch project');
        const data = await response.json();
        setProject(data);
      } catch (err) {
        console.error('Error fetching project:', err);
      } finally {
        setProjectLoading(false);
      }
    };

    fetchProject();
  }, [resolvedParams.slug]);

  // Fetch units with filters
  const { units, total, loading, error, refetch } = useUnits(
    project?.id,
    filters,
    page,
    limit
  );

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      floorMin: '',
      floorMax: '',
      bedrooms: [],
      priceMin: '',
      priceMax: '',
      search: '',
    });
    setPage(1);
  };

  const handleUnitCreated = () => {
    setIsCreateModalOpen(false);
    refetch();
  };

  const handleBulkUploadComplete = () => {
    setIsBulkUploadModalOpen(false);
    refetch();
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-900">Project not found</h3>
        <Link
          href="/developer/projects"
          className="inline-flex items-center gap-2 mt-4 text-sm text-red-600 hover:text-red-800 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>
      </div>
    );
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/developer/projects/${resolvedParams.slug}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {resolvedParams.locale === 'uz' && project.nameUz ? project.nameUz : project.name}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {t('subtitle')} ({total} {t('unitsTotal')})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBulkUploadModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Upload className="w-4 h-4 mr-2" />
            {t('bulkUpload')}
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('addUnit')}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm font-medium text-gray-500">{t('stats.total')}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{total}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm font-medium text-gray-500">{t('stats.available')}</p>
          <p className="text-2xl font-semibold text-green-600 mt-1">
            {units.filter((u: any) => u.status === 'AVAILABLE').length}
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm font-medium text-gray-500">{t('stats.reserved')}</p>
          <p className="text-2xl font-semibold text-yellow-600 mt-1">
            {units.filter((u: any) => u.status === 'RESERVED').length}
          </p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-sm font-medium text-gray-500">{t('stats.sold')}</p>
          <p className="text-2xl font-semibold text-red-600 mt-1">
            {units.filter((u: any) => u.status === 'SOLD').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <UnitFilters
        filters={filters}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      {/* Units Table */}
      <div className="bg-white shadow rounded-lg">
        <UnitTable
          units={units}
          loading={loading}
          error={error}
          projectId={project.id}
          onUpdate={refetch}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                <span className="font-medium">{Math.min(page * limit, total)}</span> of{' '}
                <span className="font-medium">{total}</span> results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    // Show first page, last page, current page and adjacent pages
                    return (
                      p === 1 ||
                      p === totalPages ||
                      (p >= page - 2 && p <= page + 2)
                    );
                  })
                  .map((p, idx, arr) => {
                    // Add ellipsis
                    if (idx > 0 && p - arr[idx - 1] > 1) {
                      return (
                        <span key={`ellipsis-${p}`} className="px-3 py-1 text-gray-500">
                          ...
                        </span>
                      );
                    }
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-3 py-1 border rounded-md text-sm font-medium ${
                          page === p
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateUnitModal
          projectId={project.id}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleUnitCreated}
        />
      )}

      {isBulkUploadModalOpen && (
        <BulkUploadModal
          projectId={project.id}
          onClose={() => setIsBulkUploadModalOpen(false)}
          onSuccess={handleBulkUploadComplete}
        />
      )}
    </div>
  );
}
