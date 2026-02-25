# 🗺️ Quick Reference: Complete Data Flow Map

**Purpose:** Single-page cheat sheet for understanding data flow through the entire system  
**Best For:** Debugging, onboarding, impact analysis  
**Last Updated:** February 21, 2026

---

## 📍 Where Does Each Page Get Its Data?

### 🏠 DASHBOARD PAGE (`src/app/page.tsx`)

```
┌─────────────────────────────────────────────┐
│ Stats Cards (top)                           │
│ ├─ Total Students:  /api/dashboard/stats    │
│ ├─ Total Groups:    /api/dashboard/stats    │
│ ├─ Attendance Rate: /api/dashboard/stats    │
│ ├─ Active Courses:  /api/dashboard/stats    │
│ ├─ Completion %:    /api/dashboard/stats    │
│ └─ Pending Assess:  /api/dashboard/stats    │
│                                             │
│ Programme Health Table                      │
│ └─ Group info:      /api/dashboard/summary  │
│                                             │
│ Attendance Chart                            │
│ └─ 30-day trend:    /api/dashboard/charts   │
│                                             │
│ Group Distribution (Pie)                    │
│ └─ Company breakdown: /api/groups           │
└─────────────────────────────────────────────┘

REFRESH: Every 30-60 seconds (SWR default)
ISSUES: ⚠️ May show stale data after other pages make changes
```

---

### 👥 GROUPS PAGE (`src/app/groups/page.tsx`)

```
┌─────────────────────────────────────────────┐
│ Group List/Grid                             │
│ ├─ Group info:    /api/groups               │
│ ├─ Students:      /api/groups/{id}/students │
│ ├─ Assessments:   /api/assessments?groupId  │
│ └─ Credits Calc:  IN-MEMORY (from above)    │
│                                             │
│ Per Group Card Shows:                       │
│ ├─ Name, Description                        │
│ ├─ Student Count                            │
│ ├─ Credit Progress (calculated)             │
│ ├─ Status (BEHIND/ON_TRACK/AHEAD)           │
│ └─ Action Buttons (Edit, Add, Archive)      │
└─────────────────────────────────────────────┘

REFRESH: Every 30 seconds (GroupsContext)
CALCULATION: 
  totalCredits = SUM(assessments where status=COMPETENT) × credits
  completionRate = totalCredits / requiredCredits
  status = determines color/badge

ISSUES: ⚠️ May differ from Dashboard due to different calc logic
```

---

### 📝 ASSESSMENTS PAGE (`src/app/assessments/page.tsx`)

```
┌─────────────────────────────────────────────┐
│ Assessment Table                            │
│ ├─ List all:      /api/assessments          │
│ ├─ Filter by:     Status, Unit, Student     │
│ ├─ Student names: /api/students (context)   │
│ ├─ Unit standards:/api/unit-standards       │
│ └─ Details modal: /api/students/{id}        │
│                                             │
│ Marking Workflow:                           │
│ ├─ Open modal (Assessment + Student info)   │
│ ├─ Mark status (COMPETENT/NOT_COMPETENT)    │
│ ├─ Add feedback notes                       │
│ └─ POST /api/assessments/{id}/mark          │
│                                             │
│ Bulk Mark:                                  │
│ └─ POST /api/assessments/bulk-mark          │
└─────────────────────────────────────────────┘

REFRESH: Manual or on modal close
TRIGGERS REFRESH: 
  - Dashboard (credits changed)
  - Groups (progress recalculated)
  - Students (completion % updated)

ISSUES: ⚠️ Dashboard may not update immediately
```

---

### 🎓 STUDENTS PAGE (`src/app/students/page.tsx`)

```
┌─────────────────────────────────────────────┐
│ Student List                                │
│ ├─ All students:  /api/students             │
│ ├─ Group info:    /api/groups (for display) │
│ ├─ Filter by:     Name, Group, Status       │
│ └─ Sort by:       Name, Progress, Updated   │
│                                             │
│ Student Detail Modal:                       │
│ ├─ Basic info:    /api/students/{id}        │
│ ├─ Progress:      /api/students/{id}/...    │
│ ├─ Assessments:   /api/assessments?...      │
│ └─ Group assign:  /api/groups               │
│                                             │
│ Actions:                                    │
│ ├─ Create:        POST /api/students        │
│ ├─ Edit:          PATCH /api/students/{id}  │
│ ├─ Delete:        Soft delete               │
│ └─ Bulk Import:   POST /api/students/...    │
└─────────────────────────────────────────────┘

REFRESH: Manual (click refresh) or modal close
KEY DATA: Student count affects Group counts

ISSUES: ⚠️ Adding student doesn't immediately update Groups page
```

