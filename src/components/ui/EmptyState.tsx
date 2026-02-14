'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-slate-400 dark:text-slate-500" aria-hidden="true" />
      </div>
      
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
          {description}
        </p>
      )}
      
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors duration-150"
          aria-label={action.label}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  icon?: LucideIcon;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again or contact support',
  action,
  className,
  icon: Icon,
}: ErrorStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30',
      className
    )}>
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-red-600 dark:text-red-400" aria-hidden="true" />
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-red-700 dark:text-red-300 mb-6 max-w-sm">
          {description}
        </p>
      )}
      
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors duration-150"
          aria-label={action.label}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
}

export function LoadingSkeleton({ className, count = 1 }: LoadingSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
        </div>
      ))}
    </div>
  );
}
