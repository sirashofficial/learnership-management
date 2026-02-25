import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { errorResponse, successResponse, handleApiError } from '@/lib/api-utils';
import { withAuth, withRateLimit } from '@/middleware/apiAuth';

/**
 * GET /api/admin/guardian-links
 * 
 * Admin endpoint to view all guardian-student relationships
 * Useful for management and oversight
 * 
 * Query parameters:
 * - studentId: Filter by specific student
 * - guardianId: Filter by specific guardian
 * - verified: Filter by verification status (true/false)
 */
async function getGuardianLinksHandler(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    if (user.role !== 'ADMIN') {
      return errorResponse('Forbidden: Only admins can view guardian links', 403);
    }

    const url = new URL(request.url);
    const studentId = url.searchParams.get('studentId');
    const guardianId = url.searchParams.get('guardianId');
    const verified = url.searchParams.get('verified');

    // Build filter
    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (guardianId) where.guardianId = guardianId;
    if (verified !== null) where.isVerified = verified === 'true';

    const links = await prisma.guardianStudent.findMany({
      where,
      select: {
        id: true,
        guardianId: true,
        studentId: true,
        relationshipType: true,
        isVerified: true,
        verifiedAt: true,
        createdAt: true,
        guardian: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return successResponse({
      links: links.map((link) => ({
        id: link.id,
        guardian: {
          id: link.guardianId,
          name: link.guardian.name,
          email: link.guardian.email,
        },
        student: {
          id: link.studentId,
          name: `${link.student.firstName} ${link.student.lastName}`,
          studentId: link.student.studentId,
          group: link.student.group?.name || 'N/A',
        },
        relationshipType: link.relationshipType,
        verified: link.isVerified,
        verifiedAt: link.verifiedAt,
        linkedAt: link.createdAt,
      })),
      count: links.length,
    }, 'Guardian links retrieved successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(getGuardianLinksHandler, ['ADMIN']);
