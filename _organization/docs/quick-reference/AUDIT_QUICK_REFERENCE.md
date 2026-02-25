# System Audit Quick Reference

**Date:** February 25, 2026  
**Total Issues:** 16 (3 Critical, 7 Major, 4 Medium, 2 Minor)

## 🔴 Critical (Fix Now)

| # | Issue | File | Fix Time |
|---|-------|------|----------|
| 1 | `/api/health` publicly exposes DB stats, backups, disk space | [health/route.ts:274](src/app/api/health/route.ts#L274) | 1h |
| 2 | `/api/test-data` leaks production counts | [test-data/route.ts:6](src/app/api/test-data/route.ts#L6) | 15m |
| 3 | SSE stream unauthenticated + open CORS | [events/stream/route.ts:51-63](src/app/api/events/stream/route.ts#L51) | 1-2h |

## 🟠 Major (Fix Soon)

| # | Issue | File | Fix Time |
|---|-------|------|----------|
| 4 | `GroupsContext` crashes if metrics null | [GroupsContext.tsx:109](src/contexts/GroupsContext.tsx#L109) | 30m |
| 5 | Student mutations invalidate wrong group path | [StudentContext.tsx:165](src/contexts/StudentContext.tsx#L165) | 30m |
| 6 | `useAssessments` groupId filter broken | [useAssessments.ts:9](src/hooks/useAssessments.ts#L9) | 15m |
| 7 | Event cache hook leaks listeners | [useEventDrivenCache.ts:32](src/hooks/useEventDrivenCache.ts#L32) | 1h |
| 8 | Student attendance query hits URL length limit | [students/page.tsx:87](src/app/students/page.tsx#L87) | 2h |
| 9 | `useApiMutation` double-submit guard resets | [useApi.ts:202](src/hooks/useApi.ts#L202) | 30m |
| 10 | Mixed auth (localStorage + cookies) | Multiple files | 2h |

## 🟡 Medium (Consider)

| # | Issue | File | Fix Time |
|---|-------|------|----------|
| 11 | Dashboard hooks bypass shared fetcher | [useDashboard.ts:3](src/hooks/useDashboard.ts#L3) | 30m |
| 12 | Attendance polling unnecessary | [useAttendance.ts:41](src/hooks/useAttendance.ts#L41) | 15m |
| 13 | SSE connection status not reactive | [useEventStream.ts:237](src/hooks/useEventStream.ts#L237) | 30m |
| 14 | Hardcoded group collections | [attendance/page.tsx:71](src/app/attendance/page.tsx#L71) | 1h |

## 🟢 Minor

| # | Issue | File | Fix Time |
|---|-------|------|----------|
| 15 | Groups page inflates student totals | [groups/page.tsx:168](src/app/groups/page.tsx#L168) | 15m |
| 16 | Groups API logs sensitive rollout data | [groups/route.ts:158](src/app/api/groups/route.ts#L158) | 5m |

---

## 🎯 Recommended Fix Order

1. **Security First** (Issues #1-3) → 2-3 hours
2. **Data Integrity** (Issues #4-7) → 2-3 hours  
3. **Performance** (Issues #8-10) → 3-4 hours
4. **Polish** (Issues #11-16) → 2 hours

**Total:** 10-14 hours

---

## 📊 Impact Summary

### Components Affected
- ✅ Auth system (all pages)
- ✅ Groups context (dashboard, timetables, groups page)
- ✅ Students page (attendance data, filtering)
- ✅ Assessments page (group filtering)
- ✅ Real-time updates (SSE, event-driven cache)
- ✅ API security (health, test-data, events)

### Root Causes
1. Security endpoints lack authentication
2. Cache invalidation path mismatches
3. Missing null checks and cleanup handlers
4. Mixed authentication strategies
5. Legacy polling in event-driven system

---

## ✅ Verification Commands

```bash
# After security fixes
curl http://localhost:3000/api/health
# Expected: 401 Unauthorized

curl http://localhost:3000/api/test-data
# Expected: 401/403/404

curl http://localhost:3000/api/events/stream
# Expected: 401 Unauthorized

# After data integrity fixes
# Add student → check groups page for updated count
# Filter assessments by group → verify correct results
# Monitor dev tools for memory growth → none expected

# After performance fixes
# Load 500+ students → check attendance rates load
# Rapid-click submit → verify single request
# Monitor server logs → no duplicate queries
```

---

## 📁 Related Documentation

- [Full Audit Report](FULL_SITE_AUDIT_2026-02-25.md)
- [Architecture Documentation](ARCHITECTURE_DOCUMENTATION_INDEX.md)
- [Data Dependencies](DATA_DEPENDENCIES_QUICK_REFERENCE.md)
- [Event-Driven Implementation](EVENT_DRIVEN_IMPLEMENTATION_COMPLETE.md)

---

**Next Steps:**
1. Review with team
2. Prioritize Critical issues
3. Create tickets for Major issues
4. Schedule Medium/Minor for next sprint
