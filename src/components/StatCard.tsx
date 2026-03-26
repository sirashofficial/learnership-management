'use client';

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  trend?: number;
  icon: LucideIcon;
  suffix?: string;
  onClick?: () => void;
  loading?: boolean;
}

/**
 * REDESIGN: Stat Card with visual hierarchy and trend indicators
 * Features:
 * - Left accent border (brand green #16a34a)
 * - Large, bold value display
 * - Muted label above value
 * - Trend arrow with color coding
 * - Rounded 12px corners with subtle shadow
 */
export default function StatCard({
  title,
  value,
  trend,
  icon: Icon,
  suffix = '',
  onClick,
  loading = false,
}: StatCardProps) {
  if (process.env.NODE_ENV !== 'production') {
    if (typeof value !== 'number' && typeof value !== 'string') {
      console.error(`StatCard "${title}" received non-primitive value:`, value);
    }
  }

  const isPositiveTrend = trend && trend > 0;
  const isNegativeTrend = trend && trend < 0;

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      className={cn(
        'stat-card',
        onClick && 'cursor-pointer',
        loading && 'animate-pulse'
      )}
    >
      {/* Header with icon and title */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
            {title}
          </p>
        </div>
        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg ml-3">
          <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>

      {/* Value display */}
      {loading ? (
        <div className="space-y-2">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
        </div>
      ) : (
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {value}
              {suffix && <span className="text-sm text-slate-500 dark:text-slate-400 ml-1">{suffix}</span>}
            </p>
          </div>

          {/* Trend indicator */}
          {trend !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs font-semibold ml-3',
                isPositiveTrend && 'text-emerald-600 dark:text-emerald-400',
                isNegativeTrend && 'text-red-600 dark:text-red-400',
                !isPositiveTrend && !isNegativeTrend && 'text-slate-500 dark:text-slate-400'
              )}
            >
              {isPositiveTrend ? (
                <TrendingUp className="w-4 h-4" />
              ) : isNegativeTrend ? (
                <TrendingDown className="w-4 h-4" />
              ) : null}
              <span>
                {isPositiveTrend && '+'}{trend}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
