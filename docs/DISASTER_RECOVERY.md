# 🚨 DISASTER RECOVERY RUNBOOK

## Quick Reference

**RTO (Recovery Time Objective):** 4 hours  
**RPO (Recovery Point Objective):** 1 hour  
**Last Updated:** February 25, 2026

---

## 📞 Emergency Contacts

| Role | Name | Contact | Escalation |
|------|------|---------|------------|
| **Primary DBA** | [Your Name] | [Email/Phone] | Immediate |
| **Backup Admin** | [Backup Admin] | [Email/Phone] | If primary unavailable (15 min) |
| **System Admin** | [Sys Admin] | [Email/Phone] | For infrastructure issues |
| **CTO/Tech Lead** | [CTO Name] | [Email/Phone] | Critical decisions only |
| **Supabase Support** | support@supabase.com | support@supabase.com | Database host issues |

---

## 🏥 Health Check & Monitoring

### Quick Health Check
```bash
# Check system health
curl http://localhost:3000/api/health

# Expected: 200 OK with status: "healthy"
# Alert: 503 Service Unavailable = CRITICAL
```

### Monitor Backup Status
```bash
# List recent backups
npx ts-node scripts/restore-database.ts --list

# Check backup freshness (should be < 25 hours)
```

### Key Metrics to Monitor
- **Database Connectivity:** Must respond within 2 seconds
- **Last Backup Age:** < 25 hours (daily backups at 2 AM)
- **Disk Space:** < 80% full (warning), < 90% full (critical)
- **Error Rate:** < 0.5%

---

## 🔥 Incident Response Flow

```
┌─────────────────────┐
│  Issue Detected     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Assess Severity    │◄──── Use Severity Matrix Below
└──────┬──────────────┘
       │
       ├──► P0: Critical (Production Down) ───► Immediate Action
       ├──► P1: High (Degraded Service) ──────► Act within 30 min
       ├──► P2: Medium (Partial Impact) ──────► Act within 2 hours
       └──► P3: Low (Monitoring Alert) ───────► Act within 24 hours
```

---

## 📊 Severity Matrix

| Severity | Impact | Examples | Response Time | Action |
|----------|--------|----------|---------------|--------|
| **P0 - Critical** | Complete service outage | Database down, Data corruption, Complete data loss | < 15 minutes | Follow CRITICAL INCIDENT procedure |
| **P1 - High** | Degraded service | Slow queries (> 5s), Partial data access issues | < 30 minutes | Follow DEGRADED SERVICE procedure |
| **P2 - Medium** | Limited impact | Backup failed, Disk space warning | < 2 hours | Follow MAINTENANCE procedure |
| **P3 - Low** | No immediate impact | Monitoring alerts, Old backups | < 24 hours | Schedule maintenance |

---

## 🚨 P0 - CRITICAL INCIDENT: Database Down

**Symptoms:**
- Application cannot connect to database
- Health check returns 503
- Users see error pages

**Decision Tree:**

```
Database Down
    │
    ├─► Can connect to Supabase directly?
    │       │
    │       ├─► YES → Application connectivity issue
    │       │         └─► Check .env DATABASE_URL
    │       │             └─► Restart application server
    │       │
    │       └─► NO → Database host issue
    │               └─► Contact Supabase Support
    │                   └─► Consider failover (see below)
    │
    └─► Database responding but data corrupted?
            └─► RESTORE FROM BACKUP (see procedure below)
```

### Immediate Actions (First 15 minutes)

1. **Verify the Issue**
   ```bash
   # Test database connection
   npx ts-node test-postgresql-db.ts
   
   # Check Supabase dashboard
   open https://app.supabase.com/project/kbiwvnggvmykvgzmjauy
   ```

2. **Notify Stakeholders**
   - Post in #tech-alerts: "P0 INCIDENT: Database down. Investigating."
   - Update status page if available

3. **Check Recent Changes**
   ```bash
   # Review recent deployments
   git log --oneline -10
   
   # Check if migration just ran
   cat logs/migrate-*.log | tail -50
   ```

4. **Assess Backup Availability**
   ```bash
   # List available backups
   npx ts-node scripts/restore-database.ts --list
   
   # Identify latest backup (should be < 25 hours old)
   ```

