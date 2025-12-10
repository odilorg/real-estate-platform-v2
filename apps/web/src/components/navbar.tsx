'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu, X, User, LogOut, Plus, MessageSquare, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useComparison } from '@/context';
import { LanguageSwitcher } from './language-switcher';
import { Button } from '@repo/ui';
import { useTranslations } from 'next-intl';

interface MenuItem {
  labelKey: string;
  href?: string;
  submenu?: {
    titleKey?: string;
    items: {
      labelKey: string;
      href: string;
      description?: string;
    }[];
  }[];
}

export function Navbar() {
  const t = useTranslations('navbar');
  const tCommon = useTranslations('common');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { comparisonIds } = useComparison();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  // Define menu structure with translation keys
  const menuItems: MenuItem[] = [
    {
      labelKey: 'rent',
      submenu: [
        {
          titleKey: 'longTermRent',
          items: [
            { labelKey: 'apartments', href: '/properties?listingType=RENT&propertyType=APARTMENT' },
            { labelKey: 'houses', href: '/properties?listingType=RENT&propertyType=HOUSE' },
            { labelKey: 'townhouses', href: '/properties?listingType=RENT&propertyType=TOWNHOUSE' },
          ],
        },
        {
          titleKey: 'dailyRent',
          items: [
            { labelKey: 'apartments', href: '/properties?listingType=RENT&propertyType=APARTMENT&rentType=DAILY' },
            { labelKey: 'houses', href: '/properties?listingType=RENT&propertyType=HOUSE&rentType=DAILY' },
          ],
        },
      ],
    },
    {
      labelKey: 'sale',
      submenu: [
        {
          items: [
            { labelKey: 'apartments', href: '/properties?listingType=SALE&propertyType=APARTMENT' },
            { labelKey: 'houses', href: '/properties?listingType=SALE&propertyType=HOUSE' },
            { labelKey: 'condos', href: '/properties?listingType=SALE&propertyType=CONDO' },
            { labelKey: 'townhouses', href: '/properties?listingType=SALE&propertyType=TOWNHOUSE' },
            { labelKey: 'landPlots', href: '/properties?listingType=SALE&propertyType=LAND' },
            { labelKey: 'commercialProperty', href: '/properties?listingType=SALE&propertyType=COMMERCIAL' },
          ],
        },
      ],
    },
    {
      labelKey: 'newBuildings',
      href: '/properties?propertyType=APARTMENT&minYearBuilt=2020',
    },
    {
      labelKey: 'mortgage',
      href: '/mortgage-calculator',
    },
    {
      labelKey: 'housesAndLand',
      submenu: [
        {
          items: [
            { labelKey: 'buyHouse', href: '/properties?listingType=SALE&propertyType=HOUSE' },
            { labelKey: 'buyLand', href: '/properties?listingType=SALE&propertyType=LAND' },
            { labelKey: 'rentHouse', href: '/properties?listingType=RENT&propertyType=HOUSE' },
            { labelKey: 'townhouses', href: '/properties?listingType=SALE&propertyType=TOWNHOUSE' },
          ],
        },
      ],
    },
    {
      labelKey: 'commercial',
      submenu: [
        {
          items: [
            { labelKey: 'buy', href: '/properties?listingType=SALE&propertyType=COMMERCIAL' },
            { labelKey: 'rent', href: '/properties?listingType=RENT&propertyType=COMMERCIAL' },
            { labelKey: 'offices', href: '/properties?propertyType=COMMERCIAL&search=офис' },
            { labelKey: 'retail', href: '/properties?propertyType=COMMERCIAL&search=торговое' },
            { labelKey: 'warehouses', href: '/properties?propertyType=COMMERCIAL&search=склад' },
          ],
        },
      ],
    },
    {
      labelKey: 'agents',
      href: '/agents',
    },
  ];

  // Fetch unread messages count
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${apiUrl}/messages/unread`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        // Silently fail - unread count is not critical
      }
    };

    fetchUnreadCount();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, apiUrl]);

  const handleMouseEnter = (index: number) => {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    setActiveDropdown(index);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
    setCloseTimeout(timeout);
  };

  const isActive = (href: string) => {
    return pathname === href;
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              RealEstate
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex lg:items-center lg:space-x-1 lg:flex-1">
            {menuItems.map((item, index) => (
              <div
                key={index}
                className="relative"
                onMouseEnter={() => item.submenu && handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
              >
                {item.href ? (
                  <Link
                    href={item.href}
                    className={cn(
                      'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive(item.href)
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    )}
                  >
                    {t(item.labelKey as any)}
                  </Link>
                ) : (
                  <button
                    className={cn(
                      'flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors',
                      activeDropdown === index
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    )}
                  >
                    {t(item.labelKey as any)}
                    <ChevronDown
                      className={cn(
                        'ml-1 h-4 w-4 transition-transform',
                        activeDropdown === index && 'rotate-180'
                      )}
                    />
                  </button>
                )}

                {/* Dropdown Menu */}
                {item.submenu && activeDropdown === index && (
                  <div
                    className="absolute left-0 top-full pt-2 w-64"
                    onMouseEnter={() => handleMouseEnter(index)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    {item.submenu.map((section, sectionIndex) => (
                      <div key={sectionIndex} className="px-2">
                        {section.titleKey && (
                          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {t(section.titleKey as any)}
                          </div>
                        )}
                        <div className={section.titleKey ? 'mb-3' : ''}>
                          {section.items.map((subItem, subItemIndex) => (
                            <Link
                              key={subItemIndex}
                              href={subItem.href}
                              className={cn(
                                'block px-3 py-2 rounded-md text-sm transition-colors',
                                isActive(subItem.href)
                                  ? 'text-blue-600 bg-blue-50 font-medium'
                                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                              )}
                              onClick={() => setActiveDropdown(null)}
                            >
                              {t(subItem.labelKey as any)}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* User Actions - Desktop */}
          <div className="hidden lg:flex lg:items-center lg:gap-4">
            <LanguageSwitcher />

            {/* Comparison link - available to all users */}
            {comparisonIds.length > 0 && (
              <Link href="/compare">
                <Button variant="ghost" size="sm" className="gap-1 relative">
                  <Scale className="h-4 w-4" />
                  {t('comparison')}
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                    {comparisonIds.length}
                  </span>
                </Button>
              </Link>
            )}

            {isAuthenticated ? (
              <>
                <Link href="/dashboard/messages">
                  <Button variant="ghost" size="sm" className="gap-1 relative">
                    <MessageSquare className="h-4 w-4" />
                    {t('messages')}
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </Link>
                <Link href="/properties/new">
                  <Button size="sm" className="gap-1">
                    <Plus className="h-4 w-4" />
                    {t('post')}
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="gap-1">
                    <User className="h-4 w-4" />
                    {user?.firstName || t('profile')}
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    {t('signIn')}
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">{t('register')}</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-50"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 animate-in slide-in-from-top duration-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {menuItems.map((item, index) => (
              <div key={index}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className={cn(
                      'block px-3 py-2 rounded-md text-base font-medium',
                      isActive(item.href)
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t(item.labelKey as any)}
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() =>
                        setActiveDropdown(activeDropdown === index ? null : index)
                      }
                      className="w-full flex items-center justify-between px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    >
                      {t(item.labelKey as any)}
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform',
                          activeDropdown === index && 'rotate-180'
                        )}
                      />
                    </button>
                    {activeDropdown === index && item.submenu && (
                      <div className="pl-4 mt-1 space-y-1">
                        {item.submenu.map((section, sectionIndex) => (
                          <div key={sectionIndex}>
                            {section.titleKey && (
                              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {t(section.titleKey as any)}
                              </div>
                            )}
                            {section.items.map((subItem, subItemIndex) => (
                              <Link
                                key={subItemIndex}
                                href={subItem.href}
                                className={cn(
                                  'block px-3 py-2 rounded-md text-sm',
                                  isActive(subItem.href)
                                    ? 'text-blue-600 bg-blue-50 font-medium'
                                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                                )}
                                onClick={() => {
                                  setMobileMenuOpen(false);
                                  setActiveDropdown(null);
                                }}
                              >
                                {t(subItem.labelKey as any)}
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Mobile User Actions */}
          <div className="border-t border-gray-200 pt-3 pb-3 px-2 space-y-2">
            <div className="px-3 mb-2">
              <LanguageSwitcher />
            </div>
            {isAuthenticated ? (
              <>
                <Link href="/properties/new" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="sm" className="w-full gap-1 justify-center">
                    <Plus className="h-4 w-4" />
                    {t('post')}
                  </Button>
                </Link>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full gap-1 justify-center">
                    <User className="h-4 w-4" />
                    {user?.firstName || t('profile')}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  {t('signOut')}
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full">
                    {t('signIn')}
                  </Button>
                </Link>
                <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="sm" className="w-full">
                    {t('register')}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
