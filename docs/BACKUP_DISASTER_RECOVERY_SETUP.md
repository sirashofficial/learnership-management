# 🚀 Backup and Disaster Recovery System - Setup Guide

## Overview

This guide will help you set up the automated backup and disaster recovery system for your PostgreSQL database.

**Features:**
- ✅ Automated daily and monthly backups
- ✅ AES-256 encryption
- ✅ Cloud storage integration (S3, Backblaze B2, Azure Blob)
- ✅ Point-in-time recovery capability
- ✅ Health monitoring and alerts
- ✅ Admin API for manual backups
- ✅ Comprehensive disaster recovery procedures

**Targets:**
- **RTO (Recovery Time Objective):** 4 hours
- **RPO (Recovery Point Objective):** 1 hour

---

## 📋 Prerequisites

### 1. Required Software

```bash
# PostgreSQL client tools (for pg_dump/pg_restore)
# Ubuntu/Debian:
sudo apt-get install postgresql-client

# macOS:
brew install postgresql

# Windows:
# Download from https://www.postgresql.org/download/windows/
# Add to PATH: C:\Program Files\PostgreSQL\15\bin
```

### 2. Node.js Dependencies

All required dependencies are already installed:
- `node-cron` - Task scheduling ✅
- `pg` - PostgreSQL client ✅
- `crypto` (built-in) - Encryption ✅

### 3. Optional Cloud Storage SDKs

**For Amazon S3:**
```bash
npm install @aws-sdk/client-s3
```

**For Backblaze B2:**
```bash
npm install backblaze-b2
```

**For Azure Blob Storage:**
```bash
npm install @azure/storage-blob
```

---

## 🔧 Installation & Configuration

### Step 1: Configure Environment Variables

1. **Generate Encryption Key:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Add to .env file:**
   ```bash
   # Backup Configuration
   BACKUP_ENCRYPTION_KEY="your-64-character-hex-key-generated-above"
   BACKUP_RETENTION_DAYS="30"
   BACKUP_RETENTION_MONTHS="12"
   BACKUP_CLOUD_PROVIDER="LOCAL"  # Or: S3, B2, AZURE
   ```

3. **For Cloud Storage (Optional):**
   
   **Amazon S3:**
   ```bash
   BACKUP_CLOUD_PROVIDER="S3"
   BACKUP_CLOUD_BUCKET="yeha-learnership-backups"
   BACKUP_CLOUD_REGION="eu-west-1"
   BACKUP_CLOUD_ACCESS_KEY="your-aws-access-key"
   BACKUP_CLOUD_SECRET_KEY="your-aws-secret-key"
   ```

   **Backblaze B2:**
   ```bash
   BACKUP_CLOUD_PROVIDER="B2"
   BACKUP_CLOUD_BUCKET="yeha-backups"
   BACKUP_CLOUD_ACCESS_KEY="your-b2-key-id"
   BACKUP_CLOUD_SECRET_KEY="your-b2-application-key"
   ```

   **Azure Blob Storage:**
   ```bash
   BACKUP_CLOUD_PROVIDER="AZURE"
   BACKUP_CLOUD_BUCKET="yeha-backups"
   BACKUP_CLOUD_ACCESS_KEY="your-storage-account-name"
   BACKUP_CLOUD_SECRET_KEY="your-storage-account-key"
   ```

### Step 2: Create Backup Directories

```bash
mkdir -p backups/postgresql
mkdir -p backups/temp
mkdir -p logs/backups
```

### Step 3: Verify PostgreSQL Client Installation

```bash
# Test pg_dump
pg_dump --version

# Expected output: pg_dump (PostgreSQL) 15.x or higher
```

If not found, install PostgreSQL client tools (see Prerequisites).

### Step 4: Test Backup System

```bash
# Test configuration
npx ts-node scripts/backup-automated.ts --test

# Run a test backup
npx ts-node scripts/backup-automated.ts

# Verify backup
npx ts-node scripts/verify-backups.ts --latest
```

---

## 🤖 Setting Up Automated Backups

### Method 1: Integrate with Server (Recommended)

**Edit server.ts:**

