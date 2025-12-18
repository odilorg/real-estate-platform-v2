'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@repo/ui';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword');
  const tCommon = useTranslations('common');
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('title', { default: 'Forgot Password' })}</CardTitle>
          <CardDescription>
            {success 
              ? t('successMessage', { default: 'Check your email for password reset instructions.' })
              : t('description', { default: 'Enter your email address and we will send you a link to reset your password.' })
            }
          </CardDescription>
        </CardHeader>

        {!success ? (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{tCommon('email', { default: 'Email' })}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !email}
              >
                {loading ? tCommon('loading', { default: 'Loading...' }) : t('submit', { default: 'Send Reset Link' })}
              </Button>

              <div className="text-center text-sm">
                <Link href="/auth/login" className="text-primary hover:underline">
                  {t('backToLogin', { default: 'Back to Login' })}
                </Link>
              </div>
            </CardFooter>
          </form>
        ) : (
          <CardFooter className="flex flex-col gap-4">
            <div className="rounded-md bg-green-50 p-4 text-center text-sm text-green-800">
              {t('emailSent', { default: 'Password reset email has been sent. Please check your inbox.' })}
            </div>
            <Button asChild className="w-full">
              <Link href="/auth/login">
                {t('backToLogin', { default: 'Back to Login' })}
              </Link>
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
