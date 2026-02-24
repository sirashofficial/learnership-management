# Data Dependencies Site Map - Visual Reference

## Quick Site Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    LEARNERSHIP MANAGEMENT SYSTEM (YEHA)                 │
│                         Data Architecture Map                            │
└─────────────────────────────────────────────────────────────────────────┘

                              FRONTEND LAYER
                          (React + Next.js Pages)
                                   ↓
    ┌──────────────────────────────────────────────────────────────┐
    │                  SWR Cache + React Context                   │
    │  ├─ AuthContext (User, Permissions)                          │
    │  ├─ StudentContext (Current Student)                         │
    │  ├─ GroupsContext (Groups List)                              │
    │  └─ SWR Hooks (API data cache)                               │
    └──────────────────────────────────────────────────────────────┘
                                   ↓
                      API ROUTES LAYER (100+ endpoints)
                    ┌─────────────────────────────────────┐
                    │  /api/students                      │
                    │  /api/groups                        │
                    │  /api/assessment                    │
                    │  /api/formatives                    │
                    │  /api/attendance                    │
                    │  /api/progress                      │
                    │  /api/lessons                       │
                    │  /api/sessions                      │
                    │  /api/timetable                     │
                    │  /api/rollout                       │
                    │  /api/poe                           │
                    │  /api/dashboard/*                   │
                    │  /api/curriculum/*                  │
                    │  /api/ai/*                          │
                    │  /api/admin/*                       │
                    └─────────────────────────────────────┘
                                   ↓
                    DATABASE LAYER (Prisma + SQLite)
                ┌─────────────────────────────────────────┐
                │         20+ Core Entities               │
                │  See detailed schema below              │
                └─────────────────────────────────────────┘
                                   ↓
                   EXTERNAL SERVICES & INTEGRATIONS
            ┌──────────────────────────────────────────┐
            │  AI Services (OpenAI, Cohere, Google)    │
            │  Vector DB (Pinecone) for semantic search│
            │  Email Service                            │
            │  File Storage (documents, PDFs)           │
            └──────────────────────────────────────────┘
```

---

## Pages to Data Mapping (Visual)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND PAGES & THEIR DATA                       │
└─────────────────────────────────────────────────────────────────────────┘

/ DASHBOARD
├─ Displays: Total Students, Total Groups, Global Metrics
├─ Sources: 
│  ├─ GET /api/dashboard/stats (15s refresh)
│  ├─ GET /api/dashboard/charts (manual)
│  ├─ GET /api/dashboard/alerts (manual)
│  ├─ GET /api/dashboard/schedule (manual)
│  └─ GET /api/dashboard/programme-health (manual)
└─ Database Tables: Student, Group, Assessment, Attendance, RolloutPlan

/STUDENTS
├─ List View
│  ├─ Displays: All students with filters
│  ├─ Source: GET /api/students?groupId=X&status=Y
│  └─ Tables: Student, Group
│
└─ Detail View (/students/[id])
   ├─ Tabs: Overview, Progress, Assessments, Formatives, Attendance, POE
   ├─ Sources:
   │  ├─ GET /api/students/[id]
   │  ├─ GET /api/students/[id]/progress
   │  ├─ GET /api/assessment?studentId=[id]
   │  ├─ GET /api/attendance?studentId=[id]
   │  ├─ GET /api/formatives/student/[id]
   │  └─ GET /api/poe/[id]
   └─ Tables: Student, Assessment, Attendance, FormativeCompletion, 
              POEChecklist, ModuleProgress, UnitStandardProgress

/GROUPS
├─ List View
│  ├─ Displays: All groups with status
│  ├─ Source: GET /api/groups
│  └─ Tables: Group, Company, _count
│
└─ Detail View (/groups/[id])
   ├─ Tabs: Overview, Students, Curriculum, Rollout, Schedule, 
   │        Attendance, Progress, Assessments
   ├─ Sources:
   │  ├─ GET /api/groups/[id]
   │  ├─ GET /api/groups/[id]/members
   │  ├─ GET /api/groups/[id]/health
   │  ├─ GET /api/rollout/group/[id]
   │  ├─ GET /api/attendance/stats?groupId=[id]
   │  ├─ GET /api/progress/group/[id]
   │  └─ GET /api/assessment?groupId=[id]
   └─ Tables: Group, Student, RolloutPlan, Module, Assessment, 
              Attendance (aggregated), Progress (aggregated)

/ASSESSMENTS
├─ List View
│  ├─ Source: GET /api/assessment (filters: groupId, studentId, status)
│  └─ Tables: Assessment, Student, UnitStandard, Module
│
├─ Detail/Edit View
│  ├─ Sources:
│  │  ├─ GET /api/assessment/[id]
│  │  └─ GET /api/students/[id]
│  └─ Action: PUT /api/assessment/[id]
│
├─ Formative Moderation Tab
│  ├─ Sources:
│  │  ├─ GET /api/formatives/moderation
│  │  └─ GET /api/formatives/student/[id]
│  └─ Action: PUT /api/formatives/completion/[id]
│
└─ Impact on Save:
   ├─ Updates: Assessment, ModuleProgress, UnitStandardProgress, Student
   ├─ Invalidates: Multiple SWR caches
   ├─ Triggers: Alert recalculation, Dashboard refresh
   └─ Creates: UndoHistory record for 30-min rollback

/ATTENDANCE
├─ Mark Attendance Page
│  ├─ Sources: GET /api/sessions (for today)
│  ├─ Action: POST /api/attendance (bulk mark)
│  ├─ Tables: Attendance, Student, Session
│  └─ Impact: Creates/updates Attendance, triggers AttendanceAlert
│
├─ Attendance Report View
│  ├─ Sources:
│  │  ├─ GET /api/attendance/stats
│  │  ├─ GET /api/attendance/rates
│  │  └─ GET /api/attendance/history
│  └─ Tables: Attendance (read-only aggregation)
│
└─ Attendance Alerts View
   ├─ Source: GET /api/dashboard/alerts (or GET /api/attendance/alerts)
   ├─ Tables: AttendanceAlert, Student
   └─ Shows: Low attendance, consecutive absences, threshold warnings

/CURRICULUM
├─ Curriculum Overview
│  ├─ Source: GET /api/curriculum
│  ├─ Shows: All 6 modules with unit standards
│  └─ Tables: Module, UnitStandard
│
└─ Module Detail (/curriculum/[id])
   ├─ Sources:
   │  ├─ GET /api/modules/[id]?includeUnitStandards=true
   │  ├─ GET /api/curriculum/[id]/documents
   │  └─ GET /api/formatives?moduleId=[id]
   └─ Tables: Module, UnitStandard, CurriculumDocument, FormativeAssessment

/LESSONS (Timetable)
├─ Lessons List
│  ├─ Source: GET /api/lessons (or GET /api/timetable)
│  ├─ Filters: date range (from/to parameters)
│  └─ Tables: LessonPlan, Module, User, Group
│
├─ Create/Edit Lesson
│  ├─ Action: POST /api/timetable (create) or PUT /api/timetable/[id]
│  ├─ AI Generation: POST /api/ai/generate-lesson
│  └─ Impact: Creates LessonPlan, may auto-create Sessions
│
└─ Session Management
   ├─ Sources: GET /api/sessions
   ├─ Actions: POST /api/sessions, POST /api/sessions/generate
   └─ Impact: Sessions enable attendance marking

/PROGRESS
├─ Overall Progress Dashboard
│  ├─ Sources:
│  │  ├─ GET /api/progress
│  │  ├─ GET /api/dashboard/charts
│  │  └─ GET /api/dashboard/programme-health
│  └─ Tables: ModuleProgress, UnitStandardProgress (aggregated)
│
├─ Group Progress
│  ├─ Source: GET /api/progress/group/[id]
│  └─ Shows: Cohort-level metrics
│
└─ Student Progress
   ├─ Source: GET /api/progress/student/[id]
   └─ Shows: Individual module/unit progress

/ROLLOUT
├─ Rollout Status View
│  ├─ Sources:
│  │  ├─ GET /api/rollout
│  │  ├─ GET /api/rollout/status
│  │  └─ GET /api/rollout/group/[id]
│  └─ Tables: RolloutPlan, UnitStandardRollout, Module
│
└─ Export Rollout Document
   └─ Action: GET /api/rollout/[id]/export → DOCX file

/POE (Proof of Evidence)
├─ POE List View
│  ├─ Source: GET /api/poe
│  ├─ Shows: All students' POE checklist status
│  └─ Tables: POEChecklist, Student
│
└─ Student POE Detail (/poe/[id])
   ├─ Source: GET /api/poe/[id]
   ├─ Fields: Module 1-6 checkboxes, docs signatures, verification
   ├─ Action: PUT /api/poe/[id]
   └─ Impact: Updates POEChecklist, affects Student.status eligibility

/SETTINGS
├─ User Profile
│  ├─ Sources: GET /api/settings/profile
│  └─ Action: PUT /api/settings/profile
│
└─ Preferences
   ├─ Source: GET /api/settings/preferences
   └─ Action: PUT /api/settings/preferences

/ADMIN
├─ User Management
│  ├─ GET /api/admin/users
│  ├─ POST /api/admin/users
│  └─ PUT/DELETE /api/admin/users/[id]
│
├─ Documents Management
│  ├─ GET /api/ai/index-documents/list
│  ├─ POST /api/ai/index-documents/index
│  └─ DELETE /api/ai/index-documents/delete/[id]
│
├─ Audit Trail
│  ├─ GET /api/undo (undo history)
│  └─ POST /api/undo/[id] (perform undo)
│
└─ Data Validation
   ├─ GET /api/validation/data-integrity
   ├─ POST /api/validation/fix-duplicates
   └─ POST /api/validation/fix-credits
```

---

## Data Entity Dependency Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ENTITY HIERARCHY & DEPENDENCIES                       │
└─────────────────────────────────────────────────────────────────────────┘

LEVEL 0 (FOUNDATION - No dependencies):
┌──────────────────────────────────────┐
│  ┌─ User (Fasilitator/Admin)         │
│  ├─ Company (Organization)           │
│  ├─ Module (Curriculum Definition)   │
│  └─ AttendancePolicy (Rules)         │
└──────────────────────────────────────┘

LEVEL 1 (Depends on LEVEL 0):
┌──────────────────────────────────────┐
│  ├─ Group (Company → Company)        │
│  ├─ UnitStandard (Module → Module)   │
│  ├─ ReminderPreference (User → User) │
│  └─ ScheduleTemplate (Templates)     │
└──────────────────────────────────────┘

LEVEL 2 (Depends on LEVEL 0-1):
┌──────────────────────────────────────┐
│  ├─ Student (Group, User)            │
│  ├─ FormativeAssessment (Module, US) │
│  ├─ CurriculumDocument (Module)      │
│  ├─ GroupCourse (Group)              │
│  ├─ RolloutPlan (Group, Module)      │
│  ├─ GroupSchedule (Group, Template)  │
│  ├─ LessonPlan (Module, User, Group) │
│  └─ Plan (Group, User)               │
└──────────────────────────────────────┘

LEVEL 3 (Depends on LEVEL 0-2):
┌──────────────────────────────────────┐
│  ├─ Session (User, Group)            │
│  ├─ Activity (UnitStandard)          │
│  ├─ Assessment (Student, UnitStd)    │
│  ├─ ModuleProgress (Student, Module) │
│  ├─ UnitStdProgress (Student, Unit)  │
│  ├─ CourseProgress (Student)         │
│  ├─ UnitStdRollout (Group, Unit)     │
│  ├─ Reminder (Plan)                  │
│  ├─ Attendance (Student, Session)    │
│  └─ FormativeCompletion (Student, FA)│
└──────────────────────────────────────┘

LEVEL 4 (Depends on LEVEL 0-3):
┌──────────────────────────────────────┐
│  ├─ POEChecklist (Student)           │
│  ├─ AttendanceAlert (Student)        │
│  └─ UndoHistory (Audit)              │
└──────────────────────────────────────┘
```

---

## Critical Data Update Cascades

```
┌─────────────────────────────────────────────────────────────────────────┐
│              CRITICAL PATHS: What Affects What When Changed             │
└─────────────────────────────────────────────────────────────────────────┘

ASSESSMENT SUBMITTED:
└─ Assessment Record
   └─ Impact Calculation
      ├─ Update: UnitStandardProgress.formativesPassed OR summativePassed
      ├─ Update: ModuleProgress.creditsEarned, status
      ├─ Update: Student.totalCreditsEarned, progress%, status
      ├─ Check: RolloutPlan status (module completed?)
      ├─ Create: AttendanceAlert (if performance poor)
      └─ Invalidate: 15+ API cache keys (SWR)

ATTENDANCE MARKED:
└─ Attendance Record(s)
   └─ Alert Calculation
      ├─ Calculate: Attendance rate %, consecutive absences
      ├─ Check: Against AttendancePolicy thresholds
      ├─ Create/Update: AttendanceAlert if breached
      ├─ Update: Student.status to AT_RISK if critical
      └─ Invalidate: 10+ API cache keys

LESSON/SESSION CREATED:
└─ LessonPlan & Session Record
   └─ Schedule Updated
      ├─ Update: Timetable view
      ├─ Enable: Attendance marking for this session
      ├─ Update: RolloutPlan.actualStartDate (if first lesson)
      └─ Invalidate: 5+ API cache keys

ROLLOUT PLAN CREATED:
└─ RolloutPlan & UnitStandardRollout Records
   └─ Planning Updated
      ├─ Set: Projected dates for module/units
      ├─ Trigger: Lesson scheduling prompt
      ├─ Guide: Assessment timeline
      └─ Invalidate: 8+ API cache keys

GROUP CREATED:
└─ Group Record
   └─ Massive Cascade:
      ├─ Create: GroupRolloutPlan (master plan)
      ├─ Create: RolloutPlan × 6 (one per module)
      ├─ Create: GroupCourse records
      ├─ Create: GroupSchedule (if template assigned)
      ├─ Assign: All 6 modules to group
      ├─ Initialize: Student progress tracking
      └─ Invalidate: 20+ API cache keys

STUDENT CREATED/DELETED:
└─ Student Record
   └─ Massive Cascade:
      ├─ If created:
      │  ├─ Create: ModuleProgress × 6
      │  ├─ Create: UnitStandardProgress × ~24
      │  ├─ Create: CourseProgress
      │  ├─ Create: POEChecklist (empty)
      │  └─ Update: Group member count
      │
      └─ If deleted:
         ├─ CASCADE delete: All Assessment records
         ├─ CASCADE delete: Attendance records
         ├─ CASCADE delete: Progress records
         ├─ CASCADE delete: FormativeCompletion records
         ├─ CASCADE delete: AttendanceAlert records
         └─ Invalidate: 25+ API cache keys

MODULE MODIFIED:
└─ Module Record
   └─ Curriculum Updated:
      ├─ Update:  All RolloutPlan for this module
      ├─ Update: All LessonPlan referencing this
      ├─ Update: All student curriculum paths
      ├─ Re-index: CurriculumDocument & CurriculumEmbedding
      ├─ Impact: All groups using this module
      └─ Invalidate: 15+ API cache keys (ripples to all groups)
```

---

## Data Flow During Critical Operations

```
┌─────────────────────────────────────────────────────────────────────────┐
│               REAL-TIME DATA SYNC DURING KEY OPERATIONS                 │
└─────────────────────────────────────────────────────────────────────────┘

SCENARIO: Mark Attendance for 30 Students (Bulk)

┌─────────────────────────────────────┐
│    1. SUBMISSION (Frontend)          │
│ User selects students + status      │
│ POST /api/attendance/bulk            │
└─────────────────────────────────────┘
         ↓ (JSON: {records: [...]})
┌─────────────────────────────────────┐
│    2. VALIDATION (Backend)           │
│ ├─ Check: All studentIds exist      │
│ ├─ Check: Date is valid             │
│ ├─ Check: User permissions          │
│ └─ Fail early if issues             │
└─────────────────────────────────────┘
         ↓ (If all valid)
┌─────────────────────────────────────┐
│    3. DATABASE TRANSACTION           │
│ ├─ BEGIN transaction                │
│ ├─ Insert/Update 30 Attendance rows │
│ ├─ Calculate attendance rate for    │
│ │  each student (aggregation query) │
│ ├─ Check thresholds vs policy      │
│ ├─ Create AttendanceAlert if needed │
│ ├─ Update Student.status if AT_RISK │
│ ├─ Save UndoHistory (30-min undo)   │
│ └─ COMMIT (atomic)                  │
└─────────────────────────────────────┘
         ↓ (Response: success + changes)
┌─────────────────────────────────────┐
│    4. CACHE INVALIDATION (Frontend) │
│ ├─ Invalidate SWR: /api/attendance  │
│ ├─ Invalidate SWR: /api/dashboard/* │
│ ├─ Invalidate SWR: /api/groups/[id] │
│ ├─ Revalidate immediately           │
│ └─ Show success toast                │
└─────────────────────────────────────┘
         ↓ (Auto-refetch active data)
┌─────────────────────────────────────┐
│    5. UI UPDATES                     │
│ ├─ Attendance list refreshed        │
│ ├─ Dashboard alerts updated         │
│ ├─ At-risk student count changes    │
│ ├─ Group health score recalculates  │
│ └─ Student detail pages sync        │
└─────────────────────────────────────┘

Timeline:
├─ 0ms:     User clicks "Save" button
├─ 100-200ms: API request sent
├─ 300-500ms: Backend validation & DB transaction
├─ 600ms:    Response received with success
├─ 601ms:    Cache invalidation triggers
├─ 700-900ms: SWR revalidates (auto-refetch)
├─ 1000-1200ms: All affected pages sync
└─ 1500ms:   User sees all updates


SCENARIO: Submit Assessment for Student

┌─────────────────────────────────────┐
│    1. FORM SUBMISSION (Frontend)     │
│ User fills: Score, Result, Feedback │
│ PUT /api/assessment/[id]            │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│    2. MODERATION CHECK (Backend)     │
│ ├─ Save: Assessment record          │
│ ├─ If FORMATIVE:                    │
│ │  └─ Create FormativeCompletion   │
│ │     └─ Set status: PENDING        │
│ └─ If SUMMATIVE:                    │
│    └─ Save: Assessment               │
│       └─ flagged for review          │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│    3. APPROVAL WORKFLOW              │
│ Admin reviews assessment             │
│ PUT /api/assessment/[id]             │
│ (moderationStatus = APPROVED)        │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│    4. UNLOCK NEXT LEVEL              │
│ ├─ Update UnitStdProgress:          │
│ │  ├─ formativesPassed++            │
│ │  └─ Check: Ready for summative?   │
│ ├─ Update ModuleProgress:           │
│ │  ├─ Progress% = (completed/units) │
│ │  └─ creditsEarned += if complete  │
│ └─ Update Student:                  │
│    ├─ totalCreditsEarned += credits │
│    ├─ Recompute progress %          │
│    ├─ Check: Completed status?      │
│    └─ Check: At-risk status?        │
└─────────────────────────────────────┘
         ↓ (Cascade complete)
┌─────────────────────────────────────┐
│    5. CASCADE TO DASHBOARDS          │
│ ├─ Dashboard: Progress tile updates │
│ ├─ Dashboard: Credits counter       │
│ ├─ Group Detail: Student progress   │
│ ├─ Student Detail: Assessment list  │
│ └─ Rollout View: Module progress    │
└─────────────────────────────────────┘
```

---

## API Response Format Impact

```
┌─────────────────────────────────────────────────────────────────────────┐
│            HOW API RESPONSES SHAPE FRONTEND DATA STRUCTURE              │
└─────────────────────────────────────────────────────────────────────────┘

Response Formats & Cascading Updates:

Standard List Response:
GET /api/students?groupId=g1
────────────────────────────═════
{
  "success": true,
  "data": [
    {
      "id": "s1",
      "studentId": "AZ-001",
      "firstName": "John",
      "status": "ACTIVE",
      "progress": 60,
      "totalCreditsEarned": 40,
      "groupId": "g1"
    },
    ...
  ]
}

Impact:
├─ Populates: StudentContext (if full detail endpoint)
├─ Updates: Student list component (local state)
├─ Triggers: Child components re-render
└─ Invalidates: /api/dashboard/stats cache (student count)


Standard Detail Response:
GET /api/students/s1/progress
───────────────────────═════════
{
  "success": true,
  "data": {
    "studentId": "AZ-001",
    "groupId": "g1",
    "modules": [
      {
        "moduleId": "m1",
        "moduleNumber": 1,
        "progress": 100,
        "creditsEarned": 20,
        "status": "COMPLETED",
        "startDate": "2024-01-15",
        "completionDate": "2024-02-15"
      },
      ...
    ],
    "unitStandards": [
      {
        "unitId": "u1",
        "unitCode": "US123",
        "moduleNumber": 1,
        "formativesPassed": 3,
        "summativePassed": true,
        "status": "COMPLETED"
      },
      ...
    ],
    "totalCredits": 60,
    "overallProgress": 60
  }
}

Impact:
├─ Populates: Progress page tabs (module progress, unit progress)
├─ Displays: Credit accumulation chart
├─ Shows: Status badges (COMPLETED, IN_PROGRESS, etc)
└─ May trigger: At-risk alert if progress low


Aggregated Response:
GET /api/dashboard/stats
───────────────────════════
{
  "success": true,
  "data": {
    "totalStudents": {"value": 150, "trend": 5},
    "totalGroups": {"value": 8, "trend": 0},
    "activeStudents": {"value": 145},
    "atRiskStudents": {"value": 12, "alerts": 12},
    "averageProgress": {"value": 65},
    "averageAttendance": {"value": 78},
    "pendingAssessments": {"value": 34},
    "completedCredits": {"value": 3200, "target": 4000},
    ...
  }
}

Impact:
├─ Populates: All dashboard metric tiles
├─ Auto-refreshes: Every 15 seconds
├─ Aggregates: Data from 100+ records
├─ Single source of truth: For dashboard view
└─ Optimized: Pre-calculated server-side
```

---

## Cache Invalidation Triggers Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   WHEN TO REVALIDATE EACH CACHE KEY                     │
└─────────────────────────────────────────────────────────────────────────┘

PRIMARY UPDATE SOURCES (What triggers invalidation):

┌─ FORM SUBMISSIONS (POST/PUT/DELETE) ─────────────────────┐
│                                                            │
│ POST /api/assessment              Invalidates:            │
│                             ├─ /api/assessment (list)     │
│                             ├─ /api/assessment/[id]       │
│                             ├─ /api/assessment/stats      │
│                             ├─ /api/progress/*            │
│                             ├─ /api/students/[id]         │
│                             ├─ /api/dashboard/*           │
│                             └─ /api/groups/[id]/*         │
│
│ POST /api/attendance/bulk                                 │
│                             ├─ /api/attendance/*          │
│                             ├─ /api/attendance/stats      │
│                             ├─ /api/attendance/alerts     │
│                             ├─ /api/students/[id]/prog   │
│                             ├─ /api/dashboard/stats       │
│                             ├─ /api/dashboard/alerts      │
│                             └─ /api/groups/[id]/health    │
│
└────────────────────────────────────────────────────────────┘

┌─ APPROVAL WORKFLOWS ───────────────────────────────────────┐
│                                                             │
│ PUT /api/formatives/completion (moderationStatus change)  │
│                             ├─ /api/formatives/*          │
│                             ├─ /api/assessment/*          │
│                             ├─ /api/progress/student/[id] │
│                             └─ /api/students/[id]         │
│
└─────────────────────────────────────────────────────────────┘

┌─ BULK OPERATIONS ──────────────────────────────────────────┐
│                                                             │
│ POST /api/assessment (bulk update)                         │
│ POST /api/poe/bulk (bulk update)                           │
│ Creates: UndoHistory (30-min rollback window)              │
│ Invalidates: All related caches + creates undo record     │
│
└─────────────────────────────────────────────────────────────┘

SWR REVALIDATION PATTERNS:

Automatic (Built-in):
├─ revalidateOnFocus: true
│  └─ Revalidate when browser window regains focus
├─ revalidateOnReconnect: true
│  └─ Revalidate when network reconnects
└─ refreshInterval (Per endpoint):
   ├─ /api/dashboard/stats: 15000ms (15 sec)
   ├─ /api/dashboard/charts: 0 (manual only)
   ├─ /api/dashboard/alerts: 0 (manual only)
   └─ Most other endpoints: 0 (manual only)

Manual Triggers:
├─ After form submission succeeds
├─ After batch operation completes
├─ When user navigates to page
├─ After importing/bulk upload
└─ Can use filter pattern to invalidate multiple:
   mutate(key => key.includes('/api/dashboard'), undef, false)
```

---

## Performance & Optimization Considerations

```
┌─────────────────────────────────────────────────────────────────────────┐
│              DATA LOADING STRATEGY & OPTIMIZATION POINTS                │
└─────────────────────────────────────────────────────────────────────────┘

HEAVY QUERIES (Watch Performance):
├─ GET /api/dashboard/stats
│  └─ Aggregates: Students (count), Groups (count), Progress (avg), etc.
│  └─ Optimization: Cached in SWR for 15 sec
│
├─ GET /api/assessment?groupId=[id]
│  └─ Joins: Assessment + Student + UnitStandard + Module
│  └─ Optimization: Indexed on studentId, unitStandardId, result
│
├─ GET /api/attendance/rates
│  └─ Aggregates: Attendance by student (present/total count)
│  └─ Optimization: Could benefit from materialized view
│
└─ GET /api/progress/group/[id]
   └─ Aggregates: All students' progress in group
   └─ Optimization: Could batch ModuleProgress queries

LIGHTWEIGHT QUERIES (Fast):
├─ GET /api/students/[id]
│  └─ Single record fetch with relations
│
├─ GET /api/lessons?from=[date]&to=[date]
│  └─ Date range filter (indexed)
│
└─ GET /api/modules (or with includeUnitStandards=true)
   └─ All modules (usually < 10 records)

PAGINATION OPPORTUNITIES:
├─ /api/students (could add page, pageSize params)
├─ /api/assessment (could add pagination)
├─ /api/attendance (could add pagination)
└─ Would reduce payload size on initial load

N+1 QUERY PREVENTION:
├─ Use: include { relations: {...} } in Prisma
├─ Avoid: Fetching parent, then looping children
├─ Example: Get Group WITH Students in single query
└─ Current: Most endpoints properly use include()

CACHING STRATEGY:
├─ Browser: SWR cache (in-memory)
├─ Server: Could add Redis for hot data
├─ Database: SQLite indexes on common filters
└─ CDN: Static assets (stylesheets, fonts)
```

---

## Implementation Checklist for Developers

```
┌─────────────────────────────────────────────────────────────────────────┐
│          BEFORE MAKING CHANGES: IMPACT ASSESSMENT CHECKLIST             │
└─────────────────────────────────────────────────────────────────────────┘

BEFORE MODIFYING: Student Record
└─ [ ] Check student status implications
   ├─ Affects: Group member count
   ├─ Affects: Dashboard total
   ├─ Affects: At-risk calculations
   └─ Affects: Completion eligibility
└─ [ ] Verify: All progress records exist
   ├─ ModuleProgress (should be 6 records)
   ├─ UnitStandardProgress (should be ~24 records)
   └─ CourseProgress (should be 1 record)
└─ [ ] Plan: Cache invalidation
   ├─ /api/students
   ├─ /api/students/[id]
   ├─ /api/groups/[id]/members
   ├─ /api/dashboard/stats
   └─ /api/progress/*

BEFORE MODIFYING: Assessment Record
└─ [ ] Know which student and unit this affects
└─ [ ] Check moderation status workflow
   ├─ PENDING → APPROVED → Update progress
   ├─ PENDING → REJECTED → Try again
   └─ PENDING → (expired after 30 days?)
└─ [ ] Verify: Related progress tables will update
   ├─ FormativeCompletion (if formative)
   ├─ UnitStandardProgress (increment formativesPassed or summativePassed)
   ├─ ModuleProgress (recalculate status)
   └─ Student (totalCredits, progress%, status)
└─ [ ] Plan: Cache invalidation (15+ keys)
└─ [ ] Create: UndoHistory record for audit trail

BEFORE MODIFYING: Group Record
└─ [ ] Warn: This affects ALL students in group
└─ [ ] Check: What changes
   ├─ Name change? → Just UI, minimal cascade
   ├─ Status change? → May affect student eligibility
   ├─ Schedule change? → Affects lesson/session generation
   ├─ Facilitator change? → Affects student assignments
   └─ Delete group? → CRITICAL - deletes all child records
└─ [ ] Verify: Rollout plans exist
   ├─ GroupRolloutPlan (1 master plan)
   ├─ RolloutPlan (1 per module, so 6)
   └─ Will they need recalculation?
└─ [ ] Plan: Invalidate 20+ cache keys
└─ [ ] Consider: Student impact (may need notification)

BEFORE MODIFYING: Module/Curriculum
└─ CRITICAL: Module edits cascade to ALL groups!
└─ [ ] Count: How many groups use this module?
└─ [ ] Check: Are students in-progress or already completed?
└─ [ ] Decision: Is change backward-compatible?
   ├─ Adding unit standard? → OK, extend learning
   ├─ Removing unit standard? → BREAKING - students lose progress
   ├─ Changing credits? → May affect calculations
   └─ Changing name/code? → Could break references
└─ [ ] Plan: Notification strategy
└─ [ ] List: All affected groups for testing

BEFORE CREATING BULK UPDATE:
└─ [ ] Validate: All records to update exist
└─ [ ] Save: UndoHistory BEFORE making changes
└─ [ ] Check: Permissions (user allowed to bulk update?)
└─ [ ] Measure: How many records affected?
   ├─ < 100: Easy, can do in transaction
   ├─ 100-1000: Consider batching
   └─ > 1000: Definitely batch + async job
└─ [ ] Test: On staging with similar data volume
└─ [ ] Plan: Rollback strategy (30-min undo window)
└─ [ ] Plan: User notification (which pages to refresh)

BEFORE DELETING RECORDS:
└─ [ ] Verify: Record not referenced elsewhere
   ├─ Search: Database for foreign key references
   ├─ Check: Student? → Will cascade delete assessments, attendance
   ├─ Check: Group? → Will cascade delete students, rollout plans
   ├─ Check: Module? → Will cascade delete unit standards
   └─ Check: Others? → Usually safe to delete
└─ [ ] Warn: User about cascade implications
└─ [ ] Backup: Database before bulk delete
└─ [ ] Log: What was deleted (audit trail)
└─ [ ] Test: On test database first

AFTER ANY CHANGE:
└─ [ ] Verify: Cache invalidation happened
   ├─ Check: Browser dev tools (Network tab)
   ├─ Confirm: SWR revalidated correct keys
   └─ Verify: Data is fresh on all pages
└─ [ ] Check: No orphaned data
   ├─ Run: /api/validation/data-integrity
   └─ Fix: Any inconsistencies found
└─ [ ] Test: Related pages still work
   ├─ Dashboard refreshes
   ├─ Student detail loads correctly
   ├─ Group detail updates
   ├─ Progress calculations correct
   └─ Alerts still trigger
└─ [ ] Monitor: Browser console for errors
└─ [ ] Notify: Affected users if bulk operation
```

---

## Summary Matrix: Who Depends On What

```
┌─────────────────────────────────────────────────────────────────────────┐
│              COMPLETE DEPENDENCY RESPONSIBILITY MATRIX                  │
└─────────────────────────────────────────────────────────────────────────┘

                         DEPENDS ON THIS DATA
UPDATES THIS↓

Student Record       User    Group   Module  Other Students    Impact
├─ Delete            —       1       —      All progress records   CRITICAL
├─ Status change     —       1       —      Group health           HIGH
├─ Facilitator chg   1       —       —      Lesson planning        MEDIUM
└─ Info update       —       —       —      Minimal                LOW

Assessment Record    Student Unit    Module Form. Comp   Impact
├─ Create/Update     1       1       1      1           Progress calc      HIGH
├─ Delete            1       1       —      Cascade     Revert progress    HIGH
└─ Moderation change 1       1       —      1           Unlock next level  HIGH

Attendance Record    Student Session Group  Policy    Impact
├─ Mark              1       1       1      1      Alert check     HIGH
├─ Bulk mark         M       M       1      1      Alerts + status CRITICAL
└─ Delete            1       1       1      —      Recalculate    MEDIUM

Lesson/Session       Module  Group   User   Room     Impact
├─ Create            1       1       1      —      Timetable update   MEDIUM
├─ Delete            1       1       —      —      Session gone       MEDIUM
└─ Update            1       1       1      —      Timetable refresh  LOW

Group Record         Company  —      —      —      Impact
├─ Create            1        —      —      —      Initialize all stuff   CRITICAL
├─ Delete            —        —      —      —      Deletes all students   CRITICAL
└─ Schedule update   —        —      —      —      Lesson generation      MEDIUM

Rollout Plan         Group   Module  —      —      Impact
├─ Create            1       1       —      —      Sets projected dates   HIGH
├─ Update actual     1       1       —      —      Status recalc          MEDIUM
└─ Delete            1       1       —      —      Planning loss          HIGH

Module Record        —       —       —      —      Impact
├─ Create            —       —       —      —      New curriculum         HIGH
├─ Modify            —       —       —      —      All groups affected    CRITICAL
└─ Delete            —       —       —      —      Breaking change        CRITICAL

Progress Records     Student Module Unit  —      Impact
├─ Update status     1       1       1    —      Completion tracking    MEDIUM
├─ Add credits       1       1       1    —      Student progress       MEDIUM
└─ Recalculate       M       M       M    —      Consistency check      MEDIUM

Legend:
  1 = Single dependency
  M = Multiple dependencies (many records)
  — = No dependency
```

---

## Quick Reference: Critical Paths

```
ASSESSMENT SUBMISSION → PROGRESS UPDATE → STATUS CHANGE
├─ If all criteria met:
│  ├─ Module completed → RolloutPlan.actualEndDate = today
│  ├─ All modules done → Student.status = COMPLETED
│  └─ Graduation eligible → POEChecklist triggers
{
└─ If criteria not met:
   ├─ Low progress → At-risk alert
   ├─ Repeated failures → Can't progress
   └─ Teacher review needed → Marks for follow-up

ATTENDANCE → ALERT → AT-RISK STATUS
├─ If rate < threshold:
│  ├─ Create AttendanceAlert
│  └─ Update Student.status = AT_RISK
└─ If consecutive absences:
   ├─ Create AttendanceAlert with severity
   ├─ Notify facilitator
   └─ Dashboard flags student

FORMATIVE APPROVAL → SUMMATIVE UNLOCK → CREDIT AWARD
├─ Formatives passed → Eligible for summative
├─ Summative passed → Credit earned
├─ All credits earned → Module complete
└─ All modules complete → Student complete

LESSON SCHEDULED → SESSION CREATED → ATTENDANCE TRACKED
├─ Lesson date = LessonPlan.date
├─ Session created (auto) = Session.date
├─ Attendance marked = Attendance.date + Attendance.status
├─ Progress tracked = RolloutPlan.actualStartDate (first lesson)
└─ Status updated = RolloutPlan.actualEndDate (last lesson)
```

---

## Final Recommendations

✅ **DO:**
- Always check cache invalidation after changes
- Create UndoHistory for bulk operations
- Run data integrity validation periodically
- Monitor /api/validation/data-integrity
- Test on test database before production
- Document breaking changes

❌ **DON'T:**
- Delete modules (breaking change for groups)
- Delete groups without notifying students
- Update assessments without moderation workflow
- Assume one student = one record per module
- Make synchronous API calls in bulk operations
- Skip cache invalidation "for performance"

⚠️ **WATCH OUT FOR:**
- Student deletion cascades to 50+ records
- Module changes affect ALL groups using it
- Assessment moderation unlocks next learning level
- Rollout plan status drives group health metrics
- Attendance alerts trigger automatically
- POE completion blocks student graduation eligibility

