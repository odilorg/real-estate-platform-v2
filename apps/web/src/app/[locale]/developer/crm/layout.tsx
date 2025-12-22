'use client';

import { CrmSidebar } from '@/components/crm/CrmSidebar';
import { CrmMobileNav } from '@/components/crm/CrmMobileNav';

export default function DeveloperCrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar - Only shows on desktop */}
      <CrmSidebar title="Developer CRM" />

      {/* Mobile Navigation - Only shows on mobile */}
      <CrmMobileNav title="Developer CRM" />

      {/* Main Content */}
      <main className="flex-1 lg:ml-0 overflow-x-hidden">
        {/* Add top padding on mobile for the top bar, bottom padding for bottom nav */}
        <div className="px-4 py-6 sm:px-6 lg:px-8 pt-20 lg:pt-6 pb-24 lg:pb-6 overflow-x-hidden w-full max-w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
