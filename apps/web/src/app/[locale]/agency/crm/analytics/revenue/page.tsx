'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface RevenueTrend {
  month: string;
  revenue: number;
  commissions: number;
  deals: number;
}

interface RevenueData {
  trend: RevenueTrend[];
  totals: {
    revenue: number;
    commissions: number;
    deals: number;
    avgDealValue: number;
  };
}

export default function RevenueAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RevenueData | null>(null);
  const [period, setPeriod] = useState<'MONTH' | 'QUARTER' | 'YEAR'>('YEAR');

  useEffect(() => {
    fetchRevenue();
  }, [period]);

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      const response = await api.get<RevenueData>(
        `/agency-crm/analytics/revenue?period=${period}`
      );
      setData(response);
    } catch (error: any) {
      console.error('Failed to fetch revenue:', error);
      toast.error('Ошибка загрузки аналитики выручки', {
        description: 'Попробуйте обновить страницу',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU').format(amount);
  };

  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' });
  };

  if (loading && !data) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Нет данных</div>
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.trend.map((t) => t.revenue), 1);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Аналитика выручки</h1>
          <p className="text-gray-600 mt-1">Динамика продаж и комиссий</p>
        </div>

        {/* Period selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('MONTH')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === 'MONTH'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Месяц
          </button>
          <button
            onClick={() => setPeriod('QUARTER')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === 'QUARTER'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Квартал
          </button>
          <button
            onClick={() => setPeriod('YEAR')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === 'YEAR'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Год
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-600 text-sm font-medium">
              Общая выручка
            </div>
            <div className="text-2xl">💰</div>
          </div>
          <div className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
            {formatCurrency(data.totals.revenue)}
          </div>
          <div className="mt-2 text-sm text-gray-600">у.е.</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-600 text-sm font-medium">Комиссии</div>
            <div className="text-2xl">💳</div>
          </div>
          <div className="text-xl md:text-2xl lg:text-3xl font-bold text-green-600">
            {formatCurrency(data.totals.commissions)}
          </div>
          <div className="mt-2 text-sm text-gray-600">у.е.</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-600 text-sm font-medium">
              Закрытых сделок
            </div>
            <div className="text-2xl">🤝</div>
          </div>
          <div className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
            {data.totals.deals}
          </div>
          <div className="mt-2 text-sm text-gray-600">сделок</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-600 text-sm font-medium">Средний чек</div>
            <div className="text-2xl">💵</div>
          </div>
          <div className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
            {formatCurrency(data.totals.avgDealValue)}
          </div>
          <div className="mt-2 text-sm text-gray-600">у.е.</div>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Динамика выручки
        </h2>

        {data.trend.length > 0 ? (
          <div className="space-y-4">
            {data.trend.map((item) => {
              const heightPercentage = (item.revenue / maxRevenue) * 100;
              const commissionPercentage = item.revenue > 0
                ? (item.commissions / item.revenue) * 100
                : 0;

              return (
                <div key={item.month} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {formatMonth(item.month)}
                    </span>
                    <div className="flex items-center gap-6">
                      <span className="text-sm text-gray-600">
                        {item.deals} сделок
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(item.revenue)} у.е.
                      </span>
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(item.commissions)} у.е.
                      </span>
                    </div>
                  </div>

                  <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
                    {/* Revenue bar */}
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                      style={{ width: `${heightPercentage}%` }}
                    />
                    {/* Commission overlay */}
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-600 opacity-60 transition-all duration-500"
                      style={{ width: `${(heightPercentage * commissionPercentage) / 100}%` }}
                    />
                    {/* Label inside bar */}
                    {heightPercentage > 15 && (
                      <div className="absolute inset-0 flex items-center px-4">
                        <span className="text-white font-medium text-sm">
                          {formatCurrency(item.revenue)} у.е.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-2">
              Нет закрытых сделок за выбранный период
            </div>
            <div className="text-sm text-gray-400">
              Завершите сделки, чтобы увидеть динамику выручки
            </div>
          </div>
        )}

        {/* Legend */}
        {data.trend.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded"></div>
              <span className="text-sm text-gray-600">Выручка</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-green-600 rounded"></div>
              <span className="text-sm text-gray-600">Комиссии</span>
            </div>
          </div>
        )}
      </div>

      {/* Monthly Breakdown Table */}
      {data.trend.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Детальная разбивка
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Период
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Сделок
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Выручка
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Комиссии
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ср. чек
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % комиссий
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.trend.map((item) => {
                  const avgDeal = item.deals > 0 ? item.revenue / item.deals : 0;
                  const commissionPercent = item.revenue > 0
                    ? (item.commissions / item.revenue) * 100
                    : 0;

                  return (
                    <tr key={item.month} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {formatMonth(item.month)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-900">{item.deals}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(item.revenue)} у.е.
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(item.commissions)} у.е.
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(avgDeal)} у.е.
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-600">
                          {commissionPercent.toFixed(1)}%
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-gray-900">Итого</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-bold text-gray-900">
                      {data.totals.deals}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-bold text-gray-900">
                      {formatCurrency(data.totals.revenue)} у.е.
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-bold text-green-600">
                      {formatCurrency(data.totals.commissions)} у.е.
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-bold text-gray-900">
                      {formatCurrency(data.totals.avgDealValue)} у.е.
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-bold text-gray-600">
                      {data.totals.revenue > 0
                        ? ((data.totals.commissions / data.totals.revenue) * 100).toFixed(1)
                        : 0}
                      %
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
