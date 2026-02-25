/**
 * Admin Backup Download API
 * 
 * GET /api/admin/backup/[filename] - Download specific backup file
 * 
 * Authorization: ADMIN role required
 * 
 * NOTE: File-based backups are disabled in serverless environments (Vercel).
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Detect serverless environment
const IS_SERVERLESS = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY;

// ============================================
// AUTHORIZATION CHECK
// ============================================

async function checkAdminAuth(request: NextRequest): Promise<{ authorized: boolean; user?: any; error?: string }> {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value;

    if (!token) {
      return { authorized: false, error: 'No authentication token provided' };
    }

    const decoded = await verifyToken(token);
    
    if (!decoded || decoded.role !== 'ADMIN') {
      return { authorized: false, error: 'Admin privileges required' };
    }

    return { authorized: true, user: decoded };
  } catch (error: any) {
    return { authorized: false, error: 'Invalid or expired token' };
  }
}

// ============================================
// GET - DOWNLOAD BACKUP FILE
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  // Check authorization
  const auth = await checkAdminAuth(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: 401 }
    );
  }

  // Return early if serverless
  if (IS_SERVERLESS) {
    return NextResponse.json({
      error: 'File-based backups are not supported in serverless deployments'
    }, { status: 501 });
  }

  try {
    const filename = params.filename;

    // Security: Prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }

    // Only require modules in non-serverless environment
    const fs = require('fs');
    const path = require('path');
    const BACKUP_DIR = path.join(process.cwd(), 'backups', 'postgresql');
    const backupPath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(backupPath)) {
      return NextResponse.json(
        { error: 'Backup file not found' },
        { status: 404 }
      );
    }

    // Read file
    const fileBuffer = fs.readFileSync(backupPath);
    const stats = fs.statSync(backupPath);

    // Determine content type
    let contentType = 'application/octet-stream';
    if (filename.endsWith('.sql')) {
      contentType = 'application/sql';
    } else if (filename.endsWith('.gz')) {
      contentType = 'application/gzip';
    } else if (filename.endsWith('.enc')) {
      contentType = 'application/encrypted';
    }

    console.log(`[BACKUP] Download: ${filename} by ${auth.user?.email || 'admin'}`);

    // Return file as download
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('Error downloading backup:', error);
    return NextResponse.json(
      { error: 'Failed to download backup', details: error.message },
      { status: 500 }
    );
  }
}
