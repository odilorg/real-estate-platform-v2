'use client';

import { Link } from '@/i18n/routing';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Building2,
  Users,
  MessageSquare,
  BarChart3,
  Settings,
} from 'lucide-react';

export function DeveloperNav() {
  const t = useTranslations('developer');
  const pathname = usePathname();

  const navigation = [
    { name: t('dashboard'), href: '/developer', icon: LayoutDashboard },
    { name: t('projects'), href: '/developer/projects', icon: Building2 },
    { name: t('leads'), href: '/developer/leads', icon: MessageSquare },
    { name: t('team'), href: '/developer/team', icon: Users },
    { name: t('analytics'), href: '/developer/analytics', icon: BarChart3 },
    { name: t('settings'), href: '/developer/settings', icon: Settings },
  ];

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <span className="text-xl font-bold text-gray-900">
              Developer CRM
            </span>
          </div>
          <div className="hidden md:flex md:space-x-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    inline-flex items-center px-3 py-2 text-sm font-medium rounded-md
                    ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
