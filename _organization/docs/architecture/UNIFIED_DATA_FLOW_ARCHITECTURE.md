# 🔄 Unified Data Flow Architecture - Complete System Diagram

**Generated:** February 21, 2026  
**Updated:** February 24, 2026  
**Status:** Complete system data dependency map  
**Purpose:** Single reference for understanding how data flows through the entire application

---

## 📊 System-Wide Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LEARNERSHIP MANAGEMENT SYSTEM                       │
│                            Complete Data Architecture                        │
└─────────────────────────────────────────────────────────────────────────────┘

                                   DATABASE
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
              ┌─────▼────────┐ ┌─────▼──────┐  ┌──────▼────────┐
              │   Users      │ │  Students  │  │    Groups     │
              │   (Auth)     │ │  (Profile) │  │  (Management) │
              └─────┬────────┘ └─────┬──────┘  └──────┬────────┘
                    │                │               │
                    │     ┌──────────┴───────────────┤
                    │     │                          │
                    │     │          ┌────────────────┴──────────────┐
                    │     │          │                               │
              ┌─────▼─┐   │    ┌─────▼────────┐          ┌─────────▼─────┐
              │Auth   │   │    │ Assessments  │          │  Sessions &   │
              │API    │   │    │  (Grading)   │          │  Attendance   │
              └──┬────┘   │    └─────┬────────┘          └─────────┬─────┘
                 │        │          │                           │
                 │    ┌───┴──────────┴───────┬───────────────────┘
                 │    │                      │
            ┌────▼─────▼──────┐         ┌────▼─────────────┐
            │ FRONTEND LAYER  │         │  CALCULATION     │
            │                │         │  ENGINES         │
            └────────────────┘         └────────────────┘
                 │ │ │ │ │
    ┌────────────┼┼┼┼┼────────────────┐
    │            │││││               │
    │    ┌───────┘│││└───┐            │
    │    │   ┌────┘│└──┐ │            │
    │    │   │ ┌───┘    │ │            │
    │    │   │ │        │ │            │
┌───▼────▼──▼─▼────┬───▼─▼──┬────────▼────┬──────────┬───────────┐
│ DASHBOARD PAGE  │GROUPS   │ ASSESSMENTS │STUDENTS │TIMETABLE  │
│ - Stats         │- Manage │ - Mark      │- Manage │- Schedule │
│ - Charts        │- Archive│ - View      │- Progress│- Sessions │
│ - Alerts        │- Bulk   │ - Bulk      │- Attendance          │
│ - Health        │- Export │ - Export    │- Bulk    │- Modals   │
└─────────────────┴─────────┴─────────────┴─────────┴───────────┘
```

---

## 🔗 Data Dependency Graph

### Primary Data Sources (Database Tables)

```
CORE ENTITIES:
├── users (Authentication & Roles)
├── students (Learner Profiles)
├── groups (Cohorts & Batch Management)
├── unit_standards (Curriculum Framework)
├── modules (Learning Units)
├── sessions (Class Meetings)
├── assessments (Grading & Performance)
├── attendance (Attendance Records)
├── group_sessions (Junction: Groups ↔ Sessions)
└── group_credits (Credit Earned Tracking)
```

### Secondary Calculated Fields

```
COMPUTED FROM PRIMARY DATA:
├── Progress Metrics
│   ├── totalCreditsEarned = SUM(competent assessments × credits)
│   ├── completionRate = totalCreditsEarned / requiredCredits
│   ├── projectedCompletion = currentDate + (remainingCredits / avgRate)
│   └── status = AHEAD | ON_TRACK | BEHIND | AT_RISK
│
├── Attendance Metrics
│   ├── attendanceRate = (PRESENT + LATE) / totalSessions
│   ├── absence_count = NO_SHOW sessions
│   └── trend30days = avgRate for last 30 days
│
└── Assessment Metrics
    ├── pendingCount = status = null or PENDING
    ├── averageScore = AVG(scores) per unit_standard
    └── passingRate = COMPETENT / total_assessed
```

---

## 📄 Page-by-Page Data Flows

### 1️⃣ DASHBOARD PAGE (`src/app/page.tsx`)

```
┌──────────────────────────────────────────────────────────────┐
│                    DASHBOARD PAGE                            │
└──────────────────────────────────────────────────────────────┘

REQUEST FLOW:
────────────

