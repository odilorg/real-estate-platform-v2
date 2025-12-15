'use client';

import * as React from 'react';
import { cn } from '../utils/cn';
import { Card, CardContent } from '../primitives/card';

export interface PropertyCardSkeletonProps {
  className?: string;
}

/**
 * PropertyCardSkeleton - Animated loading placeholder for PropertyCard
 * Improves perceived performance by showing content structure while loading
 */
export function PropertyCardSkeleton({ className }: PropertyCardSkeletonProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="animate-pulse">
        {/* Image placeholder */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
          {/* Badge placeholders */}
          <div className="absolute top-2 left-2 flex gap-1">
            <div className="h-5 w-16 bg-gray-300 dark:bg-gray-600 rounded" />
            <div className="h-5 w-12 bg-gray-300 dark:bg-gray-600 rounded" />
          </div>

          {/* Property type placeholder */}
          <div className="absolute bottom-2 right-2">
            <div className="h-6 w-20 bg-gray-300 dark:bg-gray-600 rounded" />
          </div>
        </div>

        <CardContent className="p-4">
          {/* Price placeholder */}
          <div className="mb-2">
            <div className="h-8 w-32 bg-gray-300 dark:bg-gray-600 rounded mb-1" />
            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>

          {/* Title placeholder */}
          <div className="h-4 w-full bg-gray-300 dark:bg-gray-600 rounded mb-2" />

          {/* Details placeholder */}
          <div className="flex gap-2">
            <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

/**
 * PropertyCardSkeletonGrid - Shows multiple skeleton cards in a grid
 * @param count - Number of skeleton cards to show (default: 6)
 */
export function PropertyCardSkeletonGrid({
  count = 6,
  className
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn(
      'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
      className
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}
