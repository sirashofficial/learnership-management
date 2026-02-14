'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface AlertProps {
  variant?: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function Alert({
  variant = 'info',
  title,
  description,
  dismissible = false,
  onDismiss,
  className,
}: AlertProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  const variantClasses = {
    success: {
      container: 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30',
      icon: 'text-green-600 dark:text-green-400',
      title: 'text-green-900 dark:text-green-200',
      description: 'text-green-700 dark:text-green-300',
    },
    error: {
      container: 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30',
      icon: 'text-red-600 dark:text-red-400',
      title: 'text-red-900 dark:text-red-200',
      description: 'text-red-700 dark:text-red-300',
    },
    warning: {
      container: 'bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/30',
      icon: 'text-yellow-600 dark:text-yellow-400',
      title: 'text-yellow-900 dark:text-yellow-200',
      description: 'text-yellow-700 dark:text-yellow-300',
    },
    info: {
      container: 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30',
      icon: 'text-blue-600 dark:text-blue-400',
      title: 'text-blue-900 dark:text-blue-200',
      description: 'text-blue-700 dark:text-blue-300',
    },
  };

  const classes = variantClasses[variant];
  const Icon = variant === 'success' ? CheckCircle2 : variant === 'error' ? AlertCircle : variant === 'warning' ? AlertCircle : Info;

  return (
    <div
      className={cn(
        'rounded-lg p-4 flex items-start gap-3',
        classes.container,
        className
      )}
      role="alert"
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', classes.icon)} aria-hidden="true" />
      
      <div className="flex-1 min-w-0">
        <h3 className={cn('font-semibold mb-1', classes.title)}>
          {title}
        </h3>
        {description && (
          <p className={cn('text-sm', classes.description)}>
            {description}
          </p>
        )}
      </div>

      {dismissible && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

interface ToastProps {
  variant?: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

export function useToast() {
  // Placeholder for toast hook - would be implemented with a toast provider
  return {
    toast: (props: ToastProps) => {
      console.log('Toast:', props);
    },
  };
}
