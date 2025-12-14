'use client';

import { useMemo } from 'react';

interface LeadSource {
  source: string;
  count: number;
  percentage: number;
}

interface LeadSourcesChartProps {
  sources: LeadSource[];
}

const COLORS = [
  '#3B82F6', // blue
  '#22C55E', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
];

const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: 'Website',
  PHONE_CALL: 'Phone',
  SOCIAL_MEDIA: 'Social Media',
  REFERRAL: 'Referral',
  AGENT: 'Agent',
  WALK_IN: 'Walk-in',
  OTHER: 'Other',
};

export function LeadSourcesChart({ sources }: LeadSourcesChartProps) {
  const chartData = useMemo(() => {
    if (!sources || sources.length === 0) {
      return { segments: [], total: 0 };
    }

    const total = sources.reduce((sum, s) => sum + s.count, 0);
    let currentAngle = -90; // Start from top

    const segments = sources.map((source, i) => {
      const percentage = total > 0 ? (source.count / total) * 100 : 0;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      // Calculate arc path
      const radius = 80;
      const innerRadius = 50;
      const cx = 100;
      const cy = 100;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = cx + radius * Math.cos(startRad);
      const y1 = cy + radius * Math.sin(startRad);
      const x2 = cx + radius * Math.cos(endRad);
      const y2 = cy + radius * Math.sin(endRad);
      const x3 = cx + innerRadius * Math.cos(endRad);
      const y3 = cy + innerRadius * Math.sin(endRad);
      const x4 = cx + innerRadius * Math.cos(startRad);
      const y4 = cy + innerRadius * Math.sin(startRad);

      const largeArcFlag = angle > 180 ? 1 : 0;

      const path = `
        M ${x1} ${y1}
        A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
        L ${x3} ${y3}
        A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}
        Z
      `;

      return {
        ...source,
        path,
        color: COLORS[i % COLORS.length],
        percentage,
        label: SOURCE_LABELS[source.source] || source.source,
      };
    });

    return { segments, total };
  }, [sources]);

  if (!sources || sources.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Sources</h3>
        <div className="h-48 flex items-center justify-center text-gray-500">
          No lead source data available
        </div>
      </div>
    );
  }

  const { segments, total } = chartData;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Sources</h3>

      <div className="flex items-center gap-6">
        {/* Donut chart */}
        <div className="relative">
          <svg viewBox="0 0 200 200" className="w-48 h-48">
            {segments.map((segment, i) => (
              <path
                key={i}
                d={segment.path}
                fill={segment.color}
                className="transition-opacity hover:opacity-80 cursor-pointer"
                stroke="white"
                strokeWidth="2"
              />
            ))}
            {/* Center text */}
            <text
              x="100"
              y="95"
              textAnchor="middle"
              fontSize="24"
              fontWeight="bold"
              fill="#1F2937"
            >
              {total}
            </text>
            <text
              x="100"
              y="115"
              textAnchor="middle"
              fontSize="12"
              fill="#6B7280"
            >
              Total Leads
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {segments.map((segment, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-sm text-gray-700">{segment.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-900">
                  {segment.count}
                </span>
                <span className="text-sm text-gray-500 w-12 text-right">
                  {segment.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
