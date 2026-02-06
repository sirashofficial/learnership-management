'use client';

import { LucideIcon } from 'lucide-react';

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
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 
        transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-105' : ''}
        ${loading ? 'animate-pulse' : ''}
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
          <Icon className="w-6 h-6 text-blue-600 dark:text-blue-300" />
        </div>
        {trend !== undefined && !loading && (
          <div
            className={`
              flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full
              ${isPositiveTrend ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : ''}
              ${isNegativeTrend ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : ''}
              ${hasNoChange ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' : ''}
            `}
          >
            {isPositiveTrend && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            )}
            {isNegativeTrend && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            {hasNoChange && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
              </svg>
            )}
            <span>{Math.abs(trend)}{suffix === '%' ? '' : '%'}</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{title}</p>
        {loading ? (
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        ) : (
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {value}
            {suffix && <span className="text-xl ml-1">{suffix}</span>}
          </p>
        )}
      </div>

      {onClick && !loading && (
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Click for details
        </div>
      )}
    </div>
  );
}
