'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const animationClass = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  }[animation];

  const variantClass = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  }[variant];

  return (
    <div
      className={cn(
        'bg-slate-200 dark:bg-slate-700',
        variantClass,
        animationClass,
        className
      )}
      style={{ width, height }}
      role="status"
      aria-label="Loading..."
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Common Skeleton Patterns
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700', className)}>
      <div className="flex items-start gap-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-3">
          <Skeleton variant="text" height={20} width="60%" />
          <Skeleton variant="text" height={16} width="40%" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton variant="text" height={12} width="100%" />
        <Skeleton variant="text" height={12} width="80%" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-slate-200 dark:border-slate-700">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton variant="text" height={16} width={i === 0 ? '80%' : '60%'} />
        </td>
      ))}
    </tr>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <Skeleton variant="rectangular" width={40} height={40} />
        <Skeleton variant="text" width={60} height={20} />
      </div>
      <Skeleton variant="text" height={32} width="50%" className="mb-2" />
      <Skeleton variant="text" height={14} width="70%" />
    </div>
  );
}

export function StudentCardSkeleton() {
  return (
    <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-start gap-3 mb-4">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1">
          <Skeleton variant="text" height={18} width="70%" className="mb-2" />
          <Skeleton variant="text" height={14} width="50%" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" height={12} width="100%" />
        <Skeleton variant="text" height={8} />
      </div>
    </div>
  );
}
