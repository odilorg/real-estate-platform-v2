'use client';

import { DollarSign, Maximize, Bed, Bath, Home, Layers } from 'lucide-react';
import { WizardFormData } from '../PropertyCreationWizard';

interface Step3BasicInfoProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  errors: Record<string, string>;
}

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'YE', label: 'у.е.', symbol: 'у.е.' },
  { value: 'UZS', label: 'UZS (сўм)', symbol: 'сўм' },
];

export default function Step3BasicInfo({
  formData,
  updateFormData,
  errors,
}: Step3BasicInfoProps) {
  const selectedCurrency = CURRENCIES.find((c) => c.value === formData.currency);

  return (
    <div className="space-y-6">
      {/* Price */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Цена <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => updateFormData({ price: e.target.value })}
                placeholder="150000"
                min="0"
                step="1000"
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
          </div>
          <div>
            <select
              value={formData.currency}
              onChange={(e) => updateFormData({ currency: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {CURRENCIES.map((currency) => (
                <option key={currency.value} value={currency.value}>
                  {currency.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {errors.price && (
          <p className="mt-1 text-sm text-red-600">{errors.price}</p>
        )}
        {formData.price && parseFloat(formData.price) > 0 && (
          <p className="mt-1 text-sm text-gray-500">
            ≈ {parseFloat(formData.price).toLocaleString()} {selectedCurrency?.symbol}
          </p>
        )}
      </div>

      {/* Area */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Общая площадь (м²) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Maximize className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="number"
            value={formData.area}
            onChange={(e) => updateFormData({ area: e.target.value })}
            placeholder="75"
            min="1"
            step="0.1"
            className={`w-full pl-10 pr-16 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.area ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 text-sm">м²</span>
          </div>
        </div>
        {errors.area && (
          <p className="mt-1 text-sm text-red-600">{errors.area}</p>
        )}
        {formData.price && formData.area && parseFloat(formData.area) > 0 && (
          <p className="mt-1 text-sm text-gray-500">
            Цена за м²: ≈{' '}
            {(parseFloat(formData.price) / parseFloat(formData.area)).toLocaleString(
              'ru-RU',
              { maximumFractionDigits: 0 }
            )}{' '}
            {selectedCurrency?.symbol}
          </p>
        )}
      </div>

      {/* Rooms - only for apartments/houses */}
      {['APARTMENT', 'HOUSE', 'TOWNHOUSE', 'CONDO'].includes(
        formData.propertyType
      ) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                Комнат
              </div>
            </label>
            <input
              type="number"
              value={formData.rooms}
              onChange={(e) => updateFormData({ rooms: e.target.value })}
              placeholder="3"
              min="1"
              max="20"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-1">
                <Bed className="h-4 w-4" />
                Спален
              </div>
            </label>
            <input
              type="number"
              value={formData.bedrooms}
              onChange={(e) => updateFormData({ bedrooms: e.target.value })}
              placeholder="2"
              min="0"
              max="20"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-1">
                <Bath className="h-4 w-4" />
                Санузлов
              </div>
            </label>
            <input
              type="number"
              value={formData.bathrooms}
              onChange={(e) => updateFormData({ bathrooms: e.target.value })}
              placeholder="1"
              min="0"
              max="10"
              step="0.5"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Floor and Total Floors - for apartments */}
      {['APARTMENT', 'CONDO'].includes(formData.propertyType) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-1">
                <Layers className="h-4 w-4" />
                Этаж
              </div>
            </label>
            <input
              type="number"
              value={formData.floor}
              onChange={(e) => updateFormData({ floor: e.target.value })}
              placeholder="5"
              min="1"
              max="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Укажите на каком этаже находится квартира
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-1">
                <Layers className="h-4 w-4" />
                Этажей в здании
              </div>
            </label>
            <input
              type="number"
              value={formData.totalFloors}
              onChange={(e) => updateFormData({ totalFloors: e.target.value })}
              placeholder="16"
              min="1"
              max="150"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Общее количество этажей в доме
            </p>
          </div>
        </div>
      )}

      {/* Helpful Tips */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-semibold text-purple-900 mb-2">
          💡 Полезные советы
        </h4>
        <ul className="space-y-1 text-sm text-purple-800">
          <li>
            • Цена должна быть реалистичной - завышенные цены отпугивают
            покупателей
          </li>
          <li>
            • Указывайте точную площадь - покупатели часто фильтруют по этому
            параметру
          </li>
          <li>
            • Объявления с ценой за м² привлекают на 25% больше просмотров
          </li>
          <li>
            • Первые и последние этажи обычно продаются с небольшой скидкой
          </li>
        </ul>
      </div>
    </div>
  );
}