### Recovery Procedure

#### Option A: Application Issue (Fastest - 5 minutes)

```bash
# 1. Verify database is actually up
curl -X GET "https://aws-1-eu-west-1.pooler.supabase.com:5432" || echo "Database host unreachable"

# 2. Check environment variables
cat .env | grep DATABASE_URL

# 3. Restart application
npm run dev
# OR for production:
pm2 restart learnership-app
```

#### Option B: Rollback Recent Migration (10-15 minutes)

```bash
# 1. Check migration history
npx prisma migrate status

# 2. Rollback last migration
npx prisma migrate resolve --rolled-back [migration-name]

# 3. Restart application
npm run dev
```

#### Option C: Restore from Backup (30-60 minutes)

**⚠️ WARNING: This will replace current database with backup data**

```bash
# STEP 1: Create emergency snapshot of current state (even if corrupted)
npx ts-node scripts/backup-automated.ts

# STEP 2: List available backups
npx ts-node scripts/restore-database.ts --list

# STEP 3: Verify backup integrity (dry run)
npx ts-node scripts/restore-database.ts postgresql_daily_2026-02-25_02-00-00.sql.gz.enc --dry-run

# STEP 4: Perform restore
npx ts-node scripts/restore-database.ts postgresql_daily_2026-02-25_02-00-00.sql.gz.enc

# STEP 5: Verify restoration
npx ts-node verify-migration.ts

# STEP 6: Restart application
npm run dev
```

**Data Loss Calculation:**
- Last backup: [Check timestamp]
- Current time: [Current time]
- **Estimated data loss:** [Time difference]

---

## ⚠️ P1 - HIGH SEVERITY: Degraded Service

**Symptoms:**
- Slow database queries (> 5 seconds)
- Intermittent connection errors
- Backup failures

### Database Performance Issues

```bash
# 1. Check active connections
npx ts-node scripts/check-connections.ts

# 2. Review slow queries
# Login to Supabase dashboard → Query Performance

# 3. Check indexes
npx prisma studio
# Navigate to each table and verify indexes exist

# 4. Consider connection pooling adjustment
# Edit .env: DATABASE_URL includes ?pgbouncer=true

# 5. Monitor and document
# Check /api/health every 5 minutes
```

### Backup Failures

```bash
# 1. Check backup logs
cat logs/backups/scheduler-$(date +%Y-%m-%d).log

# 2. Verify disk space
df -h
# OR on Windows:
wmic logicaldisk get caption,freespace,size

# 3. Test backup manually
npx ts-node scripts/backup-automated.ts --test

# 4. If encryption key missing:
# Generate new key:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Add to .env: BACKUP_ENCRYPTION_KEY=[generated-key]

# 5. Retry backup
npx ts-node scripts/backup-automated.ts
```

---

## 🛠️ P2 - MEDIUM SEVERITY: Maintenance Required

### Disk Space Warning (> 80% full)

```bash
# 1. Check backup directory size
du -sh backups/
# OR on Windows:
powershell "Get-ChildItem backups -Recurse | Measure-Object -Property Length -Sum"

# 2. Review backup retention policy
# Default: 30 days daily, 12 months monthly

# 3. Manually clean old backups (if emergency)
cd backups/postgresql
ls -lt | tail -20  # List oldest 20 backups
# Carefully delete old backups (keep at least 7 days)
rm postgresql_daily_2025-*.sql.gz.enc

# 4. Adjust retention policy
# Edit scripts/backup-automated.ts
# Change: retentionDays, retentionMonths
```

### Failed Backup (Non-Critical)

```bash
# 1. Review error
cat logs/backups/scheduler-$(date +%Y-%m-%d).log

# 2. Common issues:
#    - pg_dump not in PATH
#    - Connection timeout
#    - Permissions error

# 3. Fix and retry
npx ts-node scripts/backup-automated.ts

# 4. If continues failing, escalate to P1
```

---

## 🔄 Point-in-Time Recovery (PITR)

**Use Case:** Recover data from specific time (e.g., before accidental deletion)

