import { NextRequest } from 'next/server';
import { getDocumentRecommendations, summarizeProgress } from '@/lib/ai/cohere';
import { searchDocuments } from '@/lib/ai/pinecone';
import prisma from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');

        if (!studentId) {
            return Response.json(
                { success: false, error: 'Student ID is required' },
                { status: 400 }
            );
        }

        // Get student with progress data
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                currentModule: true,
                moduleProgress: {
                    include: { module: true },
                    orderBy: { module: { moduleNumber: 'asc' } },
                },
                unitStandardProgress: {
                    include: { unitStandard: true },
                },
                assessments: {
                    include: { unitStandard: true },
                    orderBy: { assessedDate: 'desc' },
                    take: 10,
                },
            },
        });

        if (!student) {
            return Response.json(
                { success: false, error: 'Student not found' },
                { status: 404 }
            );
        }

        // Determine current module
        const currentModule = student.currentModule?.name || 'Module 1 - Numeracy';

        // Find completed topics (unit standards)
        const completedTopics = student.unitStandardProgress
            .filter((usp) => usp.status === 'COMPLETED')
            .map((usp) => usp.unitStandard.title);

        // Find struggling areas (assessments where student is NOT_YET_COMPETENT)
        const strugglingAreas = student.assessments
            .filter((a) => a.result === 'NOT_YET_COMPETENT')
            .slice(0, 5)
            .map((a) => a.unitStandard.title);

        // Get AI-powered document recommendations
        const recommendations = await getDocumentRecommendations(
            currentModule,
            completedTopics,
            strugglingAreas
        );

        // Search for relevant documents based on recommendations
        const recommendedDocuments = await Promise.all(
            recommendations.slice(0, 3).map(async (rec) => {
                const docs = await searchDocuments(rec.topic, 2);
                return {
                    topic: rec.topic,
                    reason: rec.reason,
                    priority: rec.priority,
                    documents: docs.map((d) => ({
                        id: d.id,
                        filename: d.metadata.filename,
                        category: d.metadata.category,
                        moduleName: d.metadata.moduleName,
                        preview: d.content.substring(0, 150) + '...',
                        relevanceScore: d.score,
                    })),
                };
            })
        );

        // Get progress summary
        const moduleProgressData = student.moduleProgress.map((mp) => ({
            moduleName: mp.module.name,
            progress: mp.progress,
            status: mp.status,
            completedUnitStandards: student.unitStandardProgress.filter(
                (usp) => usp.unitStandard.moduleId === mp.moduleId && usp.status === 'COMPLETED'
            ).length,
            totalUnitStandards: student.unitStandardProgress.filter(
                (usp) => usp.unitStandard.moduleId === mp.moduleId
            ).length ||
                // Fallback: estimate based on module
                Math.ceil(mp.module.credits / 3),
        }));

        const recentAssessments = student.assessments.slice(0, 5).map((a) => ({
            unitStandard: a.unitStandard.title,
            result: a.result || 'PENDING',
            type: a.type,
            date: a.assessedDate?.toISOString().split('T')[0] || 'Not assessed',
        }));

        const progressSummary = await summarizeProgress(
            `${student.firstName} ${student.lastName}`,
            moduleProgressData,
            recentAssessments
        );

        return successResponse({
            student: {
                id: student.id,
                name: `${student.firstName} ${student.lastName}`,
                currentModule,
                overallProgress: student.progress,
                totalCreditsEarned: student.totalCreditsEarned,
            },
            recommendations: recommendedDocuments,
            progressSummary,
            stats: {
                completedUnitStandards: completedTopics.length,
                pendingAssessments: student.assessments.filter((a) => a.result === 'PENDING').length,
                recentSuccessRate: student.assessments.filter((a) => a.result === 'COMPETENT').length /
                    Math.max(student.assessments.length, 1) * 100,
            },
        });
    } catch (error) {
        console.error('Recommendations error:', error);
        return handleApiError(error);
    }
}
