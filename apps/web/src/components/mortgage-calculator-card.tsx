'use client';

import { Card, CardContent } from '@repo/ui';
import { TrendingUp, CheckCircle2 } from 'lucide-react';

interface MortgageCalculatorCardProps {
  price: number;
  area: number;
  dealConditions?: string;
}

export function MortgageCalculatorCard({ price, area, dealConditions }: MortgageCalculatorCardProps) {
  const pricePerSqM = Math.round(price / area);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Price Header */}
          <div>
            <div className="text-3xl font-bold text-gray-900">
              {price.toLocaleString('ru-RU')} у.е.
            </div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-gray-600">
                Цена за метр
              </span>
            </div>
          </div>

          {/* Price per square meter */}
          <div className="border-t border-b border-gray-200 py-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Цена за метр</span>
              <span className="font-semibold text-lg">
                {pricePerSqM.toLocaleString('ru-RU')} у.е./м²
              </span>
            </div>
          </div>

          {/* Deal conditions */}
          {dealConditions && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">
                Условия сделки
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{dealConditions}</span>
              </div>
            </div>
          )}

          {/* Contact button */}
          <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
            Контакты застройщика
          </button>

          {/* Online status */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Свяжитесь с застройщиком, пока он онлайн</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
