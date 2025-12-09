'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { ComparisonProvider } from './ComparisonContext';
import { Navbar, ComparisonBar } from '@/components';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ComparisonProvider>
        <Navbar />
        {children}
        <ComparisonBar />
      </ComparisonProvider>
    </AuthProvider>
  );
}
