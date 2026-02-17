import { z } from 'zod';

/**
 * ============================================================================
 * CUSTOM VALIDATORS
 * ============================================================================
 */

const passwordValidator = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const emailValidator = z.string()
  .email('Invalid email address')
  .toLowerCase()
  .refine(
    email => !email.endsWith('.local'),
    'Local domain emails are not allowed'
  );

const phoneValidator = z.string()
  .regex(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, 'Invalid phone number format')
  .optional()
  .or(z.literal(''));

const uuidValidator = z.string().uuid('Invalid ID format');

/**
 * ============================================================================
 * AUTH SCHEMAS
 * ============================================================================
 */

export const loginSchema = z.object({
  email: emailValidator,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: emailValidator,
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  password: passwordValidator,
  role: z.enum(['ADMIN', 'FACILITATOR', 'COORDINATOR']).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordValidator,
  confirmPassword: z.string(),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

/**
 * ============================================================================
 * STUDENT SCHEMAS
 * ============================================================================
 */

export const createStudentSchema = z.object({
  studentId: z.string()
    .min(1, 'Student ID is required')
    .max(50, 'Student ID must not exceed 50 characters')
    .optional(),
  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must not exceed 100 characters'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must not exceed 100 characters'),
  email: z.preprocess(
    (val) => (val === '' || val === undefined ? null : val),
    emailValidator.nullable().optional()
  ),
  phone: z.preprocess(
    (val) => (val === '' || val === undefined ? null : val),
    phoneValidator.nullable().optional()
  ),
  idNumber: z.preprocess(
    (val) => (val === '' || val === undefined ? null : val),
    z.string()
      .max(50, 'ID number must not exceed 50 characters')
      .nullable()
      .optional()
  ),
  groupId: uuidValidator,
  facilitatorId: z.preprocess(
    (val) => (val === '' || val === undefined ? null : val),
    uuidValidator.nullable().optional()
  ),
  status: z.enum(['ACTIVE', 'AT_RISK', 'COMPLETED', 'WITHDRAWN', 'ARCHIVED']).default('ACTIVE'),
  progress: z.number().min(0).max(100).optional(),
  totalCreditsEarned: z.number().min(0).optional(),
});

export const updateStudentSchema = createStudentSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be updated'
);

/**
 * ============================================================================
 * GROUP SCHEMAS
 * ============================================================================
 */

export const createGroupSchema = z.object({
  name: z.string()
    .min(1, 'Group name is required')
    .max(100, 'Group name must not exceed 100 characters'),
  description: z.string()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'COMPLETED', 'ARCHIVED']).default('ACTIVE'),
  startDate: z.string().datetime('Invalid start date format').optional(),
  endDate: z.string().datetime('Invalid end date format').optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) < new Date(data.endDate);
    }
    return true;
  },
  { message: 'End date must be after start date', path: ['endDate'] }
);

export const updateGroupSchema = z.object({
  name: z.string()
    .min(1, 'Group name is required')
    .max(100, 'Group name must not exceed 100 characters')
    .optional(),
  description: z.string()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  startDate: z.string().datetime('Invalid start date format').optional(),
  endDate: z.string().datetime('Invalid end date format').optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) < new Date(data.endDate);
    }
    return true;
  },
  { message: 'End date must be after start date', path: ['endDate'] }
);

/**
 * ============================================================================
 * SESSION & TIMETABLE SCHEMAS
 * ============================================================================
 */

export const createSessionSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must not exceed 200 characters'),
  module: z.string().min(1, 'Module is required'),
  date: z.string().datetime('Invalid date format'),
  startTime: z.string()
    .regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format'),
  endTime: z.string()
    .regex(/^\d{2}:\d{2}$/, 'End time must be in HH:MM format'),
  groupId: uuidValidator,
  notes: z.string().max(1000, 'Notes must not exceed 1000 characters').optional(),
  venue: z.string().max(200, 'Venue must not exceed 200 characters').optional(),
}).refine(
  (data) => data.startTime < data.endTime,
  { message: 'End time must be after start time', path: ['endTime'] }
);

