/**
 * Theme and Styling Utilities
 * Centralized colors and styling to avoid hardcoding throughout components
 */

/**
 * Color palette
 * Ensures consistent colors across the app
 */
export const colors = {
  // Primary colors
  primary: {
    light: '#e0f2fe',
    main: '#0ea5e9',
    dark: '#0369a1',
  },
  // Secondary colors
  secondary: {
    light: '#f0f4f8',
    main: '#64748b',
    dark: '#334155',
  },
  // Status colors
  success: {
    light: '#dcfce7',
    main: '#22c55e',
    dark: '#15803d',
  },
  warning: {
    light: '#fef3c7',
    main: '#f59e0b',
    dark: '#b45309',
  },
  error: {
    light: '#fee2e2',
    main: '#ef4444',
    dark: '#b91c1c',
  },
  info: {
    light: '#cffafe',
    main: '#06b6d4',
    dark: '#0369a1',
  },
  // Special status colors
  onTrack: {
    light: '#dcfce7',
    main: '#10b981',
    dark: '#059669',
  },
  atRisk: {
    light: '#fee2e2',
    main: '#ef4444',
    dark: '#dc2626',
  },
  behind: {
    light: '#fef3c7',
    main: '#eab308',
    dark: '#ca8a04',
  },
} as const;

/**
 * Status color mapping
 * Returns color config for a given status
 */
export function getStatusColor(status: string): { light: string; main: string; dark: string } {
  switch (status) {
    case 'ON_TRACK':
    case 'COMPETENT':
    case 'PRESENT':
      return colors.onTrack;
    case 'AT_RISK':
    case 'NOT_YET_COMPETENT':
    case 'ABSENT':
      return colors.atRisk;
    case 'BEHIND':
    case 'LATE':
      return colors.behind;
    default:
      return colors.secondary;
  }
}

/**
 * Status badge className mapping
 * Returns Tailwind classes for status badge
 */
export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'ON_TRACK':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'AT_RISK':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'BEHIND':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'NOT_STARTED':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'COMPLETE':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'NO_PLAN':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}

/**
 * Icon color class for status
 * Returns TW color class for icons
 */
export function getStatusIconColor(status: string): string {
  switch (status) {
    case 'ON_TRACK':
    case 'COMPETENT':
      return 'text-emerald-600';
    case 'AT_RISK':
    case 'NOT_YET_COMPETENT':
      return 'text-red-600';
    case 'BEHIND':
      return 'text-amber-600';
    case 'COMPLETE':
      return 'text-teal-600';
    default:
      return 'text-slate-600';
  }
}

/**
 * Background color for status
 * Returns TW background color class
 */
export function getStatusBgColor(status: string): string {
  switch (status) {
    case 'ON_TRACK':
      return 'bg-emerald-100';
    case 'AT_RISK':
      return 'bg-red-100';
    case 'BEHIND':
      return 'bg-amber-100';
    case 'COMPLETE':
      return 'bg-teal-100';
    default:
      return 'bg-slate-100';
  }
}

/**
 * Common spacing values
 */
export const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem',  // 8px
  md: '1rem',    // 16px
  lg: '1.5rem',  // 24px
  xl: '2rem',    // 32px
  '2xl': '3rem', // 48px
} as const;

/**
 * Common breakpoints
 */
export const breakpoints = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
  ultraWide: 1536,
} as const;

/**
 * Shadow definitions
 */
export const shadows = {
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
} as const;

/**
 * Convert status enum to display label
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ON_TRACK: 'On Track',
    AT_RISK: 'At Risk',
    BEHIND: 'Behind',
    NOT_STARTED: 'Not Started',
    COMPLETE: 'Complete',
    NO_PLAN: 'No Plan',
    PRESENT: 'Present',
    ABSENT: 'Absent',
    LATE: 'Late',
    EXCUSED: 'Excused',
    COMPETENT: 'Competent',
    NOT_YET_COMPETENT: 'Not Yet Competent',
    PENDING: 'Pending',
  };
  return labels[status] || status;
}
