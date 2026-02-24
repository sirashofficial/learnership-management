const fs = require('fs');
const path = require('path');

const backupsDir = path.join(__dirname, '..', 'backups');
const prismaDir = path.join(__dirname, '..', 'prisma');
const currentDbPath = path.join(prismaDir, 'dev.db');

// Find the backup to restore (February 18th - the large one)
const backupToRestore = 'dev-2026-02-18T19-50-00.db';
const backupPath = path.join(backupsDir, backupToRestore);

console.log('🔄 Database Restore Utility\n');

if (!fs.existsSync(backupPath)) {
  console.error(`❌ Backup file not found: ${backupPath}`);
  process.exit(1);
}

// Create a backup of current state before restoring
const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
const currentBackupPath = path.join(backupsDir, `before-restore-${timestamp}.db`);

if (fs.existsSync(currentDbPath)) {
  fs.copyFileSync(currentDbPath, currentBackupPath);
  console.log(`✅ Created backup of current database: before-restore-${timestamp}.db`);
}

// Restore the backup
fs.copyFileSync(backupPath, currentDbPath);
console.log(`✅ Restored database from: ${backupToRestore}`);
console.log('\nPlease restart the dev server for changes to take effect.');
console.log('Run: npm run dev\n');