export const updateSessionSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must not exceed 200 characters')
    .optional(),
  module: z.string().min(1, 'Module is required').optional(),
  date: z.string().datetime('Invalid date format').optional(),
  startTime: z.string()
    .regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format')
    .optional(),
  endTime: z.string()
    .regex(/^\d{2}:\d{2}$/, 'End time must be in HH:MM format')
    .optional(),
  groupId: uuidValidator.optional(),
  notes: z.string().max(1000, 'Notes must not exceed 1000 characters').optional(),
  venue: z.string().max(200, 'Venue must not exceed 200 characters').optional(),
}).refine(
  (data) => {
    if (data.startTime && data.endTime) {
      return data.startTime < data.endTime;
    }
    return true;
  },
  { message: 'End time must be after start time', path: ['endTime'] }
);

/**
 * ============================================================================
 * ATTENDANCE SCHEMAS
 * ============================================================================
 */

export const markAttendanceSchema = z.object({
  studentId: uuidValidator,
  sessionId: uuidValidator,
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
  notes: z.string().max(500, 'Notes must not exceed 500 characters').optional(),
  markedAt: z.string().datetime('Invalid date format').optional(),
});

export const bulkMarkAttendanceSchema = z.object({
  records: z.array(markAttendanceSchema)
    .min(1, 'At least one attendance record is required')
    .max(500, 'Cannot process more than 500 records at once'),
});

/**
 * ============================================================================
 * ASSESSMENT SCHEMAS
 * ============================================================================
 */

export const createAssessmentSchema = z.object({
  studentId: uuidValidator,
  unitStandardId: z.string().min(1, 'Unit standard is required'),
  type: z.enum(['FORMATIVE', 'SUMMATIVE', 'WORKPLACE', 'INTEGRATED']),
  method: z.enum(['KNOWLEDGE', 'PRACTICAL', 'OBSERVATION', 'PORTFOLIO']),
  dueDate: z.string().datetime('Invalid date format'),
  notes: z.string().max(1000, 'Notes must not exceed 1000 characters').optional(),
  result: z.enum(['PENDING', 'COMPETENT', 'NOT_YET_COMPETENT']).optional(),
  score: z.number().min(0).max(100).optional(),
  feedback: z.string().max(2000, 'Feedback must not exceed 2000 characters').optional(),
});

export const updateAssessmentSchema = z.object({
  result: z.enum(['COMPETENT', 'NOT_YET_COMPETENT', 'PENDING']),
  score: z.number().min(0).max(100).optional(),
  feedback: z.string().max(2000, 'Feedback must not exceed 2000 characters').optional(),
  assessedDate: z.string().datetime('Invalid date format').optional(),
  notes: z.string().max(1000, 'Notes must not exceed 1000 characters').optional(),
});

/**
 * ============================================================================
 * MODULE & CURRICULUM SCHEMAS
 * ============================================================================
 */

export const createModuleSchema = z.object({
  code: z.string()
    .min(1, 'Module code is required')
    .max(50, 'Module code must not exceed 50 characters')
    .toUpperCase(),
  name: z.string()
    .min(1, 'Module name is required')
    .max(100, 'Module name must not exceed 100 characters'),
  description: z.string().max(500, 'Description must not exceed 500 characters').optional(),
  credits: z.number().min(0).max(999),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).default('ACTIVE'),
});

export const updateModuleSchema = createModuleSchema.partial();

/**
 * ============================================================================
 * QUERY PARAMETER SCHEMAS
 * ============================================================================
 */

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive('Page must be a positive number').default(1),
  pageSize: z.coerce.number().int().min(1).max(100, 'Page size cannot exceed 100').default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const filterSchema = z.object({
  search: z.string().max(100, 'Search term must not exceed 100 characters').optional(),
  status: z.string().optional(),
  groupId: uuidValidator.optional(),
  studentId: uuidValidator.optional(),
  dateFrom: z.string().datetime('Invalid date format').optional(),
  dateTo: z.string().datetime('Invalid date format').optional(),
});

/**
 * ============================================================================
 * REQUEST BODY SIZE LIMITS
 * ============================================================================
 */

export const contentLengthValidator = (maxBytes: number) => {
  return (contentLength: number) => {
    if (contentLength > maxBytes) {
      throw new Error(`Request body exceeds maximum size of ${maxBytes / 1024}KB`);
    }
  };
};

