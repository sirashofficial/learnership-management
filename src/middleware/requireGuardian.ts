import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/api-utils';

/**
 * Row-Level Security Middleware for Guardian Endpoints
 * Verifies that the authenticated user is a GUARDIAN and has permission to access the requested student's data
 * 
 * Usage:
 *   export const GET = withGuardianAuth(handler, 'studentId');
 * 
 * The middleware will:
 * 1. Verify user is authenticated
 * 2. Verify user has role GUARDIAN
 * 3. Verify user has guardian relationship with the requested student
 * 4. Prevent access if any check fails (row-level security)
 */

export interface GuardianAuthContext {
  user: {
    userId: string;
    email: string;
    role: string;
  };
  student: {
    studentId: string;
    guardianId: string;
  };
}

/** Middleware wrapper for guardian-protected endpoints */
export function withGuardianAuth(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  studentIdParam: string = 'studentId'
) {
  return async (request: NextRequest, context?: any) => {
    try {
      // Extract user from request (JWT token from cookies/headers)
      const user = await getUserFromRequest(request);

      if (!user) {
        return errorResponse('Unauthorized: Missing authentication', 401);
      }

      // Verify user role is GUARDIAN
      if (user.role !== 'GUARDIAN') {
        return errorResponse('Forbidden: User is not a guardian', 403);
      }

      // Extract studentId from URL params or query string
      let studentId: string | null = null;

      // Try to get from URL parameters (for dynamic routes like /api/guardian/students/[id])
      if (context?.params?.[studentIdParam]) {
        studentId = context.params[studentIdParam];
      }

      // Try to get from query string
      if (!studentId) {
        const url = new URL(request.url);
        studentId = url.searchParams.get(studentIdParam);
      }

      // If this is a list endpoint (no specific studentId), allow access
      // The endpoint handler should still only return linked students
      if (!studentId) {
        // Pass through to handler for list endpoints
        return handler(request, context);
      }

      // Verify guardian has relationship with this student
      const guardianStudent = await prisma.guardianStudent.findUnique({
        where: {
          guardianId_studentId: {
            guardianId: user.userId,
            studentId: studentId,
          },
        },
        select: {
          id: true,
          isVerified: true,
        },
      });

      if (!guardianStudent) {
        return errorResponse(
          'Forbidden: You do not have access to this student\'s information',
          403
        );
      }

      // Optionally: Verify the relationship is verified (not pending)
      if (!guardianStudent.isVerified) {
        return errorResponse(
          'Forbidden: Your guardian relationship with this student is not yet verified',
          403
        );
      }

      // Attach student info to request for use in handler
      const guardianContext: GuardianAuthContext = {
        user,
        student: {
          studentId,
          guardianId: user.userId,
        },
      };

      // Call the actual handler with the authorized context
      return handler(request, { ...context, guardian: guardianContext });
    } catch (error) {
      console.error('Guardian auth middleware error:', error);
      return errorResponse('Internal server error', 500);
    }
  };
}

/**
 * Simple function to verify guardian access to a student
 * Can be used in handler functions for additional checks
 */
export async function verifyGuardianAccess(
  guardianId: string,
  studentId: string
): Promise<boolean> {
  try {
    const guardianStudent = await prisma.guardianStudent.findUnique({
      where: {
        guardianId_studentId: {
          guardianId,
          studentId,
        },
      },
    });

    return !!guardianStudent && guardianStudent.isVerified;
  } catch (error) {
    console.error('Error verifying guardian access:', error);
    return false;
  }
}

/**
 * Get all students linked to a specific guardian
 * Used to ensure guardians can only see their own students
 */
export async function getGuardianStudentIds(guardianId: string): Promise<string[]> {
  try {
    const guardianStudents = await prisma.guardianStudent.findMany({
      where: {
        guardianId,
        isVerified: true,
      },
      select: {
        studentId: true,
      },
    });

    return guardianStudents.map((gs) => gs.studentId);
  } catch (error) {
    console.error('Error getting guardian student IDs:', error);
    return [];
  }
}
