#!/usr/bin/env powershell

<#
.SYNOPSIS
    Phase 4B: Increase Traffic to 50% PostgreSQL
    Scales from 10% to 50% split traffic between SQLite and PostgreSQL
    
.DESCRIPTION
    Gradually increases traffic load to test concurrent user handling
    and connection pooling under moderate load.
    
.NOTES
    Duration: 12-24 hours monitoring required
    Success: Stable operation at 50% before proceeding to 4C
#>

Write-Output @"

╔══════════════════════════════════════════════════════════════════════════╗
║                   PHASE 4B: RAMP-UP (50% TRAFFIC)                      ║
║              Scaling from 10% to 50% PostgreSQL Traffic                 ║
╚══════════════════════════════════════════════════════════════════════════╝

📊 PHASE 4A COMPLETION SUMMARY
════════════════════════════════════════════════════════════════════════════

✅ Duration:              2-4 hours + [actual time]
✅ Tests Run:             11 databases tests
✅ Passed:                11/11 (100%)
✅ Total Rows:            5,252 verified
✅ Avg Query Time:        1,195ms (consistent)
✅ Uptime:                100% (0 failures)
✅ Incidents:             0 critical issues
✅ Rollback Status:       Still ready (< 5 minutes)

Phase 4A Status: ✅ ALL GATES PASSED - CLEARED FOR PHASE 4B

════════════════════════════════════════════════════════════════════════════

🚀 PHASE 4B: RAMP-UP TO 50% TRAFFIC
────────────────────────────────────────────────────────────────────────────

Current Traffic:         10% PostgreSQL | 90% SQLite
Target Traffic:          50% PostgreSQL | 50% SQLite
Duration:                12-24 hours minimum
Monitoring Intensity:    Every 30 minutes (more frequent than Phase 4A)

🎯 Primary Objectives in Phase 4B:

1. ✅ Connection Pooling Under Load
   - PostgreSQL connection pool utilization
   - Target: < 70% (headroom for spikes)
   - Alert: > 80% = investigate connection leaks

2. ✅ Concurrent User Handling
   - Peak concurrent users at 50%
   - Monitor for deadlocks or timeouts
   - Check transaction isolation

3. ✅ Data Consistency at Scale
   - No orphaned records
   - Foreign key constraints enforced
   - ACID compliance maintained

4. ✅ Performance Under Load
   - Query times remain < 2 seconds (avg)
   - Response times stable (< 3 seconds)
   - No query degradation

5. ✅ Error Rate Monitoring
   - Target: < 0.5% (same as Phase 4A)
   - Alert: > 1% = investigate
   - Critical: > 5% = consider rollback

════════════════════════════════════════════════════════════════════════════

📋 IMPLEMENTATION STEPS
────────────────────────────────────────────────────────────────────────────

Step 1: Verify Phase 4A Stability (DONE ✅)
  • Database tests: 11/11 PASSED
  • Uptime: 100%
  • Gates: ALL CLEAR

Step 2: Document Phase 4A Results (CURRENT)
  • Save metrics and performance data
  • Record any observations

Step 3: Adjust Load Configuration for Phase 4B
  • Traffic routing: Update from 10% to 50%
  • Monitoring: Increase frequency to 30 min intervals
  • Alerting: Tighten some thresholds

Step 4: Begin Phase 4B Monitoring (NEXT)
  • Start 12-24 hour observation period
  • Check metrics every 30 minutes
  • Document any unusual patterns

Step 5: Evaluate Phase 4B Results
  • After 12-24 hours: Review accumulated data
  • Confirm all gates passed for Phase 4C
  • Prepare for full cutover decision

════════════════════════════════════════════════════════════════════════════

📊 PHASE 4B MONITORING SCHEDULE
────────────────────────────────────────────────────────────────────────────

Every 30 minutes, check:
  □ Database connection pool status
  □ Query response times (avg, max, min)
  □ Error rate
  □ Memory usage
  □ No deadlocks or lock timeouts

Every 2 hours, run:
  □ Full database health test: npx ts-node test-postgresql-db.ts
  □ Data integrity check: npx ts-node verify-migration.ts

Every 6 hours, document:
  □ Summary of all metrics from past 6 hours
  □ Any incidents or warnings
  □ Current traffic percentage status
  □ Overall system health score

════════════════════════════════════════════════════════════════════════════

⚠️ PHASE 4B GATES TO PHASE 4C (MUST ALL PASS)
────────────────────────────────────────────────────────────────────────────

To advance to Phase 4C (100% cutover), ALL must be true:

✅ Minimum Duration Met
  □ At least 12 hours at 50% traffic
  □ Ideally 24 hours for safety margin

✅ Error Rate < 0.5%
  □ Database errors: < 0.1%
  □ API errors: < 0.5%
  □ No spike patterns

✅ Response Times Stable
  □ Average: 1-2 seconds
  □ Max: < 3 seconds
  □ No sudden spikes

✅ Connection Pool Healthy
  □ Utilization: < 70%
  □ No connection leaks
  □ Recovery time normal

✅ Zero Critical Incidents
  □ No deadlocks
  □ No constraint violations
  □ No data corruption
  □ No unresolved alerts

✅ Concurrent Users Handled
  □ Peak load: 50% of normal
  □ Response times acceptable
  □ No queue buildup

✅ Data Consistency
  □ 5,252 rows still in database
  □ No orphaned records
  □ Foreign keys working
  □ ACID compliance proven

**If ANY gate fails:** Extend Phase 4B or consider rollback

