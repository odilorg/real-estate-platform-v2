'use client';

import { Building2, Package, TrendingUp, Users } from 'lucide-react';

interface DeveloperStatsProps {
  stats: {
    totalProjects: number;
    totalUnits: number;
    unitsAvailable: number;
    unitsSold: number;
    activeLeads: number;
    salesThisMonth: number;
  };
}

export function DeveloperStats({ stats }: DeveloperStatsProps) {
  const cards = [
    {
      name: 'Total Projects',
      value: stats.totalProjects,
      icon: Building2,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Units',
      value: stats.totalUnits,
      icon: Package,
      color: 'bg-green-500',
    },
    {
      name: 'Units Sold',
      value: stats.unitsSold,
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
    {
      name: 'Active Leads',
      value: stats.activeLeads,
      icon: Users,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.name} className="bg-white shadow rounded-lg p-2.5 sm:p-4 lg:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`${card.color} rounded-lg p-1.5 sm:p-2 lg:p-3 shrink-0`}>
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs lg:text-sm font-medium text-gray-500 truncate leading-tight">
                  {card.name}
                </p>
                <p className="text-base sm:text-xl lg:text-2xl font-semibold text-gray-900">
                  {card.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
