/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const filter = searchParams.get('filter') || 'all'; // all, students, groups, courses

    if (!query || query.length === 0) {
      return successResponse({ results: [] });
    }

    const searchTerm = query.toLowerCase();
    const results: any[] = [];

    // Search Students
    if (filter === 'all' || filter === 'students') {
      const students = await prisma.student.findMany({
        where: {
          OR: [
            { firstName: { contains: searchTerm } },
            { lastName: { contains: searchTerm } },
            { studentId: { contains: searchTerm } },
            { email: { contains: searchTerm } },
            { idNumber: { contains: searchTerm } },
          ],
        },
        include: {
          group: {
            include: {
              company: true,
            },
          },
        },
        take: 10,
      });

      students.forEach((student: any) => {
        results.push({
          id: student.id,
          type: 'STUDENT',
          title: `${student.firstName} ${student.lastName}`,
          subtitle: `${student.studentId}${student.group ? ` • ${student.group.name}` : ''}`,
          description: student.group?.company?.name || null,
          status: student.status,
          progress: student.progress,
          data: {
            studentId: student.id,
            studentNumber: student.studentId,
            email: student.email,
            phone: student.phone,
            groupId: student.group?.id,
            groupName: student.group?.name,
            companyName: student.group?.company?.name,
          },
        });
      });
    }

    // Search Groups
    if (filter === 'all' || filter === 'groups') {
      const groups = await prisma.group.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm } },
            { location: { contains: searchTerm } },
            { coordinator: { contains: searchTerm } },
          ],
        },
        include: {
          company: true,
          _count: {
            select: { students: true },
          },
        },
        take: 10,
      });

      groups.forEach((group: any) => {
        results.push({
          id: group.id,
          type: 'GROUP',
          title: group.name,
          subtitle: `${group._count.students} student${group._count.students !== 1 ? 's' : ''}`,
          description: group.company?.name || null,
          status: group.status,
          data: {
            groupId: group.id,
            companyId: group.company?.id,
            companyName: group.company?.name,
            location: group.location,
            coordinator: group.coordinator,
            studentCount: group._count.students,
            startDate: group.startDate,
            endDate: group.endDate,
          },
        });
      });
    }

    // Search Courses/Modules
    if (filter === 'all' || filter === 'courses') {
      const modules = await prisma.module.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm } },
            { code: { contains: searchTerm } },
            { description: { contains: searchTerm } },
          ],
        },
        include: {
          _count: {
            select: { 
              unitStandards: true,
              progress: true,
            },
          },
        },
        take: 10,
      });

      modules.forEach((module: any) => {
        results.push({
          id: module.id,
          type: 'COURSE',
          title: module.name,
          subtitle: `${module.code} • ${module.credits} credits`,
          description: `${module._count.unitStandards} unit standard${module._count.unitStandards !== 1 ? 's' : ''}`,
          status: module.status,
          data: {
            moduleId: module.id,
            code: module.code,
            credits: module.credits,
            unitStandardCount: module._count.unitStandards,
            studentsEnrolled: module._count.progress,
          },
        });
      });
    }

    // Sort results: exact matches first, then by relevance
    const sortedResults = results.sort((a, b) => {
      const aExact = a.title.toLowerCase() === searchTerm;
      const bExact = b.title.toLowerCase() === searchTerm;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      const aStarts = a.title.toLowerCase().startsWith(searchTerm);
      const bStarts = b.title.toLowerCase().startsWith(searchTerm);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      return 0;
    });

    return successResponse({ 
      results: sortedResults,
      total: sortedResults.length,
      query,
      filter,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
