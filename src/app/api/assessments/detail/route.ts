import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, withRateLimit } from '@/middleware/apiAuth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/assessments/detail?studentId=s1&page=1&pageSize=50
 * 
 * Full assessment details with pagination.
 * Only load this when user clicks "View Details".
 * 
 * Returns: Full assessment records with 50 per page
 * Performance: ~200ms per page request
 */
async function handleGet(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const groupId = searchParams.get('groupId');
    const pageParam = searchParams.get('page') || '1';
    const pageSizeParam = searchParams.get('pageSize') || '50';

    const page = Math.max(1, parseInt(pageParam));
    const pageSize = Math.min(100, Math.max(10, parseInt(pageSizeParam)));
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (groupId) where.student = { groupId };

    // Get total count
    const total = await prisma.assessment.count({ where });

    // Fetch detailed assessments with pagination
    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            groupId: true
          }
        },
        unitStandard: {
          select: {
            id: true,
            title: true,
            credits: true,
            module: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { dueDate: 'desc' },
      skip,
      take: pageSize
    });

    const totalPages = Math.ceil(total / pageSize);
    const hasMore = page < totalPages;

    return NextResponse.json({
      assessments,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasMore
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Assessments detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessment details' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(
  withRateLimit(handleGet, 'moderate'),
  ['ADMIN', 'FACILITATOR']
);
