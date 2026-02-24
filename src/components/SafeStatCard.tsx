'use client';

import { LucideIcon } from 'lucide-react';
import StatCard from '@/components/StatCard';

interface SafeStatCardProps {
  title: string;
  value: any;
  trend?: number;
  icon: LucideIcon;
  suffix?: string;
  onClick?: () => void;
  loading?: boolean;
}

/**
 * Wrapper around StatCard that ensures value is always a primitive
 * and logs any attempt to pass objects
 */
export default function SafeStatCard({
  title,
  value,
  trend,
  icon,
  suffix,
  onClick,
  loading,
}: SafeStatCardProps) {
  // Enforce value is a primitive
  let safeValue: number | string = 0;
  
  if (typeof value === 'number' || typeof value === 'string') {
    safeValue = value;
  } else if (value === null || value === undefined) {
    safeValue = 0;
  } else {
    // Log if someone tries to pass an object
    console.warn(`⚠️ SafeStatCard: Non-primitive value passed for "${title}":`, value, 'Type:', typeof value);
    safeValue = '[ERROR]';
  }

  // Sanitize trend
  const safeTrend = typeof trend === 'number' ? trend : undefined;

  return (
    <StatCard
      title={title}
      value={safeValue}
      trend={safeTrend}
      icon={icon}
      suffix={suffix}
      onClick={onClick}
      loading={loading}
    />
  );
}
