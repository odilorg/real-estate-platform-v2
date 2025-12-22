'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { api } from '@/lib/api';

interface DashboardData {
  period: {
    startDate: string;
    endDate: string;
  };
  overview: {
    totalLeads: number;
    newLeads: number;
    convertedLeads: number;
    conversionRate: number;
    totalDeals: number;
    activeDeals: number;
    wonDeals: number;
    winRate: number;
    totalRevenue: number;
    avgDealValue: number;
    totalCommissions: number;
    commissionsCount: number;
  };
  leadsBySource: Array<{
    source: string;
    count: number;
  }>;
  dealsByStage: Array<{
    stage: string;
    count: number;
    value: number;
  }>;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [period, setPeriod] = useState<'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR'>('MONTH');

  useEffect(() => {
    fetchDashboard();
  }, [period]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.get<DashboardData>(
        `/agency-crm/analytics/dashboard?period=${period}`
      );
      setData(response);
    } catch (error: any) {
      console.error('Failed to fetch dashboard:', error);
      alert('Ошибка загрузки аналитики');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU').format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      WEBSITE: 'Сайт',
      PHONE: 'Телефон',
      EMAIL: 'Email',
      REFERRAL: 'Рекомендация',
      SOCIAL: 'Соц. сети',
      WALK_IN: 'Личный визит',
      OTHER: 'Другое',
    };
    return labels[source] || source;
  };

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      NEW: 'Новая',
      QUALIFIED: 'Квалифицирована',
      PROPOSAL: 'Предложение',
      NEGOTIATION: 'Переговоры',
      CLOSED_WON: 'Выиграна',
      CLOSED_LOST: 'Проиграна',
    };
    return labels[stage] || stage;
  };

  if (loading && !data) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Загрузка аналитики...</div>
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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Аналитика CRM</h1>
          <p className="text-gray-600 mt-1">
            {formatDate(data.period.startDate)} — {formatDate(data.period.endDate)}
          </p>
        </div>

        {/* Period selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('WEEK')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === 'WEEK'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Неделя
          </button>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Leads */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-600 text-sm font-medium">Лиды</div>
            <div className="text-2xl">📊</div>
          </div>
          <div className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
            {data.overview.totalLeads}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Новых: {data.overview.newLeads}
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-600 text-sm font-medium">Конверсия</div>
            <div className="text-2xl">📈</div>
          </div>
          <div className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
            {data.overview.conversionRate}%
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Конвертировано: {data.overview.convertedLeads}
          </div>
        </div>

        {/* Active Deals */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-600 text-sm font-medium">Сделки</div>
            <div className="text-2xl">🤝</div>
          </div>
          <div className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
            {data.overview.activeDeals}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Всего: {data.overview.totalDeals}
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-600 text-sm font-medium">Win Rate</div>
            <div className="text-2xl">🎯</div>
          </div>
          <div className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
            {data.overview.winRate}%
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Выиграно: {data.overview.wonDeals}
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-600 text-sm font-medium">Выручка</div>
            <div className="text-2xl">💰</div>
          </div>
          <div className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
            {formatCurrency(data.overview.totalRevenue)}
          </div>
          <div className="mt-2 text-sm text-gray-600">у.е.</div>
        </div>

        {/* Avg Deal Value */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-600 text-sm font-medium">Средний чек</div>
            <div className="text-2xl">💵</div>
          </div>
          <div className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
            {formatCurrency(data.overview.avgDealValue)}
          </div>
          <div className="mt-2 text-sm text-gray-600">у.е.</div>
        </div>

        {/* Total Commissions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-600 text-sm font-medium">Комиссии</div>
            <div className="text-2xl">💳</div>
          </div>
          <div className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
            {formatCurrency(data.overview.totalCommissions)}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Выплат: {data.overview.commissionsCount}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow p-6 flex flex-col justify-center">
          <div className="text-gray-700 text-sm font-medium mb-4">
            Детальная аналитика
          </div>
          <div className="space-y-2">
            <button
              onClick={() => router.push('/agency-crm/analytics/leads')}
              className="w-full text-left px-3 py-2 text-sm text-blue-700 hover:bg-white rounded transition-colors"
            >
              → Лиды
            </button>
            <button
              onClick={() => router.push('/agency-crm/analytics/deals')}
              className="w-full text-left px-3 py-2 text-sm text-blue-700 hover:bg-white rounded transition-colors"
            >
              → Сделки
            </button>
            <button
              onClick={() => router.push('/agency-crm/analytics/agents')}
              className="w-full text-left px-3 py-2 text-sm text-blue-700 hover:bg-white rounded transition-colors"
            >
              → Агенты
            </button>
            <button
              onClick={() => router.push('/agency-crm/analytics/revenue')}
              className="w-full text-left px-3 py-2 text-sm text-blue-700 hover:bg-white rounded transition-colors"
            >
              → Выручка
            </button>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads by Source */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Лиды по источникам
          </h2>
          <div className="space-y-3">
            {data.leadsBySource.map((item) => {
              const total = data.leadsBySource.reduce((sum, i) => sum + i.count, 0);
              const percentage = total > 0 ? (item.count / total) * 100 : 0;
              return (
                <div key={item.source}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">
                      {getSourceLabel(item.source)}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {item.count} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {data.leadsBySource.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                Нет данных за выбранный период
              </div>
            )}
          </div>
        </div>

        {/* Deals by Stage */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Сделки по этапам
          </h2>
          <div className="space-y-3">
            {data.dealsByStage.map((item) => {
              const totalValue = data.dealsByStage.reduce(
                (sum, i) => sum + i.value,
                0
              );
              const percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
              return (
                <div key={item.stage}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">
                      {getStageLabel(item.stage)}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {item.count} / {formatCurrency(item.value)} у.е.
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {data.dealsByStage.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                Нет активных сделок
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
