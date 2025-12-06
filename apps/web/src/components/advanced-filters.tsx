'use client';

import { useState } from 'react';
import {
  Button,
  Label,
  Checkbox,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui';
import { SlidersHorizontal, X } from 'lucide-react';

export interface AdvancedFilterValues {
  propertyTypes: string[];
  listingTypes: string[];
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minArea?: number;
  maxArea?: number;
  amenities: string[];
  city?: string;
  district?: string;
  // Enhanced CIAN-style filters
  buildingClasses: string[];
  renovationTypes: string[];
  maxMetroDistance?: number;
  minPricePerSqM?: number;
  maxPricePerSqM?: number;
  minYearBuilt?: number;
  maxYearBuilt?: number;
  minFloor?: number;
  maxFloor?: number;
  parkingTypes: string[];
  hasBalcony?: boolean;
  hasConcierge?: boolean;
  hasGatedArea?: boolean;
}

interface AdvancedFiltersProps {
  values: AdvancedFilterValues;
  onChange: (values: AdvancedFilterValues) => void;
  onApply: () => void;
  onReset: () => void;
}

const PROPERTY_TYPES = [
  { value: 'APARTMENT', label: 'Квартира' },
  { value: 'HOUSE', label: 'Дом' },
  { value: 'CONDO', label: 'Апартаменты' },
  { value: 'TOWNHOUSE', label: 'Таунхаус' },
  { value: 'VILLA', label: 'Вилла' },
  { value: 'STUDIO', label: 'Студия' },
  { value: 'COMMERCIAL', label: 'Коммерческая' },
  { value: 'LAND', label: 'Участок' },
];

const LISTING_TYPES = [
  { value: 'SALE', label: 'Продажа' },
  { value: 'RENT', label: 'Аренда' },
];

const AMENITIES = [
  { value: 'PARKING', label: 'Парковка' },
  { value: 'GARAGE', label: 'Гараж' },
  { value: 'GARDEN', label: 'Сад' },
  { value: 'POOL', label: 'Бассейн' },
  { value: 'GYM', label: 'Спортзал' },
  { value: 'ELEVATOR', label: 'Лифт' },
  { value: 'SECURITY', label: 'Охрана' },
  { value: 'AIR_CONDITIONING', label: 'Кондиционер' },
  { value: 'HEATING', label: 'Отопление' },
  { value: 'BALCONY', label: 'Балкон' },
  { value: 'FIREPLACE', label: 'Камин' },
  { value: 'PET_FRIENDLY', label: 'Можно с животными' },
];

const BUILDING_CLASSES = [
  { value: 'ECONOMY', label: 'Эконом' },
  { value: 'COMFORT', label: 'Комфорт' },
  { value: 'BUSINESS', label: 'Бизнес' },
  { value: 'ELITE', label: 'Элитный' },
];

const RENOVATION_TYPES = [
  { value: 'NONE', label: 'Без ремонта' },
  { value: 'COSMETIC', label: 'Косметический' },
  { value: 'EURO', label: 'Евроремонт' },
  { value: 'DESIGNER', label: 'Дизайнерский' },
  { value: 'NEEDS_RENOVATION', label: 'Требует ремонта' },
];

const PARKING_TYPES = [
  { value: 'STREET', label: 'На улице' },
  { value: 'GARAGE', label: 'Гараж' },
  { value: 'UNDERGROUND', label: 'Подземная' },
  { value: 'COVERED', label: 'Крытая' },
  { value: 'OPEN', label: 'Открытая' },
];

const METRO_DISTANCES = [
  { value: 5, label: '5 мин пешком' },
  { value: 10, label: '10 мин пешком' },
  { value: 15, label: '15 мин пешком' },
  { value: 20, label: '20 мин пешком' },
  { value: 30, label: '30 мин пешком' },
];

export function AdvancedFilters({
  values,
  onChange,
  onApply,
  onReset,
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateValue = <K extends keyof AdvancedFilterValues>(
    key: K,
    value: AdvancedFilterValues[K],
  ) => {
    onChange({ ...values, [key]: value });
  };

  const toggleArrayValue = (
    key:
      | 'propertyTypes'
      | 'listingTypes'
      | 'amenities'
      | 'buildingClasses'
      | 'renovationTypes'
      | 'parkingTypes',
    value: string,
  ) => {
    const current = values[key] || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateValue(key, updated);
  };

  const hasActiveFilters = () => {
    return (
      values.propertyTypes.length > 0 ||
      values.listingTypes.length > 0 ||
      values.amenities.length > 0 ||
      (values.buildingClasses?.length || 0) > 0 ||
      (values.renovationTypes?.length || 0) > 0 ||
      (values.parkingTypes?.length || 0) > 0 ||
      values.minPrice !== undefined ||
      values.maxPrice !== undefined ||
      values.minBedrooms !== undefined ||
      values.maxBedrooms !== undefined ||
      values.minBathrooms !== undefined ||
      values.maxBathrooms !== undefined ||
      values.minArea !== undefined ||
      values.maxArea !== undefined ||
      values.maxMetroDistance !== undefined ||
      values.minPricePerSqM !== undefined ||
      values.maxPricePerSqM !== undefined ||
      values.minYearBuilt !== undefined ||
      values.maxYearBuilt !== undefined ||
      values.minFloor !== undefined ||
      values.maxFloor !== undefined ||
      values.hasBalcony !== undefined ||
      values.hasConcierge !== undefined ||
      values.hasGatedArea !== undefined ||
      values.city ||
      values.district
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            Расширенные фильтры
            {hasActiveFilters() && (
              <span className="text-sm font-normal text-blue-600">(Активны)</span>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Скрыть' : 'Показать'}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Property Type */}
          <div>
            <Label className="text-base mb-3 block">Тип недвижимости</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {PROPERTY_TYPES.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`prop-${type.value}`}
                    checked={values.propertyTypes.includes(type.value)}
                    onCheckedChange={() =>
                      toggleArrayValue('propertyTypes', type.value)
                    }
                  />
                  <label
                    htmlFor={`prop-${type.value}`}
                    className="text-sm cursor-pointer"
                  >
                    {type.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Listing Type */}
          <div>
            <Label className="text-base mb-3 block">Тип сделки</Label>
            <div className="flex gap-4">
              {LISTING_TYPES.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`list-${type.value}`}
                    checked={values.listingTypes.includes(type.value)}
                    onCheckedChange={() =>
                      toggleArrayValue('listingTypes', type.value)
                    }
                  />
                  <label
                    htmlFor={`list-${type.value}`}
                    className="text-sm cursor-pointer"
                  >
                    {type.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <Label className="text-base mb-3 block">Цена (у.е.)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minPrice" className="text-xs text-gray-600">
                  От
                </Label>
                <Input
                  id="minPrice"
                  type="number"
                  placeholder="0"
                  value={values.minPrice || ''}
                  onChange={(e) =>
                    updateValue(
                      'minPrice',
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="maxPrice" className="text-xs text-gray-600">
                  До
                </Label>
                <Input
                  id="maxPrice"
                  type="number"
                  placeholder="Любая"
                  value={values.maxPrice || ''}
                  onChange={(e) =>
                    updateValue(
                      'maxPrice',
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                />
              </div>
            </div>
          </div>

          {/* Bedrooms */}
          <div>
            <Label className="text-base mb-3 block">Комнаты</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minBedrooms" className="text-xs text-gray-600">
                  От
                </Label>
                <Select
                  value={values.minBedrooms?.toString()}
                  onValueChange={(val) =>
                    updateValue('minBedrooms', val ? Number(val) : undefined)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Любое" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Любое</SelectItem>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}+
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="maxBedrooms" className="text-xs text-gray-600">
                  До
                </Label>
                <Select
                  value={values.maxBedrooms?.toString()}
                  onValueChange={(val) =>
                    updateValue('maxBedrooms', val ? Number(val) : undefined)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Любое" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Любое</SelectItem>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Square Meters */}
          <div>
            <Label className="text-base mb-3 block">Площадь (м²)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minArea" className="text-xs text-gray-600">
                  От
                </Label>
                <Input
                  id="minArea"
                  type="number"
                  placeholder="0"
                  value={values.minArea || ''}
                  onChange={(e) =>
                    updateValue(
                      'minArea',
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="maxArea" className="text-xs text-gray-600">
                  До
                </Label>
                <Input
                  id="maxArea"
                  type="number"
                  placeholder="Любая"
                  value={values.maxArea || ''}
                  onChange={(e) =>
                    updateValue(
                      'maxArea',
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                />
              </div>
            </div>
          </div>

          {/* Price per Sq M */}
          <div>
            <Label className="text-base mb-3 block">Цена за м² (у.е.)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minPricePerSqM" className="text-xs text-gray-600">
                  От
                </Label>
                <Input
                  id="minPricePerSqM"
                  type="number"
                  placeholder="0"
                  value={values.minPricePerSqM || ''}
                  onChange={(e) =>
                    updateValue(
                      'minPricePerSqM',
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="maxPricePerSqM" className="text-xs text-gray-600">
                  До
                </Label>
                <Input
                  id="maxPricePerSqM"
                  type="number"
                  placeholder="Любая"
                  value={values.maxPricePerSqM || ''}
                  onChange={(e) =>
                    updateValue(
                      'maxPricePerSqM',
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                />
              </div>
            </div>
          </div>

          {/* Building Class */}
          <div>
            <Label className="text-base mb-3 block">Класс жилья</Label>
            <div className="flex flex-wrap gap-2">
              {BUILDING_CLASSES.map((cls) => (
                <div key={cls.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`class-${cls.value}`}
                    checked={(values.buildingClasses || []).includes(cls.value)}
                    onCheckedChange={() =>
                      toggleArrayValue('buildingClasses', cls.value)
                    }
                  />
                  <label
                    htmlFor={`class-${cls.value}`}
                    className="text-sm cursor-pointer"
                  >
                    {cls.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Renovation Type */}
          <div>
            <Label className="text-base mb-3 block">Ремонт</Label>
            <div className="flex flex-wrap gap-2">
              {RENOVATION_TYPES.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`reno-${type.value}`}
                    checked={(values.renovationTypes || []).includes(type.value)}
                    onCheckedChange={() =>
                      toggleArrayValue('renovationTypes', type.value)
                    }
                  />
                  <label
                    htmlFor={`reno-${type.value}`}
                    className="text-sm cursor-pointer"
                  >
                    {type.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Metro Distance */}
          <div>
            <Label className="text-base mb-3 block">До метро</Label>
            <Select
              value={values.maxMetroDistance?.toString()}
              onValueChange={(val) =>
                updateValue(
                  'maxMetroDistance',
                  val && val !== '0' ? Number(val) : undefined,
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Любое расстояние" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Любое расстояние</SelectItem>
                {METRO_DISTANCES.map((dist) => (
                  <SelectItem key={dist.value} value={dist.value.toString()}>
                    До {dist.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year Built */}
          <div>
            <Label className="text-base mb-3 block">Год постройки</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minYearBuilt" className="text-xs text-gray-600">
                  От
                </Label>
                <Input
                  id="minYearBuilt"
                  type="number"
                  placeholder="1950"
                  value={values.minYearBuilt || ''}
                  onChange={(e) =>
                    updateValue(
                      'minYearBuilt',
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="maxYearBuilt" className="text-xs text-gray-600">
                  До
                </Label>
                <Input
                  id="maxYearBuilt"
                  type="number"
                  placeholder={new Date().getFullYear().toString()}
                  value={values.maxYearBuilt || ''}
                  onChange={(e) =>
                    updateValue(
                      'maxYearBuilt',
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                />
              </div>
            </div>
          </div>

          {/* Floor Range */}
          <div>
            <Label className="text-base mb-3 block">Этаж</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minFloor" className="text-xs text-gray-600">
                  От
                </Label>
                <Select
                  value={values.minFloor?.toString()}
                  onValueChange={(val) =>
                    updateValue(
                      'minFloor',
                      val && val !== '0' ? Number(val) : undefined,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Любой" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Любой</SelectItem>
                    <SelectItem value="2">Не первый</SelectItem>
                    {[1, 2, 3, 5, 10, 15, 20].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}+
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="maxFloor" className="text-xs text-gray-600">
                  До
                </Label>
                <Select
                  value={values.maxFloor?.toString()}
                  onValueChange={(val) =>
                    updateValue(
                      'maxFloor',
                      val && val !== '0' ? Number(val) : undefined,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Любой" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Любой</SelectItem>
                    {[3, 5, 10, 15, 20, 30, 50].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        До {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Parking Type */}
          <div>
            <Label className="text-base mb-3 block">Парковка</Label>
            <div className="flex flex-wrap gap-2">
              {PARKING_TYPES.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`parking-${type.value}`}
                    checked={(values.parkingTypes || []).includes(type.value)}
                    onCheckedChange={() =>
                      toggleArrayValue('parkingTypes', type.value)
                    }
                  />
                  <label
                    htmlFor={`parking-${type.value}`}
                    className="text-sm cursor-pointer"
                  >
                    {type.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Building Features */}
          <div>
            <Label className="text-base mb-3 block">Особенности</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasBalcony"
                  checked={values.hasBalcony === true}
                  onCheckedChange={(checked) =>
                    updateValue('hasBalcony', checked ? true : undefined)
                  }
                />
                <label htmlFor="hasBalcony" className="text-sm cursor-pointer">
                  С балконом
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasConcierge"
                  checked={values.hasConcierge === true}
                  onCheckedChange={(checked) =>
                    updateValue('hasConcierge', checked ? true : undefined)
                  }
                />
                <label htmlFor="hasConcierge" className="text-sm cursor-pointer">
                  Консьерж
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasGatedArea"
                  checked={values.hasGatedArea === true}
                  onCheckedChange={(checked) =>
                    updateValue('hasGatedArea', checked ? true : undefined)
                  }
                />
                <label htmlFor="hasGatedArea" className="text-sm cursor-pointer">
                  Закрытая территория
                </label>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <Label className="text-base mb-3 block">Удобства</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {AMENITIES.map((amenity) => (
                <div key={amenity.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`amenity-${amenity.value}`}
                    checked={values.amenities.includes(amenity.value)}
                    onCheckedChange={() =>
                      toggleArrayValue('amenities', amenity.value)
                    }
                  />
                  <label
                    htmlFor={`amenity-${amenity.value}`}
                    className="text-sm cursor-pointer"
                  >
                    {amenity.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <Label className="text-base mb-3 block">Локация</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city" className="text-xs text-gray-600">
                  Город
                </Label>
                <Input
                  id="city"
                  placeholder="Введите город"
                  value={values.city || ''}
                  onChange={(e) =>
                    updateValue('city', e.target.value || undefined)
                  }
                />
              </div>
              <div>
                <Label htmlFor="district" className="text-xs text-gray-600">
                  Район
                </Label>
                <Input
                  id="district"
                  placeholder="Введите район"
                  value={values.district || ''}
                  onChange={(e) =>
                    updateValue('district', e.target.value || undefined)
                  }
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={onApply} className="flex-1">
              Применить фильтры
            </Button>
            <Button variant="outline" onClick={onReset}>
              <X className="h-4 w-4 mr-2" />
              Сбросить
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
