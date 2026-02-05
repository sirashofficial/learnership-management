import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { requireAuth, requireAdmin } from '@/lib/middleware';

// GET /api/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error, user } = requireAuth(request);
    if (error) return error;

    // Users can only view their own profile unless they're admin
    if (user.userId !== params.id && user.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403);
    }

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
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error, user } = requireAuth(request);
    if (error) return error;

    // Users can only update their own profile unless they're admin
    if (user.userId !== params.id && user.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403);
    }

    const body = await request.json();
    const { name, email, role } = body;

    // Only admins can change roles
    if (role && user.role !== 'ADMIN') {
      return errorResponse('Only administrators can change user roles', 403);
    }

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
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error, user } = requireAdmin(request);
    if (error) return error;

    // Prevent deleting yourself
    if (user.userId === params.id) {
      return errorResponse('You cannot delete your own account', 400);
    }

    await prisma.user.delete({
      where: { id: params.id },
    });

    return successResponse(null, 'User deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
