import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import bcrypt from 'bcryptjs';
import { getUserFromRequest } from '@/lib/auth';

// PUT /api/users/[id]/password - Change user password
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);

    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    // Only allow users to change their own password
    if (user.userId !== params.id) {
      return errorResponse('Forbidden', 403);
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return errorResponse('Current password and new password are required', 400);
    }

    if (newPassword.length < 6) {
      return errorResponse('New password must be at least 6 characters', 400);
    }

    // Get user with password
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!targetUser) {
      return errorResponse('User not found', 404);
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, targetUser.password);

    if (!passwordMatch) {
      return errorResponse('Current password is incorrect', 401);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: params.id },
      data: { password: hashedPassword },
    });

    return successResponse(null, 'Password changed successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
