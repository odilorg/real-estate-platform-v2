'use client';

import Image from 'next/image';
import {
  Building2,
  MapPin,
  DollarSign,
  Maximize,
  Bed,
  Bath,
  Home,
  Calendar,
  Wrench,
  Image as ImageIcon,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { WizardFormData } from '../PropertyCreationWizard';

interface Step6ReviewProps {
  formData: WizardFormData;
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: 'Квартира',
  HOUSE: 'Дом',
  TOWNHOUSE: 'Таунхаус',
  CONDO: 'Кондоминиум',
  LAND: 'Земельный участок',
  COMMERCIAL: 'Коммерческая недвижимость',
};

const LISTING_TYPE_LABELS: Record<string, string> = {
  SALE: 'Продажа',
  RENT_LONG: 'Длительная аренда',
  RENT_DAILY: 'Посуточная аренда',
};

const CURRENCY_LABELS: Record<string, string> = {
  USD: '$',
  YE: 'у.е.',
  UZS: 'сўм',
};

export default function Step6Review({ formData }: Step6ReviewProps) {
  const completionScore = calculateCompletionScore(formData);

  return (
    <div className="space-y-6">
      {/* Completion Score */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Готовность объявления
            </h3>
            <p className="text-sm text-gray-600">
              {completionScore >= 90
                ? '🎉 Отличное объявление! Готово к публикации.'
                : completionScore >= 70
                  ? '👍 Хорошее объявление. Можно дополнить детали.'
                  : '⚠️ Заполните больше информации для лучшего результата.'}
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600">
              {completionScore}%
            </div>
            <div className="text-xs text-gray-500">заполнено</div>
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              completionScore >= 90
                ? 'bg-green-600'
                : completionScore >= 70
                  ? 'bg-blue-600'
                  : 'bg-orange-500'
            }`}
            style={{ width: `${completionScore}%` }}
          />
        </div>
      </div>

      {/* Property Overview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          Основная информация
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ReviewItem
            label="Тип недвижимости"
            value={PROPERTY_TYPE_LABELS[formData.propertyType] || formData.propertyType}
          />
          <ReviewItem
            label="Тип объявления"
            value={LISTING_TYPE_LABELS[formData.listingType] || formData.listingType}
          />
          <ReviewItem
            label="Цена"
            value={`${parseFloat(formData.price || '0').toLocaleString()} ${CURRENCY_LABELS[formData.currency]}`}
            icon={<DollarSign className="h-4 w-4" />}
          />
          <ReviewItem
            label="Площадь"
            value={`${formData.area} м²`}
            icon={<Maximize className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Location */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          Местоположение
        </h3>

        <div className="space-y-3">
          <ReviewItem label="Город" value={formData.city} />
          {formData.district && (
            <ReviewItem label="Район" value={formData.district} />
          )}
          <ReviewItem label="Адрес" value={formData.address} />
          {formData.nearestMetro && (
            <ReviewItem
              label="Метро"
              value={`${formData.nearestMetro}${formData.metroDistance ? ` (${formData.metroDistance} мин)` : ''}`}
            />
          )}
        </div>
      </div>

      {/* Property Details */}
      {['APARTMENT', 'HOUSE', 'TOWNHOUSE', 'CONDO'].includes(
        formData.propertyType
      ) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Home className="h-5 w-5 text-blue-600" />
            Детали недвижимости
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {formData.rooms && (
              <ReviewItem
                label="Комнат"
                value={formData.rooms}
                icon={<Home className="h-4 w-4" />}
              />
            )}
            {formData.bedrooms && (
              <ReviewItem
                label="Спален"
                value={formData.bedrooms}
                icon={<Bed className="h-4 w-4" />}
              />
            )}
            {formData.bathrooms && (
              <ReviewItem
                label="Санузлов"
                value={formData.bathrooms}
                icon={<Bath className="h-4 w-4" />}
              />
            )}
            {formData.floor && (
              <ReviewItem label="Этаж" value={`${formData.floor}${formData.totalFloors ? `/${formData.totalFloors}` : ''}`} />
            )}
            {formData.livingArea && (
              <ReviewItem label="Жилая площадь" value={`${formData.livingArea} м²`} />
            )}
            {formData.kitchenArea && (
              <ReviewItem label="Кухня" value={`${formData.kitchenArea} м²`} />
            )}
          </div>
        </div>
      )}

      {/* Building Features */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Wrench className="h-5 w-5 text-blue-600" />
          Характеристики
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {formData.yearBuilt && (
            <ReviewItem
              label="Год постройки"
              value={formData.yearBuilt}
              icon={<Calendar className="h-4 w-4" />}
            />
          )}
          {formData.renovation && (
            <ReviewItem label="Ремонт" value={formData.renovation} />
          )}
          {formData.ceilingHeight && (
            <ReviewItem label="Высота потолков" value={`${formData.ceilingHeight} м`} />
          )}
          {formData.parking && parseInt(formData.parking) > 0 && (
            <ReviewItem
              label="Парковка"
              value={`${formData.parking} ${formData.parkingType ? `(${formData.parkingType})` : 'мест'}`}
            />
          )}
          {formData.balcony && parseInt(formData.balcony) > 0 && (
            <ReviewItem label="Балконов" value={formData.balcony} />
          )}
          {formData.loggia && parseInt(formData.loggia) > 0 && (
            <ReviewItem label="Лоджий" value={formData.loggia} />
          )}
        </div>

        {/* Checkboxes */}
        {(formData.hasGarbageChute ||
          formData.hasConcierge ||
          formData.hasGatedArea) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {formData.hasGarbageChute && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  <CheckCircle2 className="h-3 w-3" />
                  Мусоропровод
                </span>
              )}
              {formData.hasConcierge && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  <CheckCircle2 className="h-3 w-3" />
                  Консьерж
                </span>
              )}
              {formData.hasGatedArea && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  <CheckCircle2 className="h-3 w-3" />
                  Закрытая территория
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Photos */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-blue-600" />
          Фотографии ({formData.images.length})
        </h3>

        {formData.images.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {formData.images.slice(0, 12).map((url, index) => (
              <div
                key={index}
                className="aspect-square relative rounded-lg overflow-hidden border border-gray-200"
              >
                <Image
                  src={url}
                  alt={`Фото ${index + 1}`}
                  fill
                  className="object-cover"
                />
                {index === 0 && (
                  <div className="absolute top-1 left-1 bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-semibold">
                    Главное
                  </div>
                )}
              </div>
            ))}
            {formData.images.length > 12 && (
              <div className="aspect-square flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200">
                <span className="text-sm text-gray-500">
                  +{formData.images.length - 12}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Фотографии не загружены</p>
        )}
      </div>

      {/* Title & Description */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Заголовок и описание
        </h3>

        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium text-gray-500 mb-1">
              Заголовок
            </div>
            <p className="text-gray-900 font-semibold">{formData.title}</p>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-500 mb-1">
              Описание
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">
              {formData.description}
            </p>
          </div>
        </div>
      </div>

      {/* Final Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">
          ✅ Последняя проверка перед публикацией
        </h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• Проверьте правильность цены и площади</li>
          <li>• Убедитесь, что адрес указан точно</li>
          <li>• Первое фото - самое привлекательное</li>
          <li>• Описание содержит всю важную информацию</li>
          <li>• Контактные данные актуальны</li>
        </ul>
      </div>
    </div>
  );
}

function ReviewItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}) {
  if (!value) return null;

  return (
    <div>
      <div className="text-xs font-medium text-gray-500 mb-1">{label}</div>
      <div className="flex items-center gap-1 text-sm text-gray-900">
        {icon && <span className="text-gray-400">{icon}</span>}
        <span className="font-medium">{value}</span>
      </div>
    </div>
  );
}

function calculateCompletionScore(formData: WizardFormData): number {
  let score = 0;
  let maxScore = 0;

  // Required fields (40 points total)
  maxScore += 10;
  if (formData.propertyType) score += 10;

  maxScore += 10;
  if (formData.listingType) score += 10;

  maxScore += 10;
  if (formData.price && parseFloat(formData.price) > 0) score += 10;

  maxScore += 10;
  if (formData.address) score += 10;

  // Important fields (30 points total)
  maxScore += 10;
  if (formData.area && parseFloat(formData.area) > 0) score += 10;

  maxScore += 10;
  if (formData.images.length >= 5) {
    score += 10;
  } else if (formData.images.length > 0) {
    score += (formData.images.length / 5) * 10;
  }

  maxScore += 10;
  if (formData.title && formData.title.length >= 20) {
    score += 10;
  } else if (formData.title && formData.title.length >= 10) {
    score += 5;
  }

  // Additional details (30 points total)
  maxScore += 5;
  if (formData.description && formData.description.length >= 100) {
    score += 5;
  }

  maxScore += 5;
  if (formData.yearBuilt) score += 5;

  maxScore += 5;
  if (formData.renovation) score += 5;

  maxScore += 5;
  if (formData.rooms || formData.bedrooms) score += 5;

  maxScore += 5;
  if (formData.livingArea) score += 5;

  maxScore += 5;
  if (formData.nearestMetro) score += 5;

  return Math.round((score / maxScore) * 100);
}
