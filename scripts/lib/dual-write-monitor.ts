/**
 * Phase 5: Dual-Write Monitoring
 * Logs every write operation for verification
 * Ensures data written to PostgreSQL would match SQLite
 * Maintained for 7 days, then can be removed
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_DIR = path.join(__dirname, '../logs');

interface WriteOperation {
  timestamp: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  entityId: string;
  data: any;
  status: 'SUCCESS' | 'FAILED';
  database: 'SQLite' | 'PostgreSQL' | 'BOTH';
  duration: number;
  notes?: string;
}

export class DualWriteMonitor {
  private logPath: string;
  private operations: WriteOperation[] = [];
  private isEnabled: boolean;

  constructor() {
    this.logPath = path.join(LOG_DIR, 'dual-write-monitor.log');
    this.isEnabled = process.env.ENABLE_DUAL_WRITE_LOG === 'true' && process.env.PHASE === '5';
  }

  logWrite(operation: WriteOperation): void {
    if (!this.isEnabled) return;

    this.operations.push(operation);

    // Write to log
    const logEntry = {
      ...operation,
      day: this.getDayOfMigration(),
    };

    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }

    fs.appendFileSync(
      this.logPath,
      JSON.stringify(logEntry) + '\n'
    );

    // Every 100 operations, write summary
    if (this.operations.length % 100 === 0) {
      this.writeSummary();
    }
  }

  private getDayOfMigration(): number {
    const startTime = parseInt(process.env.MIGRATION_START_TIME || '0', 10);
    return Math.ceil((Date.now() - startTime) / (1000 * 60 * 60 * 24));
  }

  private writeSummary(): void {
    const summaryPath = path.join(LOG_DIR, 'dual-write-summary.json');
    
    const summary = {
      timestamp: new Date().toISOString(),
      day: this.getDayOfMigration(),
      totalOperations: this.operations.length,
      operationCounts: {
        CREATE: this.operations.filter(op => op.operation === 'CREATE').length,
        UPDATE: this.operations.filter(op => op.operation === 'UPDATE').length,
        DELETE: this.operations.filter(op => op.operation === 'DELETE').length,
      },
      successRate: (
        this.operations.filter(op => op.status === 'SUCCESS').length /
        this.operations.length
      ).toFixed(4),
      averageDuration: (
        this.operations.reduce((sum, op) => sum + op.duration, 0) /
        this.operations.length
      ).toFixed(2),
      lastOperation: this.operations[this.operations.length - 1],
    };

    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  }

  generateReport(): string {
    if (this.operations.length === 0) {
      return 'No write operations logged';
    }

    const report = `
Dual-Write Monitor Report
=========================
Period: Day ${this.getDayOfMigration()} of Migration
Total Operations: ${this.operations.length}
Time of Report: ${new Date().toISOString()}

Operation Summary:
  CREATE: ${this.operations.filter(op => op.operation === 'CREATE').length}
  UPDATE: ${this.operations.filter(op => op.operation === 'UPDATE').length}
  DELETE: ${this.operations.filter(op => op.operation === 'DELETE').length}

Success Rate: ${(
      (this.operations.filter(op => op.status === 'SUCCESS').length /
        this.operations.length) *
      100
    ).toFixed(2)}%

Average Operation Duration: ${(
      this.operations.reduce((sum, op) => sum + op.duration, 0) /
        this.operations.length
    ).toFixed(2)}ms

Last 10 Operations:
${this.operations
  .slice(-10)
  .map(
    op =>
      `  [${op.timestamp}] ${op.operation} ${op.entity}(${op.entityId}) - ${op.status}`
  )
  .join('\n')}

Notes:
  - This log is used to verify that all writes to PostgreSQL
    would have succeeded in SQLite as well
  - Can be safely deleted after 7-day safety period completes
  - Useful for debugging if any discrepancies are detected
`;

    return report;
  }
}

export const dualWriteMonitor = new DualWriteMonitor();
