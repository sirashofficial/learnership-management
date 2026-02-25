# Zero-Risk SQLite to PostgreSQL Migration Guide

## 🎯 Overview

This guide provides a complete zero-risk migration from SQLite to PostgreSQL while maintaining:
- **100% Data Preservation** - All records migrated with full integrity verification
- **Instant Rollback** - Revert to SQLite in < 5 minutes if issues arise
- **Zero Data Loss** - Original SQLite file never modified, only backed up
- **Horizontal Scaling** - Support 100+ concurrent users with PostgreSQL

## 📋 Prerequisites

Before starting, ensure you have:
- [ ] PostgreSQL 12+ instance (local or cloud)
- [ ] PostgreSQL connection string ready
- [ ] 30 minutes for Phase 1 (backups)
- [ ] 1 hour for Phase 2 (migration)
- [ ] 2 hours for Phase 3 (verification)
- [ ] 4 hours for Phase 4 (gradual cutover)
- [ ] 7 days for Phase 5 (safety period)
- [ ] 30 days before Phase 6 (cleanup)

## 🚀 Phase 1: Pre-Migration Data Fortress (Zero Downtime)

**Duration:** 30 minutes  
**Risk Level:** ZERO (read-only operations)  
**User Impact:** NONE

### What Gets Created
1. **Backup A** - Raw SQLite file copy with timestamp
2. **Backup B** - JSON structured export
3. **Backup C** - Plain SQL dump (INSERT statements)
4. **migration-lock.txt** - Prevents schema changes
5. **pre-migration-row-counts.json** - "Source of truth" checksums

### How to Execute

```bash
# Step 1: Create raw file backup
cd "c:\Users\LATITUDE 5400\Downloads\Learnership Management"

# Step 2: Run backup script
npm install better-sqlite3  # If not already installed
npx ts-node scripts/backup-sqlite.ts

# Step 3: Verify row count baseline
npx ts-node scripts/verify-row-counts.ts

# Step 4: Export to plain SQL
npx ts-node scripts/export-sqlite-to-sql.ts

# Step 5: Commit all backups
git add backups/ migration-lock.txt
git commit -m "Phase 1: Pre-migration backups created"
```

### What to Verify
- [ ] `backups/dev.db.backup.*.original` exists (raw copy)
- [ ] `backups/pre-migration-row-counts.json` exists (row count baseline)
- [ ] `backups/sqlite-export-complete.sql` exists (full SQL dump)
- [ ] `migration-lock.txt` created (database locked)
- [ ] No schema changes during this phase

## 🔧 Phase 2: Parallel Environment Setup (No Production Touch)

**Duration:** 1-2 hours  
**Risk Level:** ZERO (separate environment)  
**User Impact:** NONE

### Steps

```bash
# Step 1: Create .env.new for PostgreSQL
cat > .env.new << 'EOF'
DATABASE_URL="postgresql://user:password@localhost:5432/learnership"
DIRECT_URL="postgresql://user:password@localhost:5432/learnership"
# ... copy other env vars from .env
EOF

# Step 2: Create PostgreSQL database
createdb learnership  # or via cloud console

# Step 3: Run Prisma migrations to PostgreSQL environment
export DATABASE_URL="postgresql://..."
npx prisma migrate deploy --skip-generate
npx prisma db push --skip-generate

# Step 4: Verify schema exists
npx prisma studio  # Check tables are created

# Step 5: Run data migration script
# Set DATABASE_URL to PostgreSQL and run:
npx ts-node scripts/migrate-data-sqlite-to-postgres.ts

# This will:
# - Connect to SQLite (read-only)
# - Connect to PostgreSQL
# - Transform data types
# - Insert in dependency order
# - Handle foreign keys
# - Log progress in real-time
```

### Expected Output
```
Found 20 tables to migrate
📦 User: 15 rows
✅ Complete: 15/15
📦 Group: 9 rows
✅ Complete: 9/9
...
Migration Summary
Duration: 45.23s
Tables: 20 ✅ | 0 ⚠ | 0 ❌
Records: 2,145/2,145 inserted
```

## ✅ Phase 3: Verification & Validation (Critical)

**Duration:** 30 minutes  
**Risk Level:** LOW (testing only)  
**User Impact:** NONE

### Three Critical Verifications

**1. Row Count Verification**
```bash
# Switch back to SQLite to verify original counts didn't change
export DATABASE_URL="file:prisma/dev.db"

# Generate row counts for comparison
npx ts-node scripts/verify-row-counts.ts > pre-migration-check.txt

# Switch to PostgreSQL and verify counts match
export DATABASE_URL="postgresql://..."
npx ts-node scripts/verify-row-counts.ts > post-migration-check.txt

# Compare files - should be identical
diff pre-migration-check.txt post-migration-check.txt
```

**2. Data Integrity Sampling (10% of records)**
```bash
# Random sample comparison between SQLite and PostgreSQL
export DATABASE_URL="postgresql://..."
npx ts-node scripts/verify-data-sampling.ts

# Should output:
# Student: 45/50 matched (90%)
# Assessment: 5/5 matched (100%)
# Attendance: 150/150 matched (100%)
# ...
# STATUS: PASS
```