### Prerequisites
- WAL (Write-Ahead Logging) must be enabled
- Continuous archiving configured

### Recovery Procedure

```bash
# 1. Identify target recovery point
# "I need data from 2 hours ago"

# 2. Find backup before target time
npx ts-node scripts/restore-database.ts --list

# 3. Restore base backup
npx ts-node scripts/restore-database.ts postgresql_daily_2026-02-25_02-00-00.sql.gz.enc

# 4. Apply WAL files up to target time
# (Requires pg_wal directory from Supabase)
# Contact Supabase support for WAL access

# 5. Stop at target time
# Set recovery_target_time in postgresql.conf
# recovery_target_time = '2026-02-25 14:30:00'

# 6. Restart and verify
npm run dev
npx ts-node verify-migration.ts
```

**Note:** Full PITR requires WAL archiving to be configured on Supabase. Check with support.

---

## 🧪 Testing & Validation

### Monthly Restore Test (Staging)

**Schedule:** First Saturday of each month, 10:00 AM

```bash
# 1. Notify team: "Monthly DR test starting"

# 2. Create staging database snapshot
# Use separate DATABASE_URL for staging

# 3. Restore latest backup to staging
npx ts-node scripts/restore-database.ts postgresql_daily_[latest].sql.gz.enc

# 4. Run validation checks
npx ts-node verify-migration.ts

# 5. Test application functionality
# - Login
# - View data
# - Create test record
# - Delete test record

# 6. Document results
# Update: docs/DR_TEST_LOG.md

# 7. Calculate actual RTO
# Record time from restore start to app functional
```

### Weekly Backup Verification

**Schedule:** Every Monday, 9:00 AM

```bash
# 1. Check backup health
curl http://localhost:3000/api/health

# 2. Verify backup exists and is recent
npx ts-node scripts/restore-database.ts --list

# 3. Check backup integrity
# Latest backup checksum should match metadata

# 4. If issues found, escalate to P2
```

---

## 🔐 Security Considerations

### Backup Encryption

- **Algorithm:** AES-256-CBC
- **Key Storage:** Environment variable `BACKUP_ENCRYPTION_KEY`
- **Key Rotation:** Every 90 days (recommended)

```bash
# Generate new encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update .env
BACKUP_ENCRYPTION_KEY=[new-key]

# Re-encrypt existing backups (if required)
# Use scripts/re-encrypt-backups.ts (create if needed)
```

### Access Control

- Backup files: Admin only
- API endpoints: ADMIN role required
- Cloud storage: Restricted IAM policies

### Compliance

- **Data Retention:** 30 days + 12 months
- **Data Location:** South Africa (Supabase EU-West-1)
- **Audit Trail:** All restore operations logged

---

## ☁️ Cloud Storage Configuration

### Amazon S3

```bash
# Install AWS SDK
npm install @aws-sdk/client-s3

# Configure environment
BACKUP_CLOUD_PROVIDER=S3
BACKUP_CLOUD_BUCKET=yeha-learnership-backups
BACKUP_CLOUD_REGION=eu-west-1
BACKUP_CLOUD_ACCESS_KEY=[AWS_ACCESS_KEY]
BACKUP_CLOUD_SECRET_KEY=[AWS_SECRET_KEY]

# Test upload
npx ts-node scripts/backup-automated.ts
```

### Backblaze B2

```bash
# Install B2 SDK
npm install backblaze-b2

# Configure environment
BACKUP_CLOUD_PROVIDER=B2
BACKUP_CLOUD_BUCKET=yeha-backups
BACKUP_CLOUD_ACCESS_KEY=[B2_KEY_ID]
BACKUP_CLOUD_SECRET_KEY=[B2_APPLICATION_KEY]

# Test upload
npx ts-node scripts/backup-automated.ts
```

### Azure Blob Storage

```bash
# Install Azure SDK
npm install @azure/storage-blob

# Configure environment
BACKUP_CLOUD_PROVIDER=AZURE
BACKUP_CLOUD_BUCKET=yeha-backups
BACKUP_CLOUD_ACCESS_KEY=[AZURE_STORAGE_ACCOUNT]
BACKUP_CLOUD_SECRET_KEY=[AZURE_STORAGE_KEY]

# Test upload
npx ts-node scripts/backup-automated.ts
```

