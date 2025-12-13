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
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.name} className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className={`${card.color} rounded-lg p-3`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  {card.name}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
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
