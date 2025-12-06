/**
 * React Component Template
 *
 * Usage:
 * 1. Copy to appropriate location:
 *    - Reusable: packages/ui/src/composites/
 *    - Page-specific: apps/web/src/components/
 *    - Feature: apps/web/src/features/{feature}/
 * 2. Replace {ComponentName} with your component name
 * 3. Update props interface and implementation
 * 4. Export from index.ts
 */

'use client';

import * as React from 'react';
import { cn } from '@repo/ui';

// ============================================
// Props Interface (always define)
// ============================================

export interface {ComponentName}Props {
  /** Description of prop */
  title: string;
  /** Optional description */
  description?: string;
  /** Additional CSS classes */
  className?: string;
  /** Children elements */
  children?: React.ReactNode;
  /** Callback when action happens */
  onAction?: () => void;
}

// ============================================
// Component
// ============================================

export function {ComponentName}({
  title,
  description,
  className,
  children,
  onAction,
}: {ComponentName}Props) {
  // State (if needed)
  const [isLoading, setIsLoading] = React.useState(false);

  // Handlers
  const handleClick = React.useCallback(() => {
    if (onAction) {
      onAction();
    }
  }, [onAction]);

  // Render
  return (
    <div className={cn('rounded-lg border p-4', className)}>
      <h3 className="font-semibold">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {children}
      {onAction && (
        <button
          onClick={handleClick}
          disabled={isLoading}
          className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded"
        >
          Action
        </button>
      )}
    </div>
  );
}

// ============================================
// Display name (for debugging)
// ============================================

{ComponentName}.displayName = '{ComponentName}';


/**
 * CHECKLIST after creating component:
 * [ ] Props interface defined with JSDoc comments
 * [ ] Component exported (named export preferred)
 * [ ] Added to index.ts exports
 * [ ] DisplayName set
 * [ ] className prop accepts additional styles
 * [ ] Loading/error states handled (if async)
 */