---

### 📅 SESSIONS/TIMETABLE PAGE (`src/app/sessions/page.tsx`)

```
┌─────────────────────────────────────────────┐
│ Calendar Views (Month/Week/Day)             │
│ ├─ Sessions:      /api/sessions?from=...    │
│ ├─ Groups:        /api/groups (context)     │
│ ├─ Modules:       /api/modules              │
│ └─ Attendance:    /api/sessions/{id}/...    │
│                                             │
│ Session Creation:                           │
│ ├─ Group (req):   Dropdown from /api/groups │
│ ├─ Module (req):  Dropdown from /api/modules│
│ ├─ Date/Time:     Input                     │
│ └─ POST /api/sessions                       │
│                                             │
│ Attendance Marking:                         │
│ ├─ Show students: From group membership     │
│ ├─ Mark each:     PRESENT/LATE/NO_SHOW      │
│ └─ POST /api/attendance                     │
└─────────────────────────────────────────────┘

REFRESH: Calendar range change
TRIGGERS REFRESH:
  - Dashboard (attendance % may change)
  - Students (attendance rate updated)
```

---

## 🔗 Data Dependency Chain

```
WRITES (Changes):
┌─────────────────────────────────────────────┐
│ When you CREATE/EDIT something...           │
├─────────────────────────────────────────────┤
│ POST /api/students                          │
│   ↓ Invalidates                             │
│   ├─ Student list (students page)           │
│   ├─ Group student count (groups page)      │
│   ├─ Group credits (recalculate)            │
│   ├─ Dashboard stats                        │
│   └─ Group distribution chart               │
│                                             │
│ PATCH /api/groups/{id}                      │
│   ↓ Invalidates                             │
│   ├─ Groups list (groups + dashboard)       │
│   ├─ Group detail                           │
│   └─ Dashboard summary table                │
│                                             │
│ POST /api/assessments/{id}/mark             │
│   ↓ Invalidates                             │
│   ├─ Assessment list                        │
│   ├─ Group credits (RECALCULATE!)           │
│   ├─ Student progress                       │
│   ├─ Dashboard stats                        │
│   ├─ Dashboard summary                      │
│   └─ Groups page (cards)                    │
│                                             │
│ POST /api/attendance                        │
│   ↓ Invalidates                             │
│   ├─ Session attendance                     │
│   ├─ Student attendance rate                │
│   ├─ Dashboard attendance chart             │
│   └─ Group attendance rate                  │
└─────────────────────────────────────────────┘
```

---

## 🚨 Known Sync Issues & Timing

```
ISSUE #1: Assessment Mark Lag
───────────────────────────────
Timeline:
  T=0:   User marks "COMPETENT" in Assessment page ✓
  T=5:   Dashboard shows OLD credit value ❌
  T=30:  Groups page refreshes, shows new value ✓
  T=60:  Dashboard finally refreshes ✓

ROOT CAUSE: Different endpoints + different refresh intervals
FIX NEEDED: Event-based invalidation instead of polling

ISSUE #2: Student Add Lag
──────────────────────────
Timeline:
  T=0:   User adds student in Students page ✓
  T=5:   Groups page still shows old count ❌
  T=30:  Groups refreshes, shows new count ✓
  T=60:  Dashboard refreshes ✓

ROOT CAUSE: No cache invalidation broadcast
FIX NEEDED: Trigger dependent page refresh after POST

ISSUE #3: Credit Calculation Mismatch
──────────────────────────────────────
Groups Page:
  Shows: 342 credits earned
  Calc: All assessments in group (in-memory)
  
Dashboard:
  Shows: 285 credits earned
  Calc: /api/dashboard/summary endpoint
  
ROOT CAUSE: Two different calculation algorithms!
FIX NEEDED: Consolidate to single calculation function
```

---

## 🔄 API Endpoints Summary

