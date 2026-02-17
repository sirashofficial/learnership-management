import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';

const parsePlanDate = (value?: string | null) => {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (trimmed.includes('/')) {
    const [day, month, year] = trimmed.split('/').map((part) => Number(part));
    if (!day || !month || !year) return null;
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const logRolloutMismatch = (groupId: string, message: string, details: any) => {
  console.log(`⚠️ Rollout mismatch [${groupId}]: ${message}`, details);
};
// GET /api/groups/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const group = await prisma.group.findUnique({
      where: { id: params.id },
      include: {
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
            status: true,
          },
        },
        sessions: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        _count: {
          select: { students: true, sessions: true },
        },
        rolloutPlan: true,
        unitStandardRollouts: {
          include: {
            unitStandard: {
              include: {
                module: true
              }
            }
          },
          orderBy: {
            startDate: 'asc'
          }
        },
        lessonPlans: {
          orderBy: {
            date: 'asc'
          }
        }
      },
    });

    if (!group) {
      return errorResponse('Group not found', 404);
    }

    return successResponse(group);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/groups/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    let parsedNotes: any = null;
    if (body.notes) {
      try {
        parsedNotes = JSON.parse(body.notes);
      } catch {
        parsedNotes = null;
      }
    }

    const group = await prisma.group.update({
      where: { id: params.id },
      data: {
        name: body.name,
        location: body.location,
        coordinator: body.coordinator,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        status: body.status,
        notes: body.notes,
      },
    });

    const rolloutPlan = parsedNotes?.rolloutPlan;
    if (rolloutPlan?.modules?.length) {
      const unitStandards = await prisma.unitStandard.findMany({
        select: { id: true, code: true },
      });
      const unitByCode = new Map(unitStandards.map((unit) => [unit.code, unit.id]));

      for (const module of rolloutPlan.modules) {
        const units = Array.isArray(module.unitStandards) ? module.unitStandards : [];
        for (const unit of units) {
          const code = String(unit.code || unit.id || '').trim();
          const unitStandardId = unitByCode.get(code);
          if (!unitStandardId) continue;

          await prisma.unitStandardRollout.upsert({
            where: {
              groupId_unitStandardId: {
                groupId: params.id,
                unitStandardId,
              },
            },
            update: {
              startDate: parsePlanDate(unit.startDate),
              endDate: parsePlanDate(unit.endDate),
              summativeDate: parsePlanDate(unit.summativeDate),
              assessingDate: parsePlanDate(unit.assessingDate),
            },
            create: {
              groupId: params.id,
              unitStandardId,
              startDate: parsePlanDate(unit.startDate),
              endDate: parsePlanDate(unit.endDate),
              summativeDate: parsePlanDate(unit.summativeDate),
              assessingDate: parsePlanDate(unit.assessingDate),
            },
          });
        }
      }

      const existingRollouts = await prisma.unitStandardRollout.findMany({
        where: { groupId: params.id },
        include: { unitStandard: true },
      });

      for (const rollout of existingRollouts) {
        const code = rollout.unitStandard?.code;
        if (!code) continue;
        const moduleMatch = rolloutPlan.modules.find((m: any) =>
          (m.unitStandards || []).some((u: any) => String(u.code || u.id || '').trim() === code)
        );
        if (!moduleMatch) {
          logRolloutMismatch(params.id, 'Missing unit in notes', { code });
          continue;
        }
        const unitMatch = (moduleMatch.unitStandards || []).find((u: any) =>
          String(u.code || u.id || '').trim() === code
        );
        if (!unitMatch) continue;

        const startDate = parsePlanDate(unitMatch.startDate)?.toISOString() || null;
        const endDate = parsePlanDate(unitMatch.endDate)?.toISOString() || null;
        const summativeDate = parsePlanDate(unitMatch.summativeDate)?.toISOString() || null;
        const assessingDate = parsePlanDate(unitMatch.assessingDate)?.toISOString() || null;

        if ((rollout.startDate?.toISOString() || null) !== startDate) {
          logRolloutMismatch(params.id, 'Start date mismatch', { code, notes: unitMatch.startDate, table: rollout.startDate });
        }
        if ((rollout.endDate?.toISOString() || null) !== endDate) {
          logRolloutMismatch(params.id, 'End date mismatch', { code, notes: unitMatch.endDate, table: rollout.endDate });
        }
        if ((rollout.summativeDate?.toISOString() || null) !== summativeDate) {
          logRolloutMismatch(params.id, 'Summative date mismatch', { code, notes: unitMatch.summativeDate, table: rollout.summativeDate });
        }
        if ((rollout.assessingDate?.toISOString() || null) !== assessingDate) {
          logRolloutMismatch(params.id, 'Assessing date mismatch', { code, notes: unitMatch.assessingDate, table: rollout.assessingDate });
        }
      }
    }

    return successResponse(group, 'Group updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/groups/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get group with student count
    const group = await prisma.group.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { students: true }
        }
      }
    });

    if (!group) {
      return errorResponse('Group not found', 404);
    }

    // Delete the group (students will be disconnected automatically via the relation)
    await prisma.group.delete({
      where: { id: params.id },
    });

    return successResponse(
      { id: params.id, studentCount: group._count.students },
      'Group deleted successfully'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
