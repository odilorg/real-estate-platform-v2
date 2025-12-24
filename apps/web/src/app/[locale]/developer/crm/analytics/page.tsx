'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import {
  Users,
  TrendingUp,
  Handshake,
  Target,
  DollarSign,
  PiggyBank,
  CreditCard,
  ArrowUpRight,
  BarChart3
} from 'lucide-react';

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
  const t = useTranslations('crm.analytics');
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
        `/developer-crm/analytics/dashboard?period=${period}`
      );
      setData(response);
    } catch (error: any) {
      console.error('Failed to fetch dashboard:', error);
      alert(t('loadError'));
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
    return t(`sources.${source}` as any, { defaultValue: source });
  };

  const getStageLabel = (stage: string) => {
    return t(`stages.${stage}` as any, { defaultValue: stage });
  };

  if (loading && !data) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 text-base">{t('loading')}</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 text-base">{t('noData')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
        <p className="text-sm md:text-base text-gray-600">
          {formatDate(data.period.startDate)} — {formatDate(data.period.endDate)}
        </p>
      </div>

      {/* Period selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setPeriod('WEEK')}
          className={`px-3 md:px-4 py-2 rounded-lg text-sm md:text-base font-medium transition-colors whitespace-nowrap ${
            period === 'WEEK'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('periods.week')}
        </button>
        <button
          onClick={() => setPeriod('MONTH')}
          className={`px-3 md:px-4 py-2 rounded-lg text-sm md:text-base font-medium transition-colors whitespace-nowrap ${
            period === 'MONTH'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('periods.month')}
        </button>
        <button
          onClick={() => setPeriod('QUARTER')}
          className={`px-3 md:px-4 py-2 rounded-lg text-sm md:text-base font-medium transition-colors whitespace-nowrap ${
            period === 'QUARTER'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('periods.quarter')}
        </button>
        <button
          onClick={() => setPeriod('YEAR')}
          className={`px-3 md:px-4 py-2 rounded-lg text-sm md:text-base font-medium transition-colors whitespace-nowrap ${
            period === 'YEAR'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('periods.year')}
        </button>
      </div>

      {/* KPI Cards - 2 Row Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Row 1: Primary Metrics */}

        {/* Total Leads */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm p-5 border border-blue-200 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div className="text-xs font-medium text-blue-700 bg-blue-200 px-2 py-1 rounded">
              +{data.overview.newLeads}
            </div>
          </div>
          <div className="text-sm font-medium text-blue-900 mb-1">{t('kpis.leads')}</div>
          <div className="text-3xl font-bold text-blue-900 mb-1">
            {data.overview.totalLeads}
          </div>
          <div className="text-xs text-blue-700">
            {t('kpis.newLeads')}: {data.overview.newLeads}
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm p-5 border border-green-200 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-green-600 rounded-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div className="text-xs font-medium text-green-700 bg-green-200 px-2 py-1 rounded">
              {data.overview.convertedLeads}
            </div>
          </div>
          <div className="text-sm font-medium text-green-900 mb-1">{t('kpis.conversion')}</div>
          <div className="text-3xl font-bold text-green-900 mb-1">
            {data.overview.conversionRate}%
          </div>
          <div className="text-xs text-green-700">
            {t('kpis.converted')}: {data.overview.convertedLeads}
          </div>
        </div>

        {/* Active Deals */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm p-5 border border-purple-200 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Handshake className="h-5 w-5 text-white" />
            </div>
            <div className="text-xs font-medium text-purple-700 bg-purple-200 px-2 py-1 rounded">
              {data.overview.totalDeals}
            </div>
          </div>
          <div className="text-sm font-medium text-purple-900 mb-1">{t('kpis.deals')}</div>
          <div className="text-3xl font-bold text-purple-900 mb-1">
            {data.overview.activeDeals}
          </div>
          <div className="text-xs text-purple-700">
            {t('kpis.total')}: {data.overview.totalDeals}
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-sm p-5 border border-orange-200 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-orange-600 rounded-lg">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div className="text-xs font-medium text-orange-700 bg-orange-200 px-2 py-1 rounded">
              {data.overview.wonDeals}
            </div>
          </div>
          <div className="text-sm font-medium text-orange-900 mb-1">{t('kpis.winRate')}</div>
          <div className="text-3xl font-bold text-orange-900 mb-1">
            {data.overview.winRate}%
          </div>
          <div className="text-xs text-orange-700">
            {t('kpis.won')}: {data.overview.wonDeals}
          </div>
        </div>

        {/* Row 2: Financial Metrics */}

        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-sm p-5 border border-emerald-200 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-emerald-600 rounded-lg">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="text-sm font-medium text-emerald-900 mb-1">{t('kpis.revenue')}</div>
          <div className="text-2xl md:text-3xl font-bold text-emerald-900 mb-1 break-words">
            {formatCurrency(data.overview.totalRevenue)}
          </div>
          <div className="text-xs text-emerald-700">{t('currency.ye')}</div>
        </div>

        {/* Avg Deal Value */}
        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl shadow-sm p-5 border border-cyan-200 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-cyan-600 rounded-lg">
              <PiggyBank className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="text-sm font-medium text-cyan-900 mb-1">{t('kpis.avgDeal')}</div>
          <div className="text-2xl md:text-3xl font-bold text-cyan-900 mb-1 break-words">
            {formatCurrency(data.overview.avgDealValue)}
          </div>
          <div className="text-xs text-cyan-700">{t('currency.ye')}</div>
        </div>

        {/* Total Commissions */}
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl shadow-sm p-5 border border-pink-200 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-pink-600 rounded-lg">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div className="text-xs font-medium text-pink-700 bg-pink-200 px-2 py-1 rounded">
              {data.overview.commissionsCount}
            </div>
          </div>
          <div className="text-sm font-medium text-pink-900 mb-1">{t('kpis.commissions')}</div>
          <div className="text-2xl md:text-3xl font-bold text-pink-900 mb-1 break-words">
            {formatCurrency(data.overview.totalCommissions)}
          </div>
          <div className="text-xs text-pink-700">
            {t('kpis.payouts')}: {data.overview.commissionsCount}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl shadow-sm p-5 border border-indigo-200 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="text-sm font-medium text-indigo-900 mb-3">
            {t('sections.detailed')}
          </div>
          <div className="space-y-1.5">
            <button
              onClick={() => router.push('/developer/crm/analytics/leads')}
              className="w-full text-left px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-white rounded-lg transition-colors flex items-center justify-between group"
            >
              <span>{t('sections.leadsLink')}</span>
              <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button
              onClick={() => router.push('/developer/crm/analytics/deals')}
              className="w-full text-left px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-white rounded-lg transition-colors flex items-center justify-between group"
            >
              <span>{t('sections.dealsLink')}</span>
              <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button
              onClick={() => router.push('/developer/crm/analytics/agents')}
              className="w-full text-left px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-white rounded-lg transition-colors flex items-center justify-between group"
            >
              <span>{t('sections.agentsLink')}</span>
              <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button
              onClick={() => router.push('/developer/crm/analytics/revenue')}
              className="w-full text-left px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-white rounded-lg transition-colors flex items-center justify-between group"
            >
              <span>{t('sections.revenueLink')}</span>
              <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Leads by Source */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
            {t('sections.leadsBySource')}
          </h2>
          <div className="space-y-3">
            {data.leadsBySource.map((item) => {
              const total = data.leadsBySource.reduce((sum, i) => sum + i.count, 0);
              const percentage = total > 0 ? (item.count / total) * 100 : 0;
              return (
                <div key={item.source}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700">
                      {getSourceLabel(item.source)}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {item.count} <span className="text-xs text-gray-500">({percentage.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {data.leadsBySource.length === 0 && (
              <div className="text-center text-gray-500 py-8 text-sm">
                {t('sections.noDataPeriod')}
              </div>
            )}
          </div>
        </div>

        {/* Deals by Stage */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
            {t('sections.dealsByStage')}
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
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700">
                      {getStageLabel(item.stage)}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {item.count} <span className="text-xs text-gray-500">/ {formatCurrency(item.value)} {t('currency.ye')}</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {data.dealsByStage.length === 0 && (
              <div className="text-center text-gray-500 py-8 text-sm">
                {t('sections.noActiveDeals')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
