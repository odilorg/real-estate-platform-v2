'use client';

import * as React from 'react';
import { Input } from '../primitives/input';
import { Label } from '../primitives/label';
import { cn } from '../lib/utils';

export interface OtpInputProps {
  label?: string;
  error?: string;
  value?: string;
  onChange?: (value: string) => void;
  length?: number;
  disabled?: boolean;
}

export const OtpInput = React.forwardRef<HTMLDivElement, OtpInputProps>(
  ({ label, error, value = '', onChange, length = 6, disabled }, ref) => {
    const [otp, setOtp] = React.useState<string[]>(
      Array(length).fill(''),
    );
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

    // Initialize refs array
    React.useEffect(() => {
      inputRefs.current = inputRefs.current.slice(0, length);
    }, [length]);

    // Update local state when value prop changes
    React.useEffect(() => {
      if (value) {
        const otpArray = value.split('').slice(0, length);
        const paddedArray = [
          ...otpArray,
          ...Array(length - otpArray.length).fill(''),
        ];
        setOtp(paddedArray);
      } else {
        setOtp(Array(length).fill(''));
      }
    }, [value, length]);

    const focusInput = (index: number) => {
      if (inputRefs.current[index]) {
        inputRefs.current[index]?.focus();
      }
    };

    const handleChange = (index: number, value: string) => {
      // Only allow digits
      const digit = value.replace(/\D/g, '').slice(-1);

      const newOtp = [...otp];
      newOtp[index] = digit;
      setOtp(newOtp);

      // Notify parent
      if (onChange) {
        onChange(newOtp.join(''));
      }

      // Auto-focus next input
      if (digit && index < length - 1) {
        focusInput(index + 1);
      }
    };

    const handleKeyDown = (
      index: number,
      e: React.KeyboardEvent<HTMLInputElement>,
    ) => {
      if (e.key === 'Backspace') {
        if (!otp[index] && index > 0) {
          // If current input is empty, focus previous and clear it
          const newOtp = [...otp];
          newOtp[index - 1] = '';
          setOtp(newOtp);
          focusInput(index - 1);

          if (onChange) {
            onChange(newOtp.join(''));
          }
        } else if (otp[index]) {
          // Clear current input
          const newOtp = [...otp];
          newOtp[index] = '';
          setOtp(newOtp);

          if (onChange) {
            onChange(newOtp.join(''));
          }
        }
      } else if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        focusInput(index - 1);
      } else if (e.key === 'ArrowRight' && index < length - 1) {
        e.preventDefault();
        focusInput(index + 1);
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedData = e.clipboardData
        .getData('text/plain')
        .replace(/\D/g, '')
        .slice(0, length);

      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);

      if (onChange) {
        onChange(newOtp.join(''));
      }

      // Focus the next empty input or the last input
      const nextEmptyIndex = newOtp.findIndex((digit) => !digit);
      if (nextEmptyIndex !== -1) {
        focusInput(nextEmptyIndex);
      } else {
        focusInput(length - 1);
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.select();
    };

    return (
      <div ref={ref} className="space-y-2">
        {label && <Label>{label}</Label>}
        <div className="flex gap-2 justify-center">
          {Array.from({ length }).map((_, index) => (
            <Input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={otp[index]}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={handleFocus}
              disabled={disabled}
              className={cn(
                'w-12 h-12 text-center text-lg font-semibold',
                error && 'border-red-500 focus-visible:ring-red-500',
              )}
            />
          ))}
        </div>
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
      </div>
    );
  },
);

OtpInput.displayName = 'OtpInput';
