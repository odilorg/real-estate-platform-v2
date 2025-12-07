'use client';

import { Maximize, Building2, Calendar, Home, Paintbrush } from 'lucide-react';

interface PropertyKeyFactsProps {
  area: number;
  floor?: number | null;
  totalFloors?: number | null;
  yearBuilt?: number | null;
  buildingType?: string | null;
  renovation?: string | null;
}

const BUILDING_TYPE_LABELS: Record<string, string> = {
  BRICK: 'Кирпичный',
  PANEL: 'Панельный',
  MONOLITHIC: 'Монолитный',
  WOOD: 'Деревянный',
  BLOCK: 'Блочный',
};

const RENOVATION_LABELS: Record<string, string> = {
  NONE: 'Без ремонта',
  COSMETIC: 'Косметический',
  EURO: 'Евроремонт',
  DESIGNER: 'Дизайнерский',
  NEEDS_REPAIR: 'Требует ремонта',
};

export function PropertyKeyFacts({
  area,
  floor,
  totalFloors,
  yearBuilt,
  buildingType,
  renovation,
}: PropertyKeyFactsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 p-6 bg-gray-50 rounded-lg">
      {/* Total Area */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 flex items-center justify-center bg-white rounded-lg">
          <Maximize className="h-5 w-5 text-gray-700" />
        </div>
        <div>
          <div className="text-sm text-gray-600">Общая площадь</div>
          <div className="font-semibold text-lg">{area} м²</div>
        </div>
      </div>

      {/* Floor */}
      {floor !== null && totalFloors !== null && (
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-white rounded-lg">
            <Building2 className="h-5 w-5 text-gray-700" />
          </div>
          <div>
            <div className="text-sm text-gray-600">Этаж</div>
            <div className="font-semibold text-lg">
              {floor} из {totalFloors}
            </div>
          </div>
        </div>
      )}

      {/* Year Built */}
      {yearBuilt && (
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-white rounded-lg">
            <Calendar className="h-5 w-5 text-gray-700" />
          </div>
          <div>
            <div className="text-sm text-gray-600">Год сдачи</div>
            <div className="font-semibold text-lg">{yearBuilt}</div>
          </div>
        </div>
      )}

      {/* Building Type */}
      {buildingType && (
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-white rounded-lg">
            <Home className="h-5 w-5 text-gray-700" />
          </div>
          <div>
            <div className="text-sm text-gray-600">Дом</div>
            <div className="font-semibold text-lg">
              {BUILDING_TYPE_LABELS[buildingType] || buildingType}
            </div>
          </div>
        </div>
      )}

      {/* Renovation */}
      {renovation && (
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-white rounded-lg">
            <Paintbrush className="h-5 w-5 text-gray-700" />
          </div>
          <div>
            <div className="text-sm text-gray-600">Отделка</div>
            <div className="font-semibold text-lg">
              {RENOVATION_LABELS[renovation] || renovation}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
