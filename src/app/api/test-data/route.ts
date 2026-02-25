import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  // ============================================
  // PRODUCTION GUARD
  // ============================================
  // Block access in production environments
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not Found' },
      { status: 404 }
    );
  }
  
  try {
    const [students, groups, assessments, modules] = await Promise.all([
      prisma.student.count(),
      prisma.group.count(),
      prisma.assessment.count(),
      prisma.module.count(),
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        students,
        groups,
        assessments,
        modules,
      },
      message: 'PostgreSQL data is accessible!',
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
