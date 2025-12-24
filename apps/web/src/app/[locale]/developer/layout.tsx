'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { DeveloperNav } from './components/DeveloperNav';

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (!token) {
      // Redirect to login if no token found
      router.push('/auth/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <DeveloperNav />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
