'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/context/AuthContext';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');

      if (token) {
        // Handle URL token (legacy)
        localStorage.setItem('token', token);
        await refreshUser();
        window.location.assign('/properties');
      } else {
        // Handle cookie-based auth (current implementation)
        // The token is already in an HTTP-only cookie set by the backend
        try {
          await refreshUser();
          window.location.assign('/properties');
        } catch (error) {
          console.error('Auth callback error:', error);
          router.push('/auth/login?error=auth_failed');
        }
      }
    };

    handleCallback();
  }, [router, searchParams, refreshUser]);

  return null;
}

export default function AuthCallbackPage() {
  const t = useTranslations('auth.callback');

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">{t('completing')}</p>
      </div>
      <Suspense fallback={null}>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}
