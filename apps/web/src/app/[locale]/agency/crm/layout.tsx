'use client';

import { CrmSidebar } from '@/components/crm/CrmSidebar';
import { CrmMobileNav } from '@/components/crm/CrmMobileNav';
import { CrmTopBar } from '@/components/crm/CrmTopBar';
import { useEffect, useState } from 'react';

export default function AgencyCrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [agencyId, setAgencyId] = useState<string | undefined>();
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    // TODO: Get actual agencyId and userId from auth context/session
    // For now, you can set these from cookies or session storage
    // Example:
    // const user = getUser();
    // setAgencyId(user.agencyId);
    // setUserId(user.id);

    // Placeholder - replace with actual auth logic
    const storedAgencyId = localStorage.getItem('agencyId');
    const storedUserId = localStorage.getItem('userId');

    if (storedAgencyId) setAgencyId(storedAgencyId);
    if (storedUserId) setUserId(storedUserId);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar - Only shows on desktop */}
      <CrmSidebar title="Agency CRM" />

      {/* Mobile Navigation - Only shows on mobile */}
      <CrmMobileNav title="Agency CRM" />

      {/* Main Content */}
      <main className="flex-1 lg:ml-0 overflow-x-hidden">
        {/* Top Bar with Reminder Bell - Desktop only */}
        <div className="hidden lg:block">
          {agencyId && <CrmTopBar agencyId={agencyId} userId={userId} />}
        </div>

        {/* Add top padding on mobile for the top bar, bottom padding for bottom nav */}
        <div className="px-4 py-6 sm:px-6 lg:px-8 pt-20 lg:pt-6 pb-24 lg:pb-6 overflow-x-hidden w-full max-w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
