'use client';

import { Building, Calendar, Wrench, Car, Wind, ArrowUpDown } from 'lucide-react';
import { WizardFormData } from '../PropertyCreationWizard';

interface Step4BuildingFeaturesProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  errors: Record<string, string>;
}

const BUILDING_TYPES = [
  'BRICK',
  'PANEL',
  'MONOLITHIC',
  'WOOD',
  'BLOCK',
];

const BUILDING_TYPE_LABELS: Record<string, string> = {
  BRICK: 'Кирпичный',
  PANEL: 'Панельный',
  MONOLITHIC: 'Монолитный',
  WOOD: 'Деревянный',
  BLOCK: 'Блочный',
};

const BUILDING_CLASSES = ['ECONOMY', 'COMFORT', 'BUSINESS', 'ELITE'];

const BUILDING_CLASS_LABELS: Record<string, string> = {
  ECONOMY: 'Эконом',
  COMFORT: 'Комфорт',
  BUSINESS: 'Бизнес',
  ELITE: 'Элитный',
};

const RENOVATION_TYPES = [
  'NONE',
  'COSMETIC',
  'EURO',
  'DESIGNER',
  'NEEDS_REPAIR',
];

const RENOVATION_LABELS: Record<string, string> = {
  NONE: 'Без ремонта',
  COSMETIC: 'Косметический',
  EURO: 'Евроремонт',
  DESIGNER: 'Дизайнерский',
  NEEDS_REPAIR: 'Требует ремонта',
};

const BATHROOM_TYPES = ['COMBINED', 'SEPARATE', 'MULTIPLE'];

const BATHROOM_LABELS: Record<string, string> = {
  COMBINED: 'Совмещенный',
  SEPARATE: 'Раздельный',
  MULTIPLE: '2 и более',
};

const WINDOW_VIEWS = ['YARD', 'STREET', 'YARD_STREET'];

const WINDOW_VIEW_LABELS: Record<string, string> = {
  YARD: 'Во двор',
  STREET: 'На улицу',
  YARD_STREET: 'Во двор и на улицу',
};

