import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { errorResponse, successResponse, handleApiError } from '@/lib/api-utils';
import { withAuth } from '@/middleware/apiAuth';

/**
 * DELETE /api/admin/guardian-links/[id]
 * 
 * Admin endpoint to remove a guardian-student relationship
 * Use with caution as this revokes access
 */
async function deleteGuardianLinkHandler(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    if (user.role !== 'ADMIN') {
      return errorResponse('Forbidden: Only admins can delete guardian links', 403);
    }

    const { id } = context.params;

    // Verify link exists
    const link = await prisma.guardianStudent.findUnique({
      where: { id },
      select: {
        id: true,
        student: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        guardian: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!link) {
      return errorResponse('Guardian link not found', 404);
    }

    // Delete the link
    await prisma.guardianStudent.delete({
      where: { id },
    });

    return successResponse({
      message: `Access revoked: ${link.guardian.name} can no longer view ${link.student.firstName} ${link.student.lastName}'s information`,
    }, 'Guardian link deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export const DELETE = withAuth(deleteGuardianLinkHandler, ['ADMIN']);