Component Page Load
        ↓
    useDashboard() 
        ├→ GET /api/dashboard/stats
        │   └→ Returns: {
        │       totalStudents,
        │       totalGroups,
        │       attendanceRate,
        │       activeCourses,
        │       completionRate,
        │       pendingAssessments
        │      }
        │
        ├→ GET /api/dashboard/summary
        │   └→ Returns: [Group Health Records] {
        │       groupId, groupName, currentModule,
        │       creditProgress, projectedCompletion,
        │       status, numberOfStudents
        │      }
        │
        ├→ GET /api/dashboard/charts?range=30d
        │   └→ Returns: Attendance Trend {
        │       date, rate, present, total
        │      }
        │
        ├→ GET /api/dashboard/alerts
        │   └→ Returns: Alert Messages {
        │       type (warning|error|success),
        │       message, groupId, studentId
        │      }
        │
        └→ GET /api/groups (for distribution chart)
            └→ Returns: [Groups] for pie chart

DATA ORIGIN TRACE:
──────────────────

Quick Stats:
  totalStudents 
    ← WHERE students.status = 'ACTIVE'
    ← FROM students table
    
Group Health:
  creditProgress 
    ← FROM assessments WHERE status = 'COMPETENT'
    ← JOIN with unit_standards for credits
    ← GROUP BY group_id
    
Attendance Trend:
  attendanceRate
    ← FROM attendance WHERE date >= 30 days ago
    ← JOIN with sessions
    ← Calculate: (PRESENT + LATE) / total

VISUALIZATION COMPONENTS:
─────────────────────────
├── DashboardStats
│   └── Shows: 6 stat cards (all from /api/dashboard/stats)
│
├── AttendanceTrendChart
│   └── Shows: 30-day line chart (from /api/dashboard/charts)
│
├── GroupDistributionChart
│   └── Shows: Pie chart by company (from /api/groups)
│
├── ProgrammeHealthTable
│   ├── Shows: Groups sorted by status
│   └── Data: from /api/dashboard/summary
│
└── RecentActivityFeed
    └── Shows: Last 10 activities (from /api/dashboard/alerts)

REFRESH STRATEGY:
─────────────────
Default Interval: 30-60 seconds (SWR default)
Manual Triggers:
  - After student added/removed
  - After assessment marked
  - After attendance recorded
```

---

### 2️⃣ GROUPS PAGE (`src/app/groups/page.tsx`)

```
┌──────────────────────────────────────────────────────────────┐
│                    GROUPS MANAGEMENT PAGE                    │
└──────────────────────────────────────────────────────────────┘

REQUEST FLOW:
────────────

Page Load
  ↓
createGroupsContext() ← Custom context hook
  ├→ GET /api/data/groups
  │   └→ Returns: [UnifiedGroupData] {
  │       id, name, status, createdAt,
  │       startDate, endDate, location,
  │       totalCreditsRequired,
  │       metrics: {
  │         avgCreditsPerStudent, avgProgressPercent,
  │         totalCreditsEarned, totalUniqueUnitsPassed,
  │         studentCount, atRiskCount,
  │         healthStatus, attendanceRate, totalRecorded
  │       },
  │       facilitatorMetrics,
  │       unitStandardRollouts: [UnitStandardRollout]
  │      }
  │
  ├→ GET /api/groups/{groupId}/students (per group)
     │   └→ Returns: [Students] {
     │       id, studentNo, firstName, lastName,
     │       idNumber, email, status
     │      }
     │
     └→ GET /api/assessments?groupId={id}
         └→ Returns: [Assessments] {
             studentId, unitStandardId, status,
             score, attemptCount, lastAttemptDate
            }

DATA CALCULATION (Server + Client):
────────────────────────────────────

Server-side (in /api/data/groups):

  1. STUDENT COUNT
     studentCount = metricsMap[gid].studentCount

  2. CREDIT + PROGRESS
     avgCreditsPerStudent, totalCreditsEarned,
     totalUniqueUnitsPassed, avgProgressPercent
     computed by calculateMultipleGroupMetrics

  3. ATTENDANCE RATE (current month)
     attendanceRate = average per-student
     (PRESENT + LATE) / total sessions

  4. HEALTH STATUS
     healthStatus = calculatePerformanceStatus(
       projected, avgProgressPercent,
       hasRolloutPlan, attendanceRate,
       currentAssessmentModule, expectedModule,
       dateStatus
     )

Client-side (in Groups page):

  1. ROLLOUT PLAN RESOLUTION (display)
     notes.rolloutPlan → group.rolloutPlan →
     unitStandardRollouts → group rollout table
     via buildRolloutPlanFromUnitRollouts()
     and buildRolloutPlanFromGroupRollout()

