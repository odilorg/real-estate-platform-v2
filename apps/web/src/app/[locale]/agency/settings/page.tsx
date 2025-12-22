'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Building, Loader2, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';

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
}

export default function AgencySettingsPage() {
  const router = useRouter();
  const t = useTranslations('agencySettingsPage');
  const [agency, setAgency] = useState<Agency | null>(null);
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    logo: '',
  });

  useEffect(() => {
    fetchAgency();
  }, []);

  const fetchAgency = async () => {
    try {
      const response = await api.get<any>('/agency/profile');
      setAgency(response.agency);
      setRole(response.role);
      setFormData({
        name: response.agency.name || '',
        description: response.agency.description || '',
        phone: response.agency.phone || '',
        email: response.agency.email || '',
        website: response.agency.website || '',
        address: response.agency.address || '',
        logo: response.agency.logo || '',
      });
    } catch (error) {
      console.error('Error fetching agency:', error);
      setError(t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.put('/agency/profile', formData);
      setSuccess(t('updateSuccess'));
      setTimeout(() => {
        router.push('/agency/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || t('updateError'));
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">{t('noAgency')}</p>
        </div>
      </div>
    );
  }

  // Check permissions
  const canEdit = role === 'OWNER' || role === 'ADMIN';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/agency/dashboard" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t('backToDashboard')}
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {!canEdit && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          {t('permissionWarning')}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-6">
            <Building className="h-5 w-5 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900">{t('profileInformation')}</h2>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('logo')}
              </label>
              <div className="flex items-center gap-4">
                {formData.logo && (
                  <img
                    src={formData.logo}
                    alt={t('logo')}
                    className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                  />
                )}
                <input
                  type="url"
                  disabled={!canEdit}
                  value={formData.logo}
                  onChange={(e) => handleChange('logo', e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder={t('logoPlaceholder')}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">{t('logoHint')}</p>
            </div>

            {/* Agency Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('agencyName')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                placeholder={t('agencyNamePlaceholder')}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('description')}
              </label>
              <textarea
                disabled={!canEdit}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                placeholder={t('descriptionPlaceholder')}
              />
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('email')}
                </label>
                <input
                  type="email"
                  disabled={!canEdit}
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder={t('emailPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('phone')}
                </label>
                <input
                  type="tel"
                  disabled={!canEdit}
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  placeholder={t('phonePlaceholder')}
                />
              </div>
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('website')}
              </label>
              <input
                type="url"
                disabled={!canEdit}
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                placeholder={t('websitePlaceholder')}
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('address')}
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                placeholder={t('addressPlaceholder')}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="flex items-center justify-end gap-4">
            <Link href="/agency/dashboard">
              <button
                type="button"
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                {t('cancel')}
              </button>
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? t('saving') : t('saveChanges')}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
