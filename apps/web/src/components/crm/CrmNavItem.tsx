'use client';

import { Link } from '@/i18n/routing';
import { usePathname } from '@/i18n/routing';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CrmNavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  collapsed?: boolean;
  badge?: number;
  onClick?: () => void;
}

export function CrmNavItem({
  href,
  icon: Icon,
  label,
  collapsed = false,
  badge,
  onClick,
}: CrmNavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname?.startsWith(href + '/');

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
        'hover:bg-gray-100',
        isActive
          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 pl-2.5'
          : 'text-gray-700 border-l-4 border-transparent',
        collapsed && 'justify-center px-2'
      )}
      aria-current={isActive ? 'page' : undefined}
      title={collapsed ? label : undefined}
    >
      <Icon
        className={cn(
          'flex-shrink-0 transition-colors',
          isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700',
          collapsed ? 'w-6 h-6' : 'w-5 h-5'
        )}
      />
      {!collapsed && (
        <>
          <span className="flex-1">{label}</span>
          {badge !== undefined && badge > 0 && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold text-white bg-red-500 rounded-full">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}
