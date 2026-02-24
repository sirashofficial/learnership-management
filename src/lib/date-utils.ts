/**
 * Date Utility Functions
 * Centralized date formatting and manipulation utilities
 */

import { format, formatDistanceToNow, isValid, parseISO, startOfDay, endOfDay } from 'date-fns';

/**
 * Standard date format (YYYY-MM-DD)
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid Date';
  return format(d, 'yyyy-MM-dd');
}

/**
 * Date + time format (YYYY-MM-DD HH:mm)
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid Date';
  return format(d, 'yyyy-MM-dd HH:mm');
}

/**
 * Full date + time with seconds (YYYY-MM-DD HH:mm:ss)
 */
export function formatDateTimeFull(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid Date';
  return format(d, 'yyyy-MM-dd HH:mm:ss');
}

/**
 * Human-readable date (e.g., "Jan 15, 2026")
 */
export function formatDateHuman(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid Date';
  return format(d, 'MMM d, yyyy');
}

/**
 * Relative time (e.g., "2 days ago", "in 3 hours")
 */
export function formatRelativeDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid Date';
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Check if a date is valid
 */
export function isDateValid(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d);
}

/**
 * Parse date string safely, returns null if invalid
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  const parsed = parseISO(dateString);
  return isValid(parsed) ? parsed : null;
}

/**
 * Check if date1 is before date2
 */
export function isBefore(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return d1 < d2;
}

/**
 * Check if date1 is after date2
 */
export function isAfter(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return d1 > d2;
}

/**
 * Get start of day (00:00:00)
 */
export function getStartOfDay(date: Date | string): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return startOfDay(d);
}

/**
 * Get end of day (23:59:59)
 */
export function getEndOfDay(date: Date | string): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return endOfDay(d);
}

/**
 * Format date range
 */
export function formatDateRange(
  startDate: Date | string | null,
  endDate: Date | string | null
): string {
  if (!startDate && !endDate) return '—';
  if (!startDate) return `Until ${formatDate(endDate)}`;
  if (!endDate) return `From ${formatDate(startDate)}`;
  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

/**
 * Calculate days between two dates
 */
export function daysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days < 30) return `${Math.floor(days / 7)} weeks`;
  if (days < 365) return `${Math.floor(days / 30)} months`;
  return `${Math.floor(days / 365)} years`;
}
