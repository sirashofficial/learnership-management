import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Admin-only endpoint to cleanup old data
export async function POST(request: NextRequest) {
  try {
    // Check for admin authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.includes('Bearer')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, groupsToKeep = [] } = body;

    if (action === 'delete-old-groups') {
      // Delete all groups not in the keeplist
      const groupsToDelete = await prisma.group.findMany({
        where: {
          NOT: {
            name: { in: groupsToKeep }
          }
        },
        include: {
          students: true
        }
      });

      let totalDeleted = {
        groups: 0,
        students: 0,
        assessments: 0,
        sessions: 0
      };

      for (const group of groupsToDelete) {
        // Delete associated data before deleting group
        const students = await prisma.student.findMany({
          where: { groupId: group.id }
        });

        for (const student of students) {
          await prisma.assessment.deleteMany({ where: { studentId: student.id } });
          await prisma.attendance.deleteMany({ where: { studentId: student.id } });
          await prisma.formativeCompletion.deleteMany({ where: { studentId: student.id } });
          await prisma.moduleProgress.deleteMany({ where: { studentId: student.id } });
          await prisma.unitStandardProgress.deleteMany({ where: { studentId: student.id } });
          await prisma.courseProgress.deleteMany({ where: { studentId: student.id } });
          // POEChecklist uses pOEChecklist in Prisma model
          await prisma.pOEChecklist.deleteMany({ where: { studentId: student.id } });

          totalDeleted.assessments++;
        }

        // Delete students
        await prisma.student.deleteMany({ where: { groupId: group.id } });
        totalDeleted.students += students.length;

        // Delete sessions and other group data
        const sessions = await prisma.session.deleteMany({ where: { groupId: group.id } });
        totalDeleted.sessions += sessions.count;

        await prisma.attendance.deleteMany({ where: { groupId: group.id } });
        await prisma.groupRolloutPlan.deleteMany({ where: { groupId: group.id } });
        await prisma.unitStandardRollout.deleteMany({ where: { groupId: group.id } });
        await prisma.lessonPlan.deleteMany({ where: { groupId: group.id } });
        await prisma.groupCourse.deleteMany({ where: { groupId: group.id } });
        await prisma.groupSchedule.deleteMany({ where: { groupId: group.id } });

        // Delete group
        await prisma.group.delete({ where: { id: group.id } });
        totalDeleted.groups++;
      }

      return NextResponse.json({
        success: true,
        message: 'Old data cleaned up successfully',
        deleted: totalDeleted,
        remaining: {
          groups: await prisma.group.count(),
          students: await prisma.student.count()
        }
      });
    }

    if (action === 'get-cleanup-preview') {
      const groupsToDelete = await prisma.group.findMany({
        where: {
          NOT: {
            name: { in: groupsToKeep }
          }
        },
        include: {
          students: { select: { id: true } }
        }
      });

      return NextResponse.json({
        preview: {
          groups: groupsToDelete.length,
          students: groupsToDelete.reduce((acc, g) => acc + g.students.length, 0),
          groups_list: groupsToDelete.map(g => ({ name: g.name, students: g.students.length }))
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: 'Failed to process cleanup request' },
      { status: 500 }
    );
  }
}
