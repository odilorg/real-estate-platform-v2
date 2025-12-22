'use client';

import { Link } from '@/i18n/routing';
import { usePathname } from '@/i18n/routing';
import { Home, Search, Heart, User, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { locales, localeNames, type Locale } from '@/i18n/config';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const t = useTranslations('navigation.mobile');
  const locale = useLocale();
  const router = useRouter();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  // Hide on CRM pages (they have their own navigation)
  const isCrmPage = pathname.includes('/crm');
  if (isCrmPage) {
    return null;
  }

  const handleLanguageChange = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
    setShowLanguageMenu(false);
  };

  const navItems = [
    {
      href: '/',
      label: t('home'),
      icon: Home,
      active: pathname === '/',
    },
    {
      href: '/properties',
      label: t('search'),
      icon: Search,
      active: pathname.startsWith('/properties'),
    },
    {
      href: isAuthenticated ? '/dashboard/favorites' : '/auth/login',
      label: t('favorites'),
      icon: Heart,
      active: pathname.startsWith('/dashboard/favorites'),
    },
    {
      href: isAuthenticated ? '/dashboard' : '/auth/login',
      label: t('profile'),
      icon: User,
      active: pathname.startsWith('/dashboard'),
    },
  ];

  return (
    <>
      {/* Language Selection Popup */}
      {showLanguageMenu && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowLanguageMenu(false)}
          />
          <div className="fixed bottom-20 left-4 right-4 bg-white rounded-xl shadow-xl z-50 p-4 animate-in slide-in-from-bottom duration-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('selectLanguage')}</h3>
            <div className="flex gap-2">
              {locales.map((loc) => (
                <button
                  key={loc}
                  onClick={() => handleLanguageChange(loc)}
                  className={cn(
                    'flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors',
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
        </>
      )}

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full transition-colors',
                  item.active
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                )}
              >
                <Icon className={cn('h-6 w-6 mb-1', item.active && 'fill-current')} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
          {/* Language Switcher Button */}
          <button
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full transition-colors',
              showLanguageMenu
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            )}
          >
            <Globe className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">{locale.toUpperCase()}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
