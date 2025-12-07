'use client';

import { Card, CardContent } from '@repo/ui';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PriceHistoryEntry {
  id: string;
  oldPrice: number;
  newPrice: number;
  currency: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

interface PriceStats {
  minPrice: number;
  maxPrice: number;
  firstPrice: number;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  totalChanges: number;
}

interface PriceHistoryChartProps {
  history: PriceHistoryEntry[];
  stats: PriceStats | null;
}

export function PriceHistoryChart({ history, stats }: PriceHistoryChartProps) {
  if (!history || history.length === 0 || !stats) {
    return null;
  }

  // Prepare data points for the chart
  const dataPoints = [
    {
      price: history[0].oldPrice,
      date: new Date(history[0].createdAt),
    },
    ...history.map((entry) => ({
      price: entry.newPrice,
      date: new Date(entry.createdAt),
    })),
  ];

  // Calculate chart dimensions
  const maxPrice = Math.max(...dataPoints.map((d) => d.price));
  const minPrice = Math.min(...dataPoints.map((d) => d.price));
  const priceRange = maxPrice - minPrice || 1; // Avoid division by zero
  const chartHeight = 200;
  const chartWidth = 600;

  // Generate SVG path for the line chart
  const points = dataPoints.map((point, index) => {
    const x = (index / (dataPoints.length - 1)) * chartWidth;
    const y = chartHeight - ((point.price - minPrice) / priceRange) * chartHeight;
    return { x, y, price: point.price, date: point.date };
  });

  const pathData = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  // Format currency
  const formatPrice = (price: number) => {
    return `${Math.round(price).toLocaleString('ru-RU')} у.е.`;
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const priceChangeIcon =
    stats.priceChangePercent > 0 ? (
      <TrendingUp className="h-5 w-5 text-green-600" />
    ) : stats.priceChangePercent < 0 ? (
      <TrendingDown className="h-5 w-5 text-red-600" />
    ) : (
      <Minus className="h-5 w-5 text-gray-600" />
    );

  const priceChangeColor =
    stats.priceChangePercent > 0
      ? 'text-green-600'
      : stats.priceChangePercent < 0
        ? 'text-red-600'
        : 'text-gray-600';

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">История цены</h2>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Текущая цена</div>
            <div className="text-lg font-bold text-gray-900">
              {formatPrice(stats.currentPrice)}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Изменение</div>
            <div className={`text-lg font-bold flex items-center gap-1 ${priceChangeColor}`}>
              {priceChangeIcon}
              <span>{stats.priceChangePercent > 0 ? '+' : ''}{stats.priceChangePercent.toFixed(1)}%</span>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Минимальная</div>
            <div className="text-lg font-bold text-gray-900">
              {formatPrice(stats.minPrice)}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Максимальная</div>
            <div className="text-lg font-bold text-gray-900">
              {formatPrice(stats.maxPrice)}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="relative bg-gray-50 rounded-lg p-6 overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}
            className="w-full"
            style={{ minWidth: '600px' }}
          >
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = chartHeight * (1 - ratio);
              const price = minPrice + priceRange * ratio;
              return (
                <g key={ratio}>
                  <line
                    x1="0"
                    y1={y}
                    x2={chartWidth}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x="-5"
                    y={y + 4}
                    textAnchor="end"
                    className="text-xs fill-gray-500"
                    fontSize="12"
                  >
                    {Math.round(price).toLocaleString('ru-RU')}
                  </text>
                </g>
              );
            })}

            {/* Price line */}
            <path
              d={pathData}
              fill="none"
              stroke="#2563eb"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {points.map((point, index) => (
              <g key={index}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  fill="#2563eb"
                  stroke="white"
                  strokeWidth="2"
                />
                {/* Date labels */}
                <text
                  x={point.x}
                  y={chartHeight + 20}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                  fontSize="11"
                >
                  {formatDate(point.date)}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Price change history */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            История изменений
          </h3>
          <div className="space-y-2">
            {history.map((entry, index) => {
              const priceChange = entry.newPrice - entry.oldPrice;
              const percentChange =
                ((priceChange / entry.oldPrice) * 100).toFixed(1);
              const isIncrease = priceChange > 0;

              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {isIncrease ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(entry.oldPrice)} → {formatPrice(entry.newPrice)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(new Date(entry.createdAt))}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`text-sm font-semibold ${
                      isIncrease ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {isIncrease ? '+' : ''}
                    {percentChange}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