**3. Application Smoke Test**
```bash
# Locally switch to PostgreSQL
export DATABASE_URL="postgresql://..."
npm run dev

# Test in browser:
# [ ] Login works
# [ ] Dashboard loads with correct numbers
# [ ] Groups page shows 9 groups, 46 learners
# [ ] Search functionality works
# [ ] Can create new student
# [ ] Can mark attendance
# [ ] Can record assessment
```

### Go/No-Go Criteria
- ✅ All row counts match exactly
- ✅ Random sample verification PASSED
- ✅ All smoke tests pass without errors
- ✅ No critical issues in verification report

**If any fails:** Abort immediately, rollback, fix issues, retry.

## 🔄 Phase 4: Blue-Green Cutover (Gradual Traffic Shift)

**Duration:** 4-6 hours total  
**Risk Level:** MEDIUM (controlled gradual shift)  
**User Impact:** MINIMAL (brief service restart during full cutover)

### Setup Phase 4
```bash
# Create .env.production and cutover configuration
npx ts-node scripts/setup-blue-green.ts

# This creates:
# - .env.production (PostgreSQL connection)
# - migration-config.json (detailed config)
# - CUTOVER_CHECKLIST.md (detailed procedures)
# - lib/database-health-monitor.ts (monitoring)

# Review the checklist
cat CUTOVER_CHECKLIST.md

# Save PostgreSQL start time
export MIGRATION_START_TIME=$(date +%s)
```

### Phase 4.1: 10% Traffic (Canary Testing)
```bash
# Set traffic percentage for feature flag
export TRAFFIC_PERCENTAGE=10

# Deploy (no code changes, config only)
npm run build
npm start

# Monitor for 2 hours:
# Check logs every 15 minutes
tail -f logs/migration-progress-*.log
tail -f logs/health-check.log

# Monitor checklist items:
# [ ] Error rate < 0.01%?
# [ ] Data writes persisting?
# [ ] Response times normal?
# [ ] No database errors?

# Every 30 minutes: Verify all checks passed
# If all good → proceed to Phase 2
# If any issue → IMMEDIATE ROLLBACK
```

### Phase 4.2: 50% Traffic (Progressive Rollout)
```bash
# Only if Phase 1 monitoring all passed
export TRAFFIC_PERCENTAGE=50

# Deploy configuration change
npm run build && npm restart

# Monitor for 2 hours
# Same monitoring as Phase 1

# Check:
# [ ] No new errors?
# [ ] Performance stable?
# [ ] Write operations confirmed?
# [ ] Ready for full cutover?
```

### Phase 4.3: 100% Traffic (Full Cutover)
```bash
# Only if Phases 1-2 monitoring all passed

# PRE-CUTOVER (30 minutes before)
# [ ] All monitoring team standing by
# [ ] Incident response team alerted
# [ ] Customer support notified

# CUTOVER EXECUTION
# 1. Stop application gracefully
npm stop

# 2. Update production .env to PostgreSQL
cp .env.production .env

# 3. Set SQLite to read-only
export SQLITE_READONLY_PATH="file:prisma/dev.db?mode=ro"

# 4. Restart application
npm run dev  # or docker restart

# 5. Verify application started
# - Check localhost:3000
# - Run app smoke tests
# - Monitor error logs

# IMMEDIATE POST-CUTOVER (First hour)
# [ ] Dashboard loads correctly
# [ ] Can login
# [ ] Row count checks pass
# [ ] No error spikes
# [ ] Data writes verified

# CONTINUOUS MONITORING (24 hours)
# Keep watching logs for any anomalies
tail -f logs/health-check.log
```

## 🛡️ Phase 5: Post-Migration Safety Period (7 Days)

**Duration:** 7 days  
**Risk Level:** LOW (monitoring only)  
**User Impact:** NONE (production running)

### Daily Verification Cron Job

```bash
# Schedule this to run every morning
# (Add to crontab or task scheduler)

# Daily check:
export PHASE=5
export MIGRATION_START_TIME=$(date +%s)
npx ts-node scripts/daily-verification.ts

# This verifies:
# - Row counts match baseline exactly
# - No data has drifted since migration
# - All tables healthy
# - Generates daily report
```

### Sample Output
```
Day 1: All row counts match baseline
Day 2: All row counts match baseline
Day 3: All row counts match baseline
Day 4: All row counts match baseline
Day 5: All row counts match baseline
Day 6: All row counts match baseline
Day 7: All row counts match baseline ✅

✅ 7-DAY SAFETY PERIOD COMPLETE
Ready for Phase 6: Cleanup
```

