import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api-utils';

// GET /api/reports/group-progress?groupId=xxx&format=csv
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const groupId = searchParams.get('groupId');
        const format = searchParams.get('format') || 'csv';

        if (!groupId) {
            return new Response('Group ID is required', { status: 400 });
        }

        // Fetch group with students and their progress
        const group = await prisma.group.findUnique({
            where: { id: groupId },
            include: {
                students: {
                    include: {
                        moduleProgress: {
                            include: {
                                module: true
                            }
                        },
                        assessments: {
                            where: {
                                result: 'COMPETENT',
                                moderationStatus: 'APPROVED'
                            },
                            include: {
                                unitStandard: true
                            }
                        }
                    }
                }
            }
        });

        if (!group) {
            return new Response('Group not found', { status: 404 });
        }

        // Get all modules for header
        const modules = await prisma.module.findMany({
            orderBy: { moduleNumber: 'asc' }
        });

        if (format === 'csv') {
            const Papa = require('papaparse');

            // Build CSV data
            const csvData = group.students.map((student: any) => {
                const row: any = {
                    'Student ID': student.studentId,
                    'First Name': student.firstName,
                    'Last Name': student.lastName,
                    'Total Credits': student.totalCreditsEarned || 0,
                    'Progress %': student.progress || 0,
                    'Status': student.status
                };

                // Add module-specific columns
                modules.forEach((module) => {
                    const moduleProgress = student.moduleProgress.find(
                        (mp: any) => mp.moduleId === module.id
                    );
                    row[`M${module.moduleNumber} Credits`] = moduleProgress?.creditsEarned || 0;
                    row[`M${module.moduleNumber} Status`] = moduleProgress?.status || 'NOT_STARTED';
                });

                // Calculate alert status
                const daysSinceEnrollment = Math.floor(
                    (Date.now() - new Date(student.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                );
                const expectedCredits = Math.min(
                    Math.floor((daysSinceEnrollment / 30) * 11.5),
                    138
                );
                const creditGap = expectedCredits - (student.totalCreditsEarned || 0);

                let alertStatus = 'On Track';
                if (creditGap > 20) alertStatus = 'At Risk';
                if (daysSinceEnrollment > 60 && (student.totalCreditsEarned || 0) === 0) {
                    alertStatus = 'Stalled';
                }

                row['Alert Status'] = alertStatus;
                row['Enrolled Date'] = new Date(student.createdAt).toLocaleDateString();

                return row;
            });

            const csv = Papa.unparse(csvData);

            return new Response(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="group-${group.name.replace(/[^a-z0-9]/gi, '_')}-progress-${new Date().toISOString().split('T')[0]}.csv"`
                }
            });
        }

        // JSON format
        return successResponse({
            group: {
                id: group.id,
                name: group.name,
                studentCount: group.students.length
            },
            students: group.students.map((student: any) => ({
                studentId: student.studentId,
                name: `${student.firstName} ${student.lastName}`,
                totalCredits: student.totalCreditsEarned || 0,
                progress: student.progress || 0,
                moduleProgress: student.moduleProgress
            }))
        });
    } catch (error) {
        return handleApiError(error);
    }
}
