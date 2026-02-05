import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = loginSchema.parse(body);
    
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
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    
    // Return user data (without password) and token
    const { password, ...userWithoutPassword } = user;
    
    return successResponse(
      {
        user: userWithoutPassword,
        token,
      },
      'Login successful'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
