'use client';

interface AgentStats {
  id: string;
  name: string;
  leadsAssigned: number;
  leadsConverted: number;
  conversionRate: number;
  totalRevenue: number;
}

interface AgentPerformanceChartProps {
  agents: AgentStats[];
}

function formatCurrency(num: number): string {
  if (num >= 1000000) {
    return '$' + (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return '$' + (num / 1000).toFixed(1) + 'K';
  }
  return '$' + num.toString();
}

export function AgentPerformanceChart({ agents }: AgentPerformanceChartProps) {
  if (!agents || agents.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Team Performance</h3>
        <div className="h-48 flex items-center justify-center text-gray-500">
          No sales team data available
        </div>
      </div>
    );
  }

  const maxLeads = Math.max(...agents.map((a) => a.leadsAssigned), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Sales Team Performance</h3>

      <div className="space-y-4">
        {agents.map((agent) => {
          const assignedWidth = (agent.leadsAssigned / maxLeads) * 100;
          const convertedWidth = (agent.leadsConverted / maxLeads) * 100;

          return (
            <div key={agent.id} className="relative">
              {/* Agent info */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">
                      {agent.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <span className="font-medium text-gray-900">{agent.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-500">
                    Conv: <span className={`font-medium ${agent.conversionRate >= 30 ? 'text-green-600' : agent.conversionRate >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {agent.conversionRate}%
                    </span>
                  </span>
                  <span className="text-gray-500">
                    Revenue: <span className="font-medium text-gray-900">{formatCurrency(agent.totalRevenue)}</span>
                  </span>
                </div>
              </div>

              {/* Stacked bar */}
              <div className="h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                {/* Assigned leads (full bar) */}
                <div
                  className="absolute inset-y-0 left-0 bg-blue-200 rounded-lg transition-all duration-500"
                  style={{ width: `${assignedWidth}%` }}
                />
                {/* Converted leads (overlay) */}
                <div
                  className="absolute inset-y-0 left-0 bg-green-500 rounded-lg transition-all duration-500"
                  style={{ width: `${convertedWidth}%` }}
                />
                {/* Labels */}
                <div className="absolute inset-0 flex items-center px-3 justify-between">
                  <span className="text-xs font-medium text-gray-700">
                    {agent.leadsConverted} / {agent.leadsAssigned} leads
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-200" />
          <span className="text-sm text-gray-600">Leads Assigned</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-sm text-gray-600">Leads Converted</span>
        </div>
      </div>
    </div>
  );
}
