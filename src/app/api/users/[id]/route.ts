import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { withAuth, withRateLimit } from '@/middleware/apiAuth';
import { softDelete } from '@/lib/softDelete';

// GET /api/users/[id] - Get single user
async function getUserHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            students: true,
            lessonPlans: true,
            sessions: true,
          },
        },
      },
    });

    if (!targetUser) {
      return errorResponse('User not found', 404);
    }

    return successResponse(targetUser);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/users/[id] - Update user
async function updateUserHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, email, role } = body;

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true,
      },
    });

    return successResponse(updatedUser, 'User updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/users/[id] - Delete user (Admin only)
async function deleteUserHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Soft delete the user
    await softDelete('user', params.id);

    return successResponse(null, 'User archived successfully. Can be restored within 30 days.');
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(withRateLimit(getUserHandler, 'moderate'), ['ADMIN']);
export const PUT = withAuth(withRateLimit(updateUserHandler, 'moderate'), ['ADMIN']);
export const DELETE = withAuth(withRateLimit(deleteUserHandler, 'moderate'), ['ADMIN']);
