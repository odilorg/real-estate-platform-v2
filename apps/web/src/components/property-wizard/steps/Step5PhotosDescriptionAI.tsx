'use client';

import { useState, useRef, useEffect } from 'react';
import { ImageUploader } from '../../image-uploader';
import {
  Image,
  FileText,
  AlignLeft,
  Video,
  Plus,
  Trash2,
  Youtube,
  Sparkles,
  Mic,
  MicOff,
  Loader2,
  RefreshCw,
  Wand2,
  Brain,
  TrendingUp,
  Globe,
  Volume2,
  Camera,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { WizardFormData } from '../PropertyCreationWizard';
import { Button, Badge, Card } from '@repo/ui';

interface Step5PhotosDescriptionAIProps {
  formData: WizardFormData;
  updateFormData: (updates: Partial<WizardFormData>) => void;
  errors: Record<string, string>;
}

// AI Title Templates
const AI_TITLE_STYLES = [
  { id: 'professional', label: 'Профессиональный', icon: '💼' },
  { id: 'emotional', label: 'Эмоциональный', icon: '❤️' },
  { id: 'urgent', label: 'Срочный', icon: '🔥' },
  { id: 'luxury', label: 'Премиум', icon: '✨' },
];

// AI Description Tones
const AI_DESCRIPTION_TONES = [
  { id: 'family', label: 'Для семьи', icon: '👨‍👩‍👧‍👦' },
  { id: 'investment', label: 'Инвестиция', icon: '📈' },
  { id: 'luxury', label: 'Люкс', icon: '🏰' },
  { id: 'practical', label: 'Практичный', icon: '🎯' },
];

// Photo Quality Indicators
interface PhotoAnalysis {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  roomType?: string;
  suggestions?: string[];
  score: number;
}

export default function Step5PhotosDescriptionAI({
  formData,
  updateFormData,
  errors,
}: Step5PhotosDescriptionAIProps) {
  const [selectedTitleStyle, setSelectedTitleStyle] = useState('professional');
  const [selectedTone, setSelectedTone] = useState('family');
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isAnalyzingPhotos, setIsAnalyzingPhotos] = useState(false);
  const [photoAnalysis, setPhotoAnalysis] = useState<Record<string, PhotoAnalysis>>({});

  // Voice input states
  const [isRecording, setIsRecording] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState('ru-RU');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // AI Suggestions
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  // YouTube functionality (kept from original)
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeError, setYoutubeError] = useState('');

  // Extract YouTube video ID
  const extractYoutubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Generate AI Title
  const generateAITitle = async () => {
    setIsGeneratingTitle(true);

    // Simulate AI generation (replace with actual AI API call)
    setTimeout(() => {
      const roomText = formData.bedrooms ? `${formData.bedrooms}-комнатная` : '';
      const areaText = formData.area ? `${formData.area}м²` : '';
      const districtText = formData.district || '';

      const templates = {
        professional: [
          `${roomText} квартира ${areaText} в районе ${districtText}`,
          `Продается ${roomText} квартира, ${areaText}, ${districtText}`,
          `${formData.propertyType === 'APARTMENT' ? 'Квартира' : 'Дом'} ${areaText} • ${districtText} • ${formData.floor}/${formData.totalFloors} этаж`,
        ],
        emotional: [
          `🏠 Дом вашей мечты в ${districtText}! ${roomText} ${areaText}`,
          `✨ Уютная ${roomText} квартира для счастливой жизни`,
          `❤️ Ваш новый дом ждет вас • ${areaText} в ${districtText}`,
        ],
        urgent: [
          `🔥 СРОЧНО! ${roomText} квартира ${areaText} • Выгодная цена`,
          `⚡ Последняя квартира в доме! ${districtText} ${areaText}`,
          `🎯 Не упустите! ${roomText} по цене ниже рынка • ${districtText}`,
        ],
        luxury: [
          `✨ Премиум ${roomText} квартира • ${areaText} • ${districtText}`,
          `🏰 Элитная недвижимость • ${formData.floor} этаж • Панорамные виды`,
          `💎 Эксклюзивное предложение в ${districtText} • ${areaText}`,
        ],
      };

      const suggestions = templates[selectedTitleStyle as keyof typeof templates] || templates.professional;
      setTitleSuggestions(suggestions);

      // Auto-select first suggestion
      updateFormData({ title: suggestions[0] });
      setShowAISuggestions(true);
      setIsGeneratingTitle(false);
    }, 1500);
  };

  // Generate AI Description
  const generateAIDescription = async () => {
    setIsGeneratingDescription(true);

    setTimeout(() => {
      const features = [];
      if (formData.hasAirConditioning) features.push('кондиционер');
      if (formData.parking) features.push('парковка');
      if (formData.balcony) features.push('балкон');
      if (formData.elevatorPassenger) features.push('лифт');

      const toneDescriptions = {
        family: `Идеальная квартира для семьи в ${formData.district || 'прекрасном районе'}!

🏡 Просторная ${formData.bedrooms}-комнатная квартира площадью ${formData.area} м² на ${formData.floor} этаже ${formData.totalFloors}-этажного дома.

✨ Преимущества для вашей семьи:
• Рядом школы и детские сады
• Безопасный двор с детской площадкой
• Удобная транспортная развязка
• ${features.length > 0 ? features.join(', ') : 'Все необходимые удобства'}

📍 Расположение: ${formData.address || formData.district}
${formData.nearestMetro ? `🚇 Метро ${formData.nearestMetro} - ${formData.metroDistance}` : ''}

Квартира в отличном состоянии, готова к проживанию. Развитая инфраструктура района обеспечит комфортную жизнь для всей семьи.

📞 Звоните прямо сейчас для просмотра!`,

        investment: `📈 Выгодная инвестиция в растущем районе ${formData.district}!

Характеристики объекта:
• Площадь: ${formData.area} м²
• Этаж: ${formData.floor} из ${formData.totalFloors}
• Комнат: ${formData.bedrooms}
• Год постройки: ${formData.yearBuilt || '2020'}

💰 Инвестиционные преимущества:
• Район с активным развитием инфраструктуры
• Прогнозируемый рост цен 15-20% в год
• Высокий спрос на аренду
• Ликвидная недвижимость

🎯 Окупаемость при сдаче в аренду: 7-8 лет

Отличный вариант как для сдачи в аренду, так и для перепродажи.`,

        luxury: `✨ Премиальная недвижимость в престижном районе ${formData.district}

Эксклюзивное предложение для ценителей комфорта и стиля.

🏰 Характеристики:
• Общая площадь: ${formData.area} м²
• Жилая площадь: ${formData.livingArea || Math.round(parseInt(formData.area) * 0.7)} м²
• Потолки: ${formData.ceilingHeight || '3.2'} м
• Панорамные окна с видом на ${formData.windowView || 'город'}

🌟 Премиум удобства:
• Дизайнерский ремонт
• Итальянская сантехника
• Система "умный дом"
• Консьерж-сервис 24/7
• Подземный паркинг

Для взыскательных клиентов, ценящих приватность и высокий уровень жизни.`,

        practical: `Практичная ${formData.bedrooms}-комнатная квартира ${formData.area} м²

📋 Основные параметры:
• Этаж: ${formData.floor}/${formData.totalFloors}
• Комнат: ${formData.bedrooms}
• Санузлов: ${formData.bathrooms}
• Состояние: ${formData.renovation || 'хорошее'}

📍 Локация: ${formData.district}
• До метро: ${formData.metroDistance || '10 мин'}
• Рядом магазины, аптеки
• Остановки транспорта

Квартира не требует вложений, можно сразу заезжать и жить.`,
      };

      const description = toneDescriptions[selectedTone as keyof typeof toneDescriptions] || toneDescriptions.family;
      updateFormData({ description });
      setIsGeneratingDescription(false);
    }, 2000);
  };

  // Analyze Photos with AI
  const analyzePhotos = async () => {
    setIsAnalyzingPhotos(true);

    setTimeout(() => {
      const analysis: Record<string, PhotoAnalysis> = {};

      formData.images.forEach((image, index) => {
        // Simulate AI photo analysis
        const scores = [85, 92, 78, 95, 88, 73, 90, 82];
        const score = scores[index % scores.length];

        const roomTypes = ['Гостиная', 'Спальня', 'Кухня', 'Ванная', 'Балкон', 'Коридор', 'Детская'];
        const roomType = roomTypes[index % roomTypes.length];

        let quality: PhotoAnalysis['quality'] = 'excellent';
        let suggestions: string[] = [];

        if (score >= 90) {
          quality = 'excellent';
          suggestions = ['Отличное качество!'];
        } else if (score >= 80) {
          quality = 'good';
          suggestions = ['Хорошее освещение', 'Правильный ракурс'];
        } else if (score >= 70) {
          quality = 'fair';
          suggestions = ['Улучшите освещение', 'Уберите лишние предметы'];
        } else {
          quality = 'poor';
          suggestions = ['Переснимите при дневном свете', 'Используйте горизонтальную ориентацию'];
        }

        analysis[image] = {
          quality,
          roomType,
          suggestions,
          score,
        };
      });

      setPhotoAnalysis(analysis);
      setIsAnalyzingPhotos(false);
    }, 2500);
  };

  // Voice Recording
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        // Here you would send to speech-to-text API
        // For demo, we'll just simulate
        setTimeout(() => {
          const sampleText = "Продается трехкомнатная квартира в центре города. Площадь 85 квадратных метров, седьмой этаж, есть балкон и парковка.";
          updateFormData({ description: formData.description + ' ' + sampleText });
        }, 1000);

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* AI Assistant Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI Ассистент</h2>
              <p className="text-sm text-gray-600">Я помогу создать привлекательное объявление</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={generateAITitle}
              disabled={isGeneratingTitle}
              className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg border border-purple-200 hover:border-purple-400 transition-colors"
            >
              {isGeneratingTitle ? (
                <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
              ) : (
                <Wand2 className="h-5 w-5 text-purple-600" />
              )}
              <span className="font-medium">Создать заголовок</span>
            </button>

            <button
              onClick={generateAIDescription}
              disabled={isGeneratingDescription}
              className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg border border-blue-200 hover:border-blue-400 transition-colors"
            >
              {isGeneratingDescription ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              ) : (
                <Brain className="h-5 w-5 text-blue-600" />
              )}
              <span className="font-medium">Написать описание</span>
            </button>

            <button
              onClick={analyzePhotos}
              disabled={isAnalyzingPhotos || formData.images.length === 0}
              className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg border border-green-200 hover:border-green-400 transition-colors disabled:opacity-50"
            >
              {isAnalyzingPhotos ? (
                <Loader2 className="h-5 w-5 animate-spin text-green-600" />
              ) : (
                <Camera className="h-5 w-5 text-green-600" />
              )}
              <span className="font-medium">Анализ фото</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Photos Section with AI Analysis */}
      <div>
        <div className="flex items-start gap-2 mb-4">
          <Image className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              Фотографии <span className="text-red-500">*</span>
            </h3>
            <p className="text-sm text-gray-500">
              AI проанализирует качество и поможет улучшить фото
            </p>
          </div>
          {formData.images.length > 0 && (
            <Button
              onClick={analyzePhotos}
              variant="outline"
              size="sm"
              disabled={isAnalyzingPhotos}
            >
              {isAnalyzingPhotos ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Camera className="h-4 w-4 mr-2" />
              )}
              Анализировать
            </Button>
          )}
        </div>

        <ImageUploader
          images={formData.images}
          onChange={(images) => updateFormData({ images })}
          maxImages={20}
        />

        {/* Photo Analysis Results */}
        {Object.keys(photoAnalysis).length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
            {formData.images.map((image, index) => {
              const analysis = photoAnalysis[image];
              if (!analysis) return null;

              const qualityColors = {
                excellent: 'bg-green-100 text-green-800 border-green-200',
                good: 'bg-blue-100 text-blue-800 border-blue-200',
                fair: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                poor: 'bg-red-100 text-red-800 border-red-200',
              };

              return (
                <div key={index} className={`p-3 rounded-lg border ${qualityColors[analysis.quality]}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{analysis.roomType}</span>
                    <Badge className="text-xs">{analysis.score}/100</Badge>
                  </div>
                  <ul className="text-xs space-y-1">
                    {analysis.suggestions?.map((suggestion, i) => (
                      <li key={i}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {errors.images && (
          <p className="mt-2 text-sm text-red-600">{errors.images}</p>
        )}
      </div>

      {/* Title Section with AI Suggestions */}
      <div>
        <div className="flex items-start gap-2 mb-4">
          <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              Заголовок объявления <span className="text-red-500">*</span>
            </h3>
            <p className="text-sm text-gray-500">
              Выберите стиль и AI создаст привлекательный заголовок
            </p>
          </div>
        </div>

        {/* Title Style Selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {AI_TITLE_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => setSelectedTitleStyle(style.id)}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                selectedTitleStyle === style.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{style.icon}</span>
              {style.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <input
            type="text"
            value={formData.title}
            onChange={(e) => updateFormData({ title: e.target.value })}
            placeholder="Например: Продается 3-комнатная квартира в центре"
            className={`w-full px-4 py-3 pr-24 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            maxLength={100}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {formData.title.length}/100
            </span>
            <Button
              onClick={generateAITitle}
              size="sm"
              variant="ghost"
              disabled={isGeneratingTitle}
            >
              {isGeneratingTitle ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Title Suggestions */}
        {showAISuggestions && titleSuggestions.length > 0 && (
          <div className="mt-3 p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">AI предложения:</span>
            </div>
            <div className="space-y-2">
              {titleSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => updateFormData({ title: suggestion })}
                  className="w-full text-left px-3 py-2 bg-white rounded border border-purple-200 hover:border-purple-400 transition-colors text-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {errors.title && (
          <p className="mt-2 text-sm text-red-600">{errors.title}</p>
        )}
      </div>

      {/* Description Section with Voice Input */}
      <div>
        <div className="flex items-start gap-2 mb-4">
          <AlignLeft className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              Описание <span className="text-red-500">*</span>
            </h3>
            <p className="text-sm text-gray-500">
              Опишите голосом или выберите тон для AI генерации
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
              variant={isRecording ? "destructive" : "outline"}
              size="sm"
            >
              {isRecording ? (
                <>
                  <MicOff className="h-4 w-4 mr-2" />
                  Стоп
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Диктовать
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Tone Selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {AI_DESCRIPTION_TONES.map((tone) => (
            <button
              key={tone.id}
              onClick={() => setSelectedTone(tone.id)}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                selectedTone === tone.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tone.icon}</span>
              {tone.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <textarea
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            placeholder="Расскажите о преимуществах вашей недвижимости..."
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            rows={8}
            maxLength={2000}
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {formData.description.length}/2000
            </span>
            <Button
              onClick={generateAIDescription}
              size="sm"
              variant="ghost"
              disabled={isGeneratingDescription}
            >
              {isGeneratingDescription ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Brain className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {errors.description && (
          <p className="mt-2 text-sm text-red-600">{errors.description}</p>
        )}

        {/* Voice Recording Indicator */}
        {isRecording && (
          <div className="mt-3 p-3 bg-red-50 rounded-lg flex items-center gap-3">
            <div className="relative">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
            </div>
            <span className="text-sm font-medium text-red-900">Запись... Говорите четко</span>
          </div>
        )}
      </div>

      {/* AI Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="space-y-2 text-sm text-blue-900">
              <p className="font-semibold">💡 Советы от AI:</p>
              <ul className="space-y-1 text-blue-800">
                <li>• Объявления с 10+ фото получают в 3 раза больше откликов</li>
                <li>• Эмоциональные заголовки привлекают на 45% больше внимания</li>
                <li>• Указывайте уникальные особенности в первых 2 строках описания</li>
                <li>• Добавьте видеотур для увеличения конверсии на 80%</li>
                <li>• Лучшее время публикации: Вт-Чт, 10:00-12:00 или 19:00-21:00</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}