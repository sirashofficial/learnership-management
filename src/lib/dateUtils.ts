/**
 * Date Handling Utility
 * Provides consistent date formatting and manipulation across the app
 */

import { format, parseISO, isValid, differenceInDays } from 'date-fns';

/**
 * Safe date parsing from multiple formats
 */
export function safeParseDate(value: any): Date | null {
  if (!value) return null;
  
  try {
    // If it's already a Date
    if (value instanceof Date) {
      return isValid(value) ? value : null;
    }
    
    // If it's a string
    if (typeof value === 'string') {
      const parsed = parseISO(value);
      return isValid(parsed) ? parsed : null;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Format date for API (ISO format)
 */
export function formatDateForApi(date: Date | string): string {
  const parsed = safeParseDate(date);
  if (!parsed) return '';
  return parsed.toISOString().split('T')[0];
}

/**
 * Format date for display
 */
export function formatDateForDisplay(date: Date | string, pattern = 'MMM dd, yyyy'): string {
  const parsed = safeParseDate(date);
  if (!parsed) return '';
  try {
    return format(parsed, pattern);
  } catch {
    return '';
  }
}

/**
 * Format date and time for display
 */
export function formatDateTimeForDisplay(date: Date | string, pattern = 'MMM dd, yyyy HH:mm'): string {
  const parsed = safeParseDate(date);
  if (!parsed) return '';
  try {
    return format(parsed, pattern);
  } catch {
    return '';
  }
}

/**
 * Get days remaining until deadline
 */
export function getDaysRemaining(deadline: Date | string): number | null {
  const parsed = safeParseDate(deadline);
  if (!parsed) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const deadlineDate = new Date(parsed);
  deadlineDate.setHours(0, 0, 0, 0);
  
  return differenceInDays(deadlineDate, today);
}

/**
 * Check if date is overdue
 */
export function isOverdue(deadline: Date | string): boolean {
  const daysRemaining = getDaysRemaining(deadline);
  return daysRemaining !== null && daysRemaining < 0;
}

/**
 * Check if date is within X days
 */
export function isWithinDays(deadline: Date | string, days: number): boolean {
  const daysRemaining = getDaysRemaining(deadline);
  return daysRemaining !== null && daysRemaining <= days && daysRemaining >= 0;
}

/**
 * Get relative time description (e.g., "2 days from now", "3 days ago")
 */
export function getRelativeTime(date: Date | string): string {
  const daysRemaining = getDaysRemaining(date);
  
  if (daysRemaining === null) return 'Invalid date';
  
  if (daysRemaining === 0) return 'Today';
  if (daysRemaining === 1) return 'Tomorrow';
  if (daysRemaining === -1) return 'Yesterday';
  
  if (daysRemaining > 0) {
    return `In ${daysRemaining} days`;
  } else {
    return `${Math.abs(daysRemaining)} days ago`;
  }
}

/**
 * Format date range for display
 */
export function formatDateRange(startDate: Date | string, endDate: Date | string): string {
  const start = safeParseDate(startDate);
  const end = safeParseDate(endDate);
  
  if (!start || !end) return '';
  
  return `${formatDateForDisplay(start)} to ${formatDateForDisplay(end)}`;
}