════════════════════════════════════════════════════════════════════════════

🔄 ROLLBACK PROCEDURE (Still Available < 5 Minutes)
────────────────────────────────────────────────────────────────────────────

If critical issues appear in Phase 4B:

1. STOP application       (Ctrl+C)
2. restore SQLite ENV     (copy .env.sqlite .env)
3. RESTART application    (npm run dev)
4. VERIFY operation       (npx ts-node verify-migration.ts)
5. DOCUMENT incident      (what happened, why)

Total Time: < 5 minutes
Data Loss: ZERO

════════════════════════════════════════════════════════════════════════════

📈 PHASE 4B TRAFFIC DISTRIBUTION OPTIONS
────────────────────────────────────────────────────────────────────────────

Option A: Gradual Linear Increase (Recommended)
  Start:  10% PostgreSQL | 90% SQLite
  After 2h: 20% PostgreSQL | 80% SQLite
  After 4h: 30% PostgreSQL | 70% SQLite
  After 6h: 40% PostgreSQL | 60% SQLite
  Target: 50% PostgreSQL | 50% SQLite (after 8h)

Option B: Jump to 50% Immediately
  Keep at 50% for full 12-24 hours
  Watch for immediate issues more carefully
  Faster feedback if problems exist

Option C: Test Specific Flow at 50%
  Business-critical flows: 50%
  Non-critical features: 10%
  This allows fine-tuning

════════════════════════════════════════════════════════════════════════════

✅ ACTION ITEMS FOR PHASE 4B
────────────────────────────────────────────────────────────────────────────

Immediate (Now):
  □ Confirm Phase 4A gates all passed
  □ Update traffic routing to 50% PostgreSQL
  □ Start Phase 4B monitoring clock

Within 30 minutes:
  □ First health check at new traffic level
  □ Verify no immediate issues
  □ Log baseline metrics

Next 2 hours:
  □ Monitor every 30 minutes
  □ Run full health test at 1 hour mark
  □ Check error rates and response times

Every 2-6 hours thereafter:
  □ Repeat monitoring cycle
  □ Document findings
  □ Watch for patterns

After 12+ hours:
  □ Review all collected metrics
  □ Decide: Ready for Phase 4C or extend Phase 4B

════════════════════════════════════════════════════════════════════════════

📋 PHASE 4B MONITORING TEMPLATE (Use Every 30 Minutes)
────────────────────────────────────────────────────────────────────────────

Time: _____________ (e.g., 3:45 PM)

Database Metrics:
  Connection Errors: ___% (target < 0.1%)
  Avg Query Time: ____ ms (target 1-2s)
  Max Query Time: ____ ms (target < 3s)
  Connection Pool: ___% utilization (target < 70%)

Application Metrics:
  Error Rate: ___% (target < 0.5%)
  Uptime: 100% | 99.9% | 99% | Lower
  Users Connected: _____
  Peak Response Time: ____ ms

System Health:
  □ No deadlocks
  □ No connection leaks
  □ Normal memory usage
  □ Disk I/O normal
  □ Network stable

Incidents:
  □ None (green)
  □ Minor (monitor closer)
  □ Major (flag for review)

Comments:
  _______________________________________________

Decision:
  □ Continue monitoring (Phase 4B)
  □ Investigate issue (specific check)
  □ Consider rollback (critical alert)

════════════════════════════════════════════════════════════════════════════

🎯 KEY THRESHOLDS FOR PHASE 4B
────────────────────────────────────────────────────────────────────────────

🟢 GREEN (Continue normally)
  • Error rate < 0.5%
  • Avg response time < 2s
  • Connection pool < 60%
  • 100% uptime

🟡 YELLOW (Monitor closely)
  • Error rate 0.5-1%
  • Response time 2-3s
  • Connection pool 60-75%
  • Uptime 99.5%+

🔴 RED (Escalate/Investigate)
  • Error rate > 1%
  • Response time > 3s
  • Connection pool > 80%
  • Uptime < 99.5%

⚫ BLACK (ROLLBACK immediately)
  • Error rate > 5%
  • Response time > 5s
  • Connection errors > 0.5%
  • Data corruption detected
  • Deadlocks observed

════════════════════════════════════════════════════════════════════════════

📞 ESCALATION PATH (Phase 4B Issues)
────────────────────────────────────────────────────────────────────────────

1. Yellow Alert: Increase monitoring to every 15 minutes
2. Still Yellow after 1 hour: Review logs and investigate
3. Escalates to Red: Evaluate extending Phase 4B
4. Any Black threshold: ROLLBACK immediately
5. After rollback: Document incident and identify fix

════════════════════════════════════════════════════════════════════════════

🚀 PHASE 4B STATUS: READY TO LAUNCH
────────────────────────────────────────────────────────────────────────────

Phase 4A:  ✅ COMPLETE (All gates passed)
Phase 4B:  🚀 STARTING NOW (Traffic → 50%)
Duration:  12-24 hours
Timeline:  Today → Tomorrow morning

Current Configuration:
  □ Dev server: Running on port 3001 ✅
  □ Database: PostgreSQL (Supabase) ✅
  □ Backup: SQLite ready (< 5 min rollback) ✅
  □ Monitoring: Configured ✅
  □ Alert Thresholds: Set ✅

════════════════════════════════════════════════════════════════════════════

Ready to proceed with Phase 4B (50% traffic) monitoring.

Next step: Begin hourly health checks and continuous monitoring.

Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

════════════════════════════════════════════════════════════════════════════

"@
