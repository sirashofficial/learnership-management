import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/api-utils';
import { withAuth, withRateLimit } from '@/middleware/apiAuth';

async function logoutHandler(request: NextRequest) {
  // With JWT, logout is handled client-side by removing the token
  // This endpoint exists for consistency and future session management
  return successResponse(null, 'Logout successful');
}

export const POST = withAuth(withRateLimit(logoutHandler, 'moderate'), []);
