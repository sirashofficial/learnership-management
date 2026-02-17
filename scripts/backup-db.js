#!/usr/bin/env node
// Backup SQLite DB to ./backups with timestamp.

const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const backupsDir = path.join(__dirname, '..', 'backups');

if (!fs.existsSync(dbPath)) {
  console.error(`Database not found at ${dbPath}`);
  process.exit(1);
}

if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir);
}

const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
const backupPath = path.join(backupsDir, `dev-${timestamp}.db`);

fs.copyFileSync(dbPath, backupPath);
console.log(`Backup created: ${backupPath}`);
