/**
 * Standardized Date Ranges for Attendance
 * 
 * Ensures consistent date ranges across all pages and components.
 * Prevents the issue where different pages show different attendance %
 * because they use different date ranges.
 */

import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';

export interface DateRange {
  startDate: string;
  endDate: string;
}

/**
 * Standard attendance date ranges
 * All dates in 'yyyy-MM-dd' format for consistency with API
 */
export const ATTENDANCE_DATE_RANGES = {
  /**
   * Today only - for daily attendance marking
   */
  today: (): DateRange => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return {
      startDate: today,
      endDate: today,
    };
  },

  /**
   * This week (Monday - Sunday) - for weekly reports
   */
  thisWeek: (): DateRange => ({
    startDate: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    endDate: format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
  }),

  /**
   * This month - for monthly reports and group stats
   */
  thisMonth: (): DateRange => ({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  }),

  /**
   * Last 30 days - for trend analysis
   */
  last30Days: (): DateRange => ({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  }),

  /**
   * Custom range - for specific date filtering
   */
  custom: (startDate: Date, endDate: Date): DateRange => ({
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd'),
  }),
};

/**
 * Helper to build attendance stats URL with consistent date format
 */
export function buildAttendanceStatsUrl(params: {
  groupId?: string;
  studentId?: string;
  range?: 'today' | 'thisWeek' | 'thisMonth' | 'last30Days';
  customRange?: DateRange;
}): string {
  const { groupId, studentId, range = 'thisMonth', customRange } = params;
  
  const dateRange = customRange || ATTENDANCE_DATE_RANGES[range]();
  
  const searchParams = new URLSearchParams();
  if (groupId) searchParams.append('groupId', groupId);
  if (studentId) searchParams.append('studentId', studentId);
  searchParams.append('startDate', dateRange.startDate);
  searchParams.append('endDate', dateRange.endDate);
  
  return `/api/attendance/stats?${searchParams.toString()}`;
}
