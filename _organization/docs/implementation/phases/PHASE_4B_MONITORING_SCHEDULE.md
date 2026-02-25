# Phase 4B: Monitoring Schedule & Commands

**Monitoring Period:** 12-24 hours (Feb 25-26, 2026)  
**Next Check-in:** February 26 morning for Phase 4C approval

---

## Quick Monitoring Commands

### Every 30 Minutes - Health Check
```powershell
cd "c:\Users\LATITUDE 5400\Downloads\Learnership Management"
npx ts-node test-postgresql-db.ts
```

**What to Look For:**
- All 11 tests pass ✅
- Error rate: 0%
- Average query time: < 2 seconds
- Total rows: 5,252

---

### Every 2 Hours - Full Verification
```powershell
cd "c:\Users\LATITUDE 5400\Downloads\Learnership Management"
npx ts-node verify-migration.ts
```

**What to Look For:**
- All row counts match SQLite
- "VERIFICATION PASSED" message
- No data drift detected

---

## Monitoring Checklist (Update This Document)

### Hour 0 (Baseline - COMPLETED)
- [x] Time: [Start Time]
- [x] Health Check: ✅ 11/11 tests passed
- [x] Avg Response: 1.951s
- [x] Verification: ✅ 5,252/5,252 match
- [x] Status: All systems operational

### Hour 0.5 (30 min)
- [ ] Time: _______
- [ ] Health Check: ___/11 tests passed
- [ ] Avg Response: _____s
- [ ] Notes: _______________

### Hour 1
- [ ] Time: _______
- [ ] Health Check: ___/11 tests passed
- [ ] Avg Response: _____s
- [ ] Notes: _______________

### Hour 1.5
- [ ] Time: _______
- [ ] Health Check: ___/11 tests passed
- [ ] Avg Response: _____s
- [ ] Notes: _______________

### Hour 2 (Full Verification)
- [ ] Time: _______
- [ ] Health Check: ___/11 tests passed
- [ ] Avg Response: _____s
- [ ] Verification: _____ rows match
- [ ] Notes: _______________

### Hour 3
- [ ] Time: _______
- [ ] Health Check: ___/11 tests passed
- [ ] Avg Response: _____s
- [ ] Notes: _______________

### Hour 4 (Full Verification)
- [ ] Time: _______
- [ ] Health Check: ___/11 tests passed
- [ ] Avg Response: _____s
- [ ] Verification: _____ rows match
- [ ] Notes: _______________

### Hour 6 (Full Verification)
- [ ] Time: _______
- [ ] Health Check: ___/11 tests passed
- [ ] Avg Response: _____s
- [ ] Verification: _____ rows match
- [ ] Notes: _______________

### Hour 8 (Full Verification)
- [ ] Time: _______
- [ ] Health Check: ___/11 tests passed
- [ ] Avg Response: _____s
- [ ] Verification: _____ rows match
- [ ] Notes: _______________

### Hour 12 (Decision Point - Minimum)
- [ ] Time: _______
- [ ] Health Check: ___/11 tests passed
- [ ] Avg Response: _____s
- [ ] Verification: _____ rows match
- [ ] **Decision:** Proceed to 4C? ⬜ Yes ⬜ Extend ⬜ Rollback
- [ ] Notes: _______________

### Hour 24 (Extended Monitoring)
- [ ] Time: _______
- [ ] Health Check: ___/11 tests passed
- [ ] Avg Response: _____s
- [ ] Verification: _____ rows match
- [ ] **Final Decision:** ⬜ Phase 4C Approved ⬜ Rollback
- [ ] Notes: _______________

---

## Status Criteria

### 🟢 GREEN (All Good)
- All tests passing
- Response time < 2s
- No errors
- Data integrity maintained
- **Action:** Continue monitoring

### 🟡 YELLOW (Watch Closely)
- 1-2 test failures (recoverable)
- Response time 2-3s
- Minor errors (< 0.5%)
- **Action:** Investigate, continue monitoring, prepare for potential rollback

### 🔴 RED (Critical - Rollback)
- Multiple test failures
- Response time > 3s consistently
- Error rate > 1%
- Data integrity issues
- Application unavailable
- **Action:** Execute rollback immediately

---

## Emergency Rollback

**If RED status detected:**

```powershell
# 1. Kill dev server
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force

# 2. Switch back to SQLite
cd "c:\Users\LATITUDE 5400\Downloads\Learnership Management"
copy .env.sqlite .env -Force

# 3. Restart with SQLite
npm run dev
```

---

## What to Monitor in Browser

While site is running, periodically check:

1. **Dashboard loads** - http://localhost:3000
2. **Data displays correctly** - 46 students, 9 groups visible
3. **No error messages** - Console (F12) should be clean
4. **Pages load quickly** - < 3 seconds
5. **Navigation works** - Can click between pages

---

## Phase 4C Approval Gates

Before approving Phase 4C tomorrow morning, verify:

- ✅ **12+ hours stable** - No critical incidents
- ✅ **Error rate < 0.5%** - Consistent throughout period
- ✅ **Response time 1-2s** - No degradation over time
- ✅ **Data integrity 100%** - All verifications passed
- ✅ **Zero rollbacks** - No emergency interventions needed
- ✅ **User experience positive** - Application responsive

---

## Tomorrow Morning Checklist (Feb 26)

1. [ ] Run final health check: `npx ts-node test-postgresql-db.ts`
2. [ ] Run final verification: `npx ts-node verify-migration.ts`
3. [ ] Review monitoring log: Check all checkpoints passed
4. [ ] Test application: Browse key pages, verify data
5. [ ] Make decision: Approve Phase 4C or extend monitoring
6. [ ] Document decision in [PHASE_4B_MONITORING_LOG.md](./PHASE_4B_MONITORING_LOG.md)

---

## Next Phase Preview

**Phase 4C: Full 100% Cutover**
- Already at 100% PostgreSQL (no additional traffic ramp needed)
- Main task: Final documentation and SQLite sunset
- Duration: 1 day
- Deliverable: Official "migration complete" status

**Phase 5: 7-Day Post-Migration Safety**
- Continue monitoring (less frequent)
- Watch for any issues in production use
- Keep SQLite backup until confident

**Phase 6: 30-Day Cleanup**
- Archive SQLite backups
- Remove migration scripts
- Update documentation
- Final celebration 🎉

---

_Remember: You can always rollback if needed. The SQLite backup is safe at `prisma/dev.db`._
