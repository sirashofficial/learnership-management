import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const groupId = searchParams.get('groupId');

    if (!studentId && !groupId) {
      return successResponse([]);
    }

    const where: any = studentId ? { studentId } : { student: { groupId } };

    const [moduleProgress, unitStandardProgress] = await Promise.all([
      prisma.moduleProgress.findMany({
        where,
        include: {
          module: {
            include: {
              unitStandards: true,
            },
          },
          student: {
            include: { group: true },
          },
        },
        orderBy: { module: { order: 'asc' } },
      }),

      prisma.unitStandardProgress.findMany({
        where,
        include: {
          unitStandard: {
            include: { module: true },
          },
          student: true,
        },
      }),
    ]);

    return successResponse({
      moduleProgress,
      unitStandardProgress,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, moduleId, unitStandardId, status, completionDate } = body;

    if (!studentId) {
      return errorResponse('studentId required', 400);
    }

    if (moduleId) {
      // Update module progress
      const progress = await prisma.moduleProgress.upsert({
        where: {
          studentId_moduleId: { studentId, moduleId },
        },
        update: {
          status,
          completionDate: completionDate ? new Date(completionDate) : null,
          startDate: status === 'IN_PROGRESS' && !completionDate ? new Date() : undefined,
        },
        create: {
          studentId,
          moduleId,
          status,
          startDate: new Date(),
          completionDate: completionDate ? new Date(completionDate) : null,
        },
        include: {
          module: true,
          student: true,
        },
      });

      return successResponse(progress);
    }

    if (unitStandardId) {
      // Update unit standard progress
      const progress = await prisma.unitStandardProgress.upsert({
        where: {
          studentId_unitStandardId: { studentId, unitStandardId },
        },
        update: {
          status,
          completionDate: completionDate ? new Date(completionDate) : null,
          startDate: status === 'IN_PROGRESS' && !completionDate ? new Date() : undefined,
        },
        create: {
          studentId,
          unitStandardId,
          status,
          startDate: new Date(),
          completionDate: completionDate ? new Date(completionDate) : null,
        },
        include: {
          unitStandard: true,
          student: true,
        },
      });

      return successResponse(progress);
    }

    return errorResponse('moduleId or unitStandardId required', 400);
  } catch (error) {
    return handleApiError(error);
  }
}
