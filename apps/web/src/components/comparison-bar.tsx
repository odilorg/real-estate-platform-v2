'use client';

import { useComparison } from '@/context';
import { useRouter } from 'next/navigation';
import { X, Scale } from 'lucide-react';

export function ComparisonBar() {
  const { comparisonProperties, removeFromComparison, clearComparison } = useComparison();
  const router = useRouter();

  if (comparisonProperties.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left side - Selected properties */}
          <div className="flex-1 flex items-center gap-4 overflow-x-auto">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 whitespace-nowrap">
              <Scale className="h-5 w-5 text-blue-600" />
              <span>Сравнение ({comparisonProperties.length}/4):</span>
            </div>

            <div className="flex gap-2 overflow-x-auto">
              {comparisonProperties.map((property) => (
                <div
                  key={property.id}
                  className="relative flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 min-w-max"
                >
                  {property.imageUrl && (
                    <img
                      src={property.imageUrl}
                      alt={property.title}
                      className="w-10 h-10 rounded object-cover"
                    />
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                      {property.title}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Intl.NumberFormat('ru-RU').format(property.price)} у.е.
                    </span>
                  </div>
                  <button
                    onClick={() => removeFromComparison(property.id)}
                    className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Убрать"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={clearComparison}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap"
            >
              Очистить всё
            </button>

            <button
              onClick={() => router.push('/compare')}
              disabled={comparisonProperties.length < 2}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium px-6 py-2.5 rounded-lg transition-colors whitespace-nowrap"
            >
              Сравнить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