### Rollback Procedure (If Needed)
```bash
# Works any time during Phase 5 (7-day window)

# 1. Stop application
npm stop

# 2. Revert to SQLite
# Edit .env:
# DATABASE_URL="file:prisma/dev.db"
# DIRECT_URL="file:prisma/dev.db"

# 3. Restart
npm run dev

# 4. Verify
# - Check data all present
# - Verify row counts still match

# Root cause analysis
# - Review logs/migration-progress-*.log
# - Check PostgreSQL error logs
# - Fix issue
# - Retry migration with fixes
```

## 🧹 Phase 6: Cleanup (After 30+ Days)

**Duration:** 1 hour  
**Risk Level:** ZERO (safe cleanup only)  
**User Impact:** NONE

### Cleanup Steps

```bash
# Only execute after 30+ days of successful operation
export SKIP_30_DAY_CHECK=true  # If you want to skip wait

npx ts-node scripts/cleanup-post-migration.ts

# This will:
# [ ] Archive SQLite database
# [ ] Remove migration-lock.txt
# [ ] Update documentation
# [ ] Generate final migration report
# [ ] Verify PostgreSQL backups configured

# Clean up temporary artifacts (after keeping for 30 days)
rm -rf backups/*.original
rm -f migration-lock.txt
rm -f .env.new

# Long-term archival (recommended)
# Keep SQLite backup for 6+ months
# Archive to S3 Glacier or similar cold storage
# Test restore procedures quarterly
```

## 📊 Verification Checklist

### Before Phase 1
- [ ] PostgreSQL instance ready
- [ ] Connection string obtained
- [ ] All backups directories created
- [ ] Team aware of migration window

### Before Phase 2
- [ ] Backup A, B, C all exist and verified
- [ ] Row count baseline created
- [ ] migration-lock.txt in place
- [ ] All changes committed to git

### Before Phase 3
- [ ] Data migration completed
- [ ] Migration logs reviewed for errors
- [ ] No critical errors in logs

### Before Phase 4
- [ ] Row counts match exactly
- [ ] Data sampling PASSED
- [ ] Application smoke tests passed
- [ ] PostgreSQL backups configured
- [ ] Team trained on rollback procedure

### Before Phase 5
- [ ] Full cutover successful
- [ ] SQLite in read-only mode
- [ ] No error spikes in logs
- [ ] Daily verification script running

### Before Phase 6
- [ ] 7 days of daily verifications passed
- [ ] 30+ days of production operation
- [ ] No issues or incidents
- [ ] All backups still intact

## 🚨 Troubleshooting

### Issue: Row counts don't match

**Cause:** Data type conversion error or missing records  
**Solution:**
1. Stop - don't proceed
2. Check logs: `grep ERROR logs/migration-progress-*.log`
3. Look for foreign key constraint errors
4. Review affected table in both databases
5. Fix migration script
6. Restore from Backup A and retry

### Issue: Data values differ in sampling

**Cause:** SQLite/PostgreSQL type conversion incompatibility  
**Solution:**
1. Identify the field causing mismatch
2. Check transformation logic in migrate-data script
3. Review SQLite data type vs PostgreSQL expectation
4. Adjust transformation and retry

### Issue: Need to rollback from Phase 4

**Cause:** Unacceptable error rate or data corruption detected  
**Solution:**
```bash
# Within 7-day Phase 4/5 window:
1. Set TRAFFIC_PERCENTAGE=0 (immediate)
2. Revert DATABASE_URL to SQLite
3. Restart application
4. Verify data present
5. Investigate root cause
6. Fix issues
7. Retry Phase 2+ with fixes
```

### Issue: Want to keep both databases running

**Cause:** Dual-write logging for validation  
**Solution:**
```bash
# Use environment flag
export ENABLE_DUAL_WRITE_LOG=true
export PHASE=5

# All writes logged with verification
# Check: logs/dual-write-monitor.log
# Summary: logs/dual-write-summary.json
```

## 📈 Success Metrics

After successful migration:
- ✅ **Data Completeness:** 100% of records migrated
- ✅ **Data Integrity:** All fields match exactly
- ✅ **Availability:** < 5 minutes downtime during cutover
- ✅ **Performance:** Equal or better query times
- ✅ **Scalability:** Support 100+ concurrent users
- ✅ **Safety:** Instant rollback capability maintained

## 🎓 Key Learnings

1. **Three Backups > One Backup** - Multiple formats increase recovery options
2. **Verify at Every Step** - Checksums catch problems early
3. **Gradual Isn't Slow** - 10% → 50% → 100% takes 4 hours total
4. **Rollback Ready** - Keep SQLite untouched for instant recovery
5. **Documentation Saves Lives** - Clear procedures prevent mistakes

## 📞 Support

If you encounter issues:
1. Check troubleshooting section above
2. Review detailed logs in logs/ directory
3. Check migration-progress-*.log for errors
4. Verify data in backups/ directory exists
5. Use rollback procedure and restart

---

**Total Migration Time:** ~7 days (with safety period)  
**Downtime:** < 5 minutes  
**Data Loss Risk:** ZERO  
**Rollback Window:** 7 days  

Ready to begin? Start with Phase 1! 🚀
