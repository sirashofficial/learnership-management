import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export const dynamic = 'force-dynamic';

// GET /api/assessments/analytics - Get assessment analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const moduleId = searchParams.get('moduleId');
    const period = searchParams.get('period'); // 'week', 'month', 'all'

    let dateFilter = {};
    if (period) {
      const now = new Date();
      switch (period) {
        case 'week':
          dateFilter = { assessedDate: { gte: startOfWeek(now), lte: endOfWeek(now) } };
          break;
        case 'month':
          dateFilter = { assessedDate: { gte: startOfMonth(now), lte: endOfMonth(now) } };
          break;
      }
    }

    const where: any = {
      ...dateFilter,
      ...(groupId && { student: { groupId } }),
    };

    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Calculate statistics
    const total = assessments.length;
    const pending = assessments.filter((a: any) => !a.result || a.result === 'PENDING').length;
    const competent = assessments.filter((a: any) => a.result === 'COMPETENT').length;
    const notYetCompetent = assessments.filter((a: any) => a.result === 'NOT_YET_COMPETENT').length;
    const inModeration = assessments.filter((a: any) => a.moderationStatus === 'PENDING' && a.result).length;

    // Pass rate
    const assessed = competent + notYetCompetent;
    const passRate = assessed > 0 ? (competent / assessed) * 100 : 0;

    // By type
    const formative = assessments.filter((a: any) => a.type === 'FORMATIVE').length;
    const summative = assessments.filter((a: any) => a.type === 'SUMMATIVE').length;
    const integrated = assessments.filter((a: any) => a.type === 'INTEGRATED').length;

    // By method
    const byMethod = {
      KNOWLEDGE: assessments.filter((a: any) => a.method === 'KNOWLEDGE').length,
      PRACTICAL: assessments.filter((a: any) => a.method === 'PRACTICAL').length,
      OBSERVATION: assessments.filter((a: any) => a.method === 'OBSERVATION').length,
      PORTFOLIO: assessments.filter((a: any) => a.method === 'PORTFOLIO').length,
    };

    // By student (top performers)
    const studentStats = assessments.reduce((acc: any, assessment: any) => {
      const studentId = assessment.student.id;
      if (!acc[studentId]) {
        acc[studentId] = {
          student: assessment.student,
          total: 0,
          competent: 0,
          notYetCompetent: 0,
        };
      }
      acc[studentId].total++;
      if (assessment.result === 'COMPETENT') acc[studentId].competent++;
      if (assessment.result === 'NOT_YET_COMPETENT') acc[studentId].notYetCompetent++;
      return acc;
    }, {});

    const topPerformers = Object.values(studentStats)
      .map((s: any) => ({
        ...s,
        passRate: s.total > 0 ? (s.competent / s.total) * 100 : 0,
      }))
      .sort((a: any, b: any) => b.passRate - a.passRate)
      .slice(0, 10);

    // Overdue assessments
    const now = new Date();
    const overdue = assessments.filter(
      (a: any) => (!a.result || a.result === 'PENDING') && new Date(a.dueDate) < now
    ).length;

    return successResponse({
      summary: {
        total,
        pending,
        competent,
        notYetCompetent,
        inModeration,
        overdue,
        passRate: Math.round(passRate * 100) / 100,
      },
      byType: {
        formative,
        summative,
        integrated,
      },
      byMethod,
      topPerformers,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
