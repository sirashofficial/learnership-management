import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { requireAuth } from '@/lib/middleware';

// GET /api/unit-standards - List all unit standards
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');

    const unitStandards = await prisma.unitStandard.findMany({
      where: moduleId ? { moduleId } : {},
      include: {
        module: true,
        assessments: {
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true }
            }
          }
        },
        _count: {
          select: { assessments: true, activities: true }
        }
      },
      orderBy: { code: 'asc' }
    });

    return successResponse(unitStandards);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/unit-standards - Create new unit standard
export async function POST(request: NextRequest) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const { code, title, credits, level, type, moduleId, content } = body;

    if (!code || !title || !moduleId || !credits || !level) {
      return errorResponse('Missing required fields: code, title, moduleId, credits, level', 400);
    }

    // Check if code already exists
    const existing = await prisma.unitStandard.findUnique({
      where: { code }
    });

    if (existing) {
      return errorResponse(`Unit Standard with code ${code} already exists`, 409);
    }

    const unitStandard = await prisma.unitStandard.create({
      data: {
        code,
        title,
        credits: parseInt(credits),
        level: parseInt(level),
        type: type || 'Core',
        moduleId,
        content: content || null
      },
      include: {
        module: true
      }
    });

    console.log('✅ Unit Standard created:', unitStandard.code);
    return successResponse(unitStandard, 'Unit Standard created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
