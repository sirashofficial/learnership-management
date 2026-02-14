/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    // Get recently added students (last 5)
    const recentStudents = await prisma.student.findMany({
      where: { status: 'ACTIVE' },
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
