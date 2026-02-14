import { NextRequest, NextResponse } from 'next/server';

// Company model does not exist in schema - stub endpoints for compatibility
export async function GET(request: NextRequest) {
  return NextResponse.json([], { status: 200 });
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Company management not available' },
    { status: 501 }
  );
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: 'Company management not available' },
    { status: 501 }
  );
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { error: 'Company management not available' },
    { status: 501 }
  );
}
