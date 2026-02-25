/**
 * BACKUP SYSTEM SETUP WIZARD
 * 
 * Interactive setup script for the automated backup and disaster recovery system.
 * Guides users through configuration and testing.
 * 
 * Usage: npx ts-node scripts/setup-backup-system.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     BACKUP & DISASTER RECOVERY SETUP WIZARD            ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log('This wizard will help you set up the automated backup system.\n');

  // Step 1: Check prerequisites
  console.log('📋 Step 1: Checking Prerequisites...\n');

  // Check PostgreSQL client
  try {
    const { execSync } = require('child_process');
    const pgVersion = execSync('pg_dump --version', { encoding: 'utf-8' });
    console.log(`✅ PostgreSQL client: ${pgVersion.trim()}`);
  } catch {
    console.log('❌ PostgreSQL client (pg_dump) not found');
    console.log('   Install: https://www.postgresql.org/download/');
    const continueSetup = await question('\n   Continue anyway? (y/n): ');
    if (continueSetup.toLowerCase() !== 'y') {
      console.log('\nSetup cancelled.');
      rl.close();
      return;
    }
  }

  // Check .env file
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found');
    console.log('   Copy .env.example to .env and configure database connection');
    rl.close();
    return;
  }
  console.log('✅ .env file exists');

  // Step 2: Generate encryption key
  console.log('\n📋 Step 2: Encryption Key Configuration...\n');

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const hasEncryptionKey = envContent.includes('BACKUP_ENCRYPTION_KEY=') && 
                          !envContent.includes('BACKUP_ENCRYPTION_KEY="your-');

  if (hasEncryptionKey) {
    console.log('✅ Encryption key already configured');
  } else {
    console.log('⚠️  No encryption key found in .env');
    const generateKey = await question('   Generate new encryption key? (y/n): ');
    
    if (generateKey.toLowerCase() === 'y') {
      const newKey = crypto.randomBytes(32).toString('hex');
      console.log(`\n   Generated key: ${newKey}`);
      console.log('\n   Add this to your .env file:');
      console.log(`   BACKUP_ENCRYPTION_KEY="${newKey}"`);
      
      const addNow = await question('\n   Add to .env automatically? (y/n): ');
      if (addNow.toLowerCase() === 'y') {
        let updatedEnv = envContent;
        if (envContent.includes('BACKUP_ENCRYPTION_KEY=')) {
          updatedEnv = envContent.replace(
            /BACKUP_ENCRYPTION_KEY="[^"]*"/,
            `BACKUP_ENCRYPTION_KEY="${newKey}"`
          );
        } else {
          updatedEnv += `\n# Backup Encryption\nBACKUP_ENCRYPTION_KEY="${newKey}"\n`;
        }
        fs.writeFileSync(envPath, updatedEnv);
        console.log('   ✅ Key added to .env');
      }
    }
  }

  // Step 3: Create directories
  console.log('\n📋 Step 3: Creating Required Directories...\n');

  const dirs = [
    'backups/postgresql',
    'backups/temp',
    'logs/backups',
  ];

  for (const dir of dirs) {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ Created: ${dir}`);
    } else {
      console.log(`✅ Exists: ${dir}`);
    }
  }

  // Step 4: Cloud storage configuration
  console.log('\n📋 Step 4: Cloud Storage Configuration (Optional)...\n');
  
  const hasCloudConfig = envContent.includes('BACKUP_CLOUD_PROVIDER=') &&
                        !envContent.includes('BACKUP_CLOUD_PROVIDER="LOCAL"');

  if (hasCloudConfig) {
    console.log('✅ Cloud storage configured');
  } else {
    console.log('ℹ️  Cloud storage not configured (backups will be stored locally)');
    const configureCloud = await question('   Configure cloud storage? (y/n): ');
    
    if (configureCloud.toLowerCase() === 'y') {
      console.log('\n   Available providers:');
      console.log('   1. Amazon S3');
      console.log('   2. Backblaze B2');
      console.log('   3. Azure Blob Storage');
      console.log('   4. Skip (use local storage)');
      
      const choice = await question('\n   Select provider (1-4): ');
      
      if (choice === '1' || choice === '2' || choice === '3') {
        console.log('\n   Manual configuration required:');
        console.log('   1. Add cloud provider credentials to .env');
        console.log('   2. Install provider SDK:');
        if (choice === '1') {
          console.log('      npm install @aws-sdk/client-s3');
        } else if (choice === '2') {
          console.log('      npm install backblaze-b2');
        } else {
          console.log('      npm install @azure/storage-blob');
        }
        console.log('\n   See docs/BACKUP_DISASTER_RECOVERY_SETUP.md for details');
      }
    }
  }

  // Step 5: Test backup
  console.log('\n📋 Step 5: Test Backup System...\n');
  
  const runTest = await question('   Run test backup now? (y/n): ');
  
  if (runTest.toLowerCase() === 'y') {
    console.log('\n   Testing backup system...\n');
    
    try {
      const { performBackup } = await import('./backup-automated');
      const metadata = await performBackup('daily');
      
      console.log('\n✅ Test backup completed successfully!');
      console.log(`   File: ${metadata.filename}`);
      console.log(`   Size: ${(metadata.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Duration: ${(metadata.duration / 1000).toFixed(1)}s`);
    } catch (error: any) {
      console.log(`\n❌ Test backup failed: ${error.message}`);
      console.log('   Check database connection and try again');
    }
  }

  // Step 6: Summary and next steps
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     SETUP COMPLETE                                     ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log('📚 Next Steps:\n');
  console.log('1. Review configuration in .env file');
  console.log('2. Test manual backup:');
  console.log('   npx ts-node scripts/backup-automated.ts\n');
  console.log('3. Test restore (dry-run):');
  console.log('   npx ts-node scripts/restore-database.ts --list');
  console.log('   npx ts-node scripts/restore-database.ts [backup-file] --dry-run\n');
  console.log('4. Set up automated scheduling:');
  console.log('   - Edit server.ts to call initializeBackupScheduler()');
  console.log('   - OR set up system cron/Task Scheduler\n');
  console.log('5. Configure monitoring:');
  console.log('   - Set up health check monitoring: /api/health');
  console.log('   - Configure alerts for backup failures\n');
  console.log('6. Review documentation:');
  console.log('   - docs/DISASTER_RECOVERY.md');
  console.log('   - docs/BACKUP_DISASTER_RECOVERY_SETUP.md\n');

  console.log('🎯 Backup Targets:');
  console.log('   RTO: 4 hours | RPO: 1 hour\n');

  rl.close();
}

main().catch(error => {
  console.error('Fatal error:', error);
  rl.close();
  process.exit(1);
});
