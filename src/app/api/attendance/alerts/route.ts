import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { withAuth, withRateLimit } from '@/middleware/apiAuth';

// GET /api/attendance/alerts - Get attendance alerts
async function handleGet(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');
    const resolved = searchParams.get('resolved') === 'true';
    const unresolvedOnly = searchParams.get('unresolvedOnly') === 'true';

    const alerts = await prisma.attendanceAlert.findMany({
      where: {
        ...(studentId && { studentId }),
        ...(type && { type }),
        ...(severity && { severity }),
        ...(unresolvedOnly ? { resolved: false } : resolved !== null ? { resolved } : {}),
      },
      orderBy: [{ resolved: 'asc' }, { createdAt: 'desc' }],
      take: 100,
    });

    return successResponse(alerts);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/attendance/alerts - Create alert
async function handlePost(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, type, severity, message, details } = body;

    if (!studentId || !type || !severity || !message) {
      return errorResponse('Student ID, type, severity, and message are required', 400);
    }

    const alert = await prisma.attendanceAlert.create({
      data: {
        studentId,
        type,
        severity,
        message,
        details,
      },
    });

    return successResponse(alert, 'Alert created successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/attendance/alerts/:id - Resolve alert
async function handlePut(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, resolved, resolvedBy } = body;

    if (!id) {
      return errorResponse('Alert ID is required', 400);
    }

    const alert = await prisma.attendanceAlert.update({
      where: { id },
      data: {
        resolved: resolved ?? true,
        resolvedAt: new Date(),
        resolvedBy,
      },
    });

    return successResponse(alert, 'Alert updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/attendance/alerts/:id - Delete alert
async function handleDelete(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('Alert ID is required', 400);
    }

    await prisma.attendanceAlert.delete({
      where: { id },
    });

    return successResponse(null, 'Alert deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export const GET = withAuth(withRateLimit(handleGet, 'moderate'), ['ADMIN', 'FACILITATOR']);
export const POST = withAuth(withRateLimit(handlePost, 'strict'), ['ADMIN', 'FACILITATOR']);
export const PUT = withAuth(withRateLimit(handlePut, 'moderate'), ['ADMIN', 'FACILITATOR']);
export const DELETE = withAuth(withRateLimit(handleDelete, 'strict'), ['ADMIN']);
