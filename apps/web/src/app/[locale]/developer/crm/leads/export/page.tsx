'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { ArrowLeft, Download, Filter, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { api } from '@/lib/api';
import { useTranslations } from 'next-intl';

export default function LeadsExportPage() {
  const router = useRouter();
  const t = useTranslations('crm.leads.exportPage');
  const tStatuses = useTranslations('crm.leads.statuses');
  const tPriorities = useTranslations('crm.leads.priorities');
  const tSources = useTranslations('crm.leads.sources');
  const [exporting, setExporting] = useState(false);

  // Filters
  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [assignedToId, setAssignedToId] = useState<string>('');
  const [search, setSearch] = useState('');

  const handleExport = async () => {
    setExporting(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (priority) params.append('priority', priority);
      if (source) params.append('source', source);
      if (assignedToId) params.append('assignedToId', assignedToId);
      if (search) params.append('search', search);

      const result = await api.get<{ csv: string; filename: string }>(
        `/agency-crm/leads/export?${params.toString()}`
      );

      // Download CSV file
      const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = result.filename;
      link.click();

      // Show success message
      alert(t('exportSuccess'));
    } catch (error) {
      console.error('Export error:', error);
      alert(t('exportError'));
    } finally {
      setExporting(false);
    }
  };

  const handleClearFilters = () => {
    setStatus('');
    setPriority('');
    setSource('');
    setAssignedToId('');
    setSearch('');
  };

  const hasFilters = status || priority || source || assignedToId || search;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/developer/crm/leads">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
            <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Filter Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Filter className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">{t('filterInfo')}</h3>
            <p className="text-sm text-blue-700 mt-1">
              {t('filterDescription')}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{t('filtersTitle')}</h2>
          {hasFilters && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {t('clearFilters')}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('status')}</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('allStatuses')}</option>
              <option value="NEW">{tStatuses('NEW')}</option>
              <option value="CONTACTED">{tStatuses('CONTACTED')}</option>
              <option value="QUALIFIED">{tStatuses('QUALIFIED')}</option>
              <option value="NEGOTIATING">{tStatuses('NEGOTIATING')}</option>
              <option value="CONVERTED">{tStatuses('CONVERTED')}</option>
              <option value="LOST">{tStatuses('LOST')}</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('priority')}</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('allPriorities')}</option>
              <option value="URGENT">{tPriorities('URGENT')}</option>
              <option value="HIGH">{tPriorities('HIGH')}</option>
              <option value="MEDIUM">{tPriorities('MEDIUM')}</option>
              <option value="LOW">{tPriorities('LOW')}</option>
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('source')}</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('allSources')}</option>
              <option value="WEBSITE">{tSources('WEBSITE')}</option>
              <option value="REFERRAL">{tSources('REFERRAL')}</option>
              <option value="SOCIAL_MEDIA">{tSources('SOCIAL_MEDIA')}</option>
              <option value="ADVERTISING">{tSources('ADVERTISING')}</option>
              <option value="COLD_CALL">{tSources('COLD_CALL')}</option>
              <option value="CSV_IMPORT">{tSources('CSV_IMPORT')}</option>
              <option value="OTHER">{tSources('OTHER')}</option>
            </select>
          </div>

          {/* Search Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('search')}</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasFilters && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-medium">{t('activeFilters')}</span>{' '}
              {[
                status && `${t('statusLabel')}: ${status}`,
                priority && `${t('priorityLabel')}: ${priority}`,
                source && `${t('sourceLabel')}: ${source}`,
                search && `${t('searchLabel')}: "${search}"`,
              ]
                .filter(Boolean)
                .join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Export Info */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('whatExported')}</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• {t('exportedFields.contacts')}</p>
          <p>• {t('exportedFields.property')}</p>
          <p>• {t('exportedFields.requirements')}</p>
          <p>• {t('exportedFields.status')}</p>
          <p>• {t('exportedFields.manager')}</p>
          <p>• {t('exportedFields.date')}</p>
        </div>
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <span className="font-medium">{t('note')}</span> {t('noteText')}
          </p>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end gap-3">
        <Link href="/developer/crm/leads">
          <button className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
            {t('cancel')}
          </button>
        </Link>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
        >
          {exporting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {t('exporting')}
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              {t('exportButton')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
