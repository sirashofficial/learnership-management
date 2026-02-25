# 🚀 Phase 4A: Live Monitoring Quick Reference

**Status:** ✅ ACTIVE - Testing in progress  
**Start Time:** February 25, 2026  
**Phase Duration:** 2-4 hours minimum

---

## 📊 Current Metrics (Monitor These Every 5-10 Minutes)

### Critical Metrics (STOP if these fail)
```
❌ Database Connection Errors > 0.1%
   Action: IMMEDIATE ROLLBACK (see below)
   Command: copy .env.sqlite .env && npm run dev

❌ Query Execution Time > 5 seconds
   Action: Investigate slow queries
   Check: PostgreSQL connection pool status

❌ API Error Rate > 5%
   Action: ROLLBACK and investigate
   Check: Application error logs

❌ Data Constraint Violations
   Action: IMMEDIATE ROLLBACK
   Reason: Data integrity issue
```

### Warning Metrics (MONITOR closely)
```
⚠️  API Error Rate 1-5%
   Action: Increase monitoring frequency to 1 minute

⚠️  Query Time 3-5 seconds
   Action: Check connection pool
   Command: Check SERVER LOGS for connection warnings

⚠️  Connection Pool Utilization > 80%
   Action: Prepare for rollback if increases further
```

### Healthy Metrics (Continue monitoring)
```
✅ Database Connection Errors < 0.1%
   Status: Excellent

✅ Query Time 1-2 seconds
   Status: Matching SQLite baseline

✅ API Error Rate < 0.5%
   Status: Expected (auth errors counted)

✅ Connection Pool Utilization < 60%
   Status: Good headroom available
```

---

## 🔍 Quick Diagnostic Commands

### Check PostgreSQL Connectivity
```powershell
# From PowerShell in workspace
cd "c:\Users\LATITUDE 5400\Downloads\Learnership Management"

# Run quick test
npx ts-node test-postgresql-db.ts
```

### View Application Logs
```powershell
# Terminal shows dev server output
# Watch for:
# - "error" (case insensitive)
# - "connection refused"
# - "timeout"
# - "constraint violation"
```

### Check Row Count (Verify Data Integrity)
```powershell
# Quick verification
npx ts-node verify-migration.ts

# Should show:
# ✅ ALL TABLES MATCH
# ⏱️️ TOTAL: 5,252 ↔ 5,252 ✅ ALL MATCH
```

### Force Rollback to SQLite (If Needed)
```powershell
# EMERGENCY PROCEDURE - Do not delay

# 1. Stop server (Ctrl+C in terminal)

# 2. Restore SQLite config
copy .env.sqlite .env

# 3. Restart server
npm run dev

# 4. Verify SQLite is working
npx ts-node verify-migration.ts
```

---

## 📋 60-Minute Check Template

**Every hour, record:**

```
Time: __________ (e.g., 12:30 PM)

Database:
  Connection Errors: ___% (target < 0.1%)
  Avg Query Time: ____ ms (target 1-2s)
  ✅ All 5,252 rows accessible? Yes / No

Application:
  Error Rate: ___% (target < 0.5%)
  Response Time: ____ ms (target < 1s)
  ✅ User Authentication: Working? Yes / No

Incidents:
  [ ] None (proceed normally)
  [ ] Minor (monitor closer)
  [ ] Major (consider rollback)

Notes:
________________________________________

Decision:
  [ ] Continue monitoring (Phase 4A)
  [ ] Extend testing period
  [ ] ROLLBACK to SQLite
```

---

## 🎯 Phase 4A Success Criteria (After 2-4 Hours)

To advance to Phase 4B (50% traffic):

- [x] Database connectivity stable (0 connection drops)
- [x] All 5,252 rows accessible from application
- [x] Error rate consistently < 0.5%
- [x] Response times comparable to baseline (1.1s avg)
- [x] No data corruption detected
- [x] No constraint violations
- [x] Connection pool healthy (< 60% utilization)

**If all boxes checked:** Proceed to Phase 4B ✅

---

## 🆘 When to ROLLBACK (Don't Hesitate)

**IMMEDIATE ROLLBACK if:**

1. **Database connection lost for > 1 minute**
   ```
   Error: Can't connect to PostgreSQL
   Action: STOP -> copy .env.sqlite .env -> npm run dev
   ```

2. **Data corruption or constraint violations**
   ```
   Error: Foreign key violation / orphaned records
   Action: STOP -> copy .env.sqlite .env -> npm run dev
   ```

3. **Error rate exceeds 5%**
   ```
   Error: API returning 500 errors consistently
   Action: STOP -> copy .env.sqlite .env -> npm run dev
   ```

4. **Any CRITICAL alert triggers**
   ```
   See monitoring configuration in PHASE_4_ROLLOUT_PLAN.md
   Action: STOP -> copy .env.sqlite .env -> npm run dev
   ```

---

## 📁 Key Files During Phase 4A

**Production Config:**
- `.env` - PostgreSQL connection (CURRENT)
- `.env.sqlite` - SQLite backup (ROLLBACK)

**Monitoring:**
- `test-postgresql-db.ts` - Run for integrity checks
- `verify-migration.ts` - Compare SQLite vs PostgreSQL row counts
- `PHASE_4_SETUP_COMPLETE.md` - Full documentation

**Safety:**
- `prisma/dev.db` - Original SQLite (untouched)
- `backups/dev.db.backup.1772001355.original` - Backup copy
- `backups/pre-migration-row-counts.json` - Row count baseline
- `backups/sqlite-export-complete.sql` - SQL export

---

## 🔔 Alert Notification Examples

### ✅ Good (Continue normally)
```
✅ 12:30 PM - All systems normal
✅ 1:00 PM - Error rate 0.1%, response time 1.2s
✅ 1:30 PM - Connection pool at 45% utilization
✅ 2:00 PM - No incidents detected, stable operation
```

### ⚠️ Warning (Increase monitoring)
```
⚠️  2:15 PM - Error rate spiked to 3%
   Action: Check application logs, monitor next 15 minutes
   Decision: If continues > 20 min, consider rollback
```

### ❌ Critical (ROLLBACK)
```
❌ 2:30 PM - Database connections dropped, 0% success
   Action: IMMEDIATE ROLLBACK
   Command: copy .env.sqlite .env && npm run dev
❌ Verification: 5,252 SQLite rows confirmed
❌ Status: Back to stable
```

---

## 📞 Escalation Path (If Needed)

1. **First Incident:** Monitor closely for 5 minutes
2. **If Continues:** Review logs, check PHASE_4_ROLLOUT_PLAN.md
3. **If Unresolved:** Trigger ROLLBACK (no permission needed)
4. **Post-Rollback:** Document incident, identify fix, retry

---

## 🎉 Phase 4A Completion Criteria

**After 2-4 hours of stable operation, record:**

- ✅ Duration: 2-4+ hours
- ✅ Incidents: 0-1 minor (no critical)
- ✅ Uptime: 99%+ (target)
- ✅ Data Integrity: 100% (5,252 rows match)
- ✅ Error Rate: < 0.5% average

**Decision:** ✅ Proceed to Phase 4B (50% traffic)

---

**Remember:** Safety first! If anything looks wrong, rollback immediately. The SQLite backup is ready in `.env.sqlite`.

Quick rollback: `copy .env.sqlite .env`

Good luck! 🚀