```typescript
import { initializeBackupScheduler } from './scripts/backup-scheduler';

// ... existing code ...

// Initialize backup scheduler
if (process.env.NODE_ENV === 'production') {
  initializeBackupScheduler();
  console.log('✅ Automated backup scheduler initialized');
}

// ... rest of server code ...
```

### Method 2: System Cron (Linux/macOS)

```bash
# Edit crontab
crontab -e

# Add these lines:
# Daily backup at 2:00 AM
0 2 * * * cd /path/to/project && npx ts-node scripts/backup-automated.ts >> logs/backups/cron.log 2>&1

# Monthly backup on 1st at 2:00 AM
0 2 1 * * cd /path/to/project && npx ts-node scripts/backup-automated.ts --monthly >> logs/backups/cron.log 2>&1

# Verification every 2 hours
0 */2 * * * cd /path/to/project && npx ts-node scripts/verify-backups.ts --latest >> logs/backups/verify.log 2>&1
```

### Method 3: Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. **Trigger:** Daily at 2:00 AM
4. **Action:** Start a program
   - Program: `powershell.exe`
   - Arguments: `-NoProfile -Command "cd 'C:\path\to\project'; npx ts-node scripts/backup-automated.ts"`
5. Save and test

---

## 📊 Monitoring & Health Checks

### 1. Health Check Endpoint

```bash
# Check system health
curl http://localhost:3000/api/health

# Returns:
{
  "status": "healthy",  # or "degraded", "unhealthy"
  "checks": {
    "database": { "status": "ok", "responseTime": 150 },
    "diskSpace": { "status": "ok", "percentUsed": 45 },
    "backups": { "status": "ok", "hoursAgo": 2 }
  },
  "rto": "4 hours",
  "rpo": "1 hour"
}
```

### 2. Integrate with Uptime Monitoring

**UptimeRobot:**
- URL: `https://yourdomain.com/api/health`
- Check interval: 5 minutes
- Alert on: Status code ≠ 200

**Pingdom, StatusCake, etc.:**
- Configure similar to above

### 3. Manual Health Checks

```bash
# Weekly verification (recommended)
npx ts-node scripts/verify-backups.ts

# Compare with live database
npx ts-node scripts/verify-backups.ts --compare

# Full restore test (monthly)
npx ts-node scripts/verify-backups.ts --full-test
```

---

## 🔐 Security Best Practices

### 1. Encryption Key Management

```bash
# Store encryption key securely
# Option A: Environment variable (for development)
BACKUP_ENCRYPTION_KEY="your-key"

# Option B: Secret manager (for production)
# AWS Secrets Manager, Azure Key Vault, etc.

# NEVER commit encryption keys to git
```

### 2. Backup Access Control

```bash
# Set proper file permissions (Linux/macOS)
chmod 700 backups/
chmod 600 backups/postgresql/*

# Only admin users should access backup files
```

### 3. Cloud Storage Security

- Use IAM roles/policies for minimal permissions
- Enable bucket encryption at rest
- Enable versioning for backup files
- Implement lifecycle policies for cost optimization

---

## 📚 Common Operations

### Manual Backup

```bash
# Create daily backup
npx ts-node scripts/backup-automated.ts

# Create monthly backup
npx ts-node scripts/backup-automated.ts --monthly
```

### List Available Backups

```bash
# Via script
npx ts-node scripts/restore-database.ts --list

# Via API (requires admin auth)
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:3000/api/admin/backup
```

### Restore from Backup

```bash
# Dry run (test without changes)
npx ts-node scripts/restore-database.ts postgresql_daily_2026-02-25_02-00-00.sql.gz.enc --dry-run

# Actual restore
npx ts-node scripts/restore-database.ts postgresql_daily_2026-02-25_02-00-00.sql.gz.enc

# Restore with options
npx ts-node scripts/restore-database.ts backup.sql.gz.enc --skip-snapshot
```

### Verify Backups

```bash
# Verify all backups
npx ts-node scripts/verify-backups.ts

# Verify latest only
npx ts-node scripts/verify-backups.ts --latest

# Compare with live database
npx ts-node scripts/verify-backups.ts --compare
```

### Download Backup via API