export default function Step4BuildingFeatures({
  formData,
  updateFormData,
  errors,
}: Step4BuildingFeaturesProps) {
  const showBuildingFields = ['APARTMENT', 'CONDO'].includes(
    formData.propertyType
  );
  const showHouseFields = ['HOUSE', 'TOWNHOUSE'].includes(formData.propertyType);

  return (
    <div className="space-y-6">
      {/* Building Type */}
      {showBuildingFields && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-1">
              <Building className="h-4 w-4" />
              Тип здания
            </div>
          </label>
          <select
            value={formData.buildingType}
            onChange={(e) => updateFormData({ buildingType: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Выберите тип здания</option>
            {BUILDING_TYPES.map((type) => (
              <option key={type} value={type}>
                {BUILDING_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Building Class */}
      {showBuildingFields && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Класс жилья
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {BUILDING_CLASSES.map((cls) => {
              const isSelected = formData.buildingClass === cls;
              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => updateFormData({ buildingClass: cls })}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 text-blue-600 font-semibold'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                  }`}
                >
                  {BUILDING_CLASS_LABELS[cls]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Year Built & Renovation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Год постройки
            </div>
          </label>
          <input
            type="number"
            value={formData.yearBuilt}
            onChange={(e) => updateFormData({ yearBuilt: e.target.value })}
            placeholder="2020"
            min="1900"
            max={new Date().getFullYear() + 5}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-1">
              <Wrench className="h-4 w-4" />
              Ремонт
            </div>
          </label>
          <select
            value={formData.renovation}
            onChange={(e) => updateFormData({ renovation: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Выберите тип ремонта</option>
            {RENOVATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {RENOVATION_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Living Area & Kitchen Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Жилая площадь (м²)
          </label>
          <input
            type="number"
            value={formData.livingArea}
            onChange={(e) => updateFormData({ livingArea: e.target.value })}
            placeholder="50"
            min="1"
            step="0.1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Площадь кухни (м²)
          </label>
          <input
            type="number"
            value={formData.kitchenArea}
            onChange={(e) => updateFormData({ kitchenArea: e.target.value })}
            placeholder="12"
            min="1"
            step="0.1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Ceiling Height */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4" />
            Высота потолков (м)
          </div>
        </label>
        <input
          type="number"
          value={formData.ceilingHeight}
          onChange={(e) => updateFormData({ ceilingHeight: e.target.value })}
          placeholder="2.7"
          min="2"
          max="10"
          step="0.1"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Parking */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-1">
            <Car className="h-4 w-4" />
            Парковка
          </div>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input
              type="number"
              value={formData.parking}
              onChange={(e) => updateFormData({ parking: e.target.value })}
              placeholder="Количество мест"
              min="0"
              max="10"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={formData.parkingType}
              onChange={(e) => updateFormData({ parkingType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Тип парковки</option>
              <option value="STREET">Уличная</option>
              <option value="UNDERGROUND">Подземная</option>
              <option value="GARAGE">Гараж</option>
              <option value="MULTI_LEVEL">Многоуровневая</option>
            </select>
          </div>
        </div>
      </div>

      {/* Balcony & Loggia */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-1">
              <Wind className="h-4 w-4" />
              Балконов
            </div>
          </label>
          <input
            type="number"
            value={formData.balcony}
            onChange={(e) => updateFormData({ balcony: e.target.value })}
            placeholder="0"
            min="0"
            max="5"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-1">
              <Wind className="h-4 w-4" />
              Лоджий
            </div>
          </label>
          <input
            type="number"
            value={formData.loggia}
            onChange={(e) => updateFormData({ loggia: e.target.value })}
            placeholder="0"
            min="0"
            max="5"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Elevators - for apartments */}
      {showBuildingFields && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Пассажирских лифтов
            </label>
            <input
              type="number"
              value={formData.elevatorPassenger}
              onChange={(e) =>
                updateFormData({ elevatorPassenger: e.target.value })
              }
              placeholder="0"
              min="0"
              max="10"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Грузовых лифтов
            </label>
            <input
              type="number"
              value={formData.elevatorCargo}
              onChange={(e) => updateFormData({ elevatorCargo: e.target.value })}
              placeholder="0"
              min="0"
              max="5"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Bathroom Type */}
      {['APARTMENT', 'HOUSE', 'TOWNHOUSE', 'CONDO'].includes(
        formData.propertyType
      ) && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Санузел
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {BATHROOM_TYPES.map((type) => {
              const isSelected = formData.bathroomType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => updateFormData({ bathroomType: type })}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 text-blue-600 font-semibold'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                  }`}
                >
                  {BATHROOM_LABELS[type]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Window View */}
      {showBuildingFields && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Вид из окон
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {WINDOW_VIEWS.map((view) => {
              const isSelected = formData.windowView === view;
              return (
                <button
                  key={view}
                  type="button"
                  onClick={() => updateFormData({ windowView: view })}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 text-blue-600 font-semibold'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                  }`}
                >
                  {WINDOW_VIEW_LABELS[view]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Building Features - checkboxes */}
      {showBuildingFields && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Особенности здания
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasGarbageChute}
                onChange={(e) =>
                  updateFormData({ hasGarbageChute: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Мусоропровод</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasConcierge}
                onChange={(e) =>
                  updateFormData({ hasConcierge: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Консьерж</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasGatedArea}
                onChange={(e) =>
                  updateFormData({ hasGatedArea: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Закрытая территория</span>
            </label>
          </div>
        </div>
      )}

      {/* Furnished */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Мебель
        </label>
        <select
          value={formData.furnished}
          onChange={(e) => updateFormData({ furnished: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Выберите вариант</option>
          <option value="YES">С мебелью</option>
          <option value="PARTIAL">Частично меблирована</option>
          <option value="NO">Без мебели</option>
        </select>
      </div>

      {/* Helpful Tips */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h4 className="font-semibold text-orange-900 mb-2">
          💡 Полезные советы
        </h4>
        <ul className="space-y-1 text-sm text-orange-800">
          <li>
            • Заполнение всех характеристик увеличивает шансы на продажу на 60%
          </li>
          <li>• Новостройки (2020+) продаются на 15% быстрее</li>
          <li>• Наличие парковки увеличивает стоимость на 5-10%</li>
          <li>• Высокие потолки (3м+) - важный аргумент для покупателей</li>
        </ul>
      </div>
    </div>
  );
}