COMPONENTS:
───────────

├── GroupsManagement (Main Container)
│   ├─ searchInput: Filter groups by name/company
│   ├─ viewToggle: Grid/List view
│   │
│   ├─ GRID VIEW:
│   │   └─ GroupCard (×n)
│   │       ├─ Group Info
│   │       ├─ Student Count
│   │       ├─ Progress Bar
│   │       └─ Action Buttons
│   │           ├─ Edit
│   │           ├─ Add Student
│   │           ├─ View Details
│   │           └─ Archive
│   │
│   └─ LIST VIEW:
│       └─ GroupsTable
│           ├─ Name, Company, Students, Progress
│           ├─ Status Badge
│           └─ Actions Menu
│
└── Modals (Context-Driven)
    ├─ CreateGroupModal ─→ POST /api/groups
    ├─ EditGroupModal ────→ PATCH /api/groups/{id}
    ├─ AddStudentModal ───→ POST /api/groups/{id}/students
    ├─ DeleteGroupModal ──→ DELETE /api/groups/{id}
    └─ GroupDetailsModal ─→ Shows full group details

REFRESH STRATEGY:
─────────────────
Interval: 30 seconds (GroupsContext setting)
Triggers:
  - After successful POST/PATCH/DELETE operation
  - On page focus (browser tab regains focus)
  - Manual refresh via header button
```

---

### 3️⃣ ASSESSMENTS PAGE (`src/app/assessments/page.tsx`)

```
┌──────────────────────────────────────────────────────────────┐
│              ASSESSMENTS & MARKING PAGE                      │
└──────────────────────────────────────────────────────────────┘

REQUEST FLOW:
────────────

Page Load
     ↓
useAssessments() [Custom Hook]
     ├→ GET /api/assessments
     │   └→ Returns: [Assessments] {
     │       id, studentId, unitStandardId,
     │       attemptNo, score, status,
     │       feedbackNotes, markedBy,
     │       markedAt, createdAt
     │      }
     │
     ├→ GET /api/assessments?status=PENDING
     │   └→ Returns: [Pending Assessments]
     │       (Filtered to only needs marking)
     │
     ├→ GET /api/unit-standards
     │   └→ Returns: [Unit Standards] {
     │       id, code, title, credits, level,
     │       passingScore, assessmentType
     │      }
     │
     └→ GET /api/students
         └→ Returns: [Students] for assessment context

FILTER OPTIONS:
────────────────
├─ By Status: PENDING | COMPETENT | NOT_COMPETENT | REFER
├─ By Unit Standard: Dropdown
├─ By Student: Search/autocomplete
├─ By Date Range: From/To date pickers
└─ By Group: Multi-select groups

MARKING WORKFLOW:
──────────────────

MarkAssessmentModal
     │
     ├─ Loads: Student info + Current assessment
     │
     ├─ Input: (User fills)
     │   ├─ Score / Competency: COMPETENT | NOT_COMPETENT
     │   ├─ Feedback Notes
     │   └─ Action Buttons
     │
     └─ Submit
         └─ POST /api/assessments/{id}/mark
             └─ Payload: {
                  studentId, unitStandardId,
                  attemptNo, score, status,
                  feedbackNotes, markedBy
                }
         
         Triggers:
           ├─ Update assessments cache
           ├─ Recalculate group credits
           ├─ Update student progress
           └─ Trigger dashboard refresh

BULK MARKING:
──────────────
BulkMarkingModal
     │
     ├─ Select Multiple: Assessments to mark
     │
     ├─ Quick Mark: Apply same status to all selected
     │   └─ POST /api/assessments/bulk-mark
     │       └─ Payload: {
     │            assessmentIds: [id, id, ...],
     │            status, score, feedback
     │          }
     │
     └─ Triggers refresh for all related groups

STATISTICS DISPLAYED:
──────────────────────
├─ Pending Count
├─ Pass Rate (% COMPETENT)
├─ Unit Standard Breakdown
│   └─ Each standard: Pass rate, Average score
├─ Student Breakdown
│   └─ Each student: Attempts, Best score, Status
└─ Retry Analysis
    └─ Standard with highest retries
```

---

### 4️⃣ STUDENTS PAGE (`src/app/students/page.tsx`)

```
┌──────────────────────────────────────────────────────────────┐
│              STUDENT MANAGEMENT PAGE                         │
└──────────────────────────────────────────────────────────────┘

