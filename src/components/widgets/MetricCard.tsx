'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  status?: 'good' | 'warning' | 'critical';
  icon?: React.ReactNode;
  color?: 'emerald' | 'amber' | 'red' | 'blue';
  onClick?: () => void;
}

/**
 * Metric Card Widget
 * Displays a key metric with optional trend and status indicator
 */
export default function MetricCard({
  label,
  value,
  unit = '',
  trend,
  trendValue,
  status = 'good',
  icon,
  color = 'emerald',
  onClick
}: MetricCardProps) {
  const colorMap = {
    emerald: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    red: 'text-red-600 bg-red-50',
    blue: 'text-blue-600 bg-blue-50'
  };

  const statusMap = {
    good: 'emerald',
    warning: 'amber',
    critical: 'red'
  };

  const displayColor = status ? statusMap[status] : color;

  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-lg border transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md' : ''
      } ${
        displayColor === 'emerald'
          ? 'bg-emerald-50 border-emerald-200'
          : displayColor === 'amber'
          ? 'bg-amber-50 border-amber-200'
          : displayColor === 'red'
          ? 'bg-red-50 border-red-200'
          : 'bg-blue-50 border-blue-200'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-bold ${
                displayColor === 'emerald'
                  ? 'text-emerald-700'
                  : displayColor === 'amber'
                  ? 'text-amber-700'
                  : displayColor === 'red'
                  ? 'text-red-700'
                  : 'text-blue-700'
              }`}
            >
              {value}
            </span>
            {unit && (
              <span className="text-sm text-slate-600 font-medium">{unit}</span>
            )}
          </div>
        </div>

        {icon && (
          <div
            className={`p-3 rounded-lg flex items-center justify-center ${
              displayColor === 'emerald'
                ? 'bg-emerald-100 text-emerald-600'
                : displayColor === 'amber'
                ? 'bg-amber-100 text-amber-600'
                : displayColor === 'red'
                ? 'bg-red-100 text-red-600'
                : 'bg-blue-100 text-blue-600'
            }`}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Trend Indicator */}
      {trend && (
        <div className="flex items-center gap-2 pt-4 border-t border-slate-200 border-opacity-50">
          {trend === 'up' && (
            <>
              <TrendingUp className={`w-4 h-4 text-emerald-600`} />
              <span className="text-sm font-medium text-emerald-600">
                +{trendValue}% from last month
              </span>
            </>
          )}
          {trend === 'down' && (
            <>
              <TrendingDown className={`w-4 h-4 text-red-600`} />
              <span className="text-sm font-medium text-red-600">
                -{trendValue}% from last month
              </span>
            </>
          )}
          {trend === 'stable' && (
            <>
              <Minus className={`w-4 h-4 text-slate-600`} />
              <span className="text-sm font-medium text-slate-600">
                Stable
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
