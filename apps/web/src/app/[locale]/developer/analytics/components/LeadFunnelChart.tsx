'use client';

interface LeadFunnelChartProps {
  funnel: {
    new: number;
    contacted: number;
    qualified: number;
    negotiating: number;
    converted: number;
    lost: number;
  };
}

const FUNNEL_STAGES = [
  { key: 'new', label: 'New', color: '#3B82F6' },
  { key: 'contacted', label: 'Contacted', color: '#6366F1' },
  { key: 'qualified', label: 'Qualified', color: '#8B5CF6' },
  { key: 'negotiating', label: 'Negotiating', color: '#A855F7' },
  { key: 'converted', label: 'Converted', color: '#22C55E' },
  { key: 'lost', label: 'Lost', color: '#EF4444' },
] as const;

export function LeadFunnelChart({ funnel }: LeadFunnelChartProps) {
  const maxValue = Math.max(
    funnel.new,
    funnel.contacted,
    funnel.qualified,
    funnel.negotiating,
    funnel.converted,
    funnel.lost,
    1,
  );

  const total = funnel.new + funnel.contacted + funnel.qualified + funnel.negotiating;
  const conversionFromTotal = total > 0 ? ((funnel.converted / total) * 100).toFixed(1) : '0';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Lead Funnel</h3>
        <span className="text-sm text-gray-500">
          Conversion: <span className="font-medium text-green-600">{conversionFromTotal}%</span>
        </span>
      </div>

      <div className="space-y-3">
        {FUNNEL_STAGES.map((stage) => {
          const value = funnel[stage.key];
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

          return (
            <div key={stage.key} className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{stage.label}</span>
                <span className="text-sm text-gray-900 font-semibold">{value}</span>
              </div>
              <div className="h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                <div
                  className="h-full rounded-lg transition-all duration-500 ease-out flex items-center justify-end pr-2"
                  style={{
                    width: `${Math.max(percentage, 5)}%`,
                    backgroundColor: stage.color,
                  }}
                >
                  {percentage > 20 && (
                    <span className="text-white text-xs font-medium">
                      {percentage.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Funnel visualization */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-500 mb-4">Funnel Flow</p>
        <svg viewBox="0 0 400 200" className="w-full h-32">
          {/* Funnel shape */}
          {FUNNEL_STAGES.slice(0, 5).map((stage, index) => {
            const value = funnel[stage.key];
            const widthPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;
            const width = 350 * (widthPercent / 100) + 50;
            const x = (400 - width) / 2;
            const y = index * 35 + 10;
            const height = 30;

            return (
              <g key={stage.key}>
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  fill={stage.color}
                  rx={4}
                  className="opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
                />
                <text
                  x={200}
                  y={y + height / 2 + 5}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="500"
                >
                  {stage.label}: {value}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
