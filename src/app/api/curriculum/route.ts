import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const modules = await prisma.module.findMany({
      where: { 
        OR: [
          { status: 'NOT_STARTED' },
          { status: 'IN_PROGRESS' },
          { status: 'COMPLETED' }
        ]
      },
      include: {
        unitStandards: {
          include: {
            activities: true,
          },
        },
        documents: true,
      },
      orderBy: { order: 'asc' },
    });

    return Response.json({ data: modules });
  } catch (error) {
    console.error('Error fetching curriculum:', error);
    return Response.json(
      { error: 'Failed to fetch curriculum' },
      { status: 500 }
    );
  }
}
