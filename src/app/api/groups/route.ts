import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
// GET /api/groups
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const groups = await prisma.group.findMany({
      where: {
        ...(status && { status: status as any }),
      },
      include: {
        company: true,
        students: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
            progress: true,
            status: true,
          },
          orderBy: { lastName: 'asc' },
        },
        _count: {
          select: { students: true, sessions: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return successResponse(groups);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/groups
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const group = await prisma.group.create({
      data: {
        name: body.name,
        location: body.location,
        coordinator: body.coordinator,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        status: body.status || 'Planning',
        notes: body.notes,
        companyId: body.companyId || null,
      },
      include: {
        company: true,
      },
    });

    return successResponse(group, 'Group created successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/groups
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return errorResponse('Group ID is required', 400);
    }

    const group = await prisma.group.update({
      where: { id },
      data: {
        name: data.name,
        location: data.location,
        coordinator: data.coordinator,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        status: data.status,
        notes: data.notes,
        companyId: data.companyId,
      },
      include: {
        company: true,
      },
    });

    return successResponse(group, 'Group updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/groups
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('Group ID is required', 400);
    }

    // Check if group has students
    const studentCount = await prisma.student.count({
      where: { groupId: id },
    });

    if (studentCount > 0) {
      return errorResponse(
        `Cannot delete group. There are ${studentCount} students assigned to this group.`,
        400
      );
    }

    await prisma.group.delete({
      where: { id },
    });

    return successResponse(null, 'Group deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
