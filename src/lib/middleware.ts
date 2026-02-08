import { NextRequest } from 'next/server';
import { getUserFromRequest } from './auth';
import { errorResponse } from './api-utils';

export interface AuthenticatedRequest extends NextRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * Middleware to check if user is authenticated
 * Returns the authenticated user or an error response
 */
/**
 * Middleware to check if user is authenticated
 * Returns the authenticated user or an error response
 */
export async function requireAuth(request: NextRequest) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return { error: errorResponse('Unauthorized. Please login.', 401), user: null };
  }

  return { error: null, user };
}

/**
 * Middleware to check if user has specific role
 */
export async function requireRole(request: NextRequest, allowedRoles: string[]) {
  const { error, user } = await requireAuth(request);

  if (error) {
    return { error, user: null };
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return {
      error: errorResponse('Forbidden. Insufficient permissions.', 403),
      user: null
    };
  }

  return { error: null, user };
}

/**
 * Check if user is admin
 */
export async function requireAdmin(request: NextRequest) {
  return await requireRole(request, ['ADMIN']);
}

/**
 * Check if user is admin or coordinator
 */
export async function requireAdminOrCoordinator(request: NextRequest) {
  return await requireRole(request, ['ADMIN', 'COORDINATOR']);
}
