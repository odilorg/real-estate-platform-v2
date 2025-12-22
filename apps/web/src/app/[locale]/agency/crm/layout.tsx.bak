'use client';

import { CrmSidebar } from '@/components/crm/CrmSidebar';

export default function DeveloperCrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar - Only shows on desktop */}
      <CrmSidebar title="Developer CRM" />

      {/* Main Content */}
      <main className="flex-1 lg:ml-0">
        <div className="px-4 py-6 sm:px-6 lg:px-8 pb-20 lg:pb-6">
          {children}
        </div>
      </main>
    </div>
  );
}
