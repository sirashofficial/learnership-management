/**
 * Database Monitoring & Health Check
 * Used during gradual traffic shift and post-cutover
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DatabaseHealthMonitor {
  private checks: Map<string, HealthCheck> = new Map();
  private logPath: string;

  constructor() {
    this.logPath = path.join(__dirname, '../logs/health-check.log');
  }

  async checkConnectivity(prisma: PrismaClient): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  async checkRowCounts(prisma: PrismaClient): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    
    try {
      counts.users = await prisma.user.count();
      counts.students = await prisma.student.count();
      counts.assessments = await prisma.assessment.count();
      counts.attendance = await prisma.attendance.count();
    } catch (error) {
      console.error('Row count check failed:', error);
    }

    return counts;
  }

  async runHealthCheck(prisma: PrismaClient): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString();
    
    const connectivity = await this.checkConnectivity(prisma);
    const rowCounts = await this.checkRowCounts(prisma);

    const result: HealthCheckResult = {
      timestamp,
      database: process.env.DATABASE_URL?.includes('postgresql') ? 'PostgreSQL' : 'SQLite',
      connectivity,
      rowCounts,
      status: connectivity ? 'HEALTHY' : 'UNHEALTHY',
    };

    return result;
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] ${message}`;
    console.log(formatted);
    
    if (!fs.existsSync(path.dirname(this.logPath))) {
      fs.mkdirSync(path.dirname(this.logPath), { recursive: true });
    }
    
    fs.appendFileSync(this.logPath, formatted + '\n');
  }
}

interface HealthCheckResult {
  timestamp: string;
  database: 'SQLite' | 'PostgreSQL';
  connectivity: boolean;
  rowCounts: Record<string, number>;
  status: 'HEALTHY' | 'UNHEALTHY';
}

export interface HealthCheck {
  name: string;
  lastRun: Date;
  status: 'PASS' | 'FAIL';
  duration: number;
}
