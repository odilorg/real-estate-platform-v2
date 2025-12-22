'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface AgentPerformance {
  memberId: string;
  name: string;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  totalDeals: number;
  wonDeals: number;
  winRate: number;
  revenue: number;
  commissions: number;
}

interface LeaderboardData {
  leaderboard: AgentPerformance[];
}

export default function AgentsAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [period, setPeriod] = useState<'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR'>('MONTH');

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await api.get<LeaderboardData>(
        `/agency-crm/analytics/agents?period=${period}`
      );
      setData(response);
    } catch (error: any) {
      console.error('Failed to fetch leaderboard:', error);
      alert('Ошибка загрузки лидерборда');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU').format(amount);
  };

  const getMedalEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Лидерборд агентов</h1>
          <p className="text-gray-600 mt-1">
            Рейтинг эффективности команды
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

      {/* Top 3 Podium */}
      {data.leaderboard.length >= 3 && (
        <div className="mb-8 flex items-end justify-center gap-4">
          {/* 2nd Place */}
          <div className="flex flex-col items-center">
            <div className="text-4xl mb-2">🥈</div>
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-lg p-6 w-48 text-center">
              <div className="font-bold text-lg text-gray-900 mb-2">
                {data.leaderboard[1].name}
              </div>
              <div className="text-2xl font-bold text-gray-700 mb-1">
                {formatCurrency(data.leaderboard[1].revenue)} у.е.
              </div>
              <div className="text-sm text-gray-600">
                {data.leaderboard[1].wonDeals} сделок
              </div>
            </div>
            <div className="mt-4 h-32 w-48 bg-gradient-to-t from-gray-300 to-gray-200 rounded-t-lg"></div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center -mb-8">
            <div className="text-5xl mb-2">🥇</div>
            <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg shadow-xl p-6 w-48 text-center border-2 border-yellow-400">
              <div className="font-bold text-xl text-gray-900 mb-2">
                {data.leaderboard[0].name}
              </div>
              <div className="text-xl md:text-2xl lg:text-3xl font-bold text-yellow-700 mb-1">
                {formatCurrency(data.leaderboard[0].revenue)} у.е.
              </div>
              <div className="text-sm text-gray-600">
                {data.leaderboard[0].wonDeals} сделок
              </div>
            </div>
            <div className="mt-4 h-40 w-48 bg-gradient-to-t from-yellow-400 to-yellow-300 rounded-t-lg"></div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center">
            <div className="text-4xl mb-2">🥉</div>
            <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg shadow-lg p-6 w-48 text-center">
              <div className="font-bold text-lg text-gray-900 mb-2">
                {data.leaderboard[2].name}
              </div>
              <div className="text-2xl font-bold text-orange-700 mb-1">
                {formatCurrency(data.leaderboard[2].revenue)} у.е.
              </div>
              <div className="text-sm text-gray-600">
                {data.leaderboard[2].wonDeals} сделок
              </div>
            </div>
            <div className="mt-4 h-24 w-48 bg-gradient-to-t from-orange-300 to-orange-200 rounded-t-lg"></div>
          </div>
        </div>
      )}

      {/* Detailed Leaderboard Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Место
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Агент
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Лиды
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Конверсия
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Сделки
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Win Rate
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Выручка
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Комиссии
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.leaderboard.map((agent, index) => (
              <tr
                key={agent.memberId}
                className={`${
                  index < 3 ? 'bg-yellow-50' : 'hover:bg-gray-50'
                } transition-colors`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-lg font-bold text-gray-900">
                    {getMedalEmoji(index)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{agent.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm text-gray-900">{agent.totalLeads}</div>
                  <div className="text-xs text-gray-500">
                    конвертировано: {agent.convertedLeads}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {agent.conversionRate.toFixed(1)}%
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm text-gray-900">{agent.totalDeals}</div>
                  <div className="text-xs text-gray-500">
                    выиграно: {agent.wonDeals}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {agent.winRate.toFixed(1)}%
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm font-bold text-gray-900">
                    {formatCurrency(agent.revenue)} у.е.
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm font-medium text-green-600">
                    {formatCurrency(agent.commissions)} у.е.
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data.leaderboard.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-2">Нет данных за выбранный период</div>
            <div className="text-sm text-gray-400">
              Добавьте агентов и лиды, чтобы увидеть статистику
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {data.leaderboard.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm font-medium mb-2">
              Всего агентов
            </div>
            <div className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
              {data.leaderboard.length}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm font-medium mb-2">
              Общая выручка
            </div>
            <div className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
              {formatCurrency(
                data.leaderboard.reduce((sum, agent) => sum + agent.revenue, 0)
              )}{' '}
              у.е.
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm font-medium mb-2">
              Общие комиссии
            </div>
            <div className="text-xl md:text-2xl lg:text-3xl font-bold text-green-600">
              {formatCurrency(
                data.leaderboard.reduce((sum, agent) => sum + agent.commissions, 0)
              )}{' '}
              у.е.
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-600 text-sm font-medium mb-2">
              Средняя конверсия
            </div>
            <div className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
              {data.leaderboard.length > 0
                ? (
                    data.leaderboard.reduce(
                      (sum, agent) => sum + agent.conversionRate,
                      0
                    ) / data.leaderboard.length
                  ).toFixed(1)
                : 0}
              %
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
