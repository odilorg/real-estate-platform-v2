'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { Navbar } from '@/components';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Navbar />
      {children}
    </AuthProvider>
  );
}
