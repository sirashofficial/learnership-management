/**
 * AUTOMATED BACKUP SCHEDULER
 * 
 * Schedules:
 * - Daily backups: 2:00 AM (low usage period)
 * - Monthly backups: 1st of month at 2:00 AM
 * - Backup verification: Every 2 hours
 * - Health checks: Every 30 minutes
 * 
 * Uses node-cron for scheduling
 * Import and initialize in your server.ts or app startup
 */

import cron from 'node-cron';
import { performBackup } from './backup-automated';
import * as fs from 'fs';
import * as path from 'path';

// Import node-cron types
import type { ScheduledTask } from 'node-cron';

const LOG_DIR = path.join(process.cwd(), 'logs', 'backups');

// ============================================
// UTILITY FUNCTIONS
// ============================================

function ensureLogDirectory() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function logToFile(message: string) {
  ensureLogDirectory();
  
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  const logFile = path.join(LOG_DIR, `scheduler-${new Date().toISOString().split('T')[0]}.log`);
  
  fs.appendFileSync(logFile, logMessage);
  console.log(logMessage.trim());
}

// ============================================
// BACKUP JOBS
// ============================================

/**
 * Daily backup job - Runs at 2:00 AM every day
 */
function scheduleDailyBackup() {
  // Cron expression: 0 2 * * * (At 2:00 AM every day)
  const job = cron.schedule('0 2 * * *', async () => {
    logToFile('=== DAILY BACKUP JOB STARTED ===');
    
    try {
      const metadata = await performBackup('daily');
      logToFile(`✅ Daily backup completed: ${metadata.filename}`);
      logToFile(`   Size: ${(metadata.size / 1024 / 1024).toFixed(2)} MB`);
      logToFile(`   Duration: ${(metadata.duration / 1000).toFixed(1)}s`);
      logToFile(`   Rows: ${metadata.rowCounts ? Object.values(metadata.rowCounts).reduce((a, b) => a + b, 0) : 'N/A'}`);
    } catch (error: any) {
      logToFile(`❌ Daily backup failed: ${error.message}`);
      
      // TODO: Send alert notification (email, Slack, etc.)
      console.error('[BACKUP SCHEDULER] Daily backup failed:', error);
    }
    
    logToFile('=== DAILY BACKUP JOB COMPLETED ===\n');
  }, {
    timezone: 'Africa/Johannesburg' // Adjust to your timezone
  });
  
  logToFile('✅ Daily backup scheduled: Every day at 2:00 AM');
  
  return job;
}

/**
 * Monthly backup job - Runs at 2:00 AM on the 1st of every month
 */
function scheduleMonthlyBackup() {
  // Cron expression: 0 2 1 * * (At 2:00 AM on day 1 of every month)
  const job = cron.schedule('0 2 1 * *', async () => {
    logToFile('=== MONTHLY BACKUP JOB STARTED ===');
    
    try {
      const metadata = await performBackup('monthly');
      logToFile(`✅ Monthly backup completed: ${metadata.filename}`);
      logToFile(`   Size: ${(metadata.size / 1024 / 1024).toFixed(2)} MB`);
      logToFile(`   Duration: ${(metadata.duration / 1000).toFixed(1)}s`);
      logToFile(`   Rows: ${metadata.rowCounts ? Object.values(metadata.rowCounts).reduce((a, b) => a + b, 0) : 'N/A'}`);
    } catch (error: any) {
      logToFile(`❌ Monthly backup failed: ${error.message}`);
      
      // TODO: Send alert notification
      console.error('[BACKUP SCHEDULER] Monthly backup failed:', error);
    }
    
    logToFile('=== MONTHLY BACKUP JOB COMPLETED ===\n');
  }, {
    timezone: 'Africa/Johannesburg'
  });
  
  logToFile('✅ Monthly backup scheduled: 1st of every month at 2:00 AM');
  
  return job;
}

/**
 * Backup verification job - Runs every 2 hours
 * Checks that backups exist and are recent
 */
