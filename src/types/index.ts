// Core Type Definitions for YEHA System

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'FACILITATOR' | 'COORDINATOR';
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface Student {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    idNumber?: string;
    progress: number;
    status: 'ACTIVE' | 'AT_RISK' | 'COMPLETED' | 'WITHDRAWN';
    groupId: string;
    facilitatorId: string;
    group?: Group;
    facilitator?: User;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface Group {
    id: string;
    name: string;
    location?: string;
    address?: string;
    contactName?: string;
    contactPhone?: string;
    coordinator?: string;
    startDate: Date | string;
    endDate: Date | string;
    status: 'ACTIVE' | 'INACTIVE' | 'PLANNING' | 'COMPLETED' | 'ON_HOLD';
    notes?: string;
    companyId?: string;
    company?: Company;
    students?: Student[];
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface Company {
    id: string;
    name: string;
    address?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    industry?: string;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface Assessment {
    id: string;
    unitStandard: string;
    module: string;
    type: 'FORMATIVE' | 'SUMMATIVE' | 'INTEGRATED';
    method: 'KNOWLEDGE' | 'PRACTICAL' | 'OBSERVATION' | 'PORTFOLIO';
    result?: 'COMPETENT' | 'NOT_YET_COMPETENT' | 'PENDING';
    score?: number;
    assessedDate?: Date | string;
    dueDate: Date | string;
    notes?: string;
    feedback?: string;
    moderationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RESUBMIT';
    moderatedBy?: string;
    moderatedDate?: Date | string;
    moderationNotes?: string;
    attemptNumber: number;
    studentId: string;
    student?: Student;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface Attendance {
    id: string;
    date: Date | string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
    notes?: string;
    markedBy?: string;
    markedAt?: Date | string;
    qrCodeScan: boolean;
    studentId: string;
    sessionId?: string;
    groupId?: string;
    student?: Student;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface Module {
    id: string;
    code: string;
    name: string;
    description?: string;
    credits: number;
    order: number;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
    unitStandards?: UnitStandard[];
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface UnitStandard {
    id: string;
    code: string;
    title: string;
    credits: number;
    level: number;
    content?: string;
    moduleId: string;
    module?: Module;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface LessonPlan {
    id: string;
    title: string;
    description?: string;
    date: Date | string;
    startTime: string;
    endTime: string;
    venue?: string;
    objectives?: string;
    materials?: string;
    activities?: string;
    notes?: string;
    aiGenerated: boolean;
    moduleId: string;
    facilitatorId: string;
    groupId?: string;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface Session {
    id: string;
    title: string;
    module: string;
    date: Date | string;
    startTime: string;
    endTime: string;
    notes?: string;
    groupId: string;
    facilitatorId: string;
    group?: Group;
    facilitator?: User;
    createdAt: Date | string;
    updatedAt: Date | string;
}

// API Response Types
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}

// Dashboard Types
export interface DashboardStats {
    totalStudents: { value: number; trend: number };
    totalGroups: { value: number; trend: number };
    totalCompanies: { value: number; trend: number };
    attendanceRate: { value: number; trend: number };
    activeCourses: { value: number; trend: number };
    completionRate: { value: number; trend: number };
    pendingAssessments: { value: number; trend: number };
}

export interface Alert {
    id: string;
    type: 'ABSENCE' | 'LOW_ATTENDANCE' | 'CONSECUTIVE_ABSENCE' | 'PATTERN' | 'STUDENT_AT_RISK' | 'PENDING_ASSESSMENT';
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    message: string;
    details?: string;
    studentId?: string;
    student?: Student;
    resolved: boolean;
    createdAt: Date | string;
}

export interface Activity {
    id: string;
    type: 'ATTENDANCE' | 'ASSESSMENT' | 'MODULE_COMPLETION' | 'STUDENT_ADDED' | 'AI_GENERATED';
    title: string;
    description: string;
    timestamp: Date | string;
    icon?: string;
    color?: string;
}

// Form Types
export interface StudentFormData {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    idNumber?: string;
    groupId: string;
    facilitatorId?: string;
}

export interface GroupFormData {
    name: string;
    location?: string;
    address?: string;
    contactName?: string;
    contactPhone?: string;
    coordinator?: string;
    startDate: string;
    endDate: string;
    companyId?: string;
    companyName?: string;
    notes?: string;
}

export interface AttendanceRecord {
    studentId: string;
    groupId: string;
    date: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
    notes?: string;
}

// Search Types
export interface SearchResult {
    id: string;
    type: 'student' | 'group' | 'module' | 'assessment';
    title: string;
    subtitle?: string;
    metadata?: Record<string, any>;
}

// Moderation Types
export interface ModerationData {
    assessmentId: string;
    moderationStatus: 'APPROVED' | 'REJECTED' | 'RESUBMIT';
    moderatorId: string;
    moderationNotes?: string;
}
