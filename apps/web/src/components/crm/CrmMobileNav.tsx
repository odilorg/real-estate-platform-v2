'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { usePathname, useRouter } from '@/i18n/routing';
import {
  LayoutDashboard,
  FileText,
  Handshake,
  DollarSign,
  MoreHorizontal,
  Users,
  BarChart3,
  Settings,
  X,
  Menu,
  Globe,
  CheckSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';
import { locales, localeNames, type Locale } from '@/i18n/config';

interface CrmMobileNavProps {
  className?: string;
  title?: string;
}

export function CrmMobileNav({ className, title = 'CRM' }: CrmMobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useTranslations('crm.sidebar');
  const tMobile = useTranslations('crm.mobileNav');

  const handleLanguageChange = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
  };

  const primaryNavItems = [
    { href: '/developer/crm/analytics', icon: LayoutDashboard, label: t('dashboard') },
    { href: '/developer/crm/leads', icon: FileText, label: t('leads') },
    { href: '/developer/crm/deals', icon: Handshake, label: t('deals') },
    { href: '/developer/crm/commissions', icon: DollarSign, label: t('commissions') },
  ];

  const moreNavItems = [
    { href: '/developer/crm/tasks', icon: CheckSquare, label: t('tasks') },
    { href: '/developer/crm/members', icon: Users, label: t('team') },
    { href: '/developer/crm/analytics/agents', icon: BarChart3, label: tMobile('agentPerformance') },
    { href: '/developer/crm/analytics/revenue', icon: BarChart3, label: tMobile('revenueAnalytics') },
    { href: '/agency/settings', icon: Settings, label: t('settings') },
  ];

  // Close drawer when route changes
  useEffect(() => {
    setDrawerOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen || menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen, menuOpen]);

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/');
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className={cn('lg:hidden flex items-center justify-between h-14 px-4 bg-white border-b border-gray-200', className)}>
        <button
          onClick={() => setMenuOpen(true)}
          className="p-2 -ml-2 rounded-md hover:bg-gray-100"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        <div className="w-9" /> {/* Spacer for centering */}
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav
        className={cn('lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-40', className)}
        role="navigation"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 min-w-[60px] h-12 rounded-lg transition-colors',
                  active
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center justify-center gap-1 min-w-[60px] h-12 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            aria-label={tMobile('moreOptions')}
          >
            <MoreHorizontal className="w-6 h-6" />
            <span className="text-xs font-medium">{tMobile('more')}</span>
          </button>
        </div>
      </nav>

      {/* Hamburger Menu Drawer */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
            onClick={() => setMenuOpen(false)}
          />
          {/* Drawer */}
          <div className="lg:hidden fixed inset-y-0 left-0 w-64 bg-white z-50 shadow-xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">{tMobile('menu')}</h2>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-md hover:bg-gray-100"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <nav className="p-4 space-y-2">
              <div className="mb-4">
                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {t('main')}
                </h3>
                {primaryNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        active
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
              <div>
                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {tMobile('more')}
                </h3>
                {moreNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        active
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
              {/* Language Switcher */}
              <div className="pt-4 mt-4 border-t border-gray-200">
                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {tMobile('language')}
                </h3>
                <div className="flex gap-2 px-3">
                  {locales.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => handleLanguageChange(loc)}
                      className={cn(
                        'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                        locale === loc
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      )}
                    >
                      {localeNames[loc]}
                    </button>
                  ))}
                </div>
              </div>
            </nav>
          </div>
        </>
      )}

      {/* More Drawer */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer */}
          <div className="lg:hidden fixed inset-x-0 bottom-0 bg-white rounded-t-2xl z-50 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">{tMobile('moreOptions')}</h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-md hover:bg-gray-100"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <nav className="p-4 pb-20 space-y-1">
              {moreNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                      active
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
