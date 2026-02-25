/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api-utils';
import { getAuthContext, withAuth, withRateLimit } from '@/middleware/apiAuth';

async function getRecentActivityHandler(request: NextRequest) {
  try {
    const authContext = getAuthContext(request);
    const groupFilter = authContext?.user.role === 'FACILITATOR'
      ? { groupId: { in: authContext.allowedGroupIds } }
      : {};

    if (authContext?.user.role === 'FACILITATOR' && authContext.allowedGroupIds.length === 0) {
      return successResponse({ activities: [] });
    }

    // Get recently added students (last 5)
    const recentStudents = await prisma.student.findMany({
      where: { status: 'ACTIVE', ...groupFilter },
      include: {
        group: {
          include: {

          },
        },
        facilitator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Format activity items with timestamps
    const activities = recentStudents.map((student: any) => ({
      id: student.id,
      type: 'STUDENT_ADDED',
      title: `${student.firstName} ${student.lastName} enrolled`,
      description: `Added to ${student.group.name}${student.group.company ? ` - ${student.group.company.name}` : ''}`,
      timestamp: student.createdAt,
      data: {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        groupName: student.group.name,
        companyName: student.group.company?.name || null,
        facilitatorName: student.facilitator.name,
      },
    }));

    return successResponse({ activities });
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(withRateLimit(getRecentActivityHandler, 'generous'), ['ADMIN', 'FACILITATOR']);