REQUEST FLOW:
────────────

Page Load
     ↓
useStudents() [Custom Hook]
     ├→ GET /api/students
     │   └→ Returns: [Students] {
     │       id, studentNo, firstName, lastName,
     │       email, idNumber, dateOfBirth,
     │       status, createdAt, groupId
     │      }
     │
     ├→ GET /api/groups (for assignment lookup)
     │   └→ For student.groupId resolution
     │
     ├→ GET /api/students/{id}/progress
     │   └→ Loaded on detail view
     │       └─ Returns: {
     │          totalCredits, completionRate,
     │          assessmentCount, attendanceRate,
     │          lastActivityDate
     │        }
     │
     └→ GET /api/students/{id}/assessments
         └─ Loaded on student detail modal
            └─ Returns: Assessment history

FILTERING & SEARCH:
────────────────────
├─ Search: By name, student number, ID number
├─ Filter by Status: ACTIVE | INACTIVE | SUSPENDED
├─ Filter by Group: Dropdown
├─ Filter by Progress:
│   ├─ At Risk (< 50% completed)
│   ├─ On Track (50-80%)
│   ├─ Advanced (80-99%)
│   └─ Completed (100%+)
└─ Sort by: Name | Student No | Progress | Last Updated

STUDENT ACTIONS:
──────────────────
├─ Add New Student
│   └─ POST /api/students
│       └─ Payload: {
│            studentNo, firstName, lastName,
│            email, idNumber, groupId
│          }
│
├─ Edit Student
│   └─ PATCH /api/students/{id}
│       └─ Payload: Partial student update
│
├─ View Progress
│   └─ StudentProgressModal
│       └─ Shows: Credits, Assessments, Attendance
│
├─ Bulk Import
│   └─ POST /api/students/bulk-import
│       └─ CSV or Excel upload
│
└─ Bulk Update
    └─ PATCH /api/students/bulk-update
        └─ Payload: [{ id, groupId, status }]

RELATED DATA DISPLAYED:
────────────────────────
├─ Current Group
├─ Credits Earned / Total
├─ Assessment Status (Pending, Competent)
├─ Attendance Rate (Last 30 days)
├─ Last Assessment Date
└─ Account Status
```

---

### 5️⃣ TIMETABLE/SESSIONS PAGE (`src/app/sessions/page.tsx`)

```
┌──────────────────────────────────────────────────────────────┐
│         TIMETABLE & SESSION MANAGEMENT PAGE                  │
└──────────────────────────────────────────────────────────────┘

REQUEST FLOW:
────────────

Page Load + Calendar Navigation
     ↓
useSessions() [Custom Hook]
     ├→ GET /api/sessions?from=startDate&to=endDate
     │   └→ Returns: [Sessions] {
     │       id, groupId, moduleId, sessionDate,
     │       startTime, endTime, venue, trainer,
     │       sessionType, status, notes
     │      }
     │
     ├→ GET /api/groups (for group selection)
     │   └─ For filtering by group
     │
     ├→ GET /api/modules (for module selection)
     │   └─ For filtering by module
     │
     └→ GET /api/sessions/{id}/attendance
         └─ Loaded on session detail view
            └─ Returns: [Attendance Records] {
               studentId, status (PRESENT, LATE, NO_SHOW),
               arrivedAt, departedAt
              }

CALENDAR VIEWS:
────────────────
├─ Month View
│   └─ Shows: Sessions as dots/blocks on calendar
│
├─ Week View
│   └─ Shows: Time grid with sessions positioned
│
├─ Day View
│   └─ Shows: Daily schedule with session details
│
└─ Group View
    └─ Shows: Sessions for selected group(s) only

SESSION CREATION:
──────────────────
ScheduleLessonModal
     │
     ├─ Form Inputs:
     │   ├─ Group (required)
     │   ├─ Module (required)
     │   ├─ Date & Time
     │   ├─ Venue
     │   ├─ Trainer
     │   └─ Notes
     │
     └─ POST /api/sessions
         └─ Returns: Created session

ATTENDANCE MARKING:
────────────────────
SessionAttendanceModal
     │
     ├─ Shows: All students in group
     │
     ├─ Mark Attendance:
     │   ├─ Individual students:
     │   │   └─ PRESENT | LATE | NO_SHOW
     │   │
     │   └─ Bulk Mark:
     │       └─ Mark all as PRESENT (with optional late additions)
     │
     └─ POST /api/attendance
         └─ Payload: [{
              sessionId, studentId, status,
              arrivedAt, notes
            }]
