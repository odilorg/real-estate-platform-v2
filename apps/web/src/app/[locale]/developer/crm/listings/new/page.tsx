'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Building, MapPin, Info, User } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { api } from '@/lib/api';
import { useTranslations } from 'next-intl';

export default function NewListingPage() {
  const router = useRouter();
  const t = useTranslations('crm.listings');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    // Basic info
    title: '',
    description: '',
    price: '',
    currency: 'UZS',
    propertyType: 'APARTMENT',
    listingType: 'SALE',
    marketType: 'NEW_BUILDING',

    // Location
    address: '',
    city: 'Tashkent',
    district: '',
    mahalla: '',
    latitude: '',
    longitude: '',

    // Property details
    bedrooms: '',
    bathrooms: '',
    area: '',
    floor: '',
    totalFloors: '',
    buildingType: 'MONOLITHIC',
    buildingClass: 'COMFORT',
    renovation: 'NONE',
    yearBuilt: '',
    amenities: [] as string[],

    // Owner details
    ownerName: '',
    ownerPhone: '',
    ownerIsAnonymous: false,

    // Notes
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : undefined,
        area: formData.area ? parseFloat(formData.area) : undefined,
        floor: formData.floor ? parseInt(formData.floor) : undefined,
        totalFloors: formData.totalFloors ? parseInt(formData.totalFloors) : undefined,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : undefined,
      };

      await api.post('/developer-crm/listings', payload);
      setSuccess(true);

      setTimeout(() => {
        router.push('/developer/crm/listings');
      }, 1500);
    } catch (error) {
      console.error('Error creating listing:', error);
      alert(t('alerts.createError'));
    } finally {
      setLoading(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const amenitiesList = [
    'Parking', 'Elevator', 'Balcony', 'Security', 'Internet',
    'Furniture', 'Air Conditioning', 'Heating', 'Playground', 'Gym'
  ];

  return (
    <div className="max-w-4xl mx-auto pb-24 md:pb-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/developer/crm/listings">
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ChevronLeft className="h-5 w-5" />
            <span>{t('detail.backToList')}</span>
          </button>
        </Link>

        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">{t('new.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('new.subtitle')}</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">
          ✅ {t('alerts.createSuccess')}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow" role="region" aria-labelledby="basic-info">
          <h2 id="basic-info" className="text-lg md:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building className="h-5 w-5" />
            {t('sections.basicInfo')}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('form.title')} *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('form.titlePlaceholder')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('form.description')} *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder={t('form.descriptionPlaceholder')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('form.price')} *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('form.currency')} *
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="UZS">{t('currency.UZS')}</option>
                  <option value="YE">{t('currency.USD')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('form.propertyType')} *
                </label>
                <select
                  value={formData.propertyType}
                  onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="APARTMENT">{t('propertyType.APARTMENT')}</option>
                  <option value="HOUSE">{t('propertyType.HOUSE')}</option>
                  <option value="TOWNHOUSE">{t('propertyType.TOWNHOUSE')}</option>
                  <option value="LAND">{t('propertyType.LAND')}</option>
                  <option value="COMMERCIAL">{t('propertyType.COMMERCIAL')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('form.listingType')} *
                </label>
                <select
                  value={formData.listingType}
                  onChange={(e) => setFormData({ ...formData, listingType: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="SALE">{t('listingType.SALE')}</option>
                  <option value="RENT_LONG">{t('listingType.RENT_LONG')}</option>
                  <option value="RENT_DAILY">{t('listingType.RENT_DAILY')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('form.market')}
              </label>
              <select
                value={formData.marketType}
                onChange={(e) => setFormData({ ...formData, marketType: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="NEW_BUILDING">{t('marketType.NEW_BUILDING')}</option>
                <option value="SECONDARY">{t('marketType.SECONDARY')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow" role="region" aria-labelledby="location-info">
          <h2 id="location-info" className="text-lg md:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t('sections.location')}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('form.address')} *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder={t('form.addressPlaceholder')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('form.city')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('form.district')}
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('form.mahalla')}
                </label>
                <input
                  type="text"
                  value={formData.mahalla}
                  onChange={(e) => setFormData({ ...formData, mahalla: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('form.latitude')}
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="41.311151"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('form.longitude')}
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="69.279737"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow" role="region" aria-labelledby="property-details">
          <h2 id="property-details" className="text-lg md:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Info className="h-5 w-5" />
            {t('sections.propertyDetails')}
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('form.bedrooms')}
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('form.bathrooms')}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('form.area')}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('form.floor')}
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('form.totalFloors')}
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.totalFloors}
                  onChange={(e) => setFormData({ ...formData, totalFloors: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('form.buildingType')}
                </label>
                <select
                  value={formData.buildingType}
                  onChange={(e) => setFormData({ ...formData, buildingType: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="BRICK">{t('buildingType.BRICK')}</option>
                  <option value="PANEL">{t('buildingType.PANEL')}</option>
                  <option value="MONOLITHIC">{t('buildingType.MONOLITHIC')}</option>
                  <option value="WOOD">{t('buildingType.WOOD')}</option>
                  <option value="BLOCK">{t('buildingType.BLOCK')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('form.buildingClass')}
                </label>
                <select
                  value={formData.buildingClass}
                  onChange={(e) => setFormData({ ...formData, buildingClass: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ECONOMY">{t('buildingClass.ECONOMY')}</option>
                  <option value="COMFORT">{t('buildingClass.COMFORT')}</option>
                  <option value="BUSINESS">{t('buildingClass.BUSINESS')}</option>
                  <option value="ELITE">{t('buildingClass.ELITE')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('form.renovation')}
                </label>
                <select
                  value={formData.renovation}
                  onChange={(e) => setFormData({ ...formData, renovation: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="NONE">{t('renovation.NONE')}</option>
                  <option value="COSMETIC">{t('renovation.COSMETIC')}</option>
                  <option value="EURO">{t('renovation.EURO')}</option>
                  <option value="DESIGNER">{t('renovation.DESIGNER')}</option>
                  <option value="NEEDS_REPAIR">{t('renovation.NEEDS_REPAIR')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('form.yearBuilt')}
                </label>
                <input
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() + 5}
                  value={formData.yearBuilt}
                  onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
                  placeholder="2020"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('form.amenities')}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {amenitiesList.map((amenity) => (
                  <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity)}
                      onChange={() => toggleAmenity(amenity)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Owner Details */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow" role="region" aria-labelledby="owner-info">
          <h2 id="owner-info" className="text-lg md:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('sections.ownerInfo')}
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="anonymous"
                checked={formData.ownerIsAnonymous}
                onChange={(e) => setFormData({ ...formData, ownerIsAnonymous: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="anonymous" className="text-sm text-gray-700 cursor-pointer">
                {t('form.ownerAnonymous')}
              </label>
            </div>

            {!formData.ownerIsAnonymous && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.ownerName')}
                  </label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.ownerPhone')}
                  </label>
                  <input
                    type="tel"
                    value={formData.ownerPhone}
                    onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                    placeholder="+998901234567"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
            {t('sections.additionalInfo')}
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('form.notes')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              placeholder={t('form.notesPlaceholder')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-white p-4 border-t border-gray-200 -mx-4 md:mx-0 md:border-0 md:p-0 md:relative">
          <Link href="/developer/crm/listings" className="flex-1 sm:flex-initial">
            <button
              type="button"
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              {t('actions.cancel')}
            </button>
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('actions.saving') : t('actions.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
