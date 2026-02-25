import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getAuthContext, withAuth, withRateLimit } from '@/middleware/apiAuth';

const prisma = new PrismaClient();

// POST - Change password
async function updateSecurityHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;
    const authContext = getAuthContext(request);
    const userId = authContext?.user.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'All password fields are required' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New passwords do not match' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}

// GET - Get security settings
async function getSecuritySettingsHandler(request: NextRequest) {
  try {
    // Return security status (without sensitive data)
    return NextResponse.json({
      twoFactorEnabled: false,
      sessionTimeout: 30,
      passwordLastChanged: new Date().toISOString(),
      loginAttempts: 0,
    });
  } catch (error) {
    console.error('Error fetching security settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security settings' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(withRateLimit(updateSecurityHandler, 'moderate'), []);
export const GET = withAuth(withRateLimit(getSecuritySettingsHandler, 'moderate'), []);
