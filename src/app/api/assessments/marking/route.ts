import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST - Create assessments for a student (auto-add to assessments)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, groupId, action } = body;

    if (action === 'auto-create-assessments') {
      if (!studentId) {
        return NextResponse.json(
          { error: 'studentId is required' },
          { status: 400 }
        );
      }

      // Get group's rollout plan to see which modules they're scheduled for
      const group = await prisma.group.findUnique({
        where: { id: groupId || (await prisma.student.findUnique({ where: { id: studentId } }))?.groupId },
        include: { rolloutPlan: true }
      });

      if (!group) {
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 404 }
        );
      }

      // Get all unit standards for the group
      const unitStandards = await prisma.unitStandard.findMany();

      const createdAssessments = [];
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + 3);

      for (const unitStandard of unitStandards) {
        // Check if assessment already exists
        const exists = await prisma.assessment.findFirst({
          where: {
            studentId,
            unitStandardId: unitStandard.id
          }
        });

        if (!exists) {
          const assessment = await prisma.assessment.create({
            data: {
              type: 'FORMATIVE',
              method: 'KNOWLEDGE',
              result: 'PENDING',
              dueDate,
              studentId,
              unitStandardId: unitStandard.id,
              notes: `Auto-created for new student in ${group.name}`
            }
          });

          createdAssessments.push({
            id: assessment.id,
            unitStandardCode: unitStandard.code,
            unitStandardTitle: unitStandard.title
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Created ${createdAssessments.length} assessments for student`,
        studentId,
        groupName: group.name,
        assessmentsCreated: createdAssessments
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Auto-create assessments error:', error);
    return NextResponse.json(
      { error: 'Failed to create assessments' },
      { status: 500 }
    );
  }
}

// PUT - Mark/grade an assessment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      assessmentId,
      score,
      result,
      feedback,
      type = 'FORMATIVE',
      method = 'KNOWLEDGE'
    } = body;

    if (!assessmentId) {
      return NextResponse.json(
        { error: 'assessmentId is required' },
        { status: 400 }
      );
    }

    // Validate score range if provided
    if (score !== undefined && (score < 0 || score > 100)) {
      return NextResponse.json(
        { error: 'Score must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Validate result options
    const validResults = ['COMPETENT', 'NOT_YET_COMPETENT', 'PENDING'];
    if (result && !validResults.includes(result)) {
      return NextResponse.json(
        { error: 'Invalid result. Must be COMPETENT, NOT_YET_COMPETENT, or PENDING' },
        { status: 400 }
      );
    }

    const assessment = await prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        score,
        result: result || 'PENDING',
        feedback,
        type,
        method,
        assessedDate: result ? new Date() : undefined,
        moderationStatus: result === 'COMPETENT' ? 'APPROVED' : 'PENDING'
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        unitStandard: { select: { code: true, title: true, credits: true } }
      }
    });

    // If marked as competent, update student progress
    if (result === 'COMPETENT') {
      await prisma.unitStandardProgress.upsert({
        where: {
          studentId_unitStandardId: {
            studentId: assessment.studentId,
            unitStandardId: assessment.unitStandardId
          }
        },
        create: {
          studentId: assessment.studentId,
          unitStandardId: assessment.unitStandardId,
          status: 'COMPLETED',
          completionDate: new Date(),
          summativePassed: true
        },
        update: {
          status: 'COMPLETED',
          completionDate: new Date(),
          summativePassed: true
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Assessment marked successfully',
      assessment: {
        id: assessment.id,
        studentName: `${assessment.student.firstName} ${assessment.student.lastName}`,
        unitStandard: assessment.unitStandard.code,
        score: assessment.score,
        result: assessment.result,
        feedback: assessment.feedback,
        markedAt: assessment.assessedDate
      }
    });

  } catch (error) {
    console.error('Mark assessment error:', error);
    return NextResponse.json(
      { error: 'Failed to mark assessment' },
      { status: 500 }
    );
  }
}

// GET - Fetch assessments for marking
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const status = searchParams.get('status') || 'PENDING';
    const unitStandardId = searchParams.get('unitStandardId');

    const whereClause: any = {};

    if (groupId) {
      whereClause.student = { groupId };
    }

    if (status) {
      whereClause.result = status;
    }

    if (unitStandardId) {
      whereClause.unitStandardId = unitStandardId;
    }

    const assessments = await prisma.assessment.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
            group: { select: { name: true } }
          }
        },
        unitStandard: {
          select: {
            id: true,
            code: true,
            title: true,
            credits: true
          }
        }
      },
      orderBy: [
        { student: { lastName: 'asc' } },
        { student: { firstName: 'asc' } }
      ]
    });

    return NextResponse.json({
      success: true,
      assessments: assessments.map(a => ({
        id: a.id,
        studentId: a.student.studentId,
        studentName: `${a.student.firstName} ${a.student.lastName}`,
        groupName: a.student.group.name,
        unitStandard: `${a.unitStandard.code} - ${a.unitStandard.title}`,
        type: a.type,
        method: a.method,
        result: a.result,
        score: a.score,
        feedback: a.feedback,
        status: a.result === 'PENDING' ? 'Awaiting Marking' : 'Marked',
        dueDate: a.dueDate
      })),
      total: assessments.length
    });

  } catch (error) {
    console.error('Get assessments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}
