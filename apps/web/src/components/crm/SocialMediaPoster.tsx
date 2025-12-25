'use client';

import { useState } from 'react';
import { Button, Card, CardContent, Badge } from '@repo/ui';
import {
  Facebook,
  Instagram,
  Send,
  Globe,
  Hash,
  Image,
  Video,
  Loader2,
  Check,
  AlertCircle,
  Copy,
  Share2,
  MessageCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  address: string;
  district: string;
  city: string;
  images: Array<{ url: string }>;
  listingType: 'SALE' | 'RENT_LONG' | 'RENT_DAILY';
}

interface SocialMediaPosterProps {
  property: Property;
  agencyName?: string;
  agentPhone?: string;
}

interface Platform {
  id: string;
  name: string;
  icon: any;
  color: string;
  enabled: boolean;
  status?: 'idle' | 'posting' | 'success' | 'error';
  message?: string;
}

export function SocialMediaPoster({
  property,
  agencyName = 'RealEstate Agency',
  agentPhone = '+998 90 123 45 67'
}: SocialMediaPosterProps) {
  const t = useTranslations();

  const [platforms, setPlatforms] = useState<Platform[]>([
    { id: 'telegram', name: 'Telegram Channel', icon: Send, color: 'bg-blue-500', enabled: true },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600', enabled: false },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-br from-purple-600 to-pink-500', enabled: false },
    { id: 'olx', name: 'OLX.uz', icon: Globe, color: 'bg-green-600', enabled: false },
    { id: 'tiktok', name: 'TikTok', icon: Video, color: 'bg-black', enabled: false },
  ]);

  const [description, setDescription] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  // Generate smart description in multiple languages
  const generateDescription = async () => {
    setIsGenerating(true);

    // Simulate AI generation (replace with actual API call)
    setTimeout(() => {
      const listingTypeText = property.listingType === 'SALE' ? 'Продается' : 'Сдается';
      const priceText = property.listingType === 'SALE'
        ? `${property.price.toLocaleString()} у.е.`
        : `${property.price.toLocaleString()} у.е./мес`;

      const generatedText = `🏠 ${listingTypeText} ${property.bedrooms}-комнатная квартира

📍 Район: ${property.district}
📐 Площадь: ${property.area} м²
🛏 Комнат: ${property.bedrooms}
🚿 Санузлов: ${property.bathrooms}
💰 Цена: ${priceText}

✨ ${property.description}

📞 Связаться: ${agentPhone}
🏢 ${agencyName}

#недвижимость${property.city} #квартира${property.district.replace(/\s/g, '')} #${property.listingType === 'SALE' ? 'продажа' : 'аренда'}квартиры`;

      setDescription(generatedText);

      // Generate hashtags
      const tags = [
        `недвижимость${property.city}`,
        `квартира${property.district.replace(/\s/g, '')}`,
        property.listingType === 'SALE' ? 'продажаквартиры' : 'арендаквартиры',
        'недвижимостьузбекистан',
        property.city.toLowerCase(),
        'realestate',
      ];
      setHashtags(tags);

      // Select first 5 images by default
      setSelectedImages(property.images.slice(0, 5).map(img => img.url));

      setIsGenerating(false);
    }, 1500);
  };

  const togglePlatform = (platformId: string) => {
    setPlatforms(prev => prev.map(p =>
      p.id === platformId ? { ...p, enabled: !p.enabled } : p
    ));
  };

  const postToSocialMedia = async () => {
    setIsPosting(true);

    const enabledPlatforms = platforms.filter(p => p.enabled);

    for (const platform of enabledPlatforms) {
      setPlatforms(prev => prev.map(p =>
        p.id === platform.id ? { ...p, status: 'posting' } : p
      ));

      // Simulate API call to each platform
      setTimeout(() => {
        const success = Math.random() > 0.1; // 90% success rate for demo

        setPlatforms(prev => prev.map(p =>
          p.id === platform.id
            ? {
                ...p,
                status: success ? 'success' : 'error',
                message: success ? 'Успешно опубликовано!' : 'Ошибка публикации'
              }
            : p
        ));
      }, 1000 + Math.random() * 2000);
    }

    setTimeout(() => {
      setIsPosting(false);
    }, 4000);
  };

  const copyToClipboard = () => {
    const fullText = `${description}\n\n${hashtags.map(tag => `#${tag}`).join(' ')}`;
    navigator.clipboard.writeText(fullText);
  };

  return (
    <div className="space-y-6">
      {/* Platform Selection */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Выберите платформы</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              return (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={`relative p-4 rounded-lg border-2 transition-all ${
                    platform.enabled
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-12 h-12 ${platform.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-sm font-medium">{platform.name}</div>

                  {platform.status === 'posting' && (
                    <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    </div>
                  )}

                  {platform.status === 'success' && (
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}

                  {platform.status === 'error' && (
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <AlertCircle className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Content Generator */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Контент для публикации</h3>
            <Button
              onClick={generateDescription}
              disabled={isGenerating}
              variant="outline"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Hash className="h-4 w-4 mr-2" />
              )}
              Сгенерировать описание
            </Button>
          </div>

          <div className="space-y-4">
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-48 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Нажмите 'Сгенерировать описание' для автоматического создания текста..."
              />
            </div>

            {/* Hashtags */}
            {hashtags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Хештеги
                </label>
                <div className="flex flex-wrap gap-2">
                  {hashtags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Images */}
            {selectedImages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Выбранные фото ({selectedImages.length})
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {selectedImages.map((img, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={img}
                        alt={`Property ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              onClick={postToSocialMedia}
              disabled={!description || platforms.filter(p => p.enabled).length === 0 || isPosting}
              className="flex-1"
            >
              {isPosting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4 mr-2" />
              )}
              Опубликовать на выбранных платформах
            </Button>
            <Button
              onClick={copyToClipboard}
              variant="outline"
            >
              <Copy className="h-4 w-4 mr-2" />
              Копировать
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Platform-Specific Settings */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Дополнительные настройки</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Добавить водяной знак</div>
                <div className="text-sm text-gray-500">Добавить логотип агентства на фото</div>
              </div>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Автоперевод на узбекский</div>
                <div className="text-sm text-gray-500">Автоматически переводить текст</div>
              </div>
              <input type="checkbox" className="toggle" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Планирование публикации</div>
                <div className="text-sm text-gray-500">Опубликовать в оптимальное время</div>
              </div>
              <input type="checkbox" className="toggle" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}