```
API ENDPOINT              | RETURNS              | USED BY             | REFRESH
──────────────────────────────────────────────────────────────────────────────
GET  /api/dashboard/stats | Stats data          | Dashboard           | 60s
GET  /api/dashboard/summary | Health table data | Dashboard           | 60s
GET  /api/dashboard/charts  | Chart data        | Dashboard           | 60s
GET  /api/dashboard/alerts  | Alert messages    | Dashboard           | 60s
GET  /api/groups          | Group array         | Groups, Dashboard   | 30s
GET  /api/groups/{id}     | Single group        | Groups detail     | Manual
POST /api/groups          | Created group       | Groups modal      | Manual
PATCH /api/groups/{id}    | Updated group       | Groups modal      | Manual
DELETE /api/groups/{id}   | Success/error       | Groups list       | Manual
──────────────────────────────────────────────────────────────────────────────
GET  /api/assessments     | Assessment list     | Assessments page    | Manual
GET  /api/assessments?... | Filtered list       | Assessments page    | Manual
POST /api/assessments/.../mark | Success       | Assessment modal    | Manual
POST /api/assessments/bulk-mark | Success      | Assessment page     | Manual
──────────────────────────────────────────────────────────────────────────────
GET  /api/students        | Student list        | Students page       | Manual
GET  /api/students/{id}   | Student detail      | Modal              | Manual
POST /api/students        | Created student     | Student modal      | Manual
PATCH /api/students/{id}  | Updated student     | Student modal      | Manual
GET  /api/students/{id}/progress | Progress    | Student modal      | On open
──────────────────────────────────────────────────────────────────────────────
GET  /api/sessions        | Sessions array      | Sessions page       | Manual
POST /api/sessions        | Created session     | Session modal      | Manual
GET  /api/sessions/{id}/attendance | Attendance | Session detail    | Manual
POST /api/attendance      | Success            | Attendance modal    | Manual
──────────────────────────────────────────────────────────────────────────────
GET  /api/unit-standards  | Standards list      | Assessments context | Manual
GET  /api/modules         | Modules list        | Sessions context    | Manual
POST /api/auth/login      | JWT token           | Login page         | On submit
```

---

## 🎯 Impact Analysis: "If I change X, what breaks?"

```
CHANGE: Add new field to Group model

AFFECTED PAGES:
  ✓ Groups page (display)
  ✓ Dashboard (group cards/table)
  ? Assessment page (group filter)
  
API CHANGES NEEDED:
  • PATCH /api/groups/{id}
  • GET /api/groups response schema
  • GET /api/dashboard/summary (if shown)

DATABASE CHANGES:
  • Prisma schema update
  • Database migration
  • Seed script update

TESTING:
  ✓ Groups CRUD operations
  ✓ Dashboard group display
  ✓ Filter validation

──────────────────────────────────

CHANGE: Add new field to Assessment model

AFFECTED PAGES:
  ✓ Assessments page (marking form)
  ✓ Groups page (credit calc may change)
  ✓ Dashboard (stats may change)
  ✓ Students page (progress detail)

API CHANGES NEEDED:
  • POST /api/assessments/{id}/mark payload
  • GET /api/assessments response
  • GET /api/group/{id}/assessments
  • /api/dashboard/stats calculation

DATABASE CHANGES:
  • Prisma schema
  • Migration
  • Calculation functions

TESTING:
  ✓ Marking workflow
  ✓ Credit calculation
  ✓ Dashboard stat accuracy
  ✓ Student progress accuracy

──────────────────────────────────

CHANGE: Modify attendance calculation logic

AFFECTED PAGES:
  ✓ Dashboard (attendance chart/stat)
  ✓ Sessions page (show rates)
  ✓ Students page (progress detail)
  ✓ Groups page (health metrics)

API CHANGES NEEDED:
  • /api/dashboard/stats (recalc)
  • /api/dashboard/charts (recalc)
  • /api/dashboard/summary (recalc)
  • /api/students/{id}/progress (recalc)
  • /api/groups/{id} (recalc)

TESTING:
  ✓ Attendance trend accuracy
  ✓ Rate calculations
  ✓ All pages with attendance data
  ✓ Edge cases (no sessions, etc)
```

---

## ✅ Data Validation Checklist

```
When adding a new feature, verify:

DATA FLOW:
  □ Where does data come from? (which API)
  □ Who needs to refresh when it changes?
  □ Do other pages show the same data?
  □ Are calculations consistent everywhere?

REFRESHING:
  □ When should the cache invalidate?
  □ Do dependent pages need to refresh?
  □ Is refresh timing reasonable?
  □ Are there race conditions possible?

API DESIGN:
  □ Response format consistent with others?
  □ Proper error handling?
  □ Appropriate filters/sorting?
  □ Pagination needed?

DATABASE:
  □ Proper indexes on queried fields?
  □ Query performance acceptable?
  □ Are calculations DB or in-app?
  □ Data integrity constraints?

TESTING:
  □ Test data creation flow?
  □ Test data update flow?
  □ Test data retrieval?
  □ Test concurrent updates?
  □ Test cross-page consistency?
```

