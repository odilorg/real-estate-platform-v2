'use client';

import { CrmSidebar } from './CrmSidebar';
import { CrmMobileNav } from './CrmMobileNav';

interface CrmLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function CrmLayout({ children, title = 'CRM' }: CrmLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Top Bar */}
      <CrmMobileNav title={title} />

      <div className="flex">
        {/* Desktop/Tablet Sidebar */}
        <CrmSidebar title={title} />

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          <div className="px-4 py-6 sm:px-6 lg:px-8 pb-20 lg:pb-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Tab Bar is in CrmMobileNav */}
    </div>
  );
}
