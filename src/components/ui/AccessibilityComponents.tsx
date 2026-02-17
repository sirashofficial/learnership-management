'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export const Breadcrumb = ({ items, className = '' }: { items: BreadcrumbItem[]; className?: string }) => {
  return (
    <nav aria-label="Breadcrumb" className={cn('mb-6', className)}>
      <ol className="flex items-center gap-2 text-sm">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600 flex-shrink-0" aria-hidden="true" />
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-slate-600 dark:text-slate-400 font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export const BackButton = ({ href, label = 'Back' }: { href?: string; label?: string }) => {
  const router =
    typeof window !== 'undefined'
      ? require('next/navigation').useRouter()
      : null;

  const handleClick = () => {
    if (href) {
      router?.push(href);
    } else {
      router?.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className="mb-4 inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
      aria-label={`${label} to previous page`}
    >
      <ChevronLeft className="w-4 h-4" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
};

/**
 * Status Badge Component
 * Provides consistent styling for status indicators across the app
 */
export const StatusBadge = ({
  status,
  className = '',
}: {
  status: 'ON_TRACK' | 'BEHIND' | 'AHEAD' | 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'COMPLETED';
  className?: string;
}) => {
  const styles = {
    ON_TRACK: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
    BEHIND: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
    AHEAD: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
    INACTIVE: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
    COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  };

  const displayText = status
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');

  return (
    <span
      className={cn(
        'px-2.5 py-1 text-xs font-semibold rounded-full inline-block',
        styles[status],
        className
      )}
    >
      {displayText}
    </span>
  );
};

/**
 * Alert Component with distinct styling for different alert types
 */
export const Alert = ({
  type = 'info',
  title,
  message,
  children,
  className = '',
}: {
  type?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  message?: string;
  children?: React.ReactNode;
  className?: string;
}) => {
  const styles = {
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-300',
      icon: 'text-blue-400 dark:text-blue-500',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-950/30',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-800 dark:text-yellow-300',
      icon: 'text-yellow-400 dark:text-yellow-500',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-300',
      icon: 'text-red-400 dark:text-red-500',
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-950/30',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-800 dark:text-green-300',
      icon: 'text-green-400 dark:text-green-500',
    },
  };

  const icons = {
    info: '💡',
    warning: '⚠️',
    error: '❌',
    success: '✅',
  };

  return (
    <div
      className={cn(
        `p-4 border-l-4 rounded-md ${styles[type].bg} ${styles[type].border}`,
        className
      )}
      role="alert"
    >
      <div className={`flex gap-3 ${styles[type].text}`}>
        <span className={`text-lg flex-shrink-0 ${styles[type].icon}`} aria-hidden="true">
          {icons[type]}
        </span>
        <div className="flex-1">
          {title && <h4 className="font-semibold mb-1">{title}</h4>}
          {message && <p className="text-sm leading-relaxed">{message}</p>}
          {children}
        </div>
      </div>
    </div>
  );
};

/**
 * Icon Button - Button with icon and accessible aria-label
 */
export const IconButton = ({
  icon: Icon,
  label,
  onClick,
  variant = 'secondary',
  size = 'md',
  ...props
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  [key: string]: any;
}) => {
  const variantStyles = {
    primary: 'bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700',
    secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700',
    danger: 'bg-red-100 text-red-600 hover:bg-red-200 active:bg-red-300',
  };

  const sizeStyles = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-2.5',
  };

  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        'rounded-lg transition-colors flex items-center justify-center flex-shrink-0',
        variantStyles[variant],
        sizeStyles[size]
      )}
      {...props}
    >
      <Icon className="w-full h-full" aria-hidden="true" />
    </button>
  );
};
