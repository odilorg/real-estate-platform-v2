'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Save, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const t = useTranslations('developer.settings');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccess(false);

    // TODO: Implement API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{t('successMessage')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t('basicInfo.title')}
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                {t('basicInfo.name')}
              </label>
              <input
                type="text"
                id="name"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="ООО Застройщик"
              />
            </div>

            <div>
              <label htmlFor="nameUz" className="block text-sm font-medium text-gray-700">
                {t('basicInfo.nameUz')}
              </label>
              <input
                type="text"
                id="nameUz"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Quruvchi MChJ"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                {t('basicInfo.slug')}
              </label>
              <input
                type="text"
                id="slug"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="my-company"
              />
              <p className="mt-1 text-sm text-gray-500">{t('basicInfo.slugHelper')}</p>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="descriptionRu" className="block text-sm font-medium text-gray-700">
                {t('basicInfo.descriptionRu')}
              </label>
              <textarea
                id="descriptionRu"
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Описание вашей компании..."
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="descriptionUz" className="block text-sm font-medium text-gray-700">
                {t('basicInfo.descriptionUz')}
              </label>
              <textarea
                id="descriptionUz"
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Kompaniya tavsifi..."
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t('contact.title')}
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                {t('contact.phone')}
              </label>
              <input
                type="tel"
                id="phone"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="+998 XX XXX XX XX"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('contact.email')}
              </label>
              <input
                type="email"
                id="email"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="info@company.uz"
              />
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                {t('contact.website')}
              </label>
              <input
                type="url"
                id="website"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="https://company.uz"
              />
            </div>

            <div>
              <label htmlFor="telegram" className="block text-sm font-medium text-gray-700">
                {t('contact.telegram')}
              </label>
              <input
                type="text"
                id="telegram"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="@company"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="officeAddress" className="block text-sm font-medium text-gray-700">
                {t('contact.officeAddress')}
              </label>
              <input
                type="text"
                id="officeAddress"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="г. Ташкент, ул. Амира Темура, 1"
              />
            </div>
          </div>
        </div>

        {/* Legal Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t('legal.title')}
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                {t('legal.city')}
              </label>
              <select
                id="city"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">{t('legal.selectCity')}</option>
                <option value="tashkent">Ташкент</option>
                <option value="samarkand">Самарканд</option>
                <option value="bukhara">Бухара</option>
              </select>
            </div>

            <div>
              <label htmlFor="legalEntity" className="block text-sm font-medium text-gray-700">
                {t('legal.legalEntity')}
              </label>
              <select
                id="legalEntity"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">{t('legal.selectLegalEntity')}</option>
                <option value="llc">ООО</option>
                <option value="jsc">ОАО</option>
                <option value="pjsc">ЗАО</option>
              </select>
            </div>

            <div>
              <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700">
                {t('legal.licenseNumber')}
              </label>
              <input
                type="text"
                id="licenseNumber"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="AB-12345"
              />
            </div>

            <div>
              <label htmlFor="innTin" className="block text-sm font-medium text-gray-700">
                {t('legal.innTin')}
              </label>
              <input
                type="text"
                id="innTin"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="123456789"
              />
            </div>

            <div>
              <label htmlFor="establishedYear" className="block text-sm font-medium text-gray-700">
                {t('legal.establishedYear')}
              </label>
              <input
                type="number"
                id="establishedYear"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="2020"
                min="1900"
                max="2025"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="legalAddress" className="block text-sm font-medium text-gray-700">
                {t('legal.legalAddress')}
              </label>
              <input
                type="text"
                id="legalAddress"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="г. Ташкент, ул. Амира Темура, 1"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin w-4 h-4 mr-2" />
                {t('saving')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {t('save')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
