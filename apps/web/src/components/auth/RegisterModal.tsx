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
  register,
  requestPhoneRegistrationOtp,
  verifyPhoneRegistration,
} from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';

type RegisterMethod = 'phone' | 'email';
type PhoneStep = 'phone' | 'otp';

interface RegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin?: () => void;
}

export function RegisterModal({ open, onOpenChange, onSwitchToLogin }: RegisterModalProps) {
  const t = useTranslations('auth.register');
  const tCommon = useTranslations('common');
  const { refreshUser } = useAuth();

  // Register method toggle
  const [registerMethod, setRegisterMethod] = useState<RegisterMethod>('phone');

  // Phone registration state
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('phone');
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Email registration state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailFirstName, setEmailFirstName] = useState('');
  const [emailLastName, setEmailLastName] = useState('');

  // Common state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setRegisterMethod('phone');
      setPhoneStep('phone');
      setPhone('');
      setFirstName('');
      setLastName('');
      setOtp('');
      setOtpSent(false);
      setResendTimer(0);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setEmailFirstName('');
      setEmailLastName('');
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

  // Phone Registration: Request OTP
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim()) {
      setError(t('nameRequired') || 'First name and last name are required');
      return;
    }

    setLoading(true);

    try {
      await requestPhoneRegistrationOtp({ phone });
      setOtpSent(true);
      setPhoneStep('otp');
      setResendTimer(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('sendOtpFailed') || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  // Phone Registration: Verify OTP
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyPhoneRegistration({
        phone,
        code: otp,
        firstName,
        lastName,
      });
      await refreshUser();
      onOpenChange(false);
      window.location.assign('/properties');
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : t('registrationFailed') || 'Registration failed');
      setLoading(false);
    }
  };

  // Email Registration
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('passwordMismatch') || 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError(t('passwordTooShort') || 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await register({
        email,
        password,
        firstName: emailFirstName,
        lastName: emailLastName,
      });
      await refreshUser();
      onOpenChange(false);
      window.location.assign('/properties');
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : t('registrationFailed') || 'Registration failed');
      setLoading(false);
    }
  };

  // Google Registration
  const handleGoogleRegister = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/google`;
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setError('');
    setLoading(true);

    try {
      await requestPhoneRegistrationOtp({ phone });
      setResendTimer(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('sendOtpFailed') || 'Failed to send verification code');
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

          {registerMethod === 'phone' ? (
            // Phone Registration Flow
            phoneStep === 'phone' ? (
              // Step 1: Enter Phone Number and Name
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{tCommon('firstName')}</Label>
                    <Input
                      id="firstName"
                      placeholder={t('firstNamePlaceholder')}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{tCommon('lastName')}</Label>
                    <Input
                      id="lastName"
                      placeholder={t('lastNamePlaceholder')}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

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
                  <p className="text-sm font-medium mt-1">
                    {firstName} {lastName}
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
                  {loading ? t('submitting') : t('createAccountButton') || 'Create Account'}
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
            // Email Registration Flow
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emailFirstName">{tCommon('firstName')}</Label>
                  <Input
                    id="emailFirstName"
                    placeholder={t('firstNamePlaceholder')}
                    value={emailFirstName}
                    onChange={(e) => setEmailFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailLastName">{tCommon('lastName')}</Label>
                  <Input
                    id="emailLastName"
                    placeholder={t('lastNamePlaceholder')}
                    value={emailLastName}
                    onChange={(e) => setEmailLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{tCommon('confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t('confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  setRegisterMethod(registerMethod === 'phone' ? 'email' : 'phone');
                  setError('');
                  setPhoneStep('phone');
                }}
                className="bg-background px-2 text-primary hover:underline"
              >
                {registerMethod === 'phone'
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
            onClick={handleGoogleRegister}
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

          {/* Switch to Login */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t('hasAccount')}{' '}
              {onSwitchToLogin ? (
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-primary hover:underline"
                >
                  {t('signInLink')}
                </button>
              ) : (
                <Link href="/auth/login" className="text-primary hover:underline">
                  {t('signInLink')}
                </Link>
              )}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
