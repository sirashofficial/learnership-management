import { z } from 'zod';

// ============================================
// STUDENT VALIDATION SCHEMAS
// ============================================

export const createStudentSchema = z.object({
    firstName: z.string().min(1, 'First name is required').max(100),
    lastName: z.string().min(1, 'Last name is required').max(100),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().max(20).optional().or(z.literal('')),
    idNumber: z.string().max(20).optional().or(z.literal('')),
    groupId: z.string().uuid('Invalid group ID'),
    facilitatorId: z.string().uuid('Invalid facilitator ID').optional(),
    progress: z.number().min(0).max(100).default(0),
    status: z.enum(['ACTIVE', 'AT_RISK', 'COMPLETED', 'WITHDRAWN']).default('ACTIVE'),
});

export const updateStudentSchema = createStudentSchema.partial().extend({
    id: z.string().uuid(),
});

// ============================================
// ATTENDANCE VALIDATION SCHEMAS
// ============================================

export const attendanceRecordSchema = z.object({
    studentId: z.string().uuid('Invalid student ID'),
    groupId: z.string().uuid('Invalid group ID').nullable(),
    sessionId: z.string().uuid('Invalid session ID').optional(),
    date: z.string().datetime().or(z.date()),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
    notes: z.string().max(500).optional().nullable(),
    markedBy: z.string().uuid().optional(),
    qrCodeScan: z.boolean().default(false),
});

export const bulkAttendanceSchema = z.object({
    records: z.array(attendanceRecordSchema).min(1, 'At least one attendance record required'),
});

// ============================================
// ASSESSMENT VALIDATION SCHEMAS
// ============================================

export const createAssessmentSchema = z.object({
    studentId: z.string().uuid('Invalid student ID'),
    unitStandard: z.string().min(1, 'Unit standard is required'),
    module: z.string().min(1, 'Module is required'),
    type: z.enum(['FORMATIVE', 'SUMMATIVE', 'INTEGRATED']),
    method: z.enum(['KNOWLEDGE', 'PRACTICAL', 'OBSERVATION', 'PORTFOLIO']),
    result: z.enum(['COMPETENT', 'NOT_YET_COMPETENT', 'PENDING']).optional(),
    score: z.number().min(0).max(100).optional(),
    assessedDate: z.string().datetime().or(z.date()).optional(),
    dueDate: z.string().datetime().or(z.date()),
    notes: z.string().max(1000).optional(),
    feedback: z.string().max(1000).optional(),
    attemptNumber: z.number().min(1).default(1),
});

export const updateAssessmentSchema = createAssessmentSchema.partial().extend({
    id: z.string().uuid(),
});

export const moderateAssessmentSchema = z.object({
    assessmentId: z.string().uuid('Invalid assessment ID'),
    moderationStatus: z.enum(['APPROVED', 'REJECTED', 'RESUBMIT']),
    moderatorId: z.string().uuid('Invalid moderator ID'),
    moderationNotes: z.string().max(1000).optional(),
});

// ============================================
// GROUP VALIDATION SCHEMAS
// ============================================

const baseGroupSchema = z.object({
    name: z.string().min(1, 'Group name is required').max(200),
    location: z.string().max(200).optional(),
    address: z.string().max(500).optional(),
    contactName: z.string().max(100).optional(),
    contactPhone: z.string().max(20).optional(),
    coordinator: z.string().max(100).optional(),
    startDate: z.string().datetime().or(z.date()),
    endDate: z.string().datetime().or(z.date()),
    status: z.enum(['ACTIVE', 'INACTIVE', 'PLANNING', 'COMPLETED', 'ON_HOLD']).default('ACTIVE'),
    notes: z.string().max(1000).optional(),
    companyId: z.string().uuid().optional(),
});

export const createGroupSchema = baseGroupSchema.refine(
    (data) => new Date(data.endDate) > new Date(data.startDate),
    { message: 'End date must be after start date', path: ['endDate'] }
);

export const updateGroupSchema = baseGroupSchema.partial().extend({
    id: z.string().uuid(),
});

// ============================================
// COMPANY VALIDATION SCHEMAS
// ============================================

export const createCompanySchema = z.object({
    name: z.string().min(1, 'Company name is required').max(200),
    address: z.string().max(500).optional(),
    contactPerson: z.string().max(100).optional(),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().max(20).optional(),
    industry: z.string().max(100).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const updateCompanySchema = createCompanySchema.partial().extend({
    id: z.string().uuid(),
});

// ============================================
// LESSON PLAN VALIDATION SCHEMAS
// ============================================

export const createLessonPlanSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().max(1000).optional(),
    date: z.string().datetime().or(z.date()),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    venue: z.string().max(200).optional(),
    objectives: z.string().max(2000).optional(),
    materials: z.string().max(2000).optional(),
    activities: z.string().max(5000).optional(),
    notes: z.string().max(2000).optional(),
    moduleId: z.string().uuid('Invalid module ID'),
    facilitatorId: z.string().uuid('Invalid facilitator ID'),
    groupId: z.string().uuid('Invalid group ID').optional(),
    aiGenerated: z.boolean().default(false),
});

// ============================================
// USER/AUTH VALIDATION SCHEMAS
// ============================================

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    name: z.string().min(1, 'Name is required').max(100),
    password: z.string().min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    role: z.enum(['ADMIN', 'FACILITATOR', 'COORDINATOR']).default('FACILITATOR'),
});

// ============================================
// QUERY PARAMETER VALIDATION
// ============================================

export const paginationSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const dateRangeSchema = z.object({
    startDate: z.string().datetime().or(z.date()),
    endDate: z.string().datetime().or(z.date()),
}).refine(
    (data) => new Date(data.endDate) >= new Date(data.startDate),
    { message: 'End date must be after or equal to start date' }
);

export const searchSchema = z.object({
    query: z.string().min(1, 'Search query is required').max(200),
    type: z.enum(['student', 'group', 'module', 'assessment']).optional(),
    limit: z.coerce.number().min(1).max(50).default(10),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validates data against a schema and returns typed result
 * Throws ZodError if validation fails
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
    return schema.parse(data);
}

/**
 * Safely validates data and returns result with error handling
 */
export function safeValidateData<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return { success: false, errors: result.error };
}

/**
 * Formats Zod errors for API responses
 */
export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
    const formatted: Record<string, string[]> = {};
    error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!formatted[path]) {
            formatted[path] = [];
        }
        formatted[path].push(err.message);
    });
    return formatted;
}
