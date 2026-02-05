import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';

// GET /api/poe - Get POE checklist for all students or a specific student
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const groupId = searchParams.get('groupId');

    const poeChecklists = await prisma.pOEChecklist.findMany({
      where: {
        ...(studentId && { studentId }),
        ...(groupId && { student: { groupId } }),
      },
      include: {
        student: {
          include: {
            group: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return successResponse(poeChecklists);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/poe - Create POE checklist for a student
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.studentId) {
      return errorResponse('Student ID is required', 400);
    }

    const poeChecklist = await prisma.pOEChecklist.create({
      data: {
        studentId: body.studentId,
        module1POE: body.module1POE || false,
        module2POE: body.module2POE || false,
        module3POE: body.module3POE || false,
        module4POE: body.module4POE || false,
        module5POE: body.module5POE || false,
        module6POE: body.module6POE || false,
        assessmentSigned: body.assessmentSigned || false,
        logbookComplete: body.logbookComplete || false,
        idCopy: body.idCopy || false,
        contractSigned: body.contractSigned || false,
        inductionComplete: body.inductionComplete || false,
        workplaceAgreement: body.workplaceAgreement || false,
        notes: body.notes,
      },
      include: {
        student: true,
      },
    });

    return successResponse(poeChecklist, 'POE checklist created successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/poe - Update POE checklist
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, studentId, ...data } = body;

    let poeChecklist;

    if (id) {
      // Update by ID
      poeChecklist = await prisma.pOEChecklist.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          student: {
            include: { group: true },
          },
        },
      });
    } else if (studentId) {
      // Update by studentId (upsert)
      poeChecklist = await prisma.pOEChecklist.upsert({
        where: { studentId },
        update: {
          ...data,
          updatedAt: new Date(),
        },
        create: {
          studentId,
          ...data,
        },
        include: {
          student: {
            include: { group: true },
          },
        },
      });
    } else {
      return errorResponse('ID or Student ID is required', 400);
    }

    return successResponse(poeChecklist, 'POE checklist updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/poe
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('POE checklist ID is required', 400);
    }

    await prisma.pOEChecklist.delete({
      where: { id },
    });

    return successResponse(null, 'POE checklist deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
