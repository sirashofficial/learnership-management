import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { normalizeGroupName } from '@/lib/groupNameUtils';
// GET /api/groups
export async function GET(request: NextRequest) {
  console.log('API HIT: /api/groups');
  try {
    console.log('GET /api/groups called');
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const groups = await prisma.group.findMany({
      where: {
        ...(status && { status: status as any }),
      },
      include: {
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
        rolloutPlan: true,
      },
      orderBy: { name: 'asc' },
    });
    console.log('GET /api/groups success:', groups.length, 'groups');
    
    // DEBUG: Log group.notes for each group to verify rollout plan data
    console.log('\n📋 DEBUG: Group Notes (Rollout Plans):');
    groups.forEach((group: any) => {
      console.log(`\n  Group: ${group.name}`);
      if (group.notes) {
        try {
          const parsed = JSON.parse(group.notes);
          const moduleCount = parsed.rolloutPlan?.modules?.length || 0;
          const totalUnits = parsed.rolloutPlan?.modules?.reduce((sum: number, m: any) => sum + (m.unitStandards?.length || 0), 0) || 0;
          console.log(`    ✅ Notes found - ${moduleCount} modules, ${totalUnits} total units`);
          console.log(`    Preview: ${JSON.stringify(parsed).substring(0, 100)}...`);
        } catch (e) {
          console.log(`    ⚠️  Notes present but not valid JSON: ${group.notes.substring(0, 50)}...`);
        }
      } else {
        console.log(`    ❌ No notes (empty/null)`);
      }
    });
    console.log('\n');
    
    return successResponse(groups);
  } catch (error) {
    console.error('GET /api/groups error:', error);
    return handleApiError(error);
  }
}

// POST /api/groups
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.startDate || !body.status) {
      return errorResponse('Missing required fields: name, startDate, or status', 400);
    }

    // Normalize group name(s)
    const normalizedNames = normalizeGroupName(body.name);
    // Check for duplicate group(s)
    const existing = await prisma.group.findFirst({
      where: {
        name: { in: normalizedNames },
      },
    });
    if (existing) {
      return errorResponse('A group with this name (or equivalent) already exists.', 409);
    }

    // Proceed to create group with normalized name (first in list)
    const group = await prisma.group.create({
      data: {
        name: normalizedNames[0],
        location: body.location,
        coordinator: body.coordinator,
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        endDate: body.endDate ? new Date(body.endDate) : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        status: body.status || 'ACTIVE',
        notes: body.notes,
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
