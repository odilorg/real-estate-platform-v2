'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { api } from '@/lib/api';
import { useTranslations } from 'next-intl';

export default function NewLeadPage() {
  const router = useRouter();
  const t = useTranslations('crm.leads.newPage');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    telegram: '',
    whatsapp: '',
    propertyType: '',
    listingType: '',
    budget: '',
    bedrooms: '',
    requirements: '',
    source: 'WALK_IN',
    priority: 'MEDIUM',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        source: formData.source,
        priority: formData.priority,
      };

      if (formData.email) payload.email = formData.email;
      if (formData.telegram) payload.telegram = formData.telegram;
      if (formData.whatsapp) payload.whatsapp = formData.whatsapp;
      if (formData.propertyType) payload.propertyType = formData.propertyType;
      if (formData.listingType) payload.listingType = formData.listingType;
      if (formData.budget) payload.budget = parseFloat(formData.budget);
      if (formData.bedrooms) payload.bedrooms = parseInt(formData.bedrooms);
      if (formData.requirements) payload.requirements = formData.requirements;
      if (formData.notes) payload.notes = formData.notes;

      await api.post('/developer-crm/leads', payload);
      setSuccess(true);
      setTimeout(() => {
      router.push('/developer/crm/leads');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to create lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-6">
      <div className="flex items-center gap-4">
        <Link href="/developer/crm/leads">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            ✅ {t('successMessage')}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Contact Information */}
        <div className="bg-white p-6 rounded-lg shadow" role="region" aria-labelledby="contact-info">
          <h2 id="contact-info" className="text-lg md:text-xl font-semibold text-gray-900 mb-4">{t('contactInfo')}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('firstName')} *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('lastName')} *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')} *</label>
                <input
                  type="tel" pattern="+998[0-9]{9}"
                  required
                  placeholder="+998901234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">{t('phoneFormat')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('telegram')}</label>
                <input
                  type="text"
                  placeholder="@username"
                  value={formData.telegram}
                  onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('whatsapp')}</label>
                <input
                  type="tel" pattern="+998[0-9]{9}"
                  placeholder="+998901234567"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Property Requirements */}
        <div className="bg-white p-6 rounded-lg shadow" role="region" aria-labelledby="property-requirements">
          <h2 id="property-requirements" className="text-lg md:text-xl font-semibold text-gray-900 mb-4">{t('propertyRequirements')}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('propertyType')}</label>
                <select
                  value={formData.propertyType}
                  onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t('selectType')}</option>
                  <option value="APARTMENT">{t('apartment')}</option>
                  <option value="HOUSE">{t('house')}</option>
                  <option value="TOWNHOUSE">{t('townhouse')}</option>
                  <option value="LAND">{t('land')}</option>
                  <option value="COMMERCIAL">{t('commercial')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('listingType')}</label>
                <select
                  value={formData.listingType}
                  onChange={(e) => setFormData({ ...formData, listingType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t('selectType')}</option>
                  <option value="SALE">{t('sale')}</option>
                  <option value="RENT_LONG">{t('rentLong')}</option>
                  <option value="RENT_DAILY">{t('rentDaily')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('budget')}</label>
                <input
                  type="number"
                  placeholder="50000000"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">{t('budgetHint')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('bedrooms')}</label>
                <input
                  type="number"
                  placeholder="3"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('additionalRequirements')}</label>
              <textarea
                rows={4}
                placeholder={t('requirementsPlaceholder')}
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Lead Info */}
        <div className="bg-white p-6 rounded-lg shadow" role="region" aria-labelledby="lead-info">
          <h2 id="lead-info" className="text-lg md:text-xl font-semibold text-gray-900 mb-4">{t('leadInfo')}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('leadSource')} *</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="WALK_IN">{t('sourceWalkIn')}</option>
                  <option value="AGENT">{t('sourceAgent')}</option>
                  <option value="PHONE_CALL">{t('sourcePhoneCall')}</option>
                  <option value="WEBSITE">{t('sourceWebsite')}</option>
                  <option value="SOCIAL_MEDIA">{t('sourceSocialMedia')}</option>
                  <option value="REFERRAL">{t('sourceReferral')}</option>
                  <option value="OTHER">{t('sourceOther')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('priorityLabel')} *</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="LOW">{t('priorityLow')}</option>
                  <option value="MEDIUM">{t('priorityMedium')}</option>
                  <option value="HIGH">{t('priorityHigh')}</option>
                  <option value="URGENT">{t('priorityUrgent')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('notes')}</label>
              <textarea
                rows={4}
                placeholder={t('notesPlaceholder')}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link href="/developer/crm/leads">
            <button type="button" className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" disabled={loading}>
              {t('cancel')}
            </button>
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('saving')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {t('save')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