```bash
# Get list of backups
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:3000/api/admin/backup

# Download specific backup
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -o backup.sql.gz.enc \
  http://localhost:3000/api/admin/backup/postgresql_daily_2026-02-25_02-00-00.sql.gz.enc
```

---

## 🧪 Testing Procedures

### Weekly Verification

```bash
# Every Monday at 9:00 AM
npx ts-node scripts/verify-backups.ts --latest
```

### Monthly Restore Test

```bash
# First Saturday of each month

# 1. Create test database
# 2. Restore latest backup to test database
npx ts-node scripts/restore-database.ts backup.sql.gz.enc --dry-run

# 3. Verify data integrity
npx ts-node verify-migration.ts

# 4. Document results
# Update: docs/DR_TEST_LOG.md
```

---

## 🚨 Troubleshooting

### "pg_dump: command not found"

```bash
# Add PostgreSQL bin to PATH
# Linux/macOS:
export PATH="/usr/lib/postgresql/15/bin:$PATH"

# Windows:
# Add to PATH: C:\Program Files\PostgreSQL\15\bin
```

### "Connection refused"

```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
psql "$DATABASE_URL"

# Verify Supabase is accessible
curl https://aws-1-eu-west-1.pooler.supabase.com:5432
```

### "Insufficient disk space"

```bash
# Check disk space
df -h

# Clean old backups manually
cd backups/postgresql
ls -lt | tail -10  # Review oldest backups
rm postgresql_daily_2025-*.sql.gz.enc

# Or adjust retention policy in .env
BACKUP_RETENTION_DAYS="14"  # Reduce from 30 to 14
```

### "Checksum mismatch"

```bash
# Backup file may be corrupted
# Try previous backup
npx ts-node scripts/restore-database.ts --list

# Download from cloud storage if configured
# aws s3 cp s3://bucket/backup.sql.gz.enc backups/postgresql/
```

---

## 📊 Monitoring Dashboard (Optional)

Create a simple monitoring page:

```typescript
// src/app/admin/backups/page.tsx
export default async function BackupsPage() {
  const backups = await fetch('/api/admin/backup').then(r => r.json());
  const health = await fetch('/api/health').then(r => r.json());
  
  return (
    <div>
      <h1>Backup & DR Dashboard</h1>
      <HealthStatus status={health} />
      <BackupList backups={backups} />
    </div>
  );
}
```

---

## 📖 Related Documentation

- [Disaster Recovery Runbook](./DISASTER_RECOVERY.md) - Step-by-step incident response
- [API Documentation](./API_DOCUMENTATION.md) - API endpoint details
- [Security Audit](./SECURITY_AUDIT_FINDINGS.md) - Security considerations

---

## 🎯 Checklist: Production Readiness

- [ ] PostgreSQL client tools installed
- [ ] Encryption key generated and secured
- [ ] Environment variables configured
- [ ] Backup directories created
- [ ] Test backup completed successfully
- [ ] Test restore completed successfully
- [ ] Automated scheduler configured
- [ ] Health check endpoint tested
- [ ] Monitoring/alerting configured
- [ ] Team trained on disaster recovery procedures
- [ ] Runbook reviewed by stakeholders
- [ ] Monthly test schedule established
- [ ] Incident response contacts updated

---

## 🆘 Emergency Contacts

In case of critical issues:

1. **System Admin:** [Contact info]
2. **Database Admin:** [Contact info]
3. **Supabase Support:** support@supabase.com
4. **On-Call Rotation:** [Link to PagerDuty/similar]

---

## 📝 Maintenance Schedule

| Task | Frequency | Command | Owner |
|------|-----------|---------|-------|
| Verify latest backup | Daily (auto) | `npx ts-node scripts/verify-backups.ts --latest` | Automated |
| Manual backup test | Weekly | `npx ts-node scripts/backup-automated.ts` | Admin |
| Restore test (staging) | Monthly | `npx ts-node scripts/restore-database.ts --dry-run` | Admin |
| Full restore test (staging) | Quarterly | Full restore to staging database | Team |
| Review runbook | Quarterly | Update procedures and contacts | Team Lead |
| Rotate encryption key | Annually | Generate new key, re-encrypt backups | Security |

---

*Last Updated: February 25, 2026*  
*Next Review: May 25, 2026*
