import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import {
  successPaginatedResponse,
  successResponse,
  errorResponse,
  handleApiError,
  getPaginationParams,
  createPagination,
} from '@/lib/api-utils';
import { normalizeGroupName } from '@/lib/groupNameUtils';
import { requireAuth } from '@/lib/middleware';
import { enforceGroupAccess, getAuthContext, withAuth, withRateLimit } from '@/middleware/apiAuth';
import { cascadeSoftDeleteGroup } from '@/lib/softDelete';

// GET /api/groups
async function getGroupsHandler(request: NextRequest) {
  console.log('API HIT: /api/groups');
  try {
    const { error } = await requireAuth(request);
    if (error) return error;

    console.log('GET /api/groups called');
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Extract pagination parameters
    const { page, pageSize, skip } = getPaginationParams(request);

    const where: any = {};
    if (status) where.status = status;

    const authContext = getAuthContext(request);
    if (authContext?.user.role === 'FACILITATOR') {
      if (authContext.allowedGroupIds.length === 0) {
        const pagination = createPagination(page, pageSize, 0);
        return successPaginatedResponse([], pagination);
      }
      where.id = { in: authContext.allowedGroupIds };
    }

    // Get total count for pagination
    const total = await prisma.group.count({ where });

    const groups = await prisma.group.findMany({
      where,
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
        Company: true,
        unitStandardRollouts: {
          include: {
            unitStandard: true,
          },
        },
      },
      orderBy: { name: 'asc' },
      skip,
      take: pageSize,
    });

    const groupIds = groups.map((group) => group.id);
    const totalCreditsRequired = 140;

    const competentAssessments = groupIds.length > 0
      ? await prisma.assessment.findMany({
        where: {
          result: 'COMPETENT',
          student: {
            groupId: { in: groupIds },
          },
        },
        select: {
          studentId: true,
          unitStandardId: true,
          unitStandard: { select: { credits: true } },
          student: { select: { groupId: true } },
        },
      })
      : [];

    const progressMap = new Map<
      string,
      {
        studentUnits: Map<string, Map<string, number>>;
      }
    >();

    for (const assessment of competentAssessments) {
      const groupId = assessment.student?.groupId;
      if (!groupId || !assessment.unitStandardId) continue;

      if (!progressMap.has(groupId)) {
        progressMap.set(groupId, { studentUnits: new Map() });
      }

      const groupEntry = progressMap.get(groupId);
      if (!groupEntry) continue;

      if (!groupEntry.studentUnits.has(assessment.studentId)) {
        groupEntry.studentUnits.set(assessment.studentId, new Map());
      }

      const unitMap = groupEntry.studentUnits.get(assessment.studentId);
      if (!unitMap) continue;
      unitMap.set(assessment.unitStandardId, assessment.unitStandard?.credits || 0);
    }

    const groupsWithProgress = groups.map((group) => {
      const studentCount = group._count?.students || group.students?.length || 0;
      const groupEntry = progressMap.get(group.id);

      let totalCreditsEarned = 0;
      let totalUniqueUnitsPassed = 0;

      if (groupEntry) {
        for (const unitMap of groupEntry.studentUnits.values()) {
          totalUniqueUnitsPassed += unitMap.size;
          totalCreditsEarned += Array.from(unitMap.values()).reduce((sum, credits) => sum + credits, 0);
        }
      }

      const avgCreditsPerStudent = studentCount > 0
        ? Math.round(totalCreditsEarned / studentCount)
        : 0;
      const avgProgressPercent = studentCount > 0
        ? Math.round((avgCreditsPerStudent / totalCreditsRequired) * 100)
        : 0;

      return {
        ...group,
        actualProgress: {
          avgCreditsPerStudent,
          avgProgressPercent,
          totalCreditsEarned,
          totalUniqueUnitsPassed,
          totalCreditsRequired,
        },
      };
    });

    console.log('GET /api/groups success:', groupsWithProgress.length, 'groups');

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

    const pagination = createPagination(page, pageSize, total);
    return successPaginatedResponse(groupsWithProgress, pagination);
  } catch (error) {
    console.error('GET /api/groups error:', error);
    return handleApiError(error);
  }
}

// POST /api/groups
async function createGroupHandler(request: NextRequest) {
  try {
    const { error } = await requireAuth(request);
    if (error) return error;

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
async function updateGroupHandler(request: NextRequest) {
  try {
    const { error } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return errorResponse('Group ID is required', 400);
    }

    const authContext = getAuthContext(request);
    const accessError = enforceGroupAccess(id, authContext);
    if (accessError) return accessError;

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
async function deleteGroupHandler(request: NextRequest) {
  try {
    const { error } = await requireAuth(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('Group ID is required', 400);
    }

    const authContext = getAuthContext(request);
    const accessError = enforceGroupAccess(id, authContext);
    if (accessError) return accessError;

    // Soft delete the group and cascade to students
    const result = await cascadeSoftDeleteGroup(id);

    return successResponse(
      { studentsArchived: result.studentsDeleted },
      `Group and ${result.studentsDeleted} student(s) archived successfully. Can be restored within 30 days.`
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(withRateLimit(getGroupsHandler, 'moderate'), ['ADMIN', 'FACILITATOR']);
export const POST = withAuth(withRateLimit(createGroupHandler, 'moderate'), ['ADMIN', 'FACILITATOR']);
export const PUT = withAuth(withRateLimit(updateGroupHandler, 'moderate'), ['ADMIN', 'FACILITATOR']);
export const DELETE = withAuth(withRateLimit(deleteGroupHandler, 'moderate'), ['ADMIN', 'FACILITATOR']);
