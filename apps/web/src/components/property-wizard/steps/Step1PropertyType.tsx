'use client';

import { Building2, Home, Building, Store, LandPlot, Factory, User, Briefcase, HardHat } from 'lucide-react';
import { WizardFormData } from '../PropertyCreationWizard';
import { useTranslations } from 'next-intl';

interface Step1PropertyTypeProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  errors: Record<string, string>;
}

const PROPERTY_TYPES = [
  {
    value: 'APARTMENT',
    labelKey: 'propertyTypes.apartment',
    descKey: 'propertyTypes.apartmentDesc',
    icon: Building2,
  },
  {
    value: 'HOUSE',
    labelKey: 'propertyTypes.house',
    descKey: 'propertyTypes.houseDesc',
    icon: Home,
  },
  {
    value: 'TOWNHOUSE',
    labelKey: 'propertyTypes.townhouse',
    descKey: 'propertyTypes.townhouseDesc',
    icon: Building,
  },
  {
    value: 'LAND',
    labelKey: 'propertyTypes.land',
    descKey: 'propertyTypes.landDesc',
    icon: LandPlot,
  },
  {
    value: 'COMMERCIAL',
    labelKey: 'propertyTypes.commercial',
    descKey: 'propertyTypes.commercialDesc',
    icon: Factory,
  },
];

const SELLER_TYPES = [
  {
    value: 'OWNER',
    labelKey: 'sellerTypes.owner',
    descKey: 'sellerTypes.ownerDesc',
    icon: User,
    color: 'blue',
  },
  {
    value: 'AGENT',
    labelKey: 'sellerTypes.agent',
    descKey: 'sellerTypes.agentDesc',
    icon: Briefcase,
    color: 'green',
  },
  {
    value: 'DEVELOPER',
    labelKey: 'sellerTypes.developer',
    descKey: 'sellerTypes.developerDesc',
    icon: HardHat,
    color: 'purple',
  },
];

const LISTING_TYPES = [
  {
    value: 'SALE',
    labelKey: 'listingTypes.sale',
    descKey: 'listingTypes.saleDesc',
    color: 'blue',
  },
  {
    value: 'RENT_LONG',
    labelKey: 'listingTypes.rentLong',
    descKey: 'listingTypes.rentLongDesc',
    color: 'green',
  },
  {
    value: 'RENT_DAILY',
    labelKey: 'listingTypes.rentDaily',
    descKey: 'listingTypes.rentDailyDesc',
    color: 'purple',
  },
];

const MARKET_TYPES = [
  {
    value: 'NEW_BUILDING',
    labelKey: 'marketTypes.newBuilding',
    descKey: 'marketTypes.newBuildingDesc',
    color: 'blue',
  },
  {
    value: 'SECONDARY',
    labelKey: 'marketTypes.secondary',
    descKey: 'marketTypes.secondaryDesc',
    color: 'green',
  },
];

