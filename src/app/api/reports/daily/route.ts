import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { date, groupIds, facilitator, groupTrainingData, observations, challengesFaced } = body;

        if (!date || !groupIds || !Array.isArray(groupIds) || groupIds.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Date and Group IDs array are required' },
                { status: 400 }
            );
        }

        if (groupIds.length > 10) {
            return NextResponse.json(
                { success: false, error: 'Maximum 10 groups can be selected' },
                { status: 400 }
            );
        }

        const reportDate = new Date(date);
        const start = startOfDay(reportDate);
        const end = endOfDay(reportDate);

        // Fetch all groups and their students
        const groupsData = await prisma.group.findMany({
            where: {
                id: { in: groupIds }
            },
            include: {
                students: {
                    where: { status: 'ACTIVE' },
                    orderBy: { lastName: 'asc' }
                }
            }
        });

        if (groupsData.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No groups found' },
                { status: 404 }
            );
        }

        // Process each group separately
        const groups = await Promise.all(groupsData.map(async (group) => {
            const studentsWithAttendance = await prisma.student.findMany({
                where: {
                    groupId: group.id,
                    status: 'ACTIVE',
                },
                include: {
                    attendance: {
                        where: {
                            date: {
                                gte: start,
                                lte: end
                            }
                        }
                    }
                },
                orderBy: { lastName: 'asc' }
            });

            const attendanceData = {
                present: [] as string[],
                absent: [] as { name: string; reason: string }[],
                late: [] as { name: string; arrivalTime: string }[],
            };

            studentsWithAttendance.forEach(student => {
                const name = `${student.firstName} ${student.lastName}`;
                if (!student.attendance || student.attendance.length === 0) {
                    attendanceData.absent.push({ name, reason: 'No Record' });
                } else {
                    const record = student.attendance[0];
                    if (record.status === 'PRESENT') {
                        attendanceData.present.push(name);
                    } else if (record.status === 'ABSENT') {
                        attendanceData.absent.push({ name: name, reason: record.notes || 'No Reason Provided' });
                    } else if (record.status === 'LATE') {
                        attendanceData.late.push({ name: name, arrivalTime: 'Unknown' });
                    }
                }
            });

            // Fetch Formative Completions for this group on this date
            const formativesCompleted = await prisma.formativeCompletion.findMany({
                where: {
                    student: { groupId: group.id },
                    completedDate: {
                        gte: start,
                        lte: end
                    },
                    passed: true
                },
                include: {
                    student: true,
                    formative: true
                }
            });

            const formattedFormatives = formativesCompleted.map(fc => ({
                studentName: `${fc.student.firstName} ${fc.student.lastName}`,
                formativeCode: fc.formative.code,
                title: fc.formative.title
            }));

            // Get per-group training data
            const groupData = groupTrainingData[group.id] || {
                modulesCovered: 'N/A',
                topicsCovered: 'N/A',
                activitiesCompleted: []
            };

            return {
                groupName: group.name,
                groupId: group.id,
                attendance: attendanceData,
                assessments: formattedFormatives,
                training: {
                    modulesCovered: groupData.modulesCovered || 'N/A',
                    topicsCovered: groupData.topicsCovered || 'N/A',
                    activitiesCompleted: groupData.activitiesCompleted || [],
                },
                notes: {
                    observations,
                    challengesFaced,
                }
            };
        }));

        // Construct the response data structure
        const reportData = {
            meta: {
                date: reportDate,
                facilitator,
            },
            groups: groups
        };

        return NextResponse.json({ success: true, data: reportData });

    } catch (error) {
        console.error('Error fetching daily report data:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch report data' },
            { status: 500 }
        );
    }
}
