'use client';

import {
  DollarSign,
  Users,
  TrendingUp,
  Eye,
  Target,
  ShoppingCart,
} from 'lucide-react';

interface KPICardsProps {
  totalRevenue: number;
  revenueTrend: number;
  totalLeads: number;
  leadsTrend: number;
  conversionRate: number;
  conversionTrend: number;
  avgDealSize: number;
  dealSizeTrend: number;
  totalViews: number;
  viewsTrend: number;
  unitsPipeline: {
    available: number;
    reserved: number;
    sold: number;
    handedOver: number;
  };
}

function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function TrendBadge({ trend }: { trend: number }) {
  const isPositive = trend > 0;
  const isNeutral = trend === 0;

  return (
    <span
      className={`inline-flex items-center text-xs font-medium ${
        isNeutral
          ? 'text-gray-500'
          : isPositive
          ? 'text-green-600'
          : 'text-red-600'
      }`}
    >
      {isNeutral ? (
        '0%'
      ) : (
        <>
          {isPositive ? '+' : ''}
          {trend}%
        </>
      )}
    </span>
  );
}

export function KPICards({
  totalRevenue,
  revenueTrend,
  totalLeads,
  leadsTrend,
  conversionRate,
  conversionTrend,
  avgDealSize,
  dealSizeTrend,
  totalViews,
  viewsTrend,
  unitsPipeline,
}: KPICardsProps) {
  const totalUnits =
    unitsPipeline.available +
    unitsPipeline.reserved +
    unitsPipeline.sold +
    unitsPipeline.handedOver;

  const kpiData = [
    {
      title: 'Total Revenue',
      value: `$${formatNumber(totalRevenue)}`,
      trend: revenueTrend,
      icon: DollarSign,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      title: 'Total Leads',
      value: totalLeads.toString(),
      trend: leadsTrend,
      icon: Users,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Conversion Rate',
      value: `${conversionRate}%`,
      trend: conversionTrend,
      icon: Target,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Avg Deal Size',
      value: `$${formatNumber(avgDealSize)}`,
      trend: dealSizeTrend,
      icon: ShoppingCart,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
    {
      title: 'Property Views',
      value: formatNumber(totalViews),
      trend: viewsTrend,
      icon: Eye,
      bgColor: 'bg-cyan-100',
      iconColor: 'text-cyan-600',
    },
    {
      title: 'Units Sold',
      value: `${unitsPipeline.sold}/${totalUnits}`,
      trend: 0,
      icon: TrendingUp,
      bgColor: 'bg-pink-100',
      iconColor: 'text-pink-600',
      subtitle: `${unitsPipeline.reserved} reserved`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {kpiData.map((kpi) => (
        <div
          key={kpi.title}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`${kpi.bgColor} p-2 rounded-lg`}>
              <kpi.icon className={`w-5 h-5 ${kpi.iconColor}`} />
            </div>
            <TrendBadge trend={kpi.trend} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            <p className="text-sm text-gray-500 mt-1">{kpi.title}</p>
            {kpi.subtitle && (
              <p className="text-xs text-gray-400 mt-0.5">{kpi.subtitle}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
