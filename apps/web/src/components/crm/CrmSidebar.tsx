'use client';

import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Handshake,
  DollarSign,
  Users,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Settings,
} from 'lucide-react';
import { CrmNavItem } from './CrmNavItem';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

const SIDEBAR_COLLAPSED_KEY = 'crm-sidebar-collapsed';

interface CrmSidebarProps {
  className?: string;
  title?: string;
}

export function CrmSidebar({ className, title = 'CRM' }: CrmSidebarProps) {
  const t = useTranslations('crm.sidebar');
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Define navigation items with translated labels
  const navigationItems = [
    {
      section: t('main'),
      items: [
        { href: '/developer/crm/analytics', icon: LayoutDashboard, label: t('dashboard') },
        { href: '/developer/crm/leads', icon: FileText, label: t('leads') },
        { href: '/developer/crm/deals', icon: Handshake, label: t('deals') },
        { href: '/developer/crm/commissions', icon: DollarSign, label: t('commissions') },
      ],
    },
    {
      section: t('teamReports'),
      items: [
        { href: '/developer/crm/members', icon: Users, label: t('team') },
        { href: '/developer/crm/analytics/revenue', icon: BarChart3, label: t('reports') },
      ],
    },
  ];

  // Load collapsed state from localStorage
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (saved !== null) {
      setCollapsed(saved === 'true');
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newState));
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <aside className={cn('hidden lg:flex flex-col w-60 bg-white border-r border-gray-200', className)}>
        <div className="flex-1" />
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-200 ease-in-out',
        collapsed ? 'w-16' : 'w-60',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {!collapsed && (
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        )}
        <button
          onClick={toggleCollapsed}
          className={cn(
            'p-1.5 rounded-md hover:bg-gray-100 transition-colors',
            collapsed && 'mx-auto'
          )}
          aria-label={collapsed ? t('expandSidebar') : t('collapseSidebar')}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6" role="navigation">
        {navigationItems.map((section, idx) => (
          <div key={idx}>
            {!collapsed && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.section}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <CrmNavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  collapsed={collapsed}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3">
        <CrmNavItem
          href="/agency/settings"
          icon={Settings}
          label={t('settings')}
          collapsed={collapsed}
        />
      </div>
    </aside>
  );
}
