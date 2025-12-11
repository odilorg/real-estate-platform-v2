'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  Button,
  Input,
  Label,
  PhoneInput,
  OtpInput,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@repo/ui';
import {
  login,
  requestPhoneLoginOtp,
  verifyPhoneLogin,
} from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';

type LoginMethod = 'phone' | 'email';
type PhoneStep = 'phone' | 'otp';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToRegister?: () => void;
}

export function LoginModal({ open, onOpenChange, onSwitchToRegister }: LoginModalProps) {
  const t = useTranslations('auth.login');
  const tCommon = useTranslations('common');
  const { refreshUser } = useAuth();

  // Login method toggle
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('phone');

  // Phone login state
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Email login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Common state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setLoginMethod('phone');
      setPhoneStep('phone');
      setPhone('');
      setOtp('');
      setOtpSent(false);
      setResendTimer(0);
      setEmail('');
      setPassword('');
      setError('');
      setLoading(false);
    }
  }, [open]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timeout = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timeout);
    }
  }, [resendTimer]);

  // Phone Login: Request OTP
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await requestPhoneLoginOtp({ phone });
      setOtpSent(true);
      setPhoneStep('otp');
      setResendTimer(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('sendOtpFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Phone Login: Verify OTP
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyPhoneLogin({ phone, code: otp });
      await refreshUser();
      onOpenChange(false);
      window.location.assign('/properties');
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loginFailed'));
      setLoading(false);
    }
  };

  // Email Login
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      await refreshUser();
      onOpenChange(false);
      window.location.assign('/properties');
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loginFailed'));
      setLoading(false);
    }
  };

  // Google Login
  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/google`;
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setError('');
    setLoading(true);

    try {
      await requestPhoneLoginOtp({ phone });
      setResendTimer(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('sendOtpFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Change phone number
  const handleChangePhone = () => {
    setPhoneStep('phone');
    setOtp('');
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {error && (
            <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          {loginMethod === 'phone' ? (
            // Phone Login Flow
            phoneStep === 'phone' ? (
              // Step 1: Enter Phone Number
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <PhoneInput
                  label={t('phoneLabel') || 'Phone Number'}
                  value={phone}
                  onChange={setPhone}
                  error={error}
                  disabled={loading}
                  required
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('submitting') : t('continueButton') || 'Continue'}
                </Button>
              </form>
            ) : (
              // Step 2: Enter OTP
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    {t('otpSentTo') || 'Code sent to'} {phone}
                  </p>
                </div>

                <OtpInput
                  label={t('otpLabel') || 'Verification Code'}
                  value={otp}
                  onChange={setOtp}
                  error={error}
                  disabled={loading}
                  length={6}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? t('submitting') : t('verifyButton') || 'Verify'}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0}
                    className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                  >
                    {resendTimer > 0
                      ? `${t('resendIn') || 'Resend in'} ${resendTimer}s`
                      : t('resendCode') || 'Resend code'}
                  </button>
                  <button
                    type="button"
                    onClick={handleChangePhone}
                    className="text-primary hover:underline"
                  >
                    {t('changePhone') || 'Change number'}
                  </button>
                </div>
              </form>
            )
          ) : (
            // Email Login Flow
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{tCommon('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{tCommon('password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('submitting') : t('submitButton')}
              </Button>
            </form>
          )}

          {/* Method Toggle */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-sm">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod(loginMethod === 'phone' ? 'email' : 'phone');
                  setError('');
                  setPhoneStep('phone');
                }}
                className="bg-background px-2 text-primary hover:underline"
              >
                {loginMethod === 'phone'
                  ? t('useEmail') || 'Use email instead'
                  : t('usePhone') || 'Use phone instead'}
              </button>
            </div>
          </div>

          {/* Google OAuth */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {t('continueWithGoogle')}
          </Button>

          {/* Switch to Register */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t('noAccount')}{' '}
              {onSwitchToRegister ? (
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="text-primary hover:underline"
                >
                  {t('signUpLink')}
                </button>
              ) : (
                <Link href="/auth/register" className="text-primary hover:underline">
                  {t('signUpLink')}
                </Link>
              )}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
