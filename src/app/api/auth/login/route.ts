import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeEmail, sanitizeString } from '@/lib/input-sanitizer';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  // Apply rate limiting: 5 login attempts per minute
  const rateLimitResult = await rateLimit({ interval: 60000, maxRequests: 5 })(request);
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await request.json();
    const rememberMe = Boolean(body?.rememberMe);

    // Sanitize inputs before validation
    const sanitizedBody = {
      email: sanitizeEmail(body.email || ''),
      password: sanitizeString(body.password || ''),
    };

    // Validate input
    const validatedData = loginSchema.parse(sanitizedBody);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
      },
    });

    if (!user) {
      return errorResponse('Invalid email or password', 401);
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(validatedData.password, user.password);

    if (!passwordMatch) {
      return errorResponse('Invalid email or password', 401);
    }

    // Generate JWT token
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    }, rememberMe ? '30d' : '24h');

    // Return user data (without password) and token
    const { password, ...userWithoutPassword } = user;

    // Create response with token
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });

    // Set HTTP-only cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
