import { z } from 'zod';

// Student validation
export const createStudentSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().optional(),
  idNumber: z.string().optional(),
  siteId: z.string().uuid('Invalid site ID'),
});

export const updateStudentSchema = createStudentSchema.partial();

// Site validation
export const createSiteSchema = z.object({
  name: z.string().min(1, 'Site name is required'),
  location: z.string().min(1, 'Location is required'),
  address: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).optional(),
});

export const updateSiteSchema = createSiteSchema.partial();

// Session validation
export const createSessionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  module: z.string().min(1, 'Module is required'),
  date: z.string().datetime('Invalid date format'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  siteId: z.string().uuid('Invalid site ID'),
  notes: z.string().optional(),
});

// Attendance validation
export const markAttendanceSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  sessionId: z.string().uuid('Invalid session ID'),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
  notes: z.string().optional(),
});

// Assessment validation
export const createAssessmentSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  unitStandard: z.string().min(1, 'Unit standard is required'),
  module: z.string().min(1, 'Module is required'),
  dueDate: z.string().datetime('Invalid date format'),
  notes: z.string().optional(),
});

export const updateAssessmentSchema = z.object({
  result: z.enum(['COMPETENT', 'NOT_YET_COMPETENT', 'PENDING']),
  assessedDate: z.string().datetime('Invalid date format').optional(),
  notes: z.string().optional(),
});

// Auth validation
export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'FACILITATOR', 'COORDINATOR']).optional(),
});
