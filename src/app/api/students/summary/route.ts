import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successPaginatedResponse, handleApiError, getPaginationParams, createPagination } from '@/lib/api-utils';
import { requireAuth } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAuth(request);
    if (error) return error;

    const { page, pageSize: limit, skip } = getPaginationParams(request);

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const status = searchParams.get('status');

    const where: any = {};
    if (groupId && groupId !== 'all') {
      where.groupId = groupId;
    }
    if (status && status !== 'all') {
      where.status = status;
    }

    // Get total count
    const total = await prisma.student.count({ where });

    // Fetch paginated students with group info
    const students = await prisma.student.findMany({
      where,
      select: {
        id: true,
        studentId: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        progress: true,
        totalCreditsEarned: true,
        groupId: true,
        group: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Format response
    const formattedStudents = students.map((student) => ({
      id: student.id,
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      status: student.status,
      progress: student.progress,
      totalCreditsEarned: student.totalCreditsEarned,
      groupId: student.groupId,
      groupName: student.group?.name || 'N/A',
    }));

    const pagination = createPagination(page, limit, total);
    return successPaginatedResponse(formattedStudents, pagination);
  } catch (error) {
    console.error('Students summary error:', error);
    return handleApiError(error);
  }
}
