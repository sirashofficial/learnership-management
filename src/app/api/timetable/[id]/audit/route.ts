import { NextRequest, NextResponse } from 'next/server';

import { withAuth, withRateLimit } from '@/middleware/apiAuth';

async function handleGet(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({ data: [] });
}
