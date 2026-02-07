/**
 * API Route: Get attendance rates for multiple students
 * 
 * GET /api/attendance/rates?studentIds=id1,id2,id3
 * 
 * Returns attendance statistics for each student in a single optimized query.
 */

import { NextRequest } from 'next/server';
import { successResponse, handleApiError } from '@/lib/api-utils';
import {
    getMultipleStudentAttendanceRates,
    getComplianceStatus,
    AttendanceStats
} from '@/lib/attendance-calculator';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const studentIdsParam = searchParams.get('studentIds');
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        if (!studentIdsParam) {
            return successResponse({});
        }

        const studentIds = studentIdsParam.split(',').filter(id => id.trim());

        if (studentIds.length === 0) {
            return successResponse({});
        }

        // Parse optional date filters
        const startDate = startDateParam ? new Date(startDateParam) : undefined;
        const endDate = endDateParam ? new Date(endDateParam) : undefined;

        // Get attendance rates for all students in one optimized query
        const statsMap = await getMultipleStudentAttendanceRates(
            studentIds,
            startDate,
            endDate
        );

        // Convert Map to object for JSON serialization
        const result: Record<string, AttendanceStats & { complianceStatus: string }> = {};

        for (const [studentId, stats] of statsMap) {
            result[studentId] = {
                ...stats,
                complianceStatus: getComplianceStatus(stats.rate),
            };
        }

        return successResponse(result);
    } catch (error) {
        return handleApiError(error);
    }
}