```

---

## 🔀 Cross-Page Data Dependencies

### Dependency Chain Diagram

```
DATABASE (Source of Truth)
    │
    ├── /api/students ──────────┬──────────────────┐
    │                           │                  │
    │   /api/groups ────┐       │              STUDENTS
    │       │           ├───────┼────────────────PAGE
    │       │           │       │              (uses)
    │   /api/assessments┤       │
    │       │           ├───────┼────────────────DASHBOARD
    │       │           │       │              (uses)
    │   /api/attendance ┤       │
    │       │           ├───────┼────────────────ASSESSMENTS
    │       │           │       │              (uses)
    │       │           │       │
    │       └───────────┼───────┴─ GROUPS PAGE
    │                   │         (uses)
    │               TIMETABLE PAGE
    │               (uses /api/sessions
    │                     + /api/attendance)
    │
    └── Cross-Page Issues:
        ├─ Different refresh intervals
        ├─ Different calculation methods
        ├─ Different filter logic
        └─ Race conditions on concurrent updates
```

---

## 🚨 Known Data Sync Issues

### Issue #1: Dashboard vs Groups Page Credit Calculation

```
SCENARIO: Admin adds completion to Group "A"

T=0:
  Groups Page: 342 credits (calculated in-memory)
  Dashboard: 285 credits (from /api/dashboard/summary)
  
ROOT CAUSE:
  - Groups uses: ALL assessments for group (in-memory calc)
  - Dashboard uses: /api/dashboard/summary endpoint
    which has DIFFERENT filter logic
    
FIX NEEDED:
  - Consolidate calculation to single function
  - Use same function in: Groups API + Dashboard API
  - Cache result in database if possible
```

### Issue #2: Competing Refresh Intervals

```
SCENARIO: User marks assessment as COMPETENT

T=0:   Assessment marked ✓
T=5:   Dashboard shows old completion rate ❌
       (Pages refresh at different times)
T=30:  Both pages finally sync ✓

ROOT CAUSE:
  - GroupsContext: 30-second refresh
  - Dashboard default: SWR ~5-10 second default varies
  - Assessment detail: No auto-refresh (must manual)
  
FIX NEEDED:
  - Implement event-based refresh using:
    └─ Server-Sent Events (SSE)
    └─ WebSockets (if real-time needed)
    └─ Unified cache invalidation strategy
```

### Issue #3: Partial Data Updates

```
SCENARIO: Admin creates new student in group

Event Chain:
  1. POST /api/students ✓ (student created)
  2. PATCH /api/groups/{id} ✓ (group updated)
  3. But: Dashboard still shows old student count
         because it hasn't refreshed yet

ROOT CAUSE:
  - No cache invalidation mechanism
  - No event broadcasting
  - Each page independently polls
  
FIX NEEDED:
  - Implement cache invalidation
  - Or trigger dependent page refreshes
  - Or use real-time updates (WebSockets)
```

---

## 📋 API Endpoint Summary

### Core Endpoints Called by Pages

```
DASHBOARD:
├─ GET  /api/dashboard/stats          → DashboardStats component
├─ GET  /api/dashboard/summary         → ProgrammeHealthTable
├─ GET  /api/dashboard/charts          → AttendanceTrendChart
├─ GET  /api/dashboard/alerts          → RecentActivityFeed
└─ GET  /api/groups                    → GroupDistributionChart

GROUPS:
├─ GET  /api/groups                    → GroupsManagement (main)
├─ GET  /api/groups/{id}/students      → Group detail
├─ GET  /api/assessments               → Credit calculation
├─ POST /api/groups                    → Create group
├─ PATCH /api/groups/{id}              → Edit group
└─ DELETE /api/groups/{id}             → Archive/delete

ASSESSMENTS:
├─ GET  /api/assessments               → Assessments list
├─ GET  /api/unit-standards            → for filtering
├─ GET  /api/students                  → for context
├─ POST /api/assessments/{id}/mark     → Mark single
└─ POST /api/assessments/bulk-mark     → Mark multiple

STUDENTS:
├─ GET  /api/students                  → Students list
├─ GET  /api/students/{id}/progress    → Progress modal
├─ GET  /api/students/{id}/assessments → Detail view
├─ POST /api/students                  → Create
├─ PATCH /api/students/{id}            → Edit
└─ POST /api/students/bulk-import      → Bulk import

