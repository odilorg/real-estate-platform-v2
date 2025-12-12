'use client';

import { Card, CardContent, Button } from '@repo/ui';

interface PropertyDetailedInfoProps {
  // Property type and areas
  propertyType: string;
  marketType?: string | null; // NEW_BUILDING or SECONDARY
  area: number;
  livingArea?: number | null;
  kitchenArea?: number | null;
  ceilingHeight?: number | null;
  bathrooms?: number | null;
  renovation?: string | null;
  furnished?: string | null;

  // Building info
  yearBuilt?: number | null;
  buildingType?: string | null;
  buildingClass?: string | null;
  elevatorPassenger?: number | null;
  elevatorCargo?: number | null;
  parking?: number | null;
  parkingType?: string | null;
  windowView?: string | null;
  bathroomType?: string | null;
  hasGarbageChute?: boolean;
  balcony?: number | null;
  loggia?: number | null;
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: 'Квартира',
  HOUSE: 'Дом',
  CONDO: 'Апартаменты',
  TOWNHOUSE: 'Таунхаус',
  VILLA: 'Вилла',
  STUDIO: 'Студия',
  COMMERCIAL: 'Коммерческая',
  LAND: 'Участок',
};

const BUILDING_TYPE_LABELS: Record<string, string> = {
  BRICK: 'Кирпичный',
  PANEL: 'Панельный',
  MONOLITHIC: 'Монолитный',
  WOOD: 'Деревянный',
  BLOCK: 'Блочный',
};

const BUILDING_CLASS_LABELS: Record<string, string> = {
  ECONOMY: 'Эконом',
  COMFORT: 'Комфорт',
  BUSINESS: 'Бизнес',
  ELITE: 'Элитный',
};

const MARKET_TYPE_LABELS: Record<string, string> = {
  NEW_BUILDING: 'Новостройка',
  SECONDARY: 'Вторичка',
};

const RENOVATION_LABELS: Record<string, string> = {
  NONE: 'Без ремонта',
  COSMETIC: 'Косметический',
  EURO: 'Евроремонт',
  DESIGNER: 'Дизайнерский',
  NEEDS_REPAIR: 'Требует ремонта',
};

const PARKING_TYPE_LABELS: Record<string, string> = {
  STREET: 'Уличная',
  UNDERGROUND: 'Подземная',
  GARAGE: 'Гараж',
  MULTI_LEVEL: 'Многоуровневая',
};

export function PropertyDetailedInfo(props: PropertyDetailedInfoProps) {
  const {
    propertyType,
    marketType,
    area,
    livingArea,
    kitchenArea,
    ceilingHeight,
    bathrooms,
    renovation,
    furnished,
    yearBuilt,
    buildingType,
    buildingClass,
    elevatorPassenger,
    elevatorCargo,
    parking,
    parkingType,
    windowView,
    bathroomType,
    hasGarbageChute,
    balcony,
    loggia,
  } = props;

  const InfoRow = ({ label, value }: { label: string; value: string | number | null | undefined }) => {
    if (!value && value !== 0) return null;

    return (
      <div className="flex justify-between py-3 border-b border-gray-100 last:border-b-0">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{value}</span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* About Apartment */}
      <Card>
        <CardContent className="p-0">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold">О квартире</h2>
            <Button variant="ghost" size="sm" className="text-blue-600">
              Подписаться на дом
            </Button>
          </div>
          <div className="p-6">
            <InfoRow label="Тип жилья" value={PROPERTY_TYPE_LABELS[propertyType] || propertyType} />
            <InfoRow label="Общая площадь" value={area ? `${area} м²` : null} />
            <InfoRow label="Жилая площадь" value={livingArea ? `${livingArea} м²` : null} />
            <InfoRow label="Площадь кухни" value={kitchenArea ? `${kitchenArea} м²` : null} />
            <InfoRow label="Высота потолков" value={ceilingHeight ? `${ceilingHeight} м` : null} />
            <InfoRow
              label="Санузел"
              value={bathroomType || (bathrooms ? `${bathrooms} ${bathrooms === 1 ? 'совмещенный' : 'совмещенных'}` : null)}
            />
            <InfoRow label="Ремонт" value={renovation ? RENOVATION_LABELS[renovation] || renovation : null} />
            <InfoRow
              label="Продаётся с мебелью"
              value={furnished === 'FULLY' ? 'Да' : furnished === 'PARTIALLY' ? 'Частично' : furnished === 'NO' ? 'Нет' : null}
            />
          </div>
        </CardContent>
      </Card>

      {/* About Building */}
      <Card>
        <CardContent className="p-0">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold">О доме</h2>
            <Button variant="ghost" size="sm" className="text-blue-600">
              Подписаться на дом
            </Button>
          </div>
          <div className="p-6">
            <InfoRow label="Год постройки" value={yearBuilt} />
            <InfoRow label="Тип жилья" value={marketType ? MARKET_TYPE_LABELS[marketType] || marketType : null} />
            <InfoRow
              label="Количество лифтов"
              value={
                elevatorPassenger || elevatorCargo
                  ? `${elevatorPassenger || 0} пассажирский${elevatorPassenger && elevatorPassenger > 1 ? 'их' : ''}, ${elevatorCargo || 0} грузовой${elevatorCargo && elevatorCargo > 1 ? 'ых' : ''}`
                  : null
              }
            />
            <InfoRow label="Тип дома" value={buildingType ? BUILDING_TYPE_LABELS[buildingType] || buildingType : null} />
            <InfoRow label="Тип перекрытий" value={buildingClass ? BUILDING_CLASS_LABELS[buildingClass] || buildingClass : null} />
            <InfoRow
              label="Подъезды"
              value={balcony || loggia ? `${balcony || 0} балкон${balcony && balcony > 1 ? 'ов' : ''}, ${loggia || 0} лоджи${loggia && loggia > 1 ? 'й' : ''}` : null}
            />
            <InfoRow
              label="Парковка"
              value={parking && parkingType ? `${PARKING_TYPE_LABELS[parkingType] || parkingType}` : parking ? `${parking} мест` : null}
            />
            <InfoRow label="Отопление" value={windowView || null} />
            <InfoRow label="Аварийность" value={hasGarbageChute ? 'Да' : 'Нет'} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
