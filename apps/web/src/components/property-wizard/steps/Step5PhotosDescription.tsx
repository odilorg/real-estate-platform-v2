'use client';

import { useState } from 'react';
import { ImageUploader } from '../../image-uploader';
import { Image, FileText, AlignLeft, Video, Plus, Trash2, Youtube, Sparkles } from 'lucide-react';
import { WizardFormData } from '../PropertyCreationWizard';
import { AIContentHelper } from '../AIContentHelper';
import { Button } from '@repo/ui';

interface Step5PhotosDescriptionProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  errors: Record<string, string>;
}

// YouTube URL parser - extracts video ID from various YouTube URL formats
const extractYoutubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // Just the video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Get YouTube thumbnail URL
const getYoutubeThumbnail = (videoId: string): string => {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

export default function Step5PhotosDescription({
  formData,
  updateFormData,
  errors,
}: Step5PhotosDescriptionProps) {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeError, setYoutubeError] = useState('');
  const [showAIHelper, setShowAIHelper] = useState(false);

  const titleLength = formData.title.length;
  const descriptionLength = formData.description.length;

  const handleAddVideo = () => {
    setYoutubeError('');
    const trimmedUrl = youtubeUrl.trim();
    
    if (!trimmedUrl) {
      setYoutubeError('Введите ссылку на YouTube');
      return;
    }

    const videoId = extractYoutubeVideoId(trimmedUrl);
    if (!videoId) {
      setYoutubeError('Неверная ссылка на YouTube. Пример: https://youtube.com/watch?v=xxxxx');
      return;
    }

    // Check for duplicates
    const normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;
    if (formData.videoUrls.some(url => extractYoutubeVideoId(url) === videoId)) {
      setYoutubeError('Это видео уже добавлено');
      return;
    }

    // Add video URL
    updateFormData({ 
      videoUrls: [...formData.videoUrls, normalizedUrl] 
    });
    setYoutubeUrl('');
  };

  const handleRemoveVideo = (indexToRemove: number) => {
    updateFormData({
      videoUrls: formData.videoUrls.filter((_, index) => index !== indexToRemove)
    });
  };

  return (
    <div className="space-y-8">
      {/* AI Helper Toggle Button */}
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => setShowAIHelper(!showAIHelper)}
          variant={showAIHelper ? 'default' : 'outline'}
          className="flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {showAIHelper ? 'Скрыть помощника' : 'Умный помощник'}
        </Button>
      </div>

      {/* AI Helper Panel */}
      {showAIHelper && (
        <AIContentHelper
          formData={formData}
          onTitleSelect={(title) => updateFormData({ title })}
          onDescriptionSelect={(description) => updateFormData({ description })}
        />
      )}

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

      {/* YouTube Video Section */}
      <div>
        <div className="flex items-start gap-2 mb-4">
          <Video className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Видео с YouTube
            </h3>
            <p className="text-sm text-gray-500">
              Добавьте видеообзор для повышения привлекательности объявления
            </p>
          </div>
        </div>

        {/* Video URL Input */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => {
                setYoutubeUrl(e.target.value);
                setYoutubeError('');
              }}
              placeholder="Вставьте ссылку на YouTube: https://youtube.com/watch?v=..."
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                youtubeError ? 'border-red-500' : 'border-gray-300'
              }`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddVideo();
                }
              }}
            />
            {youtubeError && (
              <p className="mt-1 text-sm text-red-600">{youtubeError}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleAddVideo}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Добавить</span>
          </button>
        </div>

        {/* Video Previews */}
        {formData.videoUrls.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {formData.videoUrls.map((url, index) => {
              const videoId = extractYoutubeVideoId(url);
              return (
                <div key={index} className="relative group">
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={videoId ? getYoutubeThumbnail(videoId) : ''}
                      alt={`Видео ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-red-600 rounded-full p-3">
                        <Youtube className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveVideo(index)}
                    className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <h4 className="font-semibold text-red-900 mb-2 text-sm">
            🎬 Советы по видео
          </h4>
          <ul className="space-y-1 text-xs text-red-800">
            <li>• Видео увеличивает просмотры объявления в 2 раза</li>
            <li>• Снимайте горизонтально, покажите все комнаты</li>
            <li>• Оптимальная длина: 1-3 минуты</li>
            <li>• Загрузите видео на YouTube и вставьте ссылку</li>
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
