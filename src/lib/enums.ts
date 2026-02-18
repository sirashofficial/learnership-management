/**
 * Application-wide Enums for Type Safety
 * Single source of truth for constants across all pages
 */

/**
 * Group Status enum
 * Prevents typos and provides IDE autocomplete
 */
export enum GroupStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PLANNING = 'PLANNING',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Attendance Status enum
 */
export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  LATE = 'LATE',
  ABSENT = 'ABSENT',
  EXCUSED = 'EXCUSED',
  NOT_MARKED = 'NOT_MARKED',
}

/**
 * Assessment Result enum
 */
export enum AssessmentResult {
  COMPETENT = 'COMPETENT',
  NOT_YET_COMPETENT = 'NOT_YET_COMPETENT',
  PENDING = 'PENDING',
}

/**
 * Assessment Type enum
 */
export enum AssessmentType {
  FORMATIVE = 'FORMATIVE',
  SUMMATIVE = 'SUMMATIVE',
  WORKPLACE = 'WORKPLACE',
  INTEGRATED = 'INTEGRATED',
}

/**
 * Progress Status enum
 * Used in groups page for plan/progress status
 */
export enum ProgressStatus {
  NO_PLAN = 'NO_PLAN',
  NOT_STARTED = 'NOT_STARTED',
  ON_TRACK = 'ON_TRACK',
  BEHIND = 'BEHIND',
  AT_RISK = 'AT_RISK',
  COMPLETE = 'COMPLETE',
}

/**
 * Moderation Status enum
 */
export enum ModerationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REVIEWED = 'REVIEWED',
}

/**
 * View type for pages with multiple views
 */
export enum ViewMode {
  GRID = 'grid',
  LIST = 'list',
}

/**
 * Toast notification types
 */
export enum ToastType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/**
 * API response status codes
 */
export enum ApiStatus {
  SUCCESS = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  SERVER_ERROR = 500,
}

/**
 * Helper to check if status is valid
 */
export function isValidGroupStatus(status: any): status is GroupStatus {
  return Object.values(GroupStatus).includes(status);
}

export function isValidAttendanceStatus(status: any): status is AttendanceStatus {
  return Object.values(AttendanceStatus).includes(status);
}

export function isValidProgressStatus(status: any): status is ProgressStatus {
  return Object.values(ProgressStatus).includes(status);
}
