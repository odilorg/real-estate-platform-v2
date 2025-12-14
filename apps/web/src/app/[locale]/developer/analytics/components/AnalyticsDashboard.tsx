'use client';

import { useState } from 'react';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';
import { KPICards } from './KPICards';
import { LeadFunnelChart } from './LeadFunnelChart';
import { ViewsLineChart } from './ViewsLineChart';
import { LeadSourcesChart } from './LeadSourcesChart';
import { AgentPerformanceChart } from './AgentPerformanceChart';
import { TopPropertiesTable } from './TopPropertiesTable';
import { RecentLeadsTable } from './RecentLeadsTable';

const TIME_RANGES = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
  { value: 365, label: 'Last year' },
];

export function AnalyticsDashboard() {
  const [days, setDays] = useState(30);
  const { data, loading, error, refetch } = useAnalytics({ days });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 font-medium mb-2">Failed to load analytics</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button
            onClick={refetch}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { overview, leads, properties, agents } = data;

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track your performance and make data-driven decisions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="block w-auto px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {TIME_RANGES.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <button
            onClick={refetch}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {overview && (
        <KPICards
          totalRevenue={overview.totalRevenue}
          revenueTrend={overview.revenueTrend}
          totalLeads={overview.totalLeads}
          leadsTrend={overview.leadsTrend}
          conversionRate={overview.conversionRate}
          conversionTrend={overview.conversionTrend}
          avgDealSize={overview.avgDealSize}
          dealSizeTrend={overview.dealSizeTrend}
          totalViews={overview.totalViews}
          viewsTrend={overview.viewsTrend}
          unitsPipeline={overview.unitsPipeline}
        />
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views Line Chart */}
        {overview && <ViewsLineChart data={overview.viewsOverTime} />}

        {/* Lead Funnel */}
        {leads && <LeadFunnelChart funnel={leads.funnel} />}
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Sources */}
        {leads && <LeadSourcesChart sources={leads.sources} />}

        {/* Agent Performance */}
        {agents && <AgentPerformanceChart agents={agents.agents} />}
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Properties */}
        {properties && (
          <TopPropertiesTable
            properties={properties.topByViews}
            title="Top Properties by Views"
          />
        )}

        {/* Recent Leads */}
        {leads && <RecentLeadsTable leads={leads.recentLeads} />}
      </div>
    </div>
  );
}
