import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Get unit standards report with multi-group and multi-module selection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { groupIds = [], moduleIds = [] } = body;

    if (groupIds.length === 0 || moduleIds.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one group and one module' },
        { status: 400 }
      );
    }

    // Fetch selected groups
    const groups = await prisma.group.findMany({
      where: { id: { in: groupIds } },
      include: { students: true }
    });

    if (groups.length === 0) {
      return NextResponse.json(
        { error: 'No groups found' },
        { status: 404 }
      );
    }

    // Fetch modules with their unit standards
    const modules = await prisma.module.findMany({
      where: { id: { in: moduleIds } },
      include: {
        unitStandards: {
          include: {
            unitStandardRollouts: {
              where: { groupId: { in: groupIds } }
            }
          }
        }
      }
    });

    if (modules.length === 0) {
      return NextResponse.json(
        { error: 'No modules found' },
        { status: 404 }
      );
    }

    // Build detailed report
    const reportData = [];

    for (const group of groups) {
      for (const module of modules) {
        const groupModuleData = {
          groupName: group.name,
          moduleName: module.name,
          credits: module.credits,
          notionalHours: module.notionalHours,
          unitStandards: [] as any[]
        };

        for (const unitStandard of module.unitStandards) {
          // Get progress for all students in the group for this unit standard
          const progressData = await prisma.unitStandardProgress.findMany({
            where: {
              unitStandardId: unitStandard.id,
              student: { groupId: group.id }
            },
            include: {
              student: { select: { firstName: true, lastName: true, studentId: true } }
            }
          });

          // Get assessments for this unit standard
          const assessments = await prisma.assessment.findMany({
            where: {
              unitStandardId: unitStandard.id,
              student: { groupId: group.id }
            },
            include: {
              student: { select: { firstName: true, lastName: true } }
            }
          });

          const competentCount = assessments.filter(a => a.result === 'COMPETENT').length;
          const notYetCompetentCount = assessments.filter(a => a.result === 'NOT_YET_COMPETENT').length;
          const pendingCount = assessments.filter(a => a.result === 'PENDING').length;

          groupModuleData.unitStandards.push({
            code: unitStandard.code,
            title: unitStandard.title,
            credits: unitStandard.credits,
            level: unitStandard.level,
            rollout: unitStandard.unitStandardRollouts[0] || null,
            assessments: {
              total: assessments.length,
              competent: competentCount,
              notYetCompetent: notYetCompetentCount,
              pending: pendingCount,
              successRate: assessments.length > 0 ? Math.round((competentCount / assessments.length) * 100) : 0
            },
            studentProgress: progressData.map(p => ({
              studentId: p.student.studentId,
              studentName: `${p.student.firstName} ${p.student.lastName}`,
              status: p.status,
              completionDate: p.completionDate
            }))
          });
        }

        reportData.push(groupModuleData);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      groupsSelected: groups.length,
      modulesSelected: modules.length,
      report: reportData,
      summary: {
        totalGroups: groups.length,
        totalModules: modules.length,
        totalUnitStandards: reportData.reduce((sum, g) => sum + g.unitStandards.length, 0)
      }
    });

  } catch (error) {
    console.error('Unit standard report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

// Get available groups and modules for selection
export async function GET(request: NextRequest) {
  try {
    const groups = await prisma.group.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { students: true } }
      },
      where: { status: 'ACTIVE' }
    });

    const modules = await prisma.module.findMany({
      select: {
        id: true,
        moduleNumber: true,
        name: true,
        credits: true,
        _count: { select: { unitStandards: true } }
      },
      where: { status: 'ACTIVE' },
      orderBy: { moduleNumber: 'asc' }
    });

    return NextResponse.json({
      success: true,
      groups: groups.map(g => ({
        id: g.id,
        name: g.name,
        studentCount: g._count.students
      })),
      modules: modules.map(m => ({
        id: m.id,
        number: m.moduleNumber,
        name: m.name,
        credits: m.credits,
        unitStandardCount: m._count.unitStandards
      }))
    });

  } catch (error) {
    console.error('Get options error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch options' },
      { status: 500 }
    );
  }
}
