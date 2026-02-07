/**
 * Attendance Calculator Utility
 * 
 * Centralized logic for calculating attendance rates and compliance status.
 * This ensures consistent attendance calculations across the application.
 * 
 * Used by:
 * - Students page (attendance percentage display)
 * - Compliance page (compliance rate calculations)
 * - Dashboard (attendance statistics)
 * - Reports generation
 */

import prisma from '@/lib/prisma';

// ============================================================================
// Types
// ============================================================================

export interface AttendanceStats {
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
    rate: number; // Percentage (0-100)
}

export type ComplianceStatus = 'COMPLIANT' | 'WARNING' | 'CRITICAL';

export interface StudentAttendanceSummary {
    studentId: string;
    stats: AttendanceStats;
    complianceStatus: ComplianceStatus;
}

export interface GroupAttendanceSummary {
    groupId: string;
    groupName: string;
    averageRate: number;
    totalStudents: number;
    studentSummaries: StudentAttendanceSummary[];
}

// ============================================================================
// Configuration
// ============================================================================

// Compliance thresholds (configurable)
export const COMPLIANCE_THRESHOLDS = {
    COMPLIANT: 80,    // >= 80% = Green/Compliant
    WARNING: 60,      // >= 60% and < 80% = Yellow/Warning
    // < 60% = Red/Critical
};

// ============================================================================
// Core Calculation Functions
// ============================================================================

/**
 * Calculate attendance rate from a list of attendance records
 */
export function calculateRateFromRecords(
    records: Array<{ status: string }>
): number {
    if (records.length === 0) return 0;

    const presentOrLate = records.filter(
        r => r.status === 'PRESENT' || r.status === 'LATE'
    ).length;

    return Math.round((presentOrLate / records.length) * 100);
}

/**
 * Get attendance statistics from records
 */
export function getStatsFromRecords(
    records: Array<{ status: string }>
): AttendanceStats {
    const stats: AttendanceStats = {
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        total: records.length,
        rate: 0,
    };

    for (const record of records) {
        switch (record.status) {
            case 'PRESENT':
                stats.present++;
                break;
            case 'ABSENT':
                stats.absent++;
                break;
            case 'LATE':
                stats.late++;
                break;
            case 'EXCUSED':
                stats.excused++;
                break;
        }
    }

    // Rate calculation: Present + Late counts as attended
    if (stats.total > 0) {
        stats.rate = Math.round(((stats.present + stats.late) / stats.total) * 100);
    }

    return stats;
}

/**
 * Determine compliance status based on attendance rate
 */
export function getComplianceStatus(rate: number): ComplianceStatus {
    if (rate >= COMPLIANCE_THRESHOLDS.COMPLIANT) {
        return 'COMPLIANT';
    } else if (rate >= COMPLIANCE_THRESHOLDS.WARNING) {
        return 'WARNING';
    }
    return 'CRITICAL';
}

/**
 * Get compliance status color class for UI
 */
export function getComplianceColor(status: ComplianceStatus): {
    bg: string;
    text: string;
    border: string;
} {
    switch (status) {
        case 'COMPLIANT':
            return {
                bg: 'bg-green-50',
                text: 'text-green-700',
                border: 'border-green-200',
            };
        case 'WARNING':
            return {
                bg: 'bg-yellow-50',
                text: 'text-yellow-700',
                border: 'border-yellow-200',
            };
        case 'CRITICAL':
            return {
                bg: 'bg-red-50',
                text: 'text-red-700',
                border: 'border-red-200',
            };
    }
}

// ============================================================================
// Database Query Functions (Server-side only)
// ============================================================================

/**
 * Calculate attendance rate for a specific student
 * @param studentId - The student's ID
 * @param startDate - Optional start date for the range
 * @param endDate - Optional end date for the range
 */
export async function calculateStudentAttendanceRate(
    studentId: string,
    startDate?: Date,
    endDate?: Date
): Promise<AttendanceStats> {
    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    const records = await prisma.attendance.findMany({
        where: {
            studentId,
            ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
        },
        select: { status: true },
    });

    return getStatsFromRecords(records);
}

/**
 * Calculate attendance rate for a group
 */
export async function calculateGroupAttendanceRate(
    groupId: string,
    startDate?: Date,
    endDate?: Date
): Promise<number> {
    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    // Get all students in the group
    const students = await prisma.student.findMany({
        where: { groupId, status: 'ACTIVE' },
        select: { id: true },
    });

    if (students.length === 0) return 0;

    // Get all attendance records for these students
    const records = await prisma.attendance.findMany({
        where: {
            studentId: { in: students.map(s => s.id) },
            ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
        },
        select: { status: true },
    });

    return calculateRateFromRecords(records);
}

/**
 * Get attendance summary for a group including all students
 */
export async function getGroupAttendanceSummary(
    groupId: string,
    startDate?: Date,
    endDate?: Date
): Promise<GroupAttendanceSummary> {
    const group = await prisma.group.findUnique({
        where: { id: groupId },
        select: { id: true, name: true },
    });

    if (!group) {
        throw new Error(`Group not found: ${groupId}`);
    }

    const students = await prisma.student.findMany({
        where: { groupId, status: 'ACTIVE' },
        select: { id: true },
    });

    const studentSummaries: StudentAttendanceSummary[] = [];
    let totalRate = 0;

    for (const student of students) {
        const stats = await calculateStudentAttendanceRate(
            student.id,
            startDate,
            endDate
        );
        const complianceStatus = getComplianceStatus(stats.rate);

        studentSummaries.push({
            studentId: student.id,
            stats,
            complianceStatus,
        });

        totalRate += stats.rate;
    }

    const averageRate = students.length > 0
        ? Math.round(totalRate / students.length)
        : 0;

    return {
        groupId: group.id,
        groupName: group.name,
        averageRate,
        totalStudents: students.length,
        studentSummaries,
    };
}

/**
 * Get attendance rates for multiple students in a single query (optimized)
 */
export async function getMultipleStudentAttendanceRates(
    studentIds: string[],
    startDate?: Date,
    endDate?: Date
): Promise<Map<string, AttendanceStats>> {
    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    // Get all attendance records for all students in one query
    const records = await prisma.attendance.findMany({
        where: {
            studentId: { in: studentIds },
            ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
        },
        select: {
            studentId: true,
            status: true
        },
    });

    // Group records by student
    const recordsByStudent = new Map<string, Array<{ status: string }>>();

    // Initialize all students with empty arrays
    for (const studentId of studentIds) {
        recordsByStudent.set(studentId, []);
    }

    // Populate with actual records
    for (const record of records) {
        const existing = recordsByStudent.get(record.studentId) || [];
        existing.push({ status: record.status });
        recordsByStudent.set(record.studentId, existing);
    }

    // Calculate stats for each student
    const statsMap = new Map<string, AttendanceStats>();
    for (const [studentId, studentRecords] of recordsByStudent) {
        statsMap.set(studentId, getStatsFromRecords(studentRecords));
    }

    return statsMap;
}
