'use client';

import { LucideIcon, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * EMPTY STATE REDESIGN
 * Replaces generic "No Data Available" with designed empty states
 * Features:
 * - Small, centered icon
 * - Clear messaging
 * - Subtle background (not stark white)
 * - Optional CTA with arrow icon
 * - Professional, minimal design
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700">
      {Icon && (
        <div className="mb-4 p-3 rounded-full bg-slate-200 dark:bg-slate-700">
          <Icon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900 dark:text-white text-center mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-slate-600 dark:text-slate-400 text-center max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 mt-2 px-4 py-2 text-xs font-semibold 
            text-emerald-600 dark:text-emerald-400
            hover:bg-emerald-50 dark:hover:bg-emerald-900/20 
            rounded-lg transition-colors"
        >
          {action.label}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
