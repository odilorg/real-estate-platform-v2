'use client';

import { Building2, Home, Building, Store, LandPlot, Factory } from 'lucide-react';
import { WizardFormData } from '../PropertyCreationWizard';

interface Step1PropertyTypeProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  errors: Record<string, string>;
}

const PROPERTY_TYPES = [
  {
    value: 'APARTMENT',
    label: 'Квартира',
    icon: Building2,
    description: 'Квартира в многоквартирном доме',
  },
  {
    value: 'HOUSE',
    label: 'Дом',
    icon: Home,
    description: 'Частный дом или коттедж',
  },
  {
    value: 'TOWNHOUSE',
    label: 'Таунхаус',
    icon: Building,
    description: 'Таунхаус или блокированный дом',
  },
  {
    value: 'CONDO',
    label: 'Кондоминиум',
    icon: Building2,
    description: 'Кондоминиум с общей территорией',
  },
  {
    value: 'LAND',
    label: 'Земельный участок',
    icon: LandPlot,
    description: 'Участок земли для строительства',
  },
  {
    value: 'COMMERCIAL',
    label: 'Коммерческая',
    icon: Factory,
    description: 'Офис, торговое помещение, склад',
  },
];

const LISTING_TYPES = [
  {
    value: 'SALE',
    label: 'Продажа',
    description: 'Продать недвижимость',
    color: 'blue',
  },
  {
    value: 'RENT_LONG',
    label: 'Длительная аренда',
    description: 'Сдать в аренду на длительный срок',
    color: 'green',
  },
  {
    value: 'RENT_DAILY',
    label: 'Посуточная аренда',
    description: 'Сдать посуточно',
    color: 'purple',
  },
];

export default function Step1PropertyType({
  formData,
  updateFormData,
  errors,
}: Step1PropertyTypeProps) {
  return (
    <div className="space-y-8">
      {/* Property Type Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Тип недвижимости</h3>
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
                      {type.label}
                    </div>
                    <div className="text-sm text-gray-500">
                      {type.description}
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
        <h3 className="text-lg font-semibold mb-4">Тип объявления</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {LISTING_TYPES.map((type) => {
            const isSelected = formData.listingType === type.value;
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
                    {type.label}
                  </div>
                  <div className="text-sm text-gray-500">{type.description}</div>
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

      {/* Helpful Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Полезные советы</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• Выберите тип недвижимости, который точно описывает ваш объект</li>
          <li>
            • Для посуточной аренды лучше подходят квартиры в центре города
          </li>
          <li>• Коммерческая недвижимость имеет дополнительные параметры</li>
        </ul>
      </div>
    </div>
  );
}
