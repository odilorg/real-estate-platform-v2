'use client';

import * as React from 'react';
import { Input } from '../primitives/input';
import { Label } from '../primitives/label';
import { cn } from '../lib/utils';

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  value?: string;
  onChange?: (value: string) => void;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, label, error, value = '', onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(value);

    // Format phone number as user types
    const formatPhoneNumber = (input: string): string => {
      // Remove all non-digits
      const digits = input.replace(/\D/g, '');

      // Always start with +998
      if (!digits.startsWith('998')) {
        if (digits.length === 0) return '+998';
        // If user typed something else, prepend 998
        return '+998' + digits.slice(0, 9);
      }

      // Limit to 12 digits total (+998 + 9 digits)
      const limitedDigits = digits.slice(0, 12);

      // Format: +998 XX XXX XX XX
      if (limitedDigits.length <= 3) {
        return '+' + limitedDigits;
      } else if (limitedDigits.length <= 5) {
        return `+${limitedDigits.slice(0, 3)} ${limitedDigits.slice(3)}`;
      } else if (limitedDigits.length <= 8) {
        return `+${limitedDigits.slice(0, 3)} ${limitedDigits.slice(3, 5)} ${limitedDigits.slice(5)}`;
      } else if (limitedDigits.length <= 10) {
        return `+${limitedDigits.slice(0, 3)} ${limitedDigits.slice(3, 5)} ${limitedDigits.slice(5, 8)} ${limitedDigits.slice(8)}`;
      } else {
        return `+${limitedDigits.slice(0, 3)} ${limitedDigits.slice(3, 5)} ${limitedDigits.slice(5, 8)} ${limitedDigits.slice(8, 10)} ${limitedDigits.slice(10)}`;
      }
    };

    // Get raw phone number (digits only with +998 prefix)
    const getRawValue = (formatted: string): string => {
      const digits = formatted.replace(/\D/g, '');
      return digits.length > 0 ? '+' + digits : '';
    };

    React.useEffect(() => {
      if (value !== displayValue) {
        setDisplayValue(formatPhoneNumber(value));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const formatted = formatPhoneNumber(inputValue);
      setDisplayValue(formatted);

      if (onChange) {
        const raw = getRawValue(formatted);
        onChange(raw);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow backspace to work naturally
      if (e.key === 'Backspace') {
        const input = e.currentTarget;
        const cursorPos = input.selectionStart || 0;

        // If cursor is at position 4 (+998|), prevent deleting the prefix
        if (cursorPos <= 4) {
          e.preventDefault();
          return;
        }
      }
    };

    return (
      <div className="space-y-2">
        {label && <Label htmlFor={props.id}>{label}</Label>}
        <Input
          ref={ref}
          type="tel"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="+998 XX XXX XX XX"
          className={cn(
            error && 'border-red-500 focus-visible:ring-red-500',
            className,
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  },
);

PhoneInput.displayName = 'PhoneInput';

export { PhoneInput };