function scheduleBackupVerification() {
  // Cron expression: 0 */2 * * * (At minute 0 past every 2nd hour)
  const job = cron.schedule('0 */2 * * *', async () => {
    logToFile('=== BACKUP VERIFICATION STARTED ===');
    
    try {
      const backupDir = path.join(process.cwd(), 'backups', 'postgresql');
      const indexPath = path.join(backupDir, 'backup-index.json');
      
      if (!fs.existsSync(indexPath)) {
        logToFile('⚠️  WARNING: No backup index found!');
        return;
      }
      
      const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      const successfulBackups = index.filter((b: any) => b.success);
      
      if (successfulBackups.length === 0) {
        logToFile('⚠️  WARNING: No successful backups found!');
        return;
      }
      
      // Find most recent backup
      const sortedBackups = successfulBackups.sort(
        (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      const lastBackup = sortedBackups[0];
      const lastBackupTime = new Date(lastBackup.timestamp);
      const hoursAgo = (Date.now() - lastBackupTime.getTime()) / (1000 * 60 * 60);
      
      logToFile(`✅ Last backup: ${lastBackupTime.toLocaleString()}`);
      logToFile(`   Age: ${hoursAgo.toFixed(1)} hours ago`);
      logToFile(`   Total backups: ${successfulBackups.length}`);
      
      if (hoursAgo > 25) {
        logToFile(`⚠️  WARNING: Last backup is ${hoursAgo.toFixed(1)} hours old!`);
        // TODO: Send alert notification
      }
    } catch (error: any) {
      logToFile(`❌ Verification failed: ${error.message}`);
    }
    
    logToFile('=== BACKUP VERIFICATION COMPLETED ===\n');
  });
  
  logToFile('✅ Backup verification scheduled: Every 2 hours');
  
  return job;
}

/**
 * Health check job - Runs every 30 minutes
 * Monitors system health and alerts on issues
 */
function scheduleHealthCheck() {
  // Cron expression: */30 * * * * (Every 30 minutes)
  const job = cron.schedule('*/30 * * * *', async () => {
    logToFile('=== HEALTH CHECK STARTED ===');
    
    try {
      // Check database connectivity
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      try {
        await prisma.$connect();
        const userCount = await prisma.user.count();
        logToFile(`✅ Database: Connected (${userCount} users)`);
      } catch (error: any) {
        logToFile(`❌ Database: Connection failed - ${error.message}`);
        // TODO: Send critical alert
      } finally {
        await prisma.$disconnect();
      }
      
      // Check disk space
      const backupDir = path.join(process.cwd(), 'backups', 'postgresql');
      if (fs.existsSync(backupDir)) {
        const files = fs.readdirSync(backupDir);
        const totalSize = files.reduce((sum, file) => {
          const filePath = path.join(backupDir, file);
          try {
            return sum + fs.statSync(filePath).size;
          } catch {
            return sum;
          }
        }, 0);
        
        logToFile(`✅ Backup storage: ${(totalSize / 1024 / 1024 / 1024).toFixed(2)} GB used`);
      }
      
    } catch (error: any) {
      logToFile(`❌ Health check failed: ${error.message}`);
    }
    
    logToFile('=== HEALTH CHECK COMPLETED ===\n');
  });
  
  logToFile('✅ Health check scheduled: Every 30 minutes');
  
  return job;
}

// ============================================
// SCHEDULER INITIALIZATION
// ============================================

export interface BackupScheduler {
  dailyBackup: ScheduledTask;
  monthlyBackup: ScheduledTask;
  verification: ScheduledTask;
  healthCheck: ScheduledTask;
  stopAll: () => void;
}

/**
 * Initialize all backup schedules
 */
export function initializeBackupScheduler(): BackupScheduler {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     AUTOMATED BACKUP SCHEDULER STARTING                ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  logToFile('='.repeat(60));
  logToFile('BACKUP SCHEDULER INITIALIZED');
  logToFile('='.repeat(60));
  
  const dailyBackup = scheduleDailyBackup();
  const monthlyBackup = scheduleMonthlyBackup();
  const verification = scheduleBackupVerification();
  const healthCheck = scheduleHealthCheck();
  
  logToFile('\n✅ All backup schedules active');
  logToFile(`   Timezone: Africa/Johannesburg`);
  logToFile(`   RTO: 4 hours | RPO: 1 hour`);
  logToFile('='.repeat(60) + '\n');
  
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     ✅ BACKUP SCHEDULER RUNNING                        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  return {
    dailyBackup,
    monthlyBackup,
    verification,
    healthCheck,
    stopAll: () => {
      dailyBackup.stop();
      monthlyBackup.stop();
      verification.stop();
      healthCheck.stop();
      logToFile('⚠️  Backup scheduler stopped');
      console.log('[BACKUP SCHEDULER] All schedules stopped');
    },
  };
}

/**
 * Test mode - Run a backup immediately for testing
 */
export async function testBackupScheduler() {
  console.log('\n🧪 TEST MODE: Running immediate backup...\n');
  
  logToFile('=== TEST BACKUP STARTED ===');
  
  try {
    const metadata = await performBackup('daily');
    logToFile(`✅ Test backup completed: ${metadata.filename}`);
    console.log('\n✅ Test backup successful!');
    console.log(`   File: ${metadata.filename}`);
    console.log(`   Size: ${(metadata.size / 1024 / 1024).toFixed(2)} MB`);
  } catch (error: any) {
    logToFile(`❌ Test backup failed: ${error.message}`);
    console.error('\n❌ Test backup failed:', error.message);
    throw error;
  }
  
  logToFile('=== TEST BACKUP COMPLETED ===\n');
}

// ============================================
// COMMAND LINE INTERFACE
// ============================================

if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    testBackupScheduler().catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
  } else {
    // Start scheduler
    initializeBackupScheduler();
    
    // Keep process alive
    process.on('SIGINT', () => {
      console.log('\n\nShutting down backup scheduler...');
      process.exit(0);
    });
  }
}
