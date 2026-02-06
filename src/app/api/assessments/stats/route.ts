import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const groupId = searchParams.get('groupId');

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (groupId) where.student = { groupId };

    const [
      totalAssessments,
      pending,
      competent,
      notYetCompetent,
      overdue,
      pendingModeration,
      formativeCount,
      summativeCount,
      byMethod,
    ] = await Promise.all([
      // Total
      prisma.assessment.count({ where }),
      
      // Pending (not assessed yet)
      prisma.assessment.count({
        where: { ...where, result: null, dueDate: { gte: new Date() } },
      }),
      
      // Competent
      prisma.assessment.count({
        where: { ...where, result: 'COMPETENT' },
      }),
      
      // Not Yet Competent
      prisma.assessment.count({
        where: { ...where, result: 'NOT_YET_COMPETENT' },
      }),
      
      // Overdue (past due date, no result)
      prisma.assessment.count({
        where: { ...where, result: null, dueDate: { lt: new Date() } },
      }),
      
      // Pending moderation
      prisma.assessment.count({
        where: { ...where, moderationStatus: 'PENDING', result: { not: null } },
      }),
      
      // Formative count
      prisma.assessment.count({
        where: { ...where, type: 'FORMATIVE' },
      }),
      
      // Summative count
      prisma.assessment.count({
        where: { ...where, type: { in: ['SUMMATIVE', 'INTEGRATED'] } },
      }),
      
      // By method
      prisma.assessment.groupBy({
        by: ['method'],
        where,
        _count: true,
      }),
    ]);

    return successResponse({
      total: totalAssessments,
      pending,
      completed: competent + notYetCompetent,
      competent,
      notYetCompetent,
      overdue,
      pendingModeration,
      byType: {
        formative: formativeCount,
        summative: summativeCount,
      },
      byMethod: byMethod.reduce((acc: any, item: any) => {
        acc[item.method] = item._count;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
