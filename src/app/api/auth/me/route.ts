import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get user from JWT token
    const authUser = getUserFromRequest(request);
    
    if (!authUser) {
      return errorResponse('Unauthorized', 401);
    }
    
    // Fetch fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    if (!user) {
      return errorResponse('User not found', 404);
    }
    
    return successResponse(user);
  } catch (error) {
    return handleApiError(error);
  }
}
