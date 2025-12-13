import { getTranslations } from 'next-intl/server';
import { DollarSign, Users, TrendingUp, ShoppingCart, BarChart3 } from 'lucide-react';

export default async function AnalyticsPage() {
  const t = await getTranslations('developer.analytics');

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
        </div>
        <select className="block w-auto px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
          <option>{t('timeRanges.7d')}</option>
          <option>{t('timeRanges.30d')}</option>
          <option>{t('timeRanges.90d')}</option>
          <option>{t('timeRanges.1y')}</option>
          <option>{t('timeRanges.all')}</option>
        </select>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('metrics.totalRevenue')}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">$0</p>
              <p className="mt-1 text-sm text-gray-600">
                <span className="text-green-600 font-medium">+0%</span>{' '}
                {t('metrics.vsLastPeriod')}
              </p>
            </div>
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Total Leads */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('metrics.totalLeads')}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
              <p className="mt-1 text-sm text-gray-600">
                <span className="text-green-600 font-medium">+0%</span>{' '}
                {t('metrics.vsLastPeriod')}
              </p>
            </div>
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('metrics.conversionRate')}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">0%</p>
              <p className="mt-1 text-sm text-gray-600">
                <span className="text-green-600 font-medium">+0%</span>{' '}
                {t('metrics.vsLastPeriod')}
              </p>
            </div>
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Average Deal Size */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('metrics.averageDealSize')}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">$0</p>
              <p className="mt-1 text-sm text-gray-600">
                <span className="text-green-600 font-medium">+0%</span>{' '}
                {t('metrics.vsLastPeriod')}
              </p>
            </div>
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sales Trend Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t('charts.salesTrend')}
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">{t('charts.noData')}</p>
            </div>
          </div>
        </div>

        {/* Lead Sources Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t('charts.leadSources')}
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">{t('charts.noData')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Project Performance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {t('projectPerformance.title')}
          </h3>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">{t('projectPerformance.noData')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
