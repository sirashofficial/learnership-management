import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';

// GET /api/assessments/templates - Get assessment templates
export async function GET(request: NextRequest) {
  try {
    // Return predefined templates
    const templates = [
      {
        id: 'formative-knowledge',
        name: 'Formative Knowledge Assessment',
        type: 'FORMATIVE',
        method: 'KNOWLEDGE',
        description: 'Standard formative assessment for knowledge testing',
      },
      {
        id: 'formative-practical',
        name: 'Formative Practical Assessment',
        type: 'FORMATIVE',
        method: 'PRACTICAL',
        description: 'Hands-on practical assessment',
      },
      {
        id: 'summative-integrated',
        name: 'Summative Integrated Assessment',
        type: 'SUMMATIVE',
        method: 'PRACTICAL',
        description: 'Final integrated summative assessment',
      },
      {
        id: 'portfolio-assessment',
        name: 'Portfolio of Evidence',
        type: 'INTEGRATED',
        method: 'PORTFOLIO',
        description: 'Portfolio-based assessment with collected evidence',
      },
      {
        id: 'workplace-observation',
        name: 'Workplace Observation',
        type: 'FORMATIVE',
        method: 'OBSERVATION',
        description: 'On-site workplace observation assessment',
      },
    ];

    return successResponse(templates);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/assessments/templates - Create assessments from template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, studentIds, unitStandard, module, dueDate, unitStandardId, notes } = body;

    if (!templateId || !studentIds || !Array.isArray(studentIds)) {
      return errorResponse('Template ID and student IDs are required', 400);
    }

    // Get template configuration
    const templates: any = {
      'formative-knowledge': { type: 'FORMATIVE', method: 'KNOWLEDGE' },
      'formative-practical': { type: 'FORMATIVE', method: 'PRACTICAL' },
      'summative-integrated': { type: 'SUMMATIVE', method: 'PRACTICAL' },
      'portfolio-assessment': { type: 'INTEGRATED', method: 'PORTFOLIO' },
      'workplace-observation': { type: 'FORMATIVE', method: 'OBSERVATION' },
    };

    const template = templates[templateId];
    if (!template) {
      return errorResponse('Invalid template ID', 400);
    }

    // Create assessments for all students using template
    const assessments = await Promise.all(
      studentIds.map((studentId: string) =>
        prisma.assessment.create({
          data: {
            studentId,
            type: template.type,
            method: template.method,
            dueDate: new Date(dueDate),
            unitStandardId,
            notes,
            attemptNumber: 1,
            moderationStatus: 'PENDING',
          },
          include: {
            student: {
              include: { group: true },
            },
          },
        })
      )
    );

    return successResponse(assessments, `Created ${assessments.length} assessments from template`);
  } catch (error) {
    return handleApiError(error);
  }
}
