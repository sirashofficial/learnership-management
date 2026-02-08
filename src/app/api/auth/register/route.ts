import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';
import { registerSchema } from '@/lib/validations';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeEmail, sanitizeString } from '@/lib/input-sanitizer';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  // Apply rate limiting: 3 registration attempts per hour
  const rateLimitResult = await rateLimit({ interval: 3600000, maxRequests: 3 })(request);
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await request.json();

    // Sanitize inputs before validation
    const sanitizedBody = {
      email: sanitizeEmail(body.email || ''),
      name: sanitizeString(body.name || ''),
      password: sanitizeString(body.password || ''),
      role: body.role,
    };

    // Validate input
    const validatedData = registerSchema.parse(sanitizedBody);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return errorResponse('User with this email already exists', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword,
        role: validatedData.role || 'FACILITATOR',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return successResponse(
      {
        user,
        token,
      },
      'Registration successful',
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
