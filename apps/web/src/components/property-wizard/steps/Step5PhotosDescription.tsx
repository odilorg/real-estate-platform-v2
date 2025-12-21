'use client';

import { ImageUploader } from '../../image-uploader';
import { Image, FileText, AlignLeft } from 'lucide-react';
import { WizardFormData } from '../PropertyCreationWizard';

interface Step5PhotosDescriptionProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  errors: Record<string, string>;
}

export default function Step5PhotosDescription({
  formData,
  updateFormData,
  errors,
}: Step5PhotosDescriptionProps) {
  const titleLength = formData.title.length;
  const descriptionLength = formData.description.length;

  return (
    <div className="space-y-8">
      {/* Photos Section */}
      <div>
        <div className="flex items-start gap-2 mb-4">
          <Image className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Фотографии <span className="text-red-500">*</span>
            </h3>
            <p className="text-sm text-gray-500">
              Загрузите минимум 3 качественных фотографии вашей недвижимости
            </p>
          </div>
        </div>

        <ImageUploader
          images={formData.images}
          onChange={(images) => updateFormData({ images })}
          maxImages={20}
        />

        {errors.images && (
          <p className="mt-2 text-sm text-red-600">{errors.images}</p>
        )}

        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="font-semibold text-blue-900 mb-2 text-sm">
            📸 Советы по съемке
          </h4>
          <ul className="space-y-1 text-xs text-blue-800">
            <li>• <strong>Минимум 3 фото</strong> - обязательное требование</li>
            <li>• Снимайте при хорошем естественном освещении (днём)</li>
            <li>• Показывайте все комнаты и ключевые особенности</li>
            <li>• Держите камеру горизонтально, избегайте наклонов</li>
            <li>• Первое фото должно быть самым привлекательным</li>
            <li>
              • Объявления с 10+ фото получают в 3 раза больше откликов
            </li>
          </ul>
        </div>
      </div>

      {/* Title Section */}
      <div>
        <div className="flex items-start gap-2 mb-2">
          <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">
              Заголовок объявления <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mt-0.5">
              Краткое и привлекательное описание недвижимости
            </p>
          </div>
        </div>

        <input
          type="text"
          value={formData.title}
          onChange={(e) => updateFormData({ title: e.target.value })}
          placeholder="Например: Светлая 3-комн. квартира в центре с ремонтом"
          maxLength={100}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
        />

        <div className="flex items-center justify-between mt-1">
          {errors.title ? (
            <p className="text-sm text-red-600">{errors.title}</p>
          ) : (
            <p className="text-xs text-gray-500">
              {titleLength < 10
                ? `Минимум 10 символов (ещё ${10 - titleLength})`
                : titleLength < 50
                  ? '✓ Хороший заголовок'
                  : '✓ Отличный заголовок'}
            </p>
          )}
          <p
            className={`text-xs ${titleLength > 90 ? 'text-orange-600 font-semibold' : 'text-gray-400'}`}
          >
            {titleLength}/100
          </p>
        </div>

        <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
          <h4 className="font-semibold text-green-900 mb-1 text-sm">
            ✨ Примеры хороших заголовков:
          </h4>
          <ul className="space-y-1 text-xs text-green-800">
            <li>• &quot;Просторная 2-комн. квартира с видом на парк, 75 м²&quot;</li>
            <li>• &quot;Новый дом в тихом районе с бассейном и садом&quot;</li>
            <li>• &quot;Студия в элитном ЖК, 5 мин от метро Юнусабад&quot;</li>
          </ul>
        </div>
      </div>

      {/* Description Section */}
      <div>
        <div className="flex items-start gap-2 mb-2">
          <AlignLeft className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">
              Подробное описание <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mt-0.5">
              Расскажите о преимуществах, инфраструктуре, особенностях
            </p>
          </div>
        </div>

        <textarea
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          placeholder="Опишите недвижимость подробно:&#10;• Особенности планировки&#10;• Состояние и ремонт&#10;• Инфраструктура района&#10;• Транспортная доступность&#10;• Дополнительные преимущества"
          rows={10}
          maxLength={2000}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
        />

        <div className="flex items-center justify-between mt-1">
          {errors.description ? (
            <p className="text-sm text-red-600">{errors.description}</p>
          ) : (
            <p className="text-xs text-gray-500">
              {descriptionLength < 50
                ? `Минимум 50 символов (ещё ${50 - descriptionLength})`
                : descriptionLength < 150
                  ? '✓ Базовое описание'
                  : descriptionLength < 300
                    ? '✓ Хорошее описание'
                    : '✓ Отличное подробное описание!'}
            </p>
          )}
          <p
            className={`text-xs ${descriptionLength > 1800 ? 'text-orange-600 font-semibold' : 'text-gray-400'}`}
          >
            {descriptionLength}/2000
          </p>
        </div>

        <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
          <h4 className="font-semibold text-purple-900 mb-2 text-sm">
            💡 Что упомянуть в описании:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
            <ul className="space-y-1 text-xs text-purple-800">
              <li>• Планировка и функциональность</li>
              <li>• Качество ремонта и материалы</li>
              <li>• Вид из окон</li>
              <li>• Мебель и техника</li>
            </ul>
            <ul className="space-y-1 text-xs text-purple-800">
              <li>• Школы, магазины, парки рядом</li>
              <li>• Транспортная доступность</li>
              <li>• Безопасность района</li>
              <li>• Парковка и инфраструктура</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Overall Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">
          🎯 Секреты успешного объявления
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-semibold text-blue-900 mb-1">Фотографии</div>
            <p className="text-xs text-gray-700">
              10+ качественных фото увеличивают отклики в 3 раза
            </p>
          </div>
          <div>
            <div className="font-semibold text-purple-900 mb-1">Заголовок</div>
            <p className="text-xs text-gray-700">
              Укажите площадь, комнаты и ключевую особенность
            </p>
          </div>
          <div>
            <div className="font-semibold text-green-900 mb-1">Описание</div>
            <p className="text-xs text-gray-700">
              Подробное описание (300+ символов) увеличивает доверие
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