---

## 📝 Post-Incident Checklist

After resolving any P0 or P1 incident:

- [ ] Document incident timeline
- [ ] Update status page: "Incident resolved"
- [ ] Notify all stakeholders
- [ ] Create backup immediately (if not done)
- [ ] Review incident cause
- [ ] Identify preventive measures
- [ ] Update runbook with lessons learned
- [ ] Schedule post-mortem meeting (within 48 hours)
- [ ] Update monitoring/alerts if needed

### Incident Report Template

```markdown
## Incident Report: [Title]

**Severity:** P0/P1/P2/P3
**Date:** YYYY-MM-DD
**Duration:** [Start time] - [End time] ([Total duration])

### Timeline
- [HH:MM] Issue detected
- [HH:MM] Team notified
- [HH:MM] Investigation started
- [HH:MM] Root cause identified
- [HH:MM] Fix applied
- [HH:MM] Service restored
- [HH:MM] Verified resolution

### Root Cause
[Detailed explanation]

### Impact
- Users affected: [Number/All]
- Data loss: [Yes/No - Describe]
- Downtime: [Duration]
- Estimated RPO: [Time]
- Actual RTO: [Time]

### Resolution
[What was done to fix]

### Preventive Measures
1. [Action item 1]
2. [Action item 2]

### Follow-up Actions
- [ ] [Action 1] - Owner: [Name] - Due: [Date]
- [ ] [Action 2] - Owner: [Name] - Due: [Date]
```

---

## 🔧 Troubleshooting Guide

### "pg_dump: command not found"

```bash
# Install PostgreSQL client tools
# Ubuntu/Debian:
sudo apt-get install postgresql-client

# macOS:
brew install postgresql

# Windows:
# Download from https://www.postgresql.org/download/windows/
# Add to PATH: C:\Program Files\PostgreSQL\15\bin
```

### "Connection refused" Error

```bash
# 1. Verify DATABASE_URL
echo $DATABASE_URL

# 2. Check firewall rules
# Supabase allows connections from any IP by default

# 3. Test connection manually
psql "postgresql://[user]:[pass]@[host]:[port]/[db]"

# 4. Check Supabase project status
# Login to https://app.supabase.com
```

### "Checksum mismatch" Error

```bash
# Backup file may be corrupted

# 1. Try previous backup
npx ts-node scripts/restore-database.ts --list

# 2. Download from cloud storage (if configured)
# aws s3 cp s3://yeha-learnership-backups/[filename] backups/postgresql/

# 3. Verify file integrity
shasum -a 256 backups/postgresql/[filename]

# 4. If all backups corrupted, escalate to P0
```

### "Insufficient disk space" Error

```bash
# 1. Check available space
df -h

# 2. Clean temp files
rm -rf backups/temp/*

# 3. Delete old backups (carefully)
cd backups/postgresql
ls -lt | tail -10  # Review oldest

# 4. Consider increasing disk size
```

---

## 📚 Related Documentation

- [Backup System Architecture](./BACKUP_ARCHITECTURE.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Monitoring Guide](./MONITORING_AND_LOGGING_GUIDE.md)
- [Security Audit](./SECURITY_AUDIT_FINDINGS.md)

---

## 📞 Support Resources

- **Supabase Status:** https://status.supabase.com
- **Supabase Docs:** https://supabase.com/docs
- **Internal Wiki:** [Your internal wiki URL]
- **On-Call Schedule:** [Link to PagerDuty/similar]

---

## ✅ Runbook Maintenance

**Review Frequency:** Quarterly (every 3 months)  
**Last Review:** February 25, 2026  
**Next Review:** May 25, 2026  
**Owner:** [Your Name]

### Quarterly Review Checklist
- [ ] Update contact information
- [ ] Verify all procedures still work
- [ ] Update links and documentation references
- [ ] Review incident history for updates
- [ ] Test restore procedure on staging
- [ ] Update RTO/RPO targets if changed
- [ ] Review and update security measures

---

*END OF RUNBOOK*
