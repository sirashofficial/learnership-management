import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { createStudentSchema, updateStudentSchema } from '@/lib/validations';
// GET /api/students - Get all students or export CSV
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const status = searchParams.get('status');
    const format = searchParams.get('format'); // csv or json

    const students = await prisma.student.findMany({
      where: {
        ...(groupId && { groupId }),
        ...(status && { status: status as any }),
      },
      include: {
        group: {
          include: {
            company: true,
          },
        },
        facilitator: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Export as CSV if requested
    if (format === 'csv') {
      const Papa = require('papaparse');
      
      const csvData = students.map((student: any) => ({
        'Student ID': student.studentId,
        'First Name': student.firstName,
        'Last Name': student.lastName,
        'ID Number': student.idNumber,
        'Email': student.email || '',
        'Phone': student.phone || '',
        'Group': student.group?.name || '',
        'Status': student.status,
        'Progress': student.progress || 0,
        'Facilitator': student.facilitator?.name || '',
        'Created Date': new Date(student.createdAt).toLocaleDateString(),
      }));

      const csv = Papa.unparse(csvData);
      
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="students-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return successResponse(students);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/students - Create a new student
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📥 Received student creation request:', body);
    
    // Get user from token (if available)
    const authHeader = request.headers.get('Authorization');
    let currentUserId = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // For demo purposes, extract user from localStorage on client
      // In production, verify JWT token here
    }
    
    // Validate input
    console.log('🔍 Validating data with schema...');
    const validatedData = createStudentSchema.parse(body);
    console.log('✅ Validation passed:', validatedData);
    
    // Use facilitatorId from body, or get first user as fallback
    let facilitatorId = validatedData.facilitatorId || body.facilitatorId;
    
    if (!facilitatorId) {
      console.log('⚠️ No facilitatorId provided, looking for fallback user...');
      // Get first available user as facilitator
      const firstUser = await prisma.user.findFirst();
      if (!firstUser) {
        console.error('❌ No users found in database');
        return errorResponse('No facilitator available. Please create a user first.', 400);
      }
      facilitatorId = firstUser.id;
      console.log(`✅ Using fallback facilitator: ${firstUser.name} (${facilitatorId})`);
    }

    // Auto-generate student ID if not provided
    let studentId = validatedData.studentId;
    if (!studentId) {
      console.log('🔢 Generating student ID...');
      
      // Get the group to extract prefix
      const group = await prisma.group.findUnique({
        where: { id: validatedData.groupId },
      });
      
      if (!group) {
        return errorResponse('Group not found', 400);
      }
      
      // Generate prefix from group name (first 2 letters uppercase)
      const prefix = group.name
        .split(/[\s-]+/)[0] // Get first word
        .substring(0, 2)      // Take first 2 chars
        .toUpperCase();       // Make uppercase
      
      // Count existing students in this group
      const studentCount = await prisma.student.count({
        where: { groupId: validatedData.groupId },
      });
      
      // Generate ID: PREFIX-NUMBER (e.g., AZ-01, AZ-02)
      const number = String(studentCount + 1).padStart(2, '0');
      studentId = `${prefix}-${number}`;
      
      console.log(`✅ Generated student ID: ${studentId} (prefix: ${prefix}, count: ${studentCount + 1})`);
    }

    console.log('💾 Creating student in database...');
    const student = await prisma.student.create({
      data: {
        studentId,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        idNumber: validatedData.idNumber || null,
        groupId: validatedData.groupId,
        facilitatorId,
        status: validatedData.status || 'ACTIVE',
        progress: validatedData.progress || 0,
      },
      include: {
        group: {
          include: {
            company: true,
          },
        },
        facilitator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    console.log('✅ Student created successfully:', student.id);
    return successResponse(student, 'Student created successfully');
  } catch (error) {
    console.error('❌ Error creating student:', error);
    return handleApiError(error);
  }
}
