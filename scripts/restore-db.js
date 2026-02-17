#!/usr/bin/env node
// Restore SQLite DB from latest backup or specified file.

const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const backupsDir = path.join(__dirname, '..', 'backups');

function getLatestBackup() {
  if (!fs.existsSync(backupsDir)) return null;
  const entries = fs.readdirSync(backupsDir)
    .filter((name) => name.startsWith('dev-') && name.endsWith('.db'))
    .map((name) => ({
      name,
      fullPath: path.join(backupsDir, name),
      mtime: fs.statSync(path.join(backupsDir, name)).mtime.getTime(),
    }))
    .sort((a, b) => b.mtime - a.mtime);

  return entries[0] || null;
}

const inputPath = process.argv[2];
const restoreFrom = inputPath
  ? path.resolve(process.cwd(), inputPath)
  : (getLatestBackup() ? getLatestBackup().fullPath : null);

if (!restoreFrom || !fs.existsSync(restoreFrom)) {
  console.error('No backup found to restore.');
  process.exit(1);
}

fs.copyFileSync(restoreFrom, dbPath);
console.log(`Restored database from ${restoreFrom}`);
