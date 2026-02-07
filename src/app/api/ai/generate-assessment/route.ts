import { NextRequest } from 'next/server';
import { generateAssessmentQuestions } from '@/lib/ai/cohere';
import { searchDocuments } from '@/lib/ai/pinecone';
import prisma from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

interface GenerateRequest {
    unitStandardId?: string;
    unitStandardCode?: string;
    type: 'formative' | 'summative';
    count?: number;
}

export async function POST(request: NextRequest) {
    try {
        const body: GenerateRequest = await request.json();
        const { unitStandardId, unitStandardCode, type, count = 5 } = body;

        if (!unitStandardId && !unitStandardCode) {
            return Response.json(
                { success: false, error: 'Unit standard ID or code is required' },
                { status: 400 }
            );
        }

        if (!type || (type !== 'formative' && type !== 'summative')) {
            return Response.json(
                { success: false, error: 'Assessment type must be "formative" or "summative"' },
                { status: 400 }
            );
        }

        // Get the unit standard
        const unitStandard = await prisma.unitStandard.findFirst({
            where: unitStandardId
                ? { id: unitStandardId }
                : { code: unitStandardCode },
            include: {
                module: true,
            },
        });

        if (!unitStandard) {
            return Response.json(
                { success: false, error: 'Unit standard not found' },
                { status: 404 }
            );
        }

        // Search for relevant curriculum content
        const searchQuery = `${unitStandard.title} ${unitStandard.content || ''} ${unitStandard.module.name}`;
        const relevantDocs = await searchDocuments(searchQuery, 5, {
            moduleNumber: unitStandard.module.moduleNumber,
        });

        // Combine document content for context
        const contextContent = relevantDocs
            .map((doc) => doc.content)
            .join('\n\n---\n\n');

        // Generate assessment questions
        const questions = await generateAssessmentQuestions(
            unitStandard.code,
            unitStandard.title,
            contextContent || unitStandard.content || unitStandard.title,
            type,
            count
        );

        return successResponse({
            unitStandard: {
                id: unitStandard.id,
                code: unitStandard.code,
                title: unitStandard.title,
                credits: unitStandard.credits,
                level: unitStandard.level,
                module: unitStandard.module.name,
            },
            assessmentType: type,
            questions,
            metadata: {
                generatedAt: new Date().toISOString(),
                sourceDocuments: relevantDocs.length,
                questionCount: questions.length,
            },
        });
    } catch (error) {
        console.error('Assessment generation error:', error);
        return handleApiError(error);
    }
}

// GET endpoint to list available unit standards for assessment generation
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const moduleId = searchParams.get('moduleId');

        const whereClause = moduleId ? { moduleId } : {};

        const unitStandards = await prisma.unitStandard.findMany({
            where: whereClause,
            include: {
                module: {
                    select: {
                        id: true,
                        name: true,
                        moduleNumber: true,
                    },
                },
                _count: {
                    select: { assessments: true },
                },
            },
            orderBy: [
                { module: { moduleNumber: 'asc' } },
                { code: 'asc' },
            ],
        });

        const formattedUnitStandards = unitStandards.map((us) => ({
            id: us.id,
            code: us.code,
            title: us.title,
            credits: us.credits,
            level: us.level,
            type: us.type,
            module: {
                id: us.module.id,
                name: us.module.name,
                number: us.module.moduleNumber,
            },
            existingAssessments: us._count.assessments,
        }));

        // Group by module
        const groupedByModule = formattedUnitStandards.reduce((acc, us) => {
            const moduleKey = us.module.name;
            if (!acc[moduleKey]) {
                acc[moduleKey] = {
                    moduleId: us.module.id,
                    moduleName: moduleKey,
                    moduleNumber: us.module.number,
                    unitStandards: [],
                };
            }
            acc[moduleKey].unitStandards.push(us);
            return acc;
        }, {} as Record<string, { moduleId: string; moduleName: string; moduleNumber: number; unitStandards: typeof formattedUnitStandards }>);

        return successResponse({
            modules: Object.values(groupedByModule).sort((a, b) => a.moduleNumber - b.moduleNumber),
            totalUnitStandards: formattedUnitStandards.length,
        });
    } catch (error) {
        console.error('Get unit standards error:', error);
        return handleApiError(error);
    }
}
