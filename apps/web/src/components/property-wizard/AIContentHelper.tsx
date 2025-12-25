'use client';

import { useState } from 'react';
import { Button, Badge } from '@repo/ui';
import { Sparkles, RefreshCw, Copy, Check, TrendingUp } from 'lucide-react';
import {
  SmartTitleGenerator,
  SmartDescriptionGenerator,
  PriceCalculator,
  type PropertyData
} from '@/lib/property-ai-templates';

interface AIContentHelperProps {
  formData: any;
  onTitleSelect: (title: string) => void;
  onDescriptionSelect: (description: string) => void;
  onPriceSelect?: (price: string) => void;
}

export function AIContentHelper({
  formData,
  onTitleSelect,
  onDescriptionSelect,
  onPriceSelect
}: AIContentHelperProps) {
  const [titleStyle, setTitleStyle] = useState<'professional' | 'emotional' | 'urgent' | 'luxury'>('professional');
  const [descriptionTone, setDescriptionTone] = useState<'family' | 'investment' | 'luxury' | 'practical'>('practical');
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [priceAnalysis, setPriceAnalysis] = useState<any>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Convert form data to PropertyData type
  const getPropertyData = (): PropertyData => {
    return {
      propertyType: formData.propertyType || 'APARTMENT',
      listingType: formData.listingType || 'SALE',
      bedrooms: parseInt(formData.bedrooms) || 0,
      bathrooms: parseInt(formData.bathrooms) || 0,
      area: parseInt(formData.area) || 0,
      floor: parseInt(formData.floor) || undefined,
      totalFloors: parseInt(formData.totalFloors) || undefined,
      district: formData.district || '',
      city: formData.city || 'Ташкент',
      price: parseInt(formData.price) || 0,
      yearBuilt: parseInt(formData.yearBuilt) || undefined,
      renovation: formData.renovation || undefined,
      parking: formData.parking === 'yes' || formData.parking === true,
      balcony: formData.balcony > 0,
      furnished: formData.furnished || 'NO',
      nearMetro: formData.nearestMetro || undefined,
      metroDistance: parseInt(formData.metroDistance) || undefined,
    };
  };

  const generateTitles = () => {
    const propertyData = getPropertyData();
    const titleGen = new SmartTitleGenerator(propertyData);
    const titles = titleGen.generate(titleStyle);
    setGeneratedTitles(titles);
  };

  const generateDescription = () => {
    const propertyData = getPropertyData();
    const descGen = new SmartDescriptionGenerator(propertyData);
    const description = descGen.generate(descriptionTone);
    setGeneratedDescription(description);
  };

  const calculatePrice = () => {
    const propertyData = getPropertyData();
    const analysis = PriceCalculator.calculatePrice(propertyData);
    setPriceAnalysis(analysis);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const titleStyles = [
    { value: 'professional', label: 'Профессиональный', icon: '💼' },
    { value: 'emotional', label: 'Эмоциональный', icon: '❤️' },
    { value: 'urgent', label: 'Срочный', icon: '🔥' },
    { value: 'luxury', label: 'Премиум', icon: '✨' },
  ];

  const descriptionTones = [
    { value: 'practical', label: 'Практичный', icon: '🎯' },
    { value: 'family', label: 'Для семьи', icon: '👨‍👩‍👧‍👦' },
    { value: 'investment', label: 'Инвестиция', icon: '📈' },
    { value: 'luxury', label: 'Люкс', icon: '🏰' },
  ];

  return (
    <div className="space-y-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Умный помощник</h3>
          <p className="text-sm text-gray-600">Создаю привлекательный контент без AI</p>
        </div>
      </div>

      {/* Title Generator */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">Генератор заголовков</h4>

        <div className="flex gap-2 flex-wrap">
          {titleStyles.map(style => (
            <button
              key={style.value}
              onClick={() => setTitleStyle(style.value as any)}
              className={`px-3 py-2 rounded-lg border-2 transition-all ${
                titleStyle === style.value
                  ? 'border-purple-500 bg-purple-100'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
            >
              <span className="mr-1">{style.icon}</span>
              <span className="text-sm">{style.label}</span>
            </button>
          ))}
        </div>

        <Button onClick={generateTitles} variant="outline" className="w-full">
          <RefreshCw className="h-4 w-4 mr-2" />
          Создать заголовки
        </Button>

        {generatedTitles.length > 0 && (
          <div className="space-y-2">
            {generatedTitles.map((title, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-400 transition-colors"
              >
                <button
                  onClick={() => onTitleSelect(title)}
                  className="flex-1 text-left text-sm"
                >
                  {title}
                </button>
                <button
                  onClick={() => copyToClipboard(title, index)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {copiedIndex === index ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Description Generator */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">Генератор описаний</h4>

        <div className="flex gap-2 flex-wrap">
          {descriptionTones.map(tone => (
            <button
              key={tone.value}
              onClick={() => setDescriptionTone(tone.value as any)}
              className={`px-3 py-2 rounded-lg border-2 transition-all ${
                descriptionTone === tone.value
                  ? 'border-blue-500 bg-blue-100'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
            >
              <span className="mr-1">{tone.icon}</span>
              <span className="text-sm">{tone.label}</span>
            </button>
          ))}
        </div>

        <Button onClick={generateDescription} variant="outline" className="w-full">
          <RefreshCw className="h-4 w-4 mr-2" />
          Создать описание
        </Button>

        {generatedDescription && (
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
              {generatedDescription}
            </pre>
            <div className="flex gap-2 mt-3">
              <Button
                onClick={() => onDescriptionSelect(generatedDescription)}
                size="sm"
                className="flex-1"
              >
                Применить
              </Button>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(generatedDescription);
                }}
                size="sm"
                variant="outline"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Price Calculator */}
      {onPriceSelect && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Калькулятор цены</h4>

          <Button onClick={calculatePrice} variant="outline" className="w-full">
            <TrendingUp className="h-4 w-4 mr-2" />
            Рассчитать цену
          </Button>

          {priceAnalysis && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  ${priceAnalysis.estimated.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">
                  ${priceAnalysis.pricePerSqm}/м²
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xs text-gray-500">Быстрая продажа</div>
                  <div className="font-semibold text-orange-600">
                    ${PriceCalculator.getQuickSalePrice(priceAnalysis.estimated).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Оптимальная</div>
                  <div className="font-semibold text-blue-600">
                    ${priceAnalysis.estimated.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Премиум</div>
                  <div className="font-semibold text-purple-600">
                    ${PriceCalculator.getPremiumPrice(priceAnalysis.estimated).toLocaleString()}
                  </div>
                </div>
              </div>

              {priceAnalysis.factors.length > 0 && (
                <div className="space-y-1 pt-3 border-t">
                  <div className="text-xs font-semibold text-gray-700">Факторы цены:</div>
                  {priceAnalysis.factors.map((factor: any, index: number) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="text-gray-600">{factor.name}</span>
                      <span className={factor.impact > 0 ? 'text-green-600' : factor.impact < 0 ? 'text-red-600' : 'text-gray-600'}>
                        {factor.impact > 0 ? '+' : ''}{(factor.impact * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={() => onPriceSelect(priceAnalysis.estimated.toString())}
                className="w-full"
                size="sm"
              >
                Применить цену
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-gray-600 bg-white/50 rounded p-3">
        💡 Этот помощник использует умные шаблоны и правила для создания контента.
        Никаких внешних AI API не требуется - работает полностью офлайн и бесплатно!
      </div>
    </div>
  );
}