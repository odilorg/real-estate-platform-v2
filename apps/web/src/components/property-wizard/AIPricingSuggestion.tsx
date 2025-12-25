'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Badge } from '@repo/ui';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Info,
  Loader2,
  BarChart3,
  MapPin,
  Home,
  Calendar,
  AlertCircle,
  CheckCircle,
  Target,
  Sparkles
} from 'lucide-react';

interface PricingSuggestionProps {
  propertyType: string;
  district: string;
  area: string;
  bedrooms: string;
  floor: string;
  totalFloors: string;
  yearBuilt: string;
  renovation?: string;
  onPriceSelect: (price: string) => void;
  currentPrice?: string;
}

interface MarketAnalysis {
  averagePrice: number;
  pricePerSqm: number;
  minPrice: number;
  maxPrice: number;
  suggestedPrice: number;
  quickSalePrice: number;
  premiumPrice: number;
  trend: 'rising' | 'stable' | 'falling';
  trendPercentage: number;
  similarListings: number;
  demandLevel: 'high' | 'medium' | 'low';
  competitionLevel: 'high' | 'medium' | 'low';
  bestTimeToSell: string;
}

interface PriceFactors {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  value: string;
  priceAdjustment: number;
}

export function AIPricingSuggestion({
  propertyType,
  district,
  area,
  bedrooms,
  floor,
  totalFloors,
  yearBuilt,
  renovation,
  onPriceSelect,
  currentPrice
}: PricingSuggestionProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [priceFactors, setPriceFactors] = useState<PriceFactors[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<'suggested' | 'quick' | 'premium'>('suggested');

  // Analyze market and suggest price
  const analyzeMarket = async () => {
    setIsAnalyzing(true);

    // Simulate API call to AI pricing service
    setTimeout(() => {
      const basePrice = parseInt(area) * 1200; // Base price per sqm in USD

      // Calculate adjustments based on factors
      let adjustedPrice = basePrice;
      const factors: PriceFactors[] = [];

      // District factor
      const districtMultipliers: Record<string, number> = {
        'Мирабадский': 1.3,
        'Яккасарайский': 1.2,
        'Юнусабадский': 1.15,
        'Чиланзарский': 1.0,
        'Сергелийский': 0.9,
        'Алмазарский': 0.95,
      };
      const districtMultiplier = districtMultipliers[district] || 1.0;
      adjustedPrice *= districtMultiplier;

      factors.push({
        factor: 'Район',
        impact: districtMultiplier > 1 ? 'positive' : districtMultiplier < 1 ? 'negative' : 'neutral',
        value: district,
        priceAdjustment: Math.round((districtMultiplier - 1) * basePrice)
      });

      // Floor factor
      const floorNum = parseInt(floor);
      const totalFloorsNum = parseInt(totalFloors);
      let floorMultiplier = 1.0;

      if (floorNum === 1) {
        floorMultiplier = 0.95; // First floor discount
      } else if (floorNum === totalFloorsNum) {
        floorMultiplier = 0.97; // Last floor small discount
      } else if (floorNum >= 3 && floorNum <= 7) {
        floorMultiplier = 1.05; // Preferred floors
      }

      adjustedPrice *= floorMultiplier;
      factors.push({
        factor: 'Этаж',
        impact: floorMultiplier > 1 ? 'positive' : floorMultiplier < 1 ? 'negative' : 'neutral',
        value: `${floor}/${totalFloors}`,
        priceAdjustment: Math.round((floorMultiplier - 1) * basePrice)
      });

      // Year built factor
      const currentYear = new Date().getFullYear();
      const buildingAge = currentYear - parseInt(yearBuilt || '2000');
      let ageMultiplier = 1.0;

      if (buildingAge <= 2) {
        ageMultiplier = 1.15; // New building premium
      } else if (buildingAge <= 5) {
        ageMultiplier = 1.1;
      } else if (buildingAge <= 10) {
        ageMultiplier = 1.0;
      } else if (buildingAge <= 20) {
        ageMultiplier = 0.95;
      } else {
        ageMultiplier = 0.9;
      }

      adjustedPrice *= ageMultiplier;
      factors.push({
        factor: 'Год постройки',
        impact: ageMultiplier > 1 ? 'positive' : ageMultiplier < 1 ? 'negative' : 'neutral',
        value: yearBuilt || 'Не указан',
        priceAdjustment: Math.round((ageMultiplier - 1) * basePrice)
      });

      // Renovation factor
      if (renovation === 'EURO') {
        adjustedPrice *= 1.2;
        factors.push({
          factor: 'Ремонт',
          impact: 'positive',
          value: 'Евроремонт',
          priceAdjustment: Math.round(0.2 * basePrice)
        });
      } else if (renovation === 'DESIGNER') {
        adjustedPrice *= 1.3;
        factors.push({
          factor: 'Ремонт',
          impact: 'positive',
          value: 'Дизайнерский',
          priceAdjustment: Math.round(0.3 * basePrice)
        });
      }

      // Room count factor
      const roomCount = parseInt(bedrooms);
      if (roomCount === 1) {
        adjustedPrice *= 1.1; // Studios/1-room are in high demand
        factors.push({
          factor: 'Количество комнат',
          impact: 'positive',
          value: '1-комнатная (высокий спрос)',
          priceAdjustment: Math.round(0.1 * basePrice)
        });
      }

      const marketAnalysis: MarketAnalysis = {
        averagePrice: Math.round(adjustedPrice),
        pricePerSqm: Math.round(adjustedPrice / parseInt(area)),
        minPrice: Math.round(adjustedPrice * 0.85),
        maxPrice: Math.round(adjustedPrice * 1.15),
        suggestedPrice: Math.round(adjustedPrice),
        quickSalePrice: Math.round(adjustedPrice * 0.92),
        premiumPrice: Math.round(adjustedPrice * 1.08),
        trend: Math.random() > 0.5 ? 'rising' : Math.random() > 0.5 ? 'stable' : 'falling',
        trendPercentage: Math.round(Math.random() * 10 - 2),
        similarListings: Math.round(15 + Math.random() * 30),
        demandLevel: roomCount <= 2 ? 'high' : 'medium',
        competitionLevel: roomCount <= 2 ? 'high' : 'medium',
        bestTimeToSell: 'Март-Май, Сентябрь-Ноябрь'
      };

      setAnalysis(marketAnalysis);
      setPriceFactors(factors);
      setIsAnalyzing(false);
    }, 2500);
  };

  useEffect(() => {
    // Auto-analyze when key fields are filled
    if (district && area && bedrooms && floor && totalFloors) {
      analyzeMarket();
    }
  }, [district, area, bedrooms, floor, totalFloors]);

  const getPriceForStrategy = () => {
    if (!analysis) return 0;

    switch (selectedStrategy) {
      case 'quick':
        return analysis.quickSalePrice;
      case 'premium':
        return analysis.premiumPrice;
      default:
        return analysis.suggestedPrice;
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-RU');
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'falling':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <TrendingUp className="h-4 w-4 text-gray-600 rotate-90" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive':
        return 'text-green-600 bg-green-50';
      case 'negative':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">AI Анализ цены</h3>
              <p className="text-sm text-gray-600">Умная оценка стоимости</p>
            </div>
          </div>
          <Button
            onClick={analyzeMarket}
            variant="outline"
            size="sm"
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BarChart3 className="h-4 w-4" />
            )}
            <span className="ml-2">Обновить</span>
          </Button>
        </div>

        {isAnalyzing ? (
          <div className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
            <p className="text-gray-600">Анализируем рынок недвижимости...</p>
            <p className="text-sm text-gray-500 mt-2">Сравниваем с {Math.round(20 + Math.random() * 30)} похожими объектами</p>
          </div>
        ) : analysis ? (
          <div className="space-y-6">
            {/* Market Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg p-3 border border-purple-100">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Home className="h-4 w-4" />
                  <span className="text-xs">Похожих</span>
                </div>
                <div className="font-bold text-lg">{analysis.similarListings}</div>
              </div>

              <div className="bg-white rounded-lg p-3 border border-purple-100">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  {getTrendIcon(analysis.trend)}
                  <span className="text-xs">Тренд</span>
                </div>
                <div className="font-bold text-lg">
                  {analysis.trendPercentage > 0 ? '+' : ''}{analysis.trendPercentage}%
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 border border-purple-100">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Target className="h-4 w-4" />
                  <span className="text-xs">Спрос</span>
                </div>
                <Badge variant={analysis.demandLevel === 'high' ? 'default' : 'secondary'}>
                  {analysis.demandLevel === 'high' ? 'Высокий' : analysis.demandLevel === 'medium' ? 'Средний' : 'Низкий'}
                </Badge>
              </div>

              <div className="bg-white rounded-lg p-3 border border-purple-100">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs">$/м²</span>
                </div>
                <div className="font-bold text-lg">${analysis.pricePerSqm}</div>
              </div>
            </div>

            {/* Pricing Strategies */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Стратегии ценообразования</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => setSelectedStrategy('quick')}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedStrategy === 'quick'
                      ? 'border-orange-400 bg-orange-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      ⚡
                    </div>
                    <span className="font-semibold">Быстрая продажа</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600 mb-1">
                    ${formatPrice(analysis.quickSalePrice)}
                  </div>
                  <p className="text-xs text-gray-600">На 8% ниже рынка</p>
                  <p className="text-xs text-gray-500 mt-1">Продажа за 2-3 недели</p>
                </button>

                <button
                  onClick={() => setSelectedStrategy('suggested')}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedStrategy === 'suggested'
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      ✓
                    </div>
                    <span className="font-semibold">Оптимальная</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    ${formatPrice(analysis.suggestedPrice)}
                  </div>
                  <p className="text-xs text-gray-600">Рыночная цена</p>
                  <p className="text-xs text-gray-500 mt-1">Продажа за 1-2 месяца</p>
                </button>

                <button
                  onClick={() => setSelectedStrategy('premium')}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedStrategy === 'premium'
                      ? 'border-purple-400 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      💎
                    </div>
                    <span className="font-semibold">Премиум</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    ${formatPrice(analysis.premiumPrice)}
                  </div>
                  <p className="text-xs text-gray-600">На 8% выше рынка</p>
                  <p className="text-xs text-gray-500 mt-1">Для терпеливых продавцов</p>
                </button>
              </div>
            </div>

            {/* Apply Price Button */}
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-purple-200">
              <div>
                <p className="text-sm text-gray-600">Выбранная цена:</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${formatPrice(getPriceForStrategy())}
                </p>
              </div>
              <Button
                onClick={() => onPriceSelect(getPriceForStrategy().toString())}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                Применить цену
              </Button>
            </div>

            {/* Price Factors */}
            <div>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
              >
                <Info className="h-4 w-4" />
                {showDetails ? 'Скрыть' : 'Показать'} факторы ценообразования
              </button>

              {showDetails && (
                <div className="mt-4 space-y-2">
                  {priceFactors.map((factor, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getImpactColor(factor.impact)}`}>
                          {factor.impact === 'positive' ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : factor.impact === 'negative' ? (
                            <TrendingDown className="h-4 w-4" />
                          ) : (
                            <TrendingUp className="h-4 w-4 rotate-90" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{factor.factor}</p>
                          <p className="text-sm text-gray-600">{factor.value}</p>
                        </div>
                      </div>
                      <div className={`font-semibold ${
                        factor.impact === 'positive' ? 'text-green-600' :
                        factor.impact === 'negative' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {factor.priceAdjustment > 0 ? '+' : ''}${formatPrice(factor.priceAdjustment)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Best Time to Sell */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900">Лучшее время для продажи</p>
                  <p className="text-sm text-blue-800 mt-1">{analysis.bestTimeToSell}</p>
                  <p className="text-xs text-blue-700 mt-2">
                    В эти месяцы спрос на недвижимость максимальный
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Заполните характеристики недвижимости для анализа цены</p>
          </div>
        )}
      </div>
    </Card>
  );
}