---

## 🔐 Current State Assessment

```
✅ WORKING WELL:
  • Individual page data loading
  • Component rendering
  • Basic CRUD operations
  • Modal interactions
  • Authentication

⚠️ NEEDS ATTENTION:
  • Cross-page data consistency
  • Real-time sync (delays are normal)
  • Cache invalidation strategy
  • Error handling consistency
  • Calculation consolidation

❌ CRITICAL ISSUES:
  • Dashboard vs Groups credit calculation mismatch
  • Competing refresh intervals causing race conditions
  • No event-based invalidation system
  • Partial data updates don't trigger dependent refreshes
```

---

## 📋 Reference: What Each Hook Does

```
useApi.ts
  ├─ Fetches data from API
  ├─ Implements deduplication (very good!)
  ├─ Handles caching
  └─ Used by: All pages for data loading

useDashboard.ts
  ├─ Loads all dashboard stats
  ├─ Calls /api/dashboard/* endpoints
  └─ Returns: { stats, summary, charts, alerts }

useAssessments.ts
  ├─ CRUD operations for assessments
  ├─ Filtering and search
  └─ Bulk operations

useStudents.ts
  ├─ Student list and detail
  ├─ Progress tracking
  └─ Bulk operations

useSites.ts (?)
  └─ [Verify what this manages]

useProgress.ts
  ├─ Student progress calculations
  ├─ Credit earned tracking
  └─ Completion percentage
```

---

## 🎓 Developer Tips

```
DEBUGGING A PAGE:
  1. Open DevTools → Network tab
  2. Look for API calls it makes
  3. Check response data
  4. Verify data matches components
  5. Check for console errors
  
ADDING A NEW FIELD:
  1. Update Prisma schema
  2. Run migration
  3. Update API endpoint response
  4. Update API calculation (if applicable)
  5. Update component to display
  6. Update related endpoints (if shared data)
  7. Test on all related pages
  
DEBUGGING STALE DATA:
  1. Check page's refresh interval
  2. Manually trigger refresh
  3. Check if other pages show same issue
  4. Look for missing cache invalidation
  5. Check API response timestamp
  
PERFORMANCE ISSUE:
  1. Check database query performance
  2. Look for N+1 query problems
  3. Check API response size
  4. Verify caching is working
  5. Check for unnecessary re-fetches
```

---

## 🔗 File Locations Reference

```
PAGES (Where components render):
  src/app/page.tsx                    ← Dashboard
  src/app/groups/page.tsx             ← Groups Management
  src/app/assessments/page.tsx        ← Assessment Marking
  src/app/students/page.tsx           ← Student Management
  src/app/sessions/page.tsx           ← Timetable & Sessions

HOOKS (Data fetching logic):
  src/hooks/useApi.ts                 ← Core data fetching
  src/hooks/useDashboard.ts           ← Dashboard data
  src/hooks/useAssessments.ts         ← Assessments data
  src/hooks/useStudents.ts            ← Students data
  src/hooks/useProgress.ts            ← Progress calculations
  src/hooks/useAttendance.ts          ← Attendance data

API ROUTES (Backend endpoints):
  src/app/api/dashboard/stats/route.ts
  src/app/api/dashboard/summary/route.ts
  src/app/api/dashboard/charts/route.ts
  src/app/api/groups/route.ts
  src/app/api/assessments/route.ts
  src/app/api/students/route.ts
  src/app/api/sessions/route.ts

COMPONENTS (UI pieces):
  src/components/DashboardStats.tsx    ← Stats cards
  src/components/dashboard/            ← Dashboard components
  src/components/modals/              ← Modal dialogs
  src/components/tables/              ← Table components
  src/components/ui/                  ← Reusable UI
  src/components/GroupsManagement.tsx ← Groups container

CONTEXTS (Shared state):
  src/contexts/                       ← React contexts
  GroupsContext                       ← Group management state
```

---

**For more details, see:**
- [UNIFIED_DATA_FLOW_ARCHITECTURE.md](UNIFIED_DATA_FLOW_ARCHITECTURE.md) - Complete flows
- [DATA_FLOW_VISUAL_DIAGRAMS.md](DATA_FLOW_VISUAL_DIAGRAMS.md) - Visual Mermaid diagrams
- [SYSTEM_AUDIT_DATA_SYNC_ISSUES.md](SYSTEM_AUDIT_DATA_SYNC_ISSUES.md) - Issues to fix