export default function Step1PropertyType({
  formData,
  updateFormData,
  errors,
}: Step1PropertyTypeProps) {
  const t = useTranslations('wizard.step1');

  const colorClasses = {
    blue: {
      border: 'border-blue-600',
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      text: 'text-blue-600',
      hover: 'hover:border-blue-300',
    },
    green: {
      border: 'border-green-600',
      bg: 'bg-green-50',
      iconBg: 'bg-green-100',
      text: 'text-green-600',
      hover: 'hover:border-green-300',
    },
    purple: {
      border: 'border-purple-600',
      bg: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      text: 'text-purple-600',
      hover: 'hover:border-purple-300',
    },
  };

  return (
    <div className="space-y-8">
      {/* Property Type Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4">{t('propertyTypeTitle')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROPERTY_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = formData.propertyType === type.value;

            return (
              <button
                key={type.value}
                type="button"
                onClick={() => updateFormData({ propertyType: type.value })}
                className={`p-4 rounded-lg border-2 transition-all text-left hover:shadow-md ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isSelected ? 'bg-blue-100' : 'bg-gray-100'
                    }`}
                  >
                    <Icon
                      className={`h-6 w-6 ${
                        isSelected ? 'text-blue-600' : 'text-gray-600'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div
                      className={`font-semibold mb-1 ${
                        isSelected ? 'text-blue-600' : 'text-gray-900'
                      }`}
                    >
                      {t(type.labelKey as any)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {t(type.descKey as any)}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="flex-shrink-0">
                      <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        {errors.propertyType && (
          <p className="mt-2 text-sm text-red-600">{errors.propertyType}</p>
        )}
      </div>

      {/* Listing Type Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4">{t('listingTypeTitle')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {LISTING_TYPES.map((type) => {
            const isSelected = formData.listingType === type.value;
            const colors = colorClasses[type.color as keyof typeof colorClasses];

            return (
              <button
                key={type.value}
                type="button"
                onClick={() => updateFormData({ listingType: type.value })}
                className={`p-5 rounded-lg border-2 transition-all text-center hover:shadow-md ${
                  isSelected
                    ? `${colors.border} ${colors.bg} shadow-md`
                    : `border-gray-200 bg-white ${colors.hover}`
                }`}
              >
                <div className="space-y-2">
                  <div
                    className={`text-lg font-bold ${
                      isSelected ? colors.text : 'text-gray-900'
                    }`}
                  >
                    {t(type.labelKey as any)}
                  </div>
                  <div className="text-sm text-gray-500">{t(type.descKey as any)}</div>
                  {isSelected && (
                    <div className="pt-2">
                      <div
                        className={`inline-flex w-5 h-5 ${colors.iconBg} rounded-full items-center justify-center`}
                      >
                        <svg
                          className={`w-3 h-3 ${colors.text}`}
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        {errors.listingType && (
          <p className="mt-2 text-sm text-red-600">{errors.listingType}</p>
        )}
      </div>

      {/* Seller Type Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          {t('sellerTypeTitle')} <span className="text-red-500">*</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SELLER_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = formData.sellerType === type.value;
            const colors = colorClasses[type.color as keyof typeof colorClasses];

            return (
              <button
                key={type.value}
                type="button"
                onClick={() => updateFormData({ sellerType: type.value })}
                className={`p-5 rounded-lg border-2 transition-all text-center hover:shadow-md ${
                  isSelected
                    ? `${colors.border} ${colors.bg} shadow-md`
                    : `border-gray-200 bg-white ${colors.hover}`
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`p-3 rounded-full ${
                      isSelected ? colors.iconBg : 'bg-gray-100'
                    }`}
                  >
                    <Icon
                      className={`h-6 w-6 ${
                        isSelected ? colors.text : 'text-gray-600'
                      }`}
                    />
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      isSelected ? colors.text : 'text-gray-900'
                    }`}
                  >
                    {t(type.labelKey as any)}
                  </div>
                  <div className="text-sm text-gray-500">{t(type.descKey as any)}</div>
                </div>
              </button>
            );
          })}
        </div>
        {errors.sellerType && (
          <p className="mt-2 text-sm text-red-600">{errors.sellerType}</p>
        )}
      </div>

      {/* Market Type Selection (only for apartments) */}
      {formData.propertyType === 'APARTMENT' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">{t('marketTypeTitle')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MARKET_TYPES.map((type) => {
              const isSelected = formData.marketType === type.value;
              const colors = colorClasses[type.color as keyof typeof colorClasses];

              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => updateFormData({ marketType: type.value })}
                  className={`p-5 rounded-lg border-2 transition-all text-center hover:shadow-md ${
                    isSelected
                      ? `${colors.border} ${colors.bg} shadow-md`
                      : `border-gray-200 bg-white ${colors.hover}`
                  }`}
                >
                  <div className="space-y-2">
                    <div
                      className={`text-lg font-bold ${
                        isSelected ? colors.text : 'text-gray-900'
                      }`}
                    >
                      {t(type.labelKey as any)}
                    </div>
                    <div className="text-sm text-gray-500">{t(type.descKey as any)}</div>
                    {isSelected && (
                      <div className="pt-2">
                        <div
                          className={`inline-flex w-5 h-5 ${colors.iconBg} rounded-full items-center justify-center`}
                        >
                          <svg
                            className={`w-3 h-3 ${colors.text}`}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {errors.marketType && (
            <p className="mt-2 text-sm text-red-600">{errors.marketType}</p>
          )}
        </div>
      )}

      {/* Helpful Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">{t('tips.title')}</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• {t('tips.tip1')}</li>
          <li>• {t('tips.tip2')}</li>
          <li>• {t('tips.tip3')}</li>
        </ul>
      </div>
    </div>
  );
}
