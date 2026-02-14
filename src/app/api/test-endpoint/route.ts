import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    return NextResponse.json({ message: 'Test GET works', method: 'GET' });
}

export async function POST(request: NextRequest) {
    console.log('🟢 TEST POST HANDLER CALLED');
    try {
        const body = await request.json();
        console.log('🟢 Body received:', body);
        return NextResponse.json({ message: 'Test POST works', method: 'POST', receivedBody: body }, { status: 200 });
    } catch (error) {
        console.log('🟢 Error in test POST:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
