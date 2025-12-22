'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

interface ShareToTelegramButtonProps {
  propertyId: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export function ShareToTelegramButton({ 
  propertyId, 
  variant = 'secondary',
  size = 'md' 
}: ShareToTelegramButtonProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShare = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/properties/${propertyId}/share/telegram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add auth token when auth is implemented
        },
      });

      if (!response.ok) {
        throw new Error('Failed to share to Telegram');
      }

      const result = await response.json();
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error(result.error || 'Failed to share');
      }
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300',
  };

  return (
    <div>
      <button
        onClick={handleShare}
        disabled={loading}
        className={`
          inline-flex items-center gap-2 rounded-lg font-medium
          transition-colors duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${sizeClasses[size]}
          ${variantClasses[variant]}
        `}
      >
        <Send className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
        {loading ? 'Posting...' : success ? '✓ Posted!' : 'Post to Telegram'}
      </button>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
