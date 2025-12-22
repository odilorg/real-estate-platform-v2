'use client';

import React, { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { usePathname } from '@/i18n/routing';
import { ChevronDown, Menu, X, User, LogOut, Plus, MessageSquare, Scale, Building2, Users, FileText, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useComparison } from '@/context';
import { LanguageSwitcher, LanguageSwitcherMobile } from './language-switcher';
import { Button } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { LoginModal } from './auth/LoginModal';
import { RegisterModal } from './auth/RegisterModal';
import { api } from '@/lib/api';

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
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [hasAgency, setHasAgency] = useState(false);
  const [agencyRole, setAgencyRole] = useState<string | null>(null);
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { comparisonIds } = useComparison();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  // Define menu structure with translation keys - Simplified structure (4 main items)
  const menuItems: MenuItem[] = [
    {
      labelKey: 'properties',
      submenu: [
        {
          items: [
            { labelKey: 'buy', href: '/properties?listingType=SALE' },
            { labelKey: 'rent', href: '/properties?listingType=RENT_LONG' },
            { labelKey: 'newBuildings', href: '/properties?propertyType=APARTMENT&minYearBuilt=2020' },
          ],
        },
      ],
    },
    {
      labelKey: 'services',
      submenu: [
        {
          items: [
            { labelKey: 'mortgage', href: '/mortgage-calculator' },
            { labelKey: 'propertyEvaluation', href: '/properties?featured=true' },
          ],
        },
      ],
    },
    {
      labelKey: 'agents',
      href: '/agents',
    },
    {
      labelKey: 'developers',
      href: '/developers',
    },
  ];

  // Check if user has an agency
  useEffect(() => {
    if (!isAuthenticated) {
      setHasAgency(false);
      setAgencyRole(null);
      return;
    }

    const checkAgency = async () => {
      try {
        const response = await api.get<any>('/agency/profile');
        if (response.agency) {
          setHasAgency(true);
          setAgencyRole(response.role);
        } else {
          setHasAgency(false);
          setAgencyRole(null);
        }
      } catch (error) {
        // User doesn't have an agency - silent fail
        setHasAgency(false);
        setAgencyRole(null);
      }
    };

    checkAgency();
  }, [isAuthenticated]);

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

  const agencyCrmActive = pathname?.startsWith('/agency') || pathname?.startsWith('/developer/crm');
  const crmLabel = pathname?.startsWith('/developer/crm') ? t('developerCrm') : t('agencyCrm');

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

          {/* Right side items */}
          <div className="hidden lg:flex lg:items-center lg:space-x-2">
            <LanguageSwitcher />
            {comparisonIds.length > 0 && (
              <Link href="/compare">
                <Button variant="ghost" size="sm" className="gap-1 relative">
                  <Scale className="h-4 w-4" />
                  {comparisonIds.length}
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

                {/* Agency CRM Dropdown - Only show if user has agency */}
                {hasAgency && (
                  <div 
                    className="relative"
                    onMouseEnter={() => handleMouseEnter(999)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      className={cn(
                        'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors gap-1',
                        agencyCrmActive || activeDropdown === 999
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      )}
                    >
                      <Building2 className="h-4 w-4" />
                      {crmLabel}
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform',
                          activeDropdown === 999 && 'rotate-180'
                        )}
                      />
                    </button>

                    {activeDropdown === 999 && (
                      <div
                        className="absolute right-0 top-full pt-2 w-56"
                        onMouseEnter={() => handleMouseEnter(999)}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                          <Link
                            href="/agency/dashboard"
                            className={cn(
                              'flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                              pathname === '/agency/dashboard'
                                ? 'text-blue-600 bg-blue-50 font-medium'
                                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                            )}
                            onClick={() => setActiveDropdown(null)}
                          >
                            <Building2 className="h-4 w-4" />
                            {t('crmDashboard')}
                          </Link>
                          <Link
                            href="/developer/crm/members"
                            className={cn(
                              'flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                              pathname?.startsWith('/developer/crm/members')
                                ? 'text-blue-600 bg-blue-50 font-medium'
                                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                            )}
                            onClick={() => setActiveDropdown(null)}
                          >
                            <Users className="h-4 w-4" />
                            {t('crmTeamMembers')}
                          </Link>
                          <Link
                            href="/developer/crm/leads"
                            className={cn(
                              'flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                              pathname?.startsWith('/developer/crm/leads')
                                ? 'text-blue-600 bg-blue-50 font-medium'
                                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                            )}
                            onClick={() => setActiveDropdown(null)}
                          >
                            <FileText className="h-4 w-4" />
                            {t('crmLeads')}
                          </Link>
                          <div className="border-t border-gray-200 my-2"></div>
                          <Link
                            href="/agency/settings"
                            className={cn(
                              'flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                              pathname === '/agency/settings'
                                ? 'text-blue-600 bg-blue-50 font-medium'
                                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                            )}
                            onClick={() => setActiveDropdown(null)}
                          >
                            <SettingsIcon className="h-4 w-4" />
                            {t('agencySettings')}
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}

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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLoginModalOpen(true)}
                >
                  {t('signIn')}
                </Button>
                <Button
                  size="sm"
                  onClick={() => setRegisterModalOpen(true)}
                >
                  {t('register')}
                </Button>
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
          {/* Mobile Language Switcher */}
          <div className="px-4 pt-3 pb-2">
            <LanguageSwitcherMobile />
          </div>

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
                        {item.submenu.flatMap((section) =>
                          section.items.map((subItem, subItemIndex) => (
                            <Link
                              key={subItemIndex}
                              href={subItem.href}
                              className={cn(
                                'block px-3 py-2 rounded-md text-sm',
                                isActive(subItem.href)
                                  ? 'text-blue-600 bg-blue-50 font-medium'
                                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                              )}
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              {t(subItem.labelKey as any)}
                            </Link>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

            {/* Agency CRM in Mobile Menu */}
            {hasAgency && isAuthenticated && (
              <div>
                <button
                  onClick={() =>
                    setActiveDropdown(activeDropdown === 998 ? null : 998)
                  }
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                >
                  <span className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {crmLabel}
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      activeDropdown === 998 && 'rotate-180'
                    )}
                  />
                </button>
                {activeDropdown === 998 && (
                  <div className="pl-4 mt-1 space-y-1">
                    <Link
                      href="/agency/dashboard"
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Building2 className="h-4 w-4" />
                      {t('crmDashboard')}
                    </Link>
                    <Link
                      href="/developer/crm/members"
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Users className="h-4 w-4" />
                      {t('crmTeamMembers')}
                    </Link>
                    <Link
                      href="/developer/crm/leads"
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <FileText className="h-4 w-4" />
                      {t('crmLeads')}
                    </Link>
                    <Link
                      href="/agency/settings"
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <SettingsIcon className="h-4 w-4" />
                      {t('crmSettings')}
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 px-2 py-3 space-y-2">
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setLoginModalOpen(true);
                  }}
                >
                  {t('signIn')}
                </Button>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setRegisterModalOpen(true);
                  }}
                >
                  {t('register')}
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Auth Modals */}
      <LoginModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
        onSwitchToRegister={() => {
          setLoginModalOpen(false);
          setRegisterModalOpen(true);
        }}
      />
      <RegisterModal
        open={registerModalOpen}
        onOpenChange={setRegisterModalOpen}
        onSwitchToLogin={() => {
          setRegisterModalOpen(false);
          setLoginModalOpen(true);
        }}
      />
    </nav>
  );
}
