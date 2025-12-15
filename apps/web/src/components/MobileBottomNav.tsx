'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Heart, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const navItems = [
    {
      href: '/',
      label: 'Главная',
      icon: Home,
      active: pathname === '/',
    },
    {
      href: '/properties',
      label: 'Поиск',
      icon: Search,
      active: pathname.startsWith('/properties'),
    },
    {
      href: isAuthenticated ? '/dashboard/favorites' : '/auth/login',
      label: 'Избранное',
      icon: Heart,
      active: pathname.startsWith('/dashboard/favorites'),
    },
    {
      href: isAuthenticated ? '/dashboard' : '/auth/login',
      label: 'Профиль',
      icon: User,
      active: pathname.startsWith('/dashboard'),
    },
  ];

  return (
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
      </div>
    </nav>
  );
}
