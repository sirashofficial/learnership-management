import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withRateLimit, getAuthContext } from '@/middleware/apiAuth';

// Company model does not exist in schema - stub endpoints for compatibility
async function handleGet(request: NextRequest) {
  return NextResponse.json([], { status: 200 });
}

async function handlePost(request: NextRequest) {
  return NextResponse.json(
    { error: 'Company management not available' },
    { status: 501 }
  );
}

async function handlePut(request: NextRequest) {
  return NextResponse.json(
    { error: 'Company management not available' },
    { status: 501 }
  );
}

async function handleDelete(request: NextRequest) {
  return NextResponse.json(
    { error: 'Company management not available' },
    { status: 501 }
  );
}

export const GET = withAuth(withRateLimit(handleGet, 'generous'), ['ADMIN', 'FACILITATOR']);
export const POST = withAuth(withRateLimit(handlePost, 'strict'), ['ADMIN']);
export const PUT = withAuth(withRateLimit(handlePut, 'strict'), ['ADMIN']);
export const DELETE = withAuth(withRateLimit(handleDelete, 'strict'), ['ADMIN']);
