import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';

// GET /api/attendance/policies - Get attendance policies
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const policies = await prisma.attendancePolicy.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(policies);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/attendance/policies - Create or update policy
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      description,
      minimumPercentage,
      consecutiveAbsences,
      warningThreshold,
      criticalThreshold,
      notifyOnAbsence,
      notifyOnWarning,
      notifyOnCritical,
      isActive,
    } = body;

    if (!name) {
      return errorResponse('Policy name is required', 400);
    }

    // Deactivate other policies if this one is being activated
    if (isActive) {
      await prisma.attendancePolicy.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    const policy = id
      ? await prisma.attendancePolicy.update({
          where: { id },
          data: {
            name,
            description,
            minimumPercentage: minimumPercentage ?? 80,
            consecutiveAbsences: consecutiveAbsences ?? 3,
            warningThreshold: warningThreshold ?? 75,
            criticalThreshold: criticalThreshold ?? 60,
            notifyOnAbsence: notifyOnAbsence ?? true,
            notifyOnWarning: notifyOnWarning ?? true,
            notifyOnCritical: notifyOnCritical ?? true,
            isActive: isActive ?? true,
          },
        })
      : await prisma.attendancePolicy.create({
          data: {
            name,
            description,
            minimumPercentage: minimumPercentage ?? 80,
            consecutiveAbsences: consecutiveAbsences ?? 3,
            warningThreshold: warningThreshold ?? 75,
            criticalThreshold: criticalThreshold ?? 60,
            notifyOnAbsence: notifyOnAbsence ?? true,
            notifyOnWarning: notifyOnWarning ?? true,
            notifyOnCritical: notifyOnCritical ?? true,
            isActive: isActive ?? true,
          },
        });

    return successResponse(policy, id ? 'Policy updated successfully' : 'Policy created successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
