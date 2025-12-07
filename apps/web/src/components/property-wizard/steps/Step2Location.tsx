'use client';

import { MapPin, Navigation, Map } from 'lucide-react';
import { useState } from 'react';
import { WizardFormData } from '../PropertyCreationWizard';
import { LocationPicker } from '../../location-picker';

interface Step2LocationProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  errors: Record<string, string>;
}

const CITIES = [
  'Ташкент',
  'Самарканд',
  'Бухара',
  'Андижан',
  'Наманган',
  'Фергана',
  'Навои',
  'Карши',
  'Термез',
];

const TASHKENT_DISTRICTS = [
  'Алмазарский',
  'Бектемирский',
  'Мирабадский',
  'Мирзо-Улугбекский',
  'Сергелийский',
  'Учтепинский',
  'Чиланзарский',
  'Шайхантахурский',
  'Юнусабадский',
  'Яккасарайский',
  'Яшнабадский',
];

const METRO_STATIONS = [
  'Алайский базар',
  'Амир Темур хиёбони',
  'Буюк ипак йули',
  'Бодомзор',
  'Беруний',
  'Гафур Гулом',
  'Дўстлик',
  'Дўстлик-2',
  'Космонавтлар',
  'Мирзо Улуғбек',
  'Минор',
  'Новза',
  'Олмазор',
  'Пахтакор',
  'Чилонзор',
  'Ойбек',
  'Хамид Олимжон',
  'Юнусобод',
];

export default function Step2Location({
  formData,
  updateFormData,
  errors,
}: Step2LocationProps) {
  const [showMapPicker, setShowMapPicker] = useState(false);

  return (
    <div className="space-y-6">
      {/* City Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Город <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.city}
          onChange={(e) => updateFormData({ city: e.target.value })}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.city ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Выберите город</option>
          {CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        {errors.city && (
          <p className="mt-1 text-sm text-red-600">{errors.city}</p>
        )}
      </div>

      {/* District Selection - only for Tashkent */}
      {formData.city === 'Ташкент' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Район
          </label>
          <select
            value={formData.district}
            onChange={(e) => updateFormData({ district: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Выберите район</option>
            {TASHKENT_DISTRICTS.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Адрес <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => updateFormData({ address: e.target.value })}
            placeholder="Например: ул. Мустақиллик, д. 15"
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.address ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        </div>
        {errors.address && (
          <p className="mt-1 text-sm text-red-600">{errors.address}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          Укажите название улицы и номер дома
        </p>
      </div>

      {/* Mahalla */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Махалля
        </label>
        <input
          type="text"
          value={formData.mahalla}
          onChange={(e) => updateFormData({ mahalla: e.target.value })}
          placeholder="Название махалли"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Metro Station and Distance */}
      {formData.city === 'Ташкент' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ближайшая станция метро
            </label>
            <select
              value={formData.nearestMetro}
              onChange={(e) => updateFormData({ nearestMetro: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Выберите станцию</option>
              {METRO_STATIONS.map((station) => (
                <option key={station} value={station}>
                  {station}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Расстояние до метро (минут пешком)
            </label>
            <input
              type="number"
              value={formData.metroDistance}
              onChange={(e) => updateFormData({ metroDistance: e.target.value })}
              placeholder="5"
              min="1"
              max="60"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Interactive Map Location Picker */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-start gap-2">
            <Map className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900">
                Точное местоположение на карте
              </h4>
              <p className="text-sm text-gray-500">
                Укажите точное местоположение недвижимости
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowMapPicker(!showMapPicker)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
          >
            {showMapPicker ? 'Скрыть карту' : 'Показать карту'}
          </button>
        </div>

        {showMapPicker && (
          <LocationPicker
            latitude={formData.latitude}
            longitude={formData.longitude}
            onLocationChange={(lat, lng, address) => {
              updateFormData({ latitude: lat, longitude: lng });
              // Optionally auto-fill address if it's empty
              if (address && !formData.address) {
                // Extract street address from full address
                const parts = address.split(',');
                if (parts.length > 0) {
                  updateFormData({ address: parts[0].trim() });
                }
              }
            }}
            onAddressSelect={(address) => {
              // Parse address to fill in city/district if possible
              if (address.includes('Ташкент') || address.includes('Tashkent')) {
                updateFormData({ city: 'Ташкент' });
              }
            }}
          />
        )}

        {!showMapPicker && (formData.latitude || formData.longitude) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-semibold text-blue-900">
                  Местоположение установлено
                </div>
                <div className="text-blue-700 text-xs mt-1">
                  {formData.latitude && formData.longitude
                    ? `${formData.latitude.toFixed(6)}, ${formData.longitude.toFixed(6)}`
                    : 'Нажмите "Показать карту" для изменения'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Helpful Tips */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-semibold text-green-900 mb-2">💡 Полезные советы</h4>
        <ul className="space-y-1 text-sm text-green-800">
          <li>• Указывайте точный адрес - это повышает доверие покупателей</li>
          <li>• Близость к метро увеличивает количество просмотров на 40%</li>
          <li>
            • Используйте интерактивную карту для точного указания местоположения
          </li>
          <li>• Кнопка "Моё местоположение" автоматически определит ваши координаты</li>
          <li>• Можно искать по адресу, кликнуть на карте или перетащить маркер</li>
        </ul>
      </div>
    </div>
  );
}
