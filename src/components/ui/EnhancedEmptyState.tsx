'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { FileQuestion, Users, Calendar, BookOpen, Inbox, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  illustration?: 'default' | 'search' | 'students' | 'calendar' | 'assessments';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const illustrations = {
  default: Inbox,
  search: Search,
  students: Users,
  calendar: Calendar,
  assessments: BookOpen,
};

export function EnhancedEmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  illustration = 'default',
  size = 'md',
  className,
}: EnhancedEmptyStateProps) {
  const Icon = icon || illustrations[illustration];
  
  const sizes = {
    sm: {
      container: 'py-8',
      icon: 'w-10 h-10',
      iconContainer: 'w-16 h-16',
      title: 'text-base',
      description: 'text-xs',
    },
    md: {
      container: 'py-12',
      icon: 'w-12 h-12',
      iconContainer: 'w-20 h-20',
      title: 'text-lg',
      description: 'text-sm',
    },
    lg: {
      container: 'py-16',
      icon: 'w-16 h-16',
      iconContainer: 'w-24 h-24',
      title: 'text-xl',
      description: 'text-base',
    },
  };

  const sizeClasses = sizes[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-4',
        sizeClasses.container,
        className
      )}
      role="status"
      aria-label={title}
    >
      {/* Icon */}
      <div
        className={cn(
          'rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 transition-colors',
          sizeClasses.iconContainer
        )}
      >
        <Icon
          className={cn(
            'text-slate-400 dark:text-slate-500',
            sizeClasses.icon
          )}
          aria-hidden="true"
        />
      </div>

      {/* Title */}
      <h3
        className={cn(
          'font-semibold text-slate-900 dark:text-white mb-2',
          sizeClasses.title
        )}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className={cn(
            'text-slate-500 dark:text-slate-400 mb-6 max-w-md',
            sizeClasses.description
          )}
        >
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {action && (
            <button
              onClick={action.onClick}
              className={cn(
                'px-5 py-2.5 rounded-lg font-medium transition-colors duration-150 focus-ring',
                action.variant === 'secondary'
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600'
                  : 'bg-emerald-600 dark:bg-emerald-700 text-white hover:bg-emerald-700 dark:hover:bg-emerald-600'
              )}
              aria-label={action.label}
            >
              {action.label}
            </button>
          )}
          
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-5 py-2.5 rounded-lg font-medium bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150 focus-ring"
              aria-label={secondaryAction.label}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Specialized empty states for common scenarios
 */
export function NoResultsEmptyState({
  searchQuery,
  onClearSearch,
  className,
}: {
  searchQuery?: string;
  onClearSearch?: () => void;
  className?: string;
}) {
  return (
    <EnhancedEmptyState
      illustration="search"
      title={searchQuery ? 'No results found' : 'No data available'}
      description={
        searchQuery
          ? `We couldn't find anything matching "${searchQuery}". Try adjusting your search.`
          : 'There are no records to display at this time.'
      }
      action={
        onClearSearch && searchQuery
          ? {
              label: 'Clear search',
              onClick: onClearSearch,
              variant: 'secondary',
            }
          : undefined
      }
      size="md"
      className={className}
    />
  );
}

export function NoStudentsEmptyState({
  onAddStudent,
  className,
}: {
  onAddStudent?: () => void;
  className?: string;
}) {
  return (
    <EnhancedEmptyState
      illustration="students"
      title="No students yet"
      description="Get started by adding your first student to the system."
      action={
        onAddStudent
          ? {
              label: 'Add student',
              onClick: onAddStudent,
            }
          : undefined
      }
      size="lg"
      className={className}
    />
  );
}

export function NoAssessmentsEmptyState({
  onCreateAssessment,
  className,
}: {
  onCreateAssessment?: () => void;
  className?: string;
}) {
  return (
    <EnhancedEmptyState
      illustration="assessments"
      title="No assessments"
      description="Create your first assessment to track student progress."
      action={
        onCreateAssessment
          ? {
              label: 'Create assessment',
              onClick: onCreateAssessment,
            }
          : undefined
      }
      size="lg"
      className={className}
    />
  );
}
