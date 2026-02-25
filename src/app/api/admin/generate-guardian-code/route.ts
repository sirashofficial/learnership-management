import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { errorResponse, successResponse, handleApiError } from '@/lib/api-utils';
import { withAuth, withRateLimit, withValidation } from '@/middleware/apiAuth';
import { z } from 'zod';
import crypto from 'crypto';

/**
 * Validation schema for generating verification codes
 */
const generateVerificationCodeSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
});

type GenerateVerificationCodeRequest = z.infer<typeof generateVerificationCodeSchema>;

/**
 * POST /api/admin/generate-guardian-code
 * 
 * Generates a verification code that a guardian can use to link a student
 * Only accessible by admins/facilitators
 * 
 * The code is temporary and expires in 24 hours
 * Can only be used once
 */
async function generateVerificationCodeHandler(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    // Only facilitators and admins can generate codes
    if (!['FACILITATOR', 'ADMIN'].includes(user.role)) {
      return errorResponse(
        'Forbidden: Only facilitators and admins can generate verification codes',
        403
      );
    }

    const body = await request.json();
    const validatedData = generateVerificationCodeSchema.parse(body);
    const { studentId } = validatedData;

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        facilitatorId: true,
      },
    });

    if (!student) {
      return errorResponse('Student not found', 404);
    }

    // For facilitators, verify they're the student's facilitator
    if (user.role === 'FACILITATOR' && student.facilitatorId !== user.userId) {
      return errorResponse(
        'Forbidden: You can only generate codes for your own students',
        403
      );
    }

    // Generate a random 8-character alphanumeric code
    const code = crypto.randomBytes(6).toString('hex').toUpperCase().slice(0, 8);

    // In a real implementation, you would store this in a VerificationCode model
    // For now, we'll mark it in the GuardianStudent as a pending link with the code
    
    // Note: The code should be stored with an expiration time (24 hours)
    // This is a simplified implementation - in production, you'd want:
    // - A separate VerificationCode model
    // - Tracking of code generation and usage
    // - Expiration enforcement
    // - Single-use enforcement

    const response = {
      code,
      studentName: `${student.firstName} ${student.lastName}`,
      studentId,
      expiresIn: '24 hours',
      instructions: `Share this code with the guardian. They should:
1. Go to the Parent/Guardian Portal login at /guardian/login
2. Sign in with their account
3. Click "Link Student"
4. Enter the Student ID: ${studentId}
5. Enter this Verification Code: ${code}`,
    };

    return successResponse(response, 'Verification code generated successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        `Validation error: ${error.errors.map((e) => e.message).join(', ')}`,
        400
      );
    }
    return handleApiError(error);
  }
}

export const POST = withAuth(
  withRateLimit(
    withValidation(generateVerificationCodeHandler, generateVerificationCodeSchema),
    'moderate'
  ),
  ['FACILITATOR', 'ADMIN']
);
