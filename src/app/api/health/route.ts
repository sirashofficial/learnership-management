/**
 * System Health Check API
 * 
 * GET /api/health - Returns system health status
 * 
 * Checks:
 * - Database connectivity
 * - Disk space availability
 * - Backup freshness (last backup timestamp)
 * - Response time
 * - Database query performance
 * 
 * Returns:
 * - 200 OK: All systems operational
 * - 503 Service Unavailable: Critical issues detected
 * 
 * Suitable for uptime monitoring services like UptimeRobot
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const BACKUP_DIR = path.join(process.cwd(), 'backups', 'postgresql');
const MAX_BACKUP_AGE_HOURS = 25; // Alert if no backup in 25 hours (daily backups at 2 AM)

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: {
      status: 'ok' | 'error';
      message: string;
      responseTime?: number;
      rowCount?: number;
    };
    diskSpace: {
      status: 'ok' | 'warning' | 'error';
      message: string;
      available?: string;
      used?: string;
      percentUsed?: number;
    };
    backups: {
      status: 'ok' | 'warning' | 'error';
      message: string;
      lastBackup?: string;
      hoursAgo?: number;
      totalBackups?: number;
    };
  };
  uptime: number;
  rto: string;
  rpo: string;
}

// ============================================
// DATABASE HEALTH CHECK
// ============================================

async function checkDatabaseHealth(): Promise<HealthStatus['checks']['database']> {
  const prisma = new PrismaClient();
  
  try {
    const startTime = Date.now();
    
    // Test connection
    await prisma.$connect();
    
    // Run a simple query to verify database is responsive
    const userCount = await prisma.user.count();
    
    const responseTime = Date.now() - startTime;
    
    await prisma.$disconnect();
    
    return {
      status: 'ok',
      message: 'Database is connected and responsive',
      responseTime,
      rowCount: userCount,
    };
  } catch (error: any) {
    console.error('[HEALTH] Database check failed:', error);
    
    try {
      await prisma.$disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
    
    return {
      status: 'error',
      message: `Database connection failed: ${error.message}`,
    };
  }
}

// ============================================
// DISK SPACE CHECK
// ============================================

function checkDiskSpace(): HealthStatus['checks']['diskSpace'] {
  try {
    // Windows: Use wmic
    // Linux/Mac: Use df
    const isWindows = process.platform === 'win32';
    
    if (isWindows) {
      // Get drive letter from current working directory
      const drive = process.cwd().substring(0, 2);
      
      try {
        const output = execSync(`wmic logicaldisk where "DeviceID='${drive}' get FreeSpace,Size /format:csv`, {
          encoding: 'utf-8'
        });
        
        const lines = output.trim().split('\n').filter(line => line.trim() && !line.startsWith('Node'));
        
        if (lines.length > 0) {
          const parts = lines[0].split(',');
          if (parts.length >= 3) {
            const freeSpace = parseInt(parts[1]);
            const totalSpace = parseInt(parts[2]);
            const usedSpace = totalSpace - freeSpace;
            const percentUsed = (usedSpace / totalSpace) * 100;
            
            const freeGB = (freeSpace / 1024 / 1024 / 1024).toFixed(2);
            const totalGB = (totalSpace / 1024 / 1024 / 1024).toFixed(2);
            
            let status: 'ok' | 'warning' | 'error' = 'ok';
            let message = `${freeGB} GB available of ${totalGB} GB`;
            
            if (percentUsed > 90) {
              status = 'error';
              message = `Critical: Disk space is ${percentUsed.toFixed(1)}% full`;
            } else if (percentUsed > 80) {
              status = 'warning';
              message = `Warning: Disk space is ${percentUsed.toFixed(1)}% full`;
            }
            
            return {
              status,
              message,
              available: `${freeGB} GB`,
              used: `${((totalSpace - freeSpace) / 1024 / 1024 / 1024).toFixed(2)} GB`,
              percentUsed: parseFloat(percentUsed.toFixed(1)),
            };
          }
        }
      } catch (error) {
        // Fallback: just check if we can write
        const testFile = path.join(process.cwd(), '.health-check-test');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        
        return {
          status: 'ok',
          message: 'Disk is writable (detailed info unavailable)',
        };
      }
    } else {
      // Linux/Mac: Use df
      const output = execSync(`df -h ${process.cwd()}`, { encoding: 'utf-8' });
      const lines = output.trim().split('\n');
      
      if (lines.length > 1) {
        const parts = lines[1].trim().split(/\s+/);
        const percentUsed = parseInt(parts[4]);
        
        let status: 'ok' | 'warning' | 'error' = 'ok';
        let message = `${parts[3]} available of ${parts[1]}`;
        
        if (percentUsed > 90) {
          status = 'error';
          message = `Critical: Disk space is ${percentUsed}% full`;
        } else if (percentUsed > 80) {
          status = 'warning';
          message = `Warning: Disk space is ${percentUsed}% full`;
        }
        
        return {
          status,
          message,
          available: parts[3],
          used: parts[2],
          percentUsed,
        };
      }
    }
    
    return {
      status: 'ok',
      message: 'Disk space check completed',
    };
  } catch (error: any) {
    console.error('[HEALTH] Disk space check failed:', error);
    return {
      status: 'warning',
      message: `Disk space check unavailable: ${error.message}`,
    };
  }
}

// ============================================
// BACKUP FRESHNESS CHECK
// ============================================

function checkBackupFreshness(): HealthStatus['checks']['backups'] {
  try {
    const indexPath = path.join(BACKUP_DIR, 'backup-index.json');
    
    if (!fs.existsSync(indexPath)) {
      return {
        status: 'error',
        message: 'No backups found',
        totalBackups: 0,
      };
    }
    
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    const successfulBackups = index.filter((b: any) => b.success);
    
    if (successfulBackups.length === 0) {
      return {
        status: 'error',
        message: 'No successful backups found',
        totalBackups: 0,
      };
    }
    
    // Find most recent backup
    const sortedBackups = successfulBackups.sort(
      (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    const lastBackup = sortedBackups[0];
    const lastBackupTime = new Date(lastBackup.timestamp);
    const hoursAgo = (Date.now() - lastBackupTime.getTime()) / (1000 * 60 * 60);
    
    let status: 'ok' | 'warning' | 'error' = 'ok';
    let message = `Last backup: ${lastBackupTime.toLocaleString()} (${hoursAgo.toFixed(1)}h ago)`;
    
    if (hoursAgo > MAX_BACKUP_AGE_HOURS) {
      status = 'error';
      message = `Critical: Last backup is ${hoursAgo.toFixed(1)} hours old`;
    } else if (hoursAgo > MAX_BACKUP_AGE_HOURS * 0.8) {
      status = 'warning';
      message = `Warning: Last backup is ${hoursAgo.toFixed(1)} hours old`;
    }
    
    return {
      status,
      message,
      lastBackup: lastBackup.timestamp,
      hoursAgo: parseFloat(hoursAgo.toFixed(1)),
      totalBackups: successfulBackups.length,
    };
  } catch (error: any) {
    console.error('[HEALTH] Backup check failed:', error);
    return {
      status: 'error',
      message: `Backup check failed: ${error.message}`,
    };
  }
}

// ============================================
// MAIN HEALTH CHECK
// ============================================

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  console.log('[HEALTH] Health check requested');
  
  // ============================================
  // AUTHENTICATION CHECK
  // ============================================
  // Verify Bearer token in Authorization header
  const authHeader = request.headers.get('Authorization');
  const expectedToken = process.env.HEALTH_CHECK_SECRET;
  
  if (!expectedToken) {
    console.error('[HEALTH] HEALTH_CHECK_SECRET not configured');
    return NextResponse.json(
      { error: 'Health check not configured' },
      { status: 500 }
    );
  }
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('[HEALTH] Unauthorized: Missing or invalid Authorization header');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  const token = authHeader.substring(7); // Remove "Bearer " prefix
  if (token !== expectedToken) {
    console.warn('[HEALTH] Unauthorized: Invalid token provided');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    // Run all health checks in parallel
    const [databaseCheck, diskSpaceCheck, backupCheck] = await Promise.all([
      checkDatabaseHealth(),
      Promise.resolve(checkDiskSpace()),
      Promise.resolve(checkBackupFreshness()),
    ]);
    
    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (
      databaseCheck.status === 'error' ||
      diskSpaceCheck.status === 'error' ||
      backupCheck.status === 'error'
    ) {
      overallStatus = 'unhealthy';
    } else if (
      diskSpaceCheck.status === 'warning' ||
      backupCheck.status === 'warning'
    ) {
      overallStatus = 'degraded';
    }
    
    const uptime = Date.now() - startTime;
    
    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: {
        database: databaseCheck,
        diskSpace: diskSpaceCheck,
        backups: backupCheck,
      },
      uptime,
      rto: '4 hours',
      rpo: '1 hour',
    };
    
    console.log(`[HEALTH] Status: ${overallStatus}`);
    
    // Return 200 for healthy/degraded, 503 for unhealthy
    const statusCode = overallStatus === 'unhealthy' ? 503 : 200;
    
    return NextResponse.json(healthStatus, { status: statusCode });
  } catch (error: any) {
    console.error('[HEALTH] Health check failed:', error);
    
    const healthStatus: HealthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: 'error',
          message: 'Health check failed',
        },
        diskSpace: {
          status: 'error',
          message: 'Health check failed',
        },
        backups: {
          status: 'error',
          message: 'Health check failed',
        },
      },
      uptime: Date.now() - startTime,
      rto: '4 hours',
      rpo: '1 hour',
    };
    
    return NextResponse.json(healthStatus, { status: 503 });
  }
}
