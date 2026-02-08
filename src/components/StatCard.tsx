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
  const hasNoChange = trend === 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        "card-premium group relative p-8 noise-texture",
        onClick ? "cursor-pointer" : "cursor-default",
        loading && "animate-pulse"
      )}
    >
      <div className="flex items-start justify-between mb-6">
        <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center transition-all duration-500 group-hover:bg-emerald-600 group-hover:scale-110 group-hover:rotate-3 shadow-xl">
          <Icon className="w-6 h-6 text-white" />
        </div>

        {trend !== undefined && !loading && (
          <div
            className={cn(
              "flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border",
              isPositiveTrend && "bg-emerald-50 text-emerald-600 border-emerald-100",
              isNegativeTrend && "bg-red-50 text-red-600 border-red-100",
              hasNoChange && "bg-slate-50 text-slate-400 border-slate-100"
            )}
          >
            {isPositiveTrend && (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            )}
            {isNegativeTrend && (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            <span>{Math.abs(trend)}{suffix === '%' ? '' : '%'}</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>

        {loading ? (
          <div className="h-10 bg-slate-100 rounded-xl w-3/4 animate-pulse"></div>
        ) : (
          <p className="text-4xl font-black text-slate-950 font-main tracking-tighter">
            {value}
            {suffix && <span className="text-xl font-bold text-slate-400 ml-1.5 italic">{suffix}</span>}
          </p>
        )}
      </div>

      {/* Decorative hover elements */}
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-br-2xl pointer-events-none" />
    </div>
  );
}