SESSIONS:
├─ GET  /api/sessions?range=dates      → Calendar/list
├─ GET  /api/sessions/{id}/attendance  → Session detail
├─ POST /api/sessions                  → Create
├─ PATCH /api/sessions/{id}            → Edit
└─ POST /api/attendance                → Mark attendance
```

---

## 🎯 Recommendations for Unified Data Flow

### Priority 1: Consolidate Data Calculations
```
GOAL: Single source of truth for all metrics

ACTION:
1. Create database views for calculated fields:
   ├─ v_group_credits (materialized view)
   ├─ v_attendance_rates
   ├─ v_student_progress
   └─ v_assessment_stats

2. Use views in ALL API endpoints
   └─ Dashboard uses same view as Groups page

3. Add triggers for cache updates
   └─ When assessment marked → update view
```

### Priority 2: Unified Refresh Strategy
```
GOAL: All pages stay in sync

ACTION:
1. Implement event-based invalidation
   └─ POST /api/* → emit cache invalidation event

2. Use SWR's validation trigger:
   └─ Call mutate() on related pages after updates

3. Add real-time updates (if needed):
   └─ Server-Sent Events for critical metrics
   └─ WebSockets for collaborative editing
```

### Priority 3: API Contract Standardization
```
GOAL: Consistent response formats across all endpoints

ACTION:
1. Define standard response wrapper:
   {
     success: boolean,
     data: object | array,
     error: string | null,
     timestamp: ISO8601,
     meta: { page, count, total }? // if paginated
   }

2. Standardize error responses:
   {
     success: false,
     error: string,
     code: 'ERROR_CODE',
     details: object?
   }

3. Document all endpoints in OpenAPI/Swagger
```

---

## 📊 Data Volume & Performance Considerations

```
ESTIMATED DATA SIZES:

users              5-50 records         (small)
students           50-5,000 records     (medium)
groups             5-100 records        (small)
unit_standards     20-150 records       (small)
modules            30-500 records       (medium)
sessions           100-10,000 records   (medium-large)
assessments        500-50,000 records   (large)
attendance         1,000-100,000 records (very large)

QUERY PERFORMANCE TIPS:

1. Assessments queries
   ├─ Always filter by: date range, group, or student
   ├─ Index: student_id, unit_standard_id, status
   └─ Watch: Avoid N+1 queries for group credit calc

2. Attendance queries
   ├─ Partition by date (monthly/quarterly)
   ├─ Index: session_id, student_id, date
   └─ Archive old records (>1 year) to separate table

3. Dashboard queries
   ├─ Pre-calculate and cache key metrics
   ├─ Use materialized views for group summaries
   └─ Refresh async (not on page load)
```

---

## ✅ Quick Reference: Who Needs What Data?

```
DASHBOARD needs:
  ├─ All groups (summary view)
  ├─ Aggregated student count
  ├─ Aggregated completion rates
  ├─ Last 30 days attendance trend
  └─ Pending assessments count

GROUPS PAGE needs:
  ├─ All groups (full detail)
  ├─ Students per group
  ├─ Assessments per group (for credit calc)
  └─ Group status calculation

ASSESSMENTS PAGE needs:
  ├─ All assessments
  ├─ Filter capability (student, status, date)
  ├─ Unit standards reference
  └─ Student names for context

STUDENTS PAGE needs:
  ├─ All students
  ├─ Group assignment
  ├─ Progress summary
  └─ Assessment history (on detail)

SESSIONS PAGE needs:
  ├─ Sessions in date range
  ├─ Group assignments to sessions
  ├─ Attendance records per session
  └─ Module assignments
```

---

## 🔗 Related Documentation

- [LEARNERSHIP_SYSTEM_ARCHITECTURE.md](docs/LEARNERSHIP_SYSTEM_ARCHITECTURE.md) - Database schema & models
- [DASHBOARD_DATA_FLOW_ANALYSIS.md](DASHBOARD_DATA_FLOW_ANALYSIS.md) - Dashboard component breakdown
- [SYSTEM_AUDIT_DATA_SYNC_ISSUES.md](SYSTEM_AUDIT_DATA_SYNC_ISSUES.md) - Issues to fix
- [PHASE_3A_UNIFIED_DATA_IMPLEMENTATION.md](PHASE_3A_UNIFIED_DATA_IMPLEMENTATION.md) - Architecture improvements

---

**Last Updated:** February 21, 2026  
**Status:** Complete system diagram ready for implementation
