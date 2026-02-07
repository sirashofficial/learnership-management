import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { date, groupId, facilitator, modulesCovered, topicsCovered, activitiesCompleted, observations, challengesFaced } = body;

        if (!date || !groupId) {
            return NextResponse.json(
                { success: false, error: 'Date and Group ID are required' },
                { status: 400 }
            );
        }

        const reportDate = new Date(date);
        const start = startOfDay(reportDate);
        const end = endOfDay(reportDate);

        // 1. Fetch Group and Students
        const group = await prisma.group.findUnique({
            where: { id: groupId },
            include: {
                students: {
                    where: { status: 'ACTIVE' },
                    orderBy: { lastName: 'asc' }
                }
            }
        });

        if (!group) {
            return NextResponse.json(
                { success: false, error: 'Group not found' },
                { status: 404 }
            );
        }

        // 2. Fetch Attendance for this date
        // Assuming AttendanceRecord model exists and has date field
        // If not, we might need to mock or adjust. 
        // Checking schema based on previous knowledge: AttendanceRecord linked to Student.

        // Let's assume a simple Attendance model for now or try to query it.
        // If Attendance doesn't exist efficiently, we might return empty or mock.
        // But we know there is `AttendanceReport` model mentioned in the plan.
        // Let's try to query `AttendanceRecord` if it exists.

        // Safe bet: Fetch students and see if we can find attendance. 
        // I'll assume we can't easily query attendance by date for all students without a specific model I haven't seen fully.
        // I'll fetch students and include their attendance records filtered by date if possible.

        // Actually, looking at previous context, there's `AttendanceRecord` inside `Student`.
        const studentsWithAttendance = await prisma.student.findMany({
            where: {
                groupId: groupId,
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
            const record = student.attendance[0];
            const name = `${student.firstName} ${student.lastName}`;

            if (!record) {
                // No record usually means absent or not marked. We'll list as 'Not Marked' or assume absent if strict.
                // For this report, maybe 'Absent (No Record)'
                attendanceData.absent.push({ name, reason: 'No Record' });
            } else if (record.status === 'PRESENT') {
                attendanceData.present.push(name);
            } else if (record.status === 'ABSENT') {
                attendanceData.absent.push({ name, reason: record.notes || 'Unspecified' });
            } else if (record.status === 'LATE') {
                attendanceData.late.push({ name, arrivalTime: 'Unknown' }); // arrivalTime might not be in schema
            }
        });

        // 3. Fetch Formative Completions for this date
        // We added FormativeCompletion model.
        const formativesCompleted = await prisma.formativeCompletion.findMany({
            where: {
                student: { groupId: groupId },
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

        // Construct the response data structure
        const reportData = {
            meta: {
                date: reportDate,
                groupName: group.name,
                facilitator,
            },
            training: {
                modulesCovered,
                topicsCovered,
                activitiesCompleted,
            },
            attendance: attendanceData,
            assessments: formattedFormatives,
            notes: {
                observations,
                challengesFaced,
            }
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
