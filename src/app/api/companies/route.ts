import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';

// GET /api/companies
export async function GET(request: NextRequest) {
  try {
    const companies = await prisma.company.findMany({
      include: {
        groups: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        _count: {
          select: { groups: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return successResponse(companies);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/companies
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const company = await prisma.company.create({
      data: {
        name: body.name,
        contactPerson: body.contactPerson,
        email: body.email,
        phone: body.phone,
        address: body.address,
        industry: body.industry,
      },
    });

    return successResponse(company, 'Company created successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/companies
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return errorResponse('Company ID is required', 400);
    }

    const company = await prisma.company.update({
      where: { id },
      data,
    });

    return successResponse(company, 'Company updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/companies
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('Company ID is required', 400);
    }

    // Check if company has groups
    const groupCount = await prisma.group.count({
      where: { companyId: id },
    });

    if (groupCount > 0) {
      return errorResponse(
        `Cannot delete company. There are ${groupCount} groups associated with this company.`,
        400
      );
    }

    await prisma.company.delete({
      where: { id },
    });

    return successResponse(null, 'Company deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
