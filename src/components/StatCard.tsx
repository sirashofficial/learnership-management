'use client';

import { LucideIcon } from 'lucide-react';
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

export default function StatCard({
  title,
  value,
  trend,
  icon: Icon,
  suffix = '',
  onClick,
  loading = false,
}: StatCardProps) {
  const isPositiveTrend = trend && trend > 0;
  const isNegativeTrend = trend && trend < 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-lg border border-slate-200 p-5 transition-colors duration-150",
        onClick && "cursor-pointer hover:border-slate-300",
        loading && "animate-pulse"
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
          <Icon className="w-[18px] h-[18px] text-slate-600" />
        </div>
        <span className="text-sm text-slate-500">{title}</span>
      </div>

      {loading ? (
        <div className="h-8 bg-slate-100 rounded w-2/3"></div>
      ) : (
        <div className="flex items-end justify-between">
          <p className="text-2xl font-semibold text-slate-900">
            {value}{suffix && <span className="text-base text-slate-400 ml-0.5">{suffix}</span>}
          </p>

          {trend !== undefined && (
            <span
              className={cn(
                "text-xs font-medium",
                isPositiveTrend && "text-emerald-600",
                isNegativeTrend && "text-red-500",
                !isPositiveTrend && !isNegativeTrend && "text-slate-400"
              )}
            >
              {isPositiveTrend && '+'}{trend}{suffix === '%' ? '' : '%'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
