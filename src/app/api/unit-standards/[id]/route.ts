import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { requireAuth } from '@/lib/middleware';

// GET /api/unit-standards/[id] - Get single unit standard
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const unitStandard = await prisma.unitStandard.findUnique({
      where: { id: params.id },
      include: {
        module: true,
        assessments: {
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, studentId: true, group: { select: { name: true } } }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        activities: true,
        _count: {
          select: { assessments: true, activities: true }
        }
      }
    });

    if (!unitStandard) {
      return errorResponse('Unit Standard not found', 404);
    }

    return successResponse(unitStandard);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/unit-standards/[id] - Update unit standard
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const { title, code, credits, level, type, content } = body;

    const existing = await prisma.unitStandard.findUnique({
      where: { id: params.id }
    });

    if (!existing) {
      return errorResponse('Unit Standard not found', 404);
    }

    // If code is being changed, check for duplicates
    if (code && code !== existing.code) {
      const duplicate = await prisma.unitStandard.findUnique({
        where: { code }
      });
      if (duplicate) {
        return errorResponse(`Unit Standard with code ${code} already exists`, 409);
      }
    }

    const updated = await prisma.unitStandard.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(code && { code }),
        ...(credits && { credits: parseInt(credits) }),
        ...(level && { level: parseInt(level) }),
        ...(type && { type }),
        ...(content !== undefined && { content })
      },
      include: {
        module: true
      }
    });

    console.log('✅ Unit Standard updated:', updated.code);
    return successResponse(updated, 'Unit Standard updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/unit-standards/[id] - Delete unit standard
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error, user } = await requireAuth(request);
    if (error) return error;

    const unitStandard = await prisma.unitStandard.findUnique({
      where: { id: params.id },
      include: { _count: { select: { assessments: true } } }
    });

    if (!unitStandard) {
      return errorResponse('Unit Standard not found', 404);
    }

    // Prevent deletion if there are assessments
    if (unitStandard._count.assessments > 0) {
      return errorResponse('Cannot delete Unit Standard with existing assessments', 409);
    }

    await prisma.unitStandard.delete({
      where: { id: params.id }
    });

    console.log('✅ Unit Standard deleted:', unitStandard.code);
    return successResponse(null, 'Unit Standard deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
