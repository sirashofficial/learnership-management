import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { groupIds, targetGroupName } = await request.json();

    if (!groupIds || !Array.isArray(groupIds) || groupIds.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 groups are required for merging' },
        { status: 400 }
      );
    }

    if (!targetGroupName || !targetGroupName.trim()) {
      return NextResponse.json(
        { error: 'Target group name is required' },
        { status: 400 }
      );
    }

    // Get all groups to merge
    const groupsToMerge = await prisma.group.findMany({
      where: {
        id: { in: groupIds }
      },
      include: {
        students: true,
        company: true
      }
    });

    if (groupsToMerge.length !== groupIds.length) {
      return NextResponse.json(
        { error: 'Some groups were not found' },
        { status: 404 }
      );
    }

    // Use the company from the first group
    const primaryCompanyId = groupsToMerge[0].companyId;

    // Create the new merged group
    const mergedGroup = await prisma.group.create({
      data: {
        name: targetGroupName.trim(),
        companyId: primaryCompanyId,
        startDate: groupsToMerge[0].startDate,
        endDate: groupsToMerge[0].endDate,
        status: 'ACTIVE',
        notes: `Merged from groups: ${groupsToMerge.map((g: any) => g.name).join(', ')}`
      }
    });

    // Get all student IDs from all groups
    const allStudentIds = groupsToMerge.flatMap((group: any) => 
      group.students.map((student: any) => student.id)
    );

    // Move all students to the new group
    if (allStudentIds.length > 0) {
      await prisma.student.updateMany({
        where: {
          id: { in: allStudentIds }
        },
        data: {
          groupId: mergedGroup.id
        }
      });
    }

    // Archive the old groups
    await prisma.group.updateMany({
      where: {
        id: { in: groupIds }
      },
      data: {
        status: 'ARCHIVED',
        notes: `Archived after merging into: ${targetGroupName.trim()}`
      }
    });

    return NextResponse.json({
      success: true,
      mergedGroup,
      totalStudentsMoved: allStudentIds.length,
      archivedGroups: groupsToMerge.length
    });
  } catch (error) {
    console.error('Error merging groups:', error);
    return NextResponse.json(
      { error: 'Failed to merge groups' },
      { status: 500 }
    );
  }
}
