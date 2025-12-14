'use client';

import { useMemo } from 'react';

interface ViewsDataPoint {
  date: string;
  views: number;
}

interface ViewsLineChartProps {
  data: ViewsDataPoint[];
}

export function ViewsLineChart({ data }: ViewsLineChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return { points: [], path: '', maxViews: 0, minViews: 0 };
    }

    const maxViews = Math.max(...data.map((d) => d.views), 1);
    const minViews = Math.min(...data.map((d) => d.views));

    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const width = 600;
    const height = 250;
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const points = data.map((d, i) => {
      const x = padding.left + (i / (data.length - 1 || 1)) * chartWidth;
      const y =
        padding.top +
        chartHeight -
        ((d.views - minViews) / (maxViews - minViews || 1)) * chartHeight;
      return { x, y, ...d };
    });

    // Create smooth curve path
    let path = '';
    if (points.length > 0) {
      path = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cp1x = prev.x + (curr.x - prev.x) / 3;
        const cp1y = prev.y;
        const cp2x = curr.x - (curr.x - prev.x) / 3;
        const cp2y = curr.y;
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
      }
    }

    return { points, path, maxViews, minViews, padding, width, height, chartHeight };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Views Over Time</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No view data available
        </div>
      </div>
    );
  }

  const { points, path, maxViews, padding, width, height, chartHeight } = chartData;

  // Generate Y-axis labels
  const yLabels = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    value: Math.round(maxViews * pct),
    y: padding.top + chartHeight * (1 - pct),
  }));

  // Generate X-axis labels (show every nth label to avoid crowding)
  const step = Math.max(1, Math.floor(data.length / 6));
  const xLabels = data
    .filter((_, i) => i % step === 0 || i === data.length - 1)
    .map((d, i, arr) => {
      const originalIndex = data.indexOf(d);
      const x = padding.left + (originalIndex / (data.length - 1 || 1)) * (width - padding.left - padding.right);
      return {
        label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        x,
      };
    });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Views Over Time</h3>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64">
        {/* Grid lines */}
        {yLabels.map((label, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={label.y}
              x2={width - padding.right}
              y2={label.y}
              stroke="#E5E7EB"
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 10}
              y={label.y + 4}
              textAnchor="end"
              fontSize="11"
              fill="#6B7280"
            >
              {label.value}
            </text>
          </g>
        ))}

        {/* Area fill under the line */}
        {points.length > 0 && (
          <path
            d={`${path} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`}
            fill="url(#viewsGradient)"
            opacity={0.3}
          />
        )}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="viewsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Line */}
        <path
          d={path}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((point, i) => (
          <g key={i} className="group cursor-pointer">
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#3B82F6"
              stroke="white"
              strokeWidth="2"
              className="transition-all hover:r-6"
            />
            {/* Tooltip */}
            <g className="opacity-0 group-hover:opacity-100 transition-opacity">
              <rect
                x={point.x - 40}
                y={point.y - 35}
                width="80"
                height="25"
                fill="#1F2937"
                rx="4"
              />
              <text
                x={point.x}
                y={point.y - 18}
                textAnchor="middle"
                fill="white"
                fontSize="11"
              >
                {point.views} views
              </text>
            </g>
          </g>
        ))}

        {/* X-axis labels */}
        {xLabels.map((label, i) => (
          <text
            key={i}
            x={label.x}
            y={height - 10}
            textAnchor="middle"
            fontSize="11"
            fill="#6B7280"
          >
            {label.label}
          </text>
        ))}
      </svg>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-sm">
        <span className="text-gray-500">
          Total: <span className="font-medium text-gray-900">{data.reduce((sum, d) => sum + d.views, 0).toLocaleString()} views</span>
        </span>
        <span className="text-gray-500">
          Average: <span className="font-medium text-gray-900">{Math.round(data.reduce((sum, d) => sum + d.views, 0) / data.length).toLocaleString()}/day</span>
        </span>
      </div>
    </div>
  );
}
