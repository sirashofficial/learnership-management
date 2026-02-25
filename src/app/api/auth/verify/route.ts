import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { getAuthContext, withAuth, withRateLimit } from '@/middleware/apiAuth';

async function verifyHandler(request: NextRequest) {
  const authContext = getAuthContext(request);
  if (!authContext) {
    return errorResponse('Unauthorized. Please login.', 401);
  }

  const { user, allowedGroupIds } = authContext;

  return successResponse({
    user: {
      userId: user.userId,
      email: user.email,
      role: user.role,
    },
    permissions: {
      canManageUsers: user.role === 'ADMIN',
      canManageSystemSettings: user.role === 'ADMIN',
      canAccessAllGroups: user.role === 'ADMIN',
      canAccessGroupData: user.role === 'ADMIN' || user.role === 'FACILITATOR',
    },
    allowedGroupIds,
  });
}

export const GET = withAuth(withRateLimit(verifyHandler, 'moderate'), []);
