/**
 * Admin Backup Download API
 * 
 * GET /api/admin/backup/[filename] - Download specific backup file
 * 
 * Authorization: ADMIN role required
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import * as fs from 'fs';
import * as path from 'path';

const BACKUP_DIR = path.join(process.cwd(), 'backups', 'postgresql');

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

  try {
    const filename = params.filename;

    // Security: Prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }

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
