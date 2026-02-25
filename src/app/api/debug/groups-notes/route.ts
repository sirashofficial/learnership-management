import { NextResponse, NextRequest } from 'next/server';
import path from 'path';
import prisma from '@/lib/prisma';
import { withAuth, withRateLimit } from '@/middleware/apiAuth';

const resolveSqlitePath = (databaseUrl?: string) => {
  if (!databaseUrl || !databaseUrl.startsWith('file:')) {
    return null;
  }

  const rawPath = databaseUrl.slice('file:'.length);

  if (!rawPath) {
    return null;
  }

  if (/^[A-Za-z]:[\\/]/.test(rawPath) || rawPath.startsWith('/')) {
    return rawPath;
  }

  return path.resolve(process.cwd(), rawPath);
};

// Temporary debug endpoint: GET /api/debug/groups-notes
async function handleGet(request: NextRequest) {
  try {
    const groups = await prisma.group.findMany({
      select: {
        id: true,
        name: true,
        notes: true,
      },
      orderBy: { name: 'asc' },
    });

    const databaseUrl = process.env.DATABASE_URL;

    return NextResponse.json({
      success: true,
      data: groups,
      debug: {
        databaseUrl: databaseUrl ?? null,
        resolvedSqlitePath: resolveSqlitePath(databaseUrl),
        cwd: process.cwd(),
      },
    });
  } catch (error) {
    console.error('GET /api/debug/groups-notes error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch group notes' }, { status: 500 });
  }
}

export const GET = withAuth(withRateLimit(handleGet, 'generous'), ['ADMIN']);
