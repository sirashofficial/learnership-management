import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  // With JWT, logout is handled client-side by removing the token
  // This endpoint exists for consistency and future session management
  return successResponse(null, 'Logout successful');
}
