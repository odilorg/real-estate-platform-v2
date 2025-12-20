'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { api } from '@/lib/api';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditMemberPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const t = useTranslations('crm.members');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    role: 'AGENT',
    agentType: '',
    phone: '',
    telegram: '',
    whatsapp: '',
    specializations: '',
    districts: '',
    languages: '',
    licenseNumber: '',
    licenseExpiry: '',
    isActive: true,
  });

  useEffect(() => {
    fetchMember(resolvedParams.id);
  }, [resolvedParams.id]);

  const fetchMember = async (id: string) => {
    try {
      const data = await api.get<any>(`/agency-crm/members/${id}`);
      setFormData({
        role: data.role || 'AGENT',
        agentType: data.agentType || '',
        phone: data.phone || '',
        telegram: data.telegram || '',
        whatsapp: data.whatsapp || '',
        specializations: data.specializations?.join(', ') || '',
        districts: data.districts?.join(', ') || '',
        languages: data.languages?.join(', ') || '',
        licenseNumber: data.licenseNumber || '',
        licenseExpiry: data.licenseExpiry ? data.licenseExpiry.split('T')[0] : '',
        isActive: data.isActive ?? true,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload: any = {
        role: formData.role,
        phone: formData.phone || undefined,
        telegram: formData.telegram || undefined,
        whatsapp: formData.whatsapp || undefined,
        licenseNumber: formData.licenseNumber || undefined,
        licenseExpiry: formData.licenseExpiry || undefined,
        isActive: formData.isActive,
      };

      if (formData.agentType) {
        payload.agentType = formData.agentType;
      }

      if (formData.specializations) {
        payload.specializations = formData.specializations.split(',').map(s => s.trim()).filter(Boolean);
      }

      if (formData.districts) {
        payload.districts = formData.districts.split(',').map(d => d.trim()).filter(Boolean);
      }

      if (formData.languages) {
        payload.languages = formData.languages.split(',').map(l => l.trim()).filter(Boolean);
      }

      await api.put(`/agency-crm/members/${resolvedParams.id}`, payload);
      router.push(`/developer/crm/members/${resolvedParams.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update member');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-6">
      <div className="flex items-center gap-4">
        <Link href={`/developer/crm/members/${resolvedParams.id}`}>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('edit.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('edit.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">{error}</div>
        )}

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('sections.roleAndType')}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.role')} *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="OWNER">{t('roles.OWNER')}</option>
                  <option value="ADMIN">{t('roles.ADMIN')}</option>
                  <option value="SENIOR_AGENT">{t('roles.SENIOR_AGENT')}</option>
                  <option value="AGENT">{t('roles.AGENT')}</option>
                  <option value="COORDINATOR">{t('roles.COORDINATOR')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.agentType')}</label>
                <select
                  value={formData.agentType}
                  onChange={(e) => setFormData({ ...formData, agentType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t('agentTypes.notSelected')}</option>
                  <option value="GENERAL">{t('agentTypes.GENERAL')}</option>
                  <option value="RESIDENTIAL">{t('agentTypes.RESIDENTIAL')}</option>
                  <option value="COMMERCIAL">{t('agentTypes.COMMERCIAL')}</option>
                  <option value="RENTAL">{t('agentTypes.RENTAL')}</option>
                  <option value="LUXURY">{t('agentTypes.LUXURY')}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('sections.contactInfo')}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.phone')}</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.telegram')}</label>
                <input
                  type="text"
                  value={formData.telegram}
                  onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.whatsapp')}</label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('sections.professionalInfo')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.specializations')}</label>
              <input
                type="text"
                value={formData.specializations}
                onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
                placeholder={t('form.specializationsPlaceholder')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.districts')}</label>
              <input
                type="text"
                value={formData.districts}
                onChange={(e) => setFormData({ ...formData, districts: e.target.value })}
                placeholder={t('form.districtsPlaceholder')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.languages')}</label>
              <input
                type="text"
                value={formData.languages}
                onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                placeholder={t('form.languagesPlaceholder')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.licenseNumber')}</label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.licenseExpiry')}</label>
                <input
                  type="date"
                  value={formData.licenseExpiry}
                  onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('detail.status')}</h2>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              {t('form.isActive')}
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link href={`/developer/crm/members/${resolvedParams.id}`}>
            <button type="button" className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50" disabled={saving}>
              {t('actions.cancel')}
            </button>
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('actions.saving')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {t('actions.save')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
