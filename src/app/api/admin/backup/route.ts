/**
 * Admin Backup Management API
 * 
 * Endpoints:
 * - POST /api/admin/backup - Trigger manual backup
 * - GET /api/admin/backup - List available backups
 * - GET /api/admin/backup/[filename] - Download backup
 * 
 * Authorization: ADMIN role required
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import * as fs from 'fs';
import * as path from 'path';

// Backup metadata interface
interface BackupMetadata {
  filename: string;
  timestamp: string;
  type: 'daily' | 'monthly';
  size: number;
  checksum: string;
  encrypted: boolean;
  compressed: boolean;
  databaseName: string;
  rowCounts?: Record<string, number>;
  duration: number;
  success: boolean;
  error?: string;
}

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
// GET - LIST AVAILABLE BACKUPS
// ============================================

export async function GET(request: NextRequest) {
  // Check authorization
  const auth = await checkAdminAuth(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: 401 }
    );
  }

  try {
    const indexPath = path.join(BACKUP_DIR, 'backup-index.json');
    
    if (!fs.existsSync(indexPath)) {
      return NextResponse.json({
        backups: [],
        total: 0,
        message: 'No backups found'
      });
    }

    const index: BackupMetadata[] = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    
    // Sort by timestamp (newest first)
    const sortedBackups = index
      .filter(b => b.success)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Calculate storage statistics
    const totalSize = sortedBackups.reduce((sum, b) => sum + b.size, 0);
    const dailyBackups = sortedBackups.filter(b => b.type === 'daily').length;
    const monthlyBackups = sortedBackups.filter(b => b.type === 'monthly').length;

    return NextResponse.json({
      backups: sortedBackups,
      total: sortedBackups.length,
      statistics: {
        totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
        dailyBackups,
        monthlyBackups,
        oldestBackup: sortedBackups[sortedBackups.length - 1]?.timestamp,
        newestBackup: sortedBackups[0]?.timestamp,
      },
      message: `Found ${sortedBackups.length} successful backups`
    });
  } catch (error: any) {
    console.error('Error listing backups:', error);
    return NextResponse.json(
      { error: 'Failed to list backups', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================
// POST - TRIGGER MANUAL BACKUP
// ============================================

export async function POST(request: NextRequest) {
  // Check authorization
  const auth = await checkAdminAuth(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const backupType = body.type === 'monthly' ? 'monthly' : 'daily';

    console.log(`[BACKUP] Manual backup triggered by ${auth.user?.email || 'admin'}`);
    console.log(`[BACKUP] Type: ${backupType}`);

  // Perform backup (this may take several minutes)
  // Dynamic import to avoid module resolution issues
  const backupModule = await import(path.join(process.cwd(), 'scripts', 'backup-automated'));
  const metadata = await backupModule.performBackup(backupType);

    // Generate download link
    const downloadUrl = `/api/admin/backup/${metadata.filename}`;

    return NextResponse.json({
      success: true,
      message: 'Backup completed successfully',
      backup: {
        filename: metadata.filename,
        timestamp: metadata.timestamp,
        type: metadata.type,
        size: metadata.size,
        sizeMB: (metadata.size / 1024 / 1024).toFixed(2),
        checksum: metadata.checksum,
        encrypted: metadata.encrypted,
        compressed: metadata.compressed,
        rowCounts: metadata.rowCounts,
        duration: metadata.duration,
        durationSeconds: (metadata.duration / 1000).toFixed(1),
      },
      downloadUrl,
    });
  } catch (error: any) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create backup', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - REMOVE OLD BACKUP
// ============================================

export async function DELETE(request: NextRequest) {
  // Check authorization
  const auth = await checkAdminAuth(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename parameter required' },
        { status: 400 }
      );
    }

    // Security: Prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }

    const backupPath = path.join(BACKUP_DIR, filename);
    const metaPath = `${backupPath}.meta.json`;

    if (!fs.existsSync(backupPath)) {
      return NextResponse.json(
        { error: 'Backup file not found' },
        { status: 404 }
      );
    }

    // Delete backup file
    fs.unlinkSync(backupPath);
    
    // Delete metadata file if exists
    if (fs.existsSync(metaPath)) {
      fs.unlinkSync(metaPath);
    }

    // Update index
    const indexPath = path.join(BACKUP_DIR, 'backup-index.json');
    if (fs.existsSync(indexPath)) {
      let index: BackupMetadata[] = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      index = index.filter(b => b.filename !== filename);
      fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
    }

    console.log(`[BACKUP] Deleted backup: ${filename} by ${auth.user?.email || 'admin'}`);

    return NextResponse.json({
      success: true,
      message: `Backup ${filename} deleted successfully`
    });
  } catch (error: any) {
    console.error('Error deleting backup:', error);
    return NextResponse.json(
      { error: 'Failed to delete backup', details: error.message },
      { status: 500 }
    );
  }
}
