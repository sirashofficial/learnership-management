# Complete Data Dependencies Audit & Site Map

## Executive Summary

This document provides a comprehensive audit of all data dependencies across the Learnership Management System (YEHA). It maps how data flows through the entire application, identifies all dependencies, shows how entities relate to each other, and demonstrates the impact of changes across the system.

**System Type:** Next.js Full-Stack LMS  
**Database:** SQLite (Prisma ORM)  
**Frontend State:** React Context + SWR Hooks  
**API Layer:** RESTful (100+ endpoints)  

---

## Table of Contents

1. [Data Model Hierarchy](#data-model-hierarchy)
2. [Complete Entity Relationship Map](#complete-entity-relationship-map)
3. [API Endpoints Structure](#api-endpoints-structure)
4. [Page-to-Data Mapping](#page-to-data-mapping)
5. [Data Flow Diagrams](#data-flow-diagrams)
6. [Dependency Chains](#dependency-chains)
7. [Cache Invalidation Map](#cache-invalidation-map)
8. [Cross-Page Dependencies](#cross-page-dependencies)
9. [Real-Time Updates Architecture](#real-time-updates-architecture)
10. [Data Impact Analysis](#data-impact-analysis)

---

## Data Model Hierarchy

### Core Entities (Foundation)

```
User (Facilitator/Admin)
├── role: FACILITATOR | ADMIN | MANAGER
├── email, name, password
└── relations:
    ├── lessonPlans (1:Many)
    ├── sessions (1:Many)
    ├── students (1:Many) - "facilitatorId"
    ├── plans (1:Many) - "PlanFacilitator"
    └── reminderPreference (1:1)

Company
├── name, address, contactPerson
└── relations:
    └── groups (1:Many)

Group (Training Cohort)
├── name, location, startDate, endDate
├── status: ACTIVE | COMPLETED | ON_HOLD
├── relations:
    ├── Company (Many:1)
    ├── schedules (1:Many) - GroupSchedule
    ├── courses (1:Many) - GroupCourse
    ├── rolloutPlans (1:Many)
    ├── students (1:Many)
    ├── lessons (1:Many) - LessonPlan
    ├── sessions (1:Many)
    ├── facilitatorTasks (1:Many)
    ├── unitStandardRollouts (1:Many)
    ├── facilitatedModule (1:1) - currentFacilitatedModuleId
    └── plans (1:Many) - Calendar

Module (6-Module Curriculum)
├── moduleNumber: 1-6
├── code, name, credits, notionalHours
├── status: ACTIVE | ARCHIVED
├── relations:
    ├── unitStandards (1:Many)
    ├── lessonPlans (1:Many)
    ├── formativeAssessments (1:Many)
    ├── documents (1:Many)
    ├── embeddings (1:Many)
    ├── progress (1:Many) - ModuleProgress
    ├── students (1:Many) - "currentModuleId"
    ├── rolloutPlans (1:Many)
    └── groups (1:Many) - "facilitatedModule"

UnitStandard (Learning Outcome)
├── code, title, credits, level
├── type, content
├── relations:
    ├── Module (Many:1)
    ├── activities (1:Many) - Activity
    ├── assessments (1:Many) - Assessment
    ├── formativeAssessments (1:Many) - FormativeAssessment
    ├── progress (1:Many) - UnitStandardProgress
    └── rollouts (1:Many) - UnitStandardRollout

Student (Learner)
├── studentId, firstName, lastName
├── email, phone, idNumber
├── progress, totalCreditsEarned
├── status: ACTIVE | AT_RISK | COMPLETED | WITHDRAWN
├── relations:
    ├── Group (Many:1)
    ├── Facilitator/User (Many:1) - "facilitatorId"
    ├── Module (Many:1) - "currentModuleId"
    ├── assessments (1:Many) - Assessment
    ├── attendance (1:Many) - Attendance
    ├── courseProgress (1:Many) - CourseProgress
    ├── formativeCompletions (1:Many) - FormativeCompletion
    ├── moduleProgress (1:Many) - ModuleProgress
    ├── poeChecklist (1:1) - POEChecklist
    ├── attendanceAlerts (1:Many) - AttendanceAlert
    └── unitStandardProgress (1:Many) - UnitStandardProgress
```

### Learning & Assessment Entities

```
FormativeAssessment (Low-stakes Assessment)
├── code, title, unitStandardId, moduleId
├── questions, passingScore, order
├── relations:
    ├── UnitStandard (Many:1)
    ├── Module (Many:1)
    └── completions (1:Many) - FormativeCompletion

FormativeCompletion (Student Formative Result)
├── completedDate, score, passed
├── attempts, moderationStatus
├── relations:
    ├── Student (Many:1)
    ├── FormativeAssessment (Many:1)
    └── UNIQUE([studentId, formativeId])

Assessment (High-stakes Assessment)
├── type, method, result, score
├── assessedDate, dueDate, feedback
├── moderationStatus, attemptNumber
├── relations:
    ├── Student (Many:1)
    ├── UnitStandard (Many:1)
    └── INDEXES: [unitStandardId], [studentId, unitStandardId], [studentId, result]

Progress Tracking (Student Learning Path)
├── ModuleProgress
│   ├── status: NOT_STARTED | IN_PROGRESS | COMPLETED
│   ├── progress: 0-100%
│   ├── creditsEarned
│   └── UNIQUE([studentId, moduleId])
│
├── UnitStandardProgress
│   ├── status, formativesPassed, summativePassed
│   ├── startDate, completionDate
│   └── UNIQUE([studentId, unitStandardId])
│
└── CourseProgress
    ├── progress: 0-100%
    └── UNIQUE([studentId])

POEChecklist (Proof of Evidence)
├── module1POE, module2POE, ... module6POE
├── assessmentsSigned, logbookComplete
├── idCopyPresent, contractSigned
├── inductionComplete, verifiedDate
└── relations:
    └── Student (1:1)
```

### Attendance & Compliance Entities

```
Session (Class/Training Session)
├── title, module, date, startTime, endTime
├── facilitatorId, groupId
├── notes
└── relations:
    ├── Facilitator/User (Many:1)
    ├── Group (Many:1)
    └── attendance (1:Many) - Attendance

Attendance (Student Presence Record)
├── date, status: PRESENT | ABSENT | LATE | EXCUSED
├── notes, markedBy, markedAt
├── qrCodeScan: boolean
├── UNIQUE([studentId, date, groupId])
└── relations:
    ├── Student (Many:1)
    ├── Session (Many:1) - optional
    └── INDEX: [studentId, date], [groupId, date]

AttendanceAlert (Compliance Warning)
├── type, severity, message
├── resolved: boolean, resolvedAt
├── notificationSent: boolean
└── relations:
    └── Student (Many:1)

AttendancePolicy (Rules)
├── minimumPercentage, consecutiveAbsences
├── warningThreshold, criticalThreshold
├── notifyOnAbsence, notifyOnWarning, notifyOnCritical
└── isActive: boolean

AttendanceReport (Export)
├── title, type, startDate, endDate
├── format: CSV | PDF | EXCEL
├── filePath, generatedBy
└── parameters: JSON
```

### Schedule & Planning Entities

```
LessonPlan (Class Plan)
├── title, description, date
├── startTime, endTime, venue
├── objectives, materials, activities
├── aiGenerated: boolean
├── relations:
    ├── Module (Many:1)
    ├── Facilitator/User (Many:1)
    └── Group (Many:1) - optional

ScheduleTemplate (Recurring Schedule Pattern)
├── name, description
├── isActive: boolean
├── schedule: string (JSON/CRON)
└── relations:
    └── groupSchedules (1:Many) - GroupSchedule

GroupSchedule (Apply Template to Group)
├── startDate, endDate
└── relations:
    ├── Group (Many:1)
    ├── ScheduleTemplate (Many:1)
    └── INDEX: [groupId], [templateId]

RecurringSessionOverride (Exception to Schedule)
├── date, groupName, venue
├── isCancelled: boolean, cancellationReason
├── notificationEnabled, notificationSent
├── UNIQUE([date, groupName, venue])

Session (see Attendance section)

Plan (Calendar Event)
├── title, description, startDate, endDate
├── groupId, facilitatorId, venue
├── objectives, materials, notes
└── relations:
    ├── Group (Many:1)
    ├── Facilitator/User (Many:1)
    └── reminders (1:Many) - Reminder

Reminder (Notification)
├── message, venue, sendTo (email list)
├── scheduledAt, sentAt
└── relations:
    └── Plan (Many:1)

ReminderPreference (User Settings)
├── emailRemindersEnabled, browserNotificationsEnabled
├── quietHoursStart, quietHoursEnd
├── timeZone
└── relations:
    └── User (1:1)
```

### Rollout & Curriculum Entities

```
RolloutPlan (Module Delivery Schedule)
├── groupId, moduleId, moduleNumber
├── projectedStartDate, projectedEndDate
├── actualStartDate, actualEndDate
├── actualSummativeDate, actualAssessmentDate
├── credits, notes
├── status: auto-calculated (NOT_STARTED | IN_PROGRESS | BEHIND | COMPLETED | AT_RISK)
├── UNIQUE([groupId, moduleId])
└── relations:
    ├── Group (Many:1)
    └── Module (Many:1)

GroupRolloutPlan (Group-wide Rollout Master Plan)
├── groupId (UNIQUE)
├── module1StartDate, module1EndDate
├── ... module6StartDate, module6EndDate
├── rolloutDocPath
└── relations:
    └── Group (1:1)

UnitStandardRollout (Unit Delivery Schedule)
├── groupId, unitStandardId
├── startDate, endDate, summativeDate
├── actualStartDate, actualEndDate, actualSummativeDate
├── status, completedPercent
├── facilitated: boolean, facilitatedAt
├── facilitatorNotes: string
├── UNIQUE([groupId, unitStandardId])
└── relations:
    ├── Group (Many:1)
    └── UnitStandard (Many:1)

GroupCourse (Curriculum Configuration)
├── status: PLANNED | IN_PROGRESS | COMPLETED
└── relations:
    └── Group (Many:1)

CurriculumDocument (Course Material)
├── title, fileName, fileType, filePath
├── description, category, version
├── uploadedAt
└── relations:
    └── Module (Many:1)

CurriculumEmbedding (AI Search Index)
├── content, embedding (vector)
├── metadata (JSON)
└── relations:
    └── Module (Many:1)

Activity (Learning Activity)
├── description, duration, resources
├── assessmentType
└── relations:
    └── UnitStandard (Many:1)
```

### Data Integrity & Utility Entities

```
UndoHistory (Audit & Rollback)
├── userId, action, entityType
├── entityIds: string (JSON array)
├── previousState, newState (JSON)
├── canUndo: boolean
├── undoneAt, expiresAt (30-min window)
└── INDEXES: [userId], [expiresAt], [canUndo]

FacilitatorTask (To-Do)
├── title, description, dueDate
├── completed: boolean, completedAt
└── relations:
    └── Group (Many:1)

DocumentChunk (AI Search)
├── content, filename, filePath
├── category, tags, chunkIndex
└── INDEXES: [category], [filename]

POEFile (Evidence Upload)
├── fileName, fileSize, fileType
├── filePath, description
├── uploadedAt
```

---

## Complete Entity Relationship Map

### Relationship Graph (Shows all 1:Many, Many:1, 1:1 relationships)

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATA DEPENDENCIES MAP                       │
└─────────────────────────────────────────────────────────────────┘

                           USER (Facilitator/Admin)
                          /    |              \
                         /     |               \
                    Sessions  LessonPlans    Plans & Reminders
                      |         |               |
                      |         |               |
        ┌─────────────┴─────────┴───────────────┴──────────────┐
        |                                                        |
      GROUP                              MODULE
      |  |                                |  |
      |  ├─ GroupCourse                  |  ├─ UnitStandards
      |  ├─ GroupSchedule                |  ├─ FormativeAssessments
      |  ├─ RolloutPlan                  |  ├─ CurriculumDocument
      |  ├─ UnitStandardRollout          |  └─ CurriculumEmbedding
      |  └─ FacilitatorTask              |
      |                                   |
     STUDENT                         ASSESSMENT
      |  |                             /    |    \
      |  ├─ Attendance              /      |      \
      |  ├─ Assessment            UnitStd  Form  Summary
      |  ├─ ModuleProgress          |       |
      |  ├─ UnitStdProgress         |       |
      |  ├─ FormativeCompletion     |    FormativeCompletion
      |  ├─ CourseProgress          |
      |  ├─ POEChecklist            |
      |  └─ AttendanceAlert         |
      |                             |
      └─────────────────────────────┘
                    |
                 ATTENDANCE
                 /    |    \
              Session Date  Status
                |
            (Bulk marking)
```

### Entity Dependency Levels

**Level 0 (Foundation - No dependencies on other entities)**
- User
- Company
- Module (technically depends on nothing, defines Unit Standards)
- AttendancePolicy

**Level 1 (Depends on Level 0)**
- Group (depends on Company)
- UnitStandard (depends on Module)
- ReminderPreference (depends on User)
- ScheduleTemplate

**Level 2 (Depends on Level 0-1)**
- Student (depends on Group, User)
- FormativeAssessment (depends on Module, UnitStandard)
- CurriculumDocument (depends on Module)
- GroupCourse (depends on Group)
- GroupRolloutPlan (depends on Group)
- RolloutPlan (depends on Group, Module)
- GroupSchedule (depends on Group, ScheduleTemplate)
- LessonPlan (depends on Module, User, Group)
- Plan (depends on Group, User)

**Level 3 (Depends on Level 0-2)**
- Session (depends on User, Group)
- Activity (depends on UnitStandard)
- Assessment (depends on Student, UnitStandard)
- ModuleProgress (depends on Student, Module)
- UnitStandardProgress (depends on Student, UnitStandard)
- CourseProgress (depends on Student)
- UnitStandardRollout (depends on Group, UnitStandard)
- Reminder (depends on Plan)
- Attendance (depends on Student, Session)
- FormativeCompletion (depends on Student, FormativeAssessment)

**Level 4 (Depends on Level 0-3)**
- POEChecklist (depends on Student)
- AttendanceAlert (depends on Student)
- UndoHistory (transaction history)

---

## API Endpoints Structure

### API Layer Organization

```
/api
├── auth/
│   ├── login [POST]
│   ├── logout [POST]
│   ├── register [POST]
│   └── me [GET]
│
├── students/
│   ├── [GET] - List (filters: groupId, status, format)
│   ├── [POST] - Create
│   ├── [id] [GET, PUT, DELETE]
│   └── [id]/progress [GET, POST]
│
├── groups/
│   ├── [GET] - List all groups
│   ├── [POST] - Create
│   ├── [id] [GET, PUT, DELETE]
│   ├── [id]/summary [GET] - Group overview
│   ├── [id]/rollout [GET, POST] - Rollout status
│   ├── [id]/health [GET] - Health metrics
│   └── [id]/members [GET] - List students
│
├── modules/
│   ├── [GET] - List modules (includeUnitStandards param)
│   ├── [id] [GET] - Module details
│   └── [GET] - Curriculum overview
│
├── unit-standards/
│   ├── [GET] - List all unit standards
│   ├── [POST] - Create
│   └── [id] [GET, PUT, DELETE]
│
├── assessment/
│   ├── [GET] - List assessments
│   ├── [POST] - Create or bulk update
│   ├── [id] [GET, PUT, DELETE]
│   ├── stats [GET] - Assessment statistics
│   ├── by-group [GET] - Filter by group
│   ├── pending [GET] - Pending moderation
│   ├── summative [GET] - Summative only
│   └── [id]/feedback [POST] - Add feedback
│
├── formatives/
│   ├── [GET] - List formative assessments
│   ├── [POST] - Create
│   ├── [id] [GET, PUT, DELETE]
│   ├── completion [POST] - Mark completion
│   ├── completion [GET] - Get completions
│   ├── [id]/attempts [GET] - Get attempts
│   ├── student/[id] [GET] - Student's completions
│   └── moderation [GET] - Pending moderation
│
├── attendance/
│   ├── [GET] - List attendance
│   ├── [POST] - Mark single
│   ├── [PUT] - Update
│   ├── [DELETE] - Delete
│   ├── bulk [POST] - Bulk mark
│   ├── batch [POST] - Batch create
│   ├── rates [GET] - Attendance rates by student
│   ├── stats [GET] - Statistics
│   ├── history [GET] - Student history
│   ├── export [GET] - Export to CSV
│   ├── alerts [GET] - Attendance alerts
│   └── policies [GET, POST]
│
├── sessions/
│   ├── [GET] - List sessions
│   ├── [POST] - Create
│   ├── [id] [GET, PUT, DELETE]
│   ├── [id]/audit [GET] - Audit trail
│   ├── generate [POST] - Generate from template
│   └── recurring [POST] - Create recurring
│
├── timetable/
│   ├── [GET] - Get lessons (date range)
│   ├── [POST] - Create
│   ├── [id] [GET, PATCH, DELETE]
│   └── [id]/audit [GET] - Audit trail
│
├── lessons/
│   ├── [GET] - List lesson plans
│   ├── [POST] - Create
│   ├── [id] [GET, PUT, DELETE]
│   └── [id]/pdf [GET] - Export as PDF
│
├── curriculum/
│   ├── [GET] - Complete curriculum
│   ├── modules [GET] - Module list
│   ├── documents [GET] - All documents
│   ├── [id]/documents [GET] - Module documents
│   ├── search [GET] - Find document
│   └── structure [GET] - Full structure
│
├── rollout/
│   ├── [GET] - All rollout plans
│   ├── [POST] - Create
│   ├── group/[groupId] [GET] - Group rollout
│   ├── [id] [GET, PUT, DELETE]
│   ├── status [GET] - Status by group
│   ├── health [GET] - Health metrics
│   ├── unit-rollouts [GET] - Unit rollouts
│   └── [id]/export [GET] - Export DOCX
│
├── progress/
│   ├── [GET] - Overall progress
│   ├── [POST] - Update progress
│   ├── group/[groupId] [GET] - Group progress
│   ├── student/[studentId] [GET] - Student detailed
│   ├── module [GET] - By module
│   └── summary [GET] - Summary stats
│
├── poe/
│   ├── [GET] - List checklists
│   ├── [POST] - Update checklist
│   ├── [studentId] [GET] - Student POE
│   ├── bulk [PUT] - Bulk update
│   └── [id]/export [GET] - Export checklist
│
├── schedule/
│   ├── templates [GET] - List templates
│   ├── templates [POST] - Create template
│   ├── group-schedules [GET] - Group schedules
│   ├── group-schedules [POST] - Assign schedule
│   ├── [id] [GET, PUT, DELETE]
│   ├── generate [POST] - Generate sessions
│   └── overrides [GET, POST] - Overrides
│
├── plans/
│   ├── [GET] - List plans
│   ├── [POST] - Create
│   ├── [id] [GET, PUT, DELETE]
│   ├── [id]/reminders [GET] - Get reminders
│   └── [id]/reminders [POST] - Add reminder
│
├── reminders/
│   ├── [GET] - List reminders
│   ├── [POST] - Create
│   ├── [id] [GET, PUT, DELETE]
│   ├── [id]/mark-read [POST]
│   └── send-pending-emails [POST]
│
├── dashboard/
│   ├── stats [GET] - Overall stats
│   ├── charts [GET] - Chart data (range param)
│   ├── recent-activity [GET] - Activity feed
│   ├── alerts [GET] - System alerts
│   ├── schedule [GET] - Today's schedule
│   ├── programme-health [GET] - Health metrics
│   └── summary [GET] - Dashboard summary
│
├── ai/
│   ├── semantic-search [GET, POST] - Vector search
│   ├── index-documents/
│   │   ├── list [GET] - List indexed docs
│   │   ├── index [POST] - Index document
│   │   ├── reindex [POST] - Reindex all
│   │   └── delete/[id] [DELETE]
│   └── generate-lesson [POST] - AI lesson plan
│
├── admin/
│   ├── users [GET, POST] - User management
│   ├── users/[id] [GET, PUT, DELETE]
│   ├── users/[id]/password [POST] - Change password
│   ├── cleanup [POST] - Delete old data
│   └── audit [GET] - Audit log
│
├── search/
│   ├── [GET] - Global search (q param, filter param)
│
├── validation/
│   ├── data-integrity [GET] - Check integrity
│   ├── fix-duplicates [POST] - Remove duplicates
│   ├── fix-credits [POST] - Recalculate credits
│   └── generate-missing-assessments [POST]
│
├── undo/
│   ├── [GET] - List undo history
│   └── [id] [POST] - Undo action
│
└── settings/
    ├── profile [GET, PUT] - User profile
    └── preferences [GET, PUT] - User preferences
```

### API Response Patterns

**Standard Success Response:**
```json
{
  "success": true,
  "data": {...} or [...]
}
```

**Standard Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

**Paginated Response (where applicable):**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

## Page-to-Data Mapping

### Dashboard Pages Structure

```
/
└── Dashboard (Main Hub)
    ├── Data Sources:
    │   ├── /api/dashboard/stats
    │   ├── /api/dashboard/recent-activity
    │   ├── /api/dashboard/alerts
    │   ├── /api/dashboard/schedule
    │   ├── /api/dashboard/charts
    │   └── /api/dashboard/programme-health
    │
    ├── Key Metrics:
    │   ├── Total Students (from Student table)
    │   ├── Total Groups (from Group table)
    │   ├── Active Courses (from GroupCourse + Group)
    │   ├── Overall Progress (from ModuleProgress aggregated)
    │   ├── Attendance Rate (from Attendance aggregated)
    │   ├── At-Risk Students (from Student where status = AT_RISK)
    │   └── Pending Assessments (from Assessment where moderationStatus = PENDING)
    │
    └── Connected Pages:
        ├── Groups Detail
        ├── Students Detail
        ├── Assessments
        └── Attendance

Student Management (/students)
├── List View
│   ├── Data Source: GET /api/students
│   ├── Filters: groupId, status, sort
│   ├── DB Tables:
│   │   ├── Student (base data)
│   │   └── Group (via groupId)
│   │
│   └── Columns Displayed:
│       ├── studentId, firstName, lastName
│       ├── email, phone
│       ├── groupName
│       ├── progress (from ModuleProgress avg)
│       ├── status
│       └── actions
│
├── Detail View (/students/[id])
│   ├── Data Sources:
│   │   ├── GET /api/students/[id] - Student details
│   │   ├── GET /api/students/[id]/progress - Detailed progress
│   │   ├── GET /api/assessment?studentId=[id] - Assessments
│   │   ├── GET /api/attendance?studentId=[id] - Attendance records
│   │   ├── GET /api/poe/[id] - POE checklist
│   │   └── GET /api/formatives/student/[id] - Formative completions
│   │
│   ├── Tabs:
│   │   ├── Overview
│   │   │   └── Student details, current module, group, facilitator
│   │   ├── Progress
│   │   │   ├── Module Progress (ModuleProgress table)
│   │   │   ├── Unit Standard Progress (UnitStandardProgress table)
│   │   │   └── Credits earned (sum from assessments)
│   │   ├── Assessments
│   │   │   └── Assessment records (Assessment table)
│   │   ├── Formatives
│   │   │   └── Formative completions (FormativeCompletion table)
│   │   ├── Attendance
│   │   │   └── Attendance records (Attendance table)
│   │   └── POE
│   │       └── POE checklist (POEChecklist table)
│   │
│   └── Impact: Updating student status affects:
│       ├── Dashboard total students count
│       ├── Group health metrics
│       ├── Attendance alerts
│       └── At-risk dashboards

Group Management (/groups)
├── List View
│   ├── Data Source: GET /api/groups
│   ├── DB Tables:
│   │   ├── Group (base data)
│   │   ├── Company (via companyId)
│   │   └── _count: students, courses, schedules
│   │
│   └── Columns:
│       ├── name, location
│       ├── startDate, endDate
│       ├── status
│       ├── studentCount
│       └── coordinatorName
│
├── Detail View (/groups/[id])
│   ├── Data Sources:
│   │   ├── GET /api/groups/[id] - Group details
│   │   ├── GET /api/groups/[id]/members - Student list
│   │   ├── GET /api/groups/[id]/summary - Group summary
│   │   ├── GET /api/groups/[id]/health - Health metrics
│   │   ├── GET /api/rollout/group/[id] - Rollout status
│   │   ├── GET /api/attendance/stats?groupId=[id] - Attendance
│   │   └── GET /api/progress/group/[id] - Group progress
│   │
│   ├── Tabs:
│   │   ├── Overview
│   │   │   ├── Group info, schedule, facilitator
│   │   │   └── Health metrics
│   │   ├── Students
│   │   │   └── Student list with progress
│   │   ├── Curriculum
│   │   │   ├── Modules (GroupCourse)
│   │   │   ├── Unit Standards
│   │   │   └── Documents
│   │   ├── Rollout Plan
│   │   │   ├── RolloutPlan (by module)
│   │   │   └── UnitStandardRollout
│   │   ├── Schedule
│   │   │   ├── GroupSchedule (templates)
│   │   │   ├── Sessions
│   │   │   └── Lessons
│   │   ├── Attendance
│   │   │   └── Overall attendance stats
│   │   ├── Progress
│   │   │   ├── Module progress aggregated
│   │   │   └── Unit standard progress aggregated
│   │   └── Assessments
│   │       └── All assessments for group students
│   │
│   └── Impact: Group changes affect:
│       ├── All students in group
│       ├── Schedule/sessions
│       ├── Rollout plans
│       ├── Dashboard metrics
│       └── Reports

Assessment Management (/assessments)
├── List View
│   ├── Data Source: GET /api/assessment
│   ├── Filters: groupId, studentId, unitStandardId, status
│   ├── DB Tables:
│   │   ├── Assessment (main)
│   │   ├── Student (via studentId)
│   │   ├── UnitStandard (via unitStandardId)
│   │   └── Module (via UnitStandard.moduleId)
│   │
│   └── Columns:
│       ├── student name
│       ├── unit standard
│       ├── score, result
│       ├── assessedDate
│       ├── dueDate
│       └── moderationStatus
│
├── Detail View (/assessments/[id])
│   ├── Data Sources:
│   │   ├── GET /api/assessment/[id]
│   │   ├── GET /api/students/[studentId] - Student info
│   │   └── GET /api/unit-standards/[unitStandardId]
│   │
│   ├── Form Fields:
│   │   ├── Student (read-only)
│   │   ├── Unit Standard (read-only)
│   │   ├── Score
│   │   ├── Result (PASS | FAIL | PENDING)
│   │   ├── Feedback
│   │   ├── Moderation Status (PENDING | APPROVED | REJECTED)
│   │   └── Moderation Notes
│   │
│   └── Impact:
│       ├── Updates ModuleProgress
│       ├── Updates UnitStandardProgress
│       ├── Updates Student.totalCreditsEarned
│       ├── May trigger AttendanceAlert
│       └── May change Student.status to AT_RISK
│
├── Bulk Update View
│   ├── Data Source: Multiple students + scores
│   ├── Action: POST /api/assessment (bulk)
│   └── Impact: Same as detail + created UndoHistory
│
└── Formative Assessment View (/assessment-checklist)
    ├── Data Sources:
    │   ├── GET /api/formatives
    │   ├── GET /api/formatives/student/[id]
    │   └── GET /api/formatives/moderation
    │
    ├── Moderation Tab:
    │   ├── FormativeCompletion records
    │   ├── Status: PENDING | APPROVED | REJECTED
    │   └── Update moderation status
    │
    └── Impact:
        ├── Updates FormativeCompletion
        ├── Triggers UnitStandardProgress calculation
        └── May auto-unlock summative assessment

Attendance Management (/attendance)
├── List View
│   ├── Data Source: GET /api/attendance
│   ├── Filters: groupId, date, studentId
│   ├── DB Tables:
│   │   ├── Attendance (main)
│   │   ├── Student (via studentId)
│   │   └── Session (via sessionId)
│   │
│   └── Columns:
│       ├── student name
│       ├── date
│       ├── status (PRESENT | ABSENT | LATE | EXCUSED)
│       └── markedAt
│
├── Mark Attendance Page (/attendance/mark)
│   ├── Data Sources:
│   │   ├── GET /api/sessions - Available sessions
│   │   ├── GET /api/attendance?date=[today]
│   │   └── GET /api/sessions/[id] - Session details
│   │
│   ├── Actions:
│   │   ├── Mark individual: POST /api/attendance
│   │   └── Bulk mark: POST /api/attendance/bulk
│   │
│   └── Impact:
│       ├── Creates/updates Attendance records
│       ├── Triggers AttendanceAlert calculation
│       ├── May update Student.status to AT_RISK
│       └── Creates UndoHistory for bulk actions
│
├── Attendance Report View
│   ├── Data Sources:
│   │   ├── GET /api/attendance/stats
│   │   ├── GET /api/attendance/rates
│   │   ├── GET /api/attendance/history
│   │   └── GET /api/dashboard/charts?range=30
│   │
│   ├── Reports:
│   │   ├── Overall rate by student
│   │   ├── Daily attendance
│   │   ├── Alerts (AttendanceAlert)
│   │   └── Trends
│   │
│   └── Export:
│       └── GET /api/attendance/export → CSV
│
└── Impact of Attendance Changes:
    ├── AttendanceAlert threshold checks
    ├── Student.status updates
    ├── Dashboard metrics
    ├── At-risk reports
    └── Compliance reports

Curriculum/Modules (/curriculum)
├── Curriculum Overview
│   ├── Data Source: GET /api/curriculum
│   ├── DB Tables: Module (all), UnitStandard (all)
│   │
│   └── Shows:
│       ├── 6 modules with details
│       ├── Unit standards per module
│       ├── Credits per module
│       └── Learning outcomes
│
├── Module Detail
│   ├── Data Sources:
│   │   ├── GET /api/modules/[id]?includeUnitStandards=true
│   │   ├── GET /api/curriculum/[id]/documents
│   │   └── GET /api/formatives?moduleId=[id]
│   │
│   ├── Tabs:
│   │   ├── Overview
│   │   ├── Unit Standards (UnitStandard table)
│   │   ├── Activities (Activity table)
│   │   ├── Documents (CurriculumDocument table)
│   │   ├── Formatives (FormativeAssessment table)
│   │   └── Progress (ModuleProgress aggregated)
│   │
│   └── Impact: Editing affects:
│       ├── All groups using this module
│       ├── All students in groups
│       ├── Rollout plans
│       └── Lesson plans

Lesson Planning (/lessons)
├── List View
│   ├── Data Source: GET /api/lessons
│   ├── Date range filter (from/to params)
│   ├── DB Tables:
│   │   ├── LessonPlan (main)
│   │   ├── Module (via moduleId)
│   │   ├── User/Facilitator (via facilitatorId)
│   │   └── Group (via groupId)
│   │
│   └── Calendar/List display
│
├── Create/Edit Lesson
│   ├── Manual Creation:
│   │   ├── POST /api/timetable
│   │   └── PUT /api/timetable/[id]
│   │
│   ├── AI Generation:
│   │   ├── POST /api/ai/generate-lesson
│   │   ├── Uses: Module content, curriculum documents
│   │   └── Calls: OpenAI or Cohere APIs
│   │
│   ├── Form Fields:
│   │   ├── title, description
│   │   ├── date, startTime, endTime
│   │   ├── module, group, facilitator
│   │   ├── venue
│   │   ├── objectives, materials, activities
│   │   └── aiGenerated flag
│   │
│   └── Impact:
│       ├── Creates LessonPlan record
│       ├── May auto-create Session records
│       └── Updates group schedule

Session Management (/lessons?view=sessions)
├── Session List
│   ├── Data Source: GET /api/sessions
│   ├── DB Tables:
│   │   ├── Session (main)
│   │   ├── Group (via groupId)
│   │   └── User (via facilitatorId)
│   │
│   └── Actions:
│       ├── Create session: POST /api/sessions
│       ├── Generate recurring: POST /api/sessions/generate
│       └── Create overrides: POST /api/schedule/overrides
│
└── Impact: Sessions connect to:
    ├── Attendance (marking present/absent)
    ├── Lessons (scheduling)
    └── Groups (assigned to cohort)

Timetable (/timetable)
├── Data Sources:
│   ├── GET /api/timetable
│   ├── GET /api/timetable?from=date&to=date
│   ├── GET /api/schedule/templates
│   └── GET /api/schedule/group-schedules
│
├── Views:
│   ├── Calendar view (by date)
│   ├── List view
│   ├── Group view
│   └── Facilitator view
│
├── Actions:
│   ├── Create lesson: POST /api/timetable
│   ├── Create template: POST /api/schedule/templates
│   ├── Assign schedule: POST /api/schedule/group-schedules
│   └── Create override: POST /api/schedule/overrides
│
└── Impact:
    ├── Affects Sessions availability
    ├── Affects Attendance marking
    ├── Affects Lesson planning
    └── Dashboard schedule feed

POE Checklist (/poe)
├── List View
│   ├── Data Source: GET /api/poe
│   ├── DB Table: POEChecklist
│   │
│   └── Displays all students' POE status
│
├── Student POE View (/poe/[studentId])
│   ├── Data Source: GET /api/poe/[studentId]
│   ├── Fields:
│   │   ├── Module 1-6 POE (checkbox + date)
│   │   ├── Assessments signed
│   │   ├── Logbook complete/signed
│   │   ├── ID copy present
│   │   ├── Contract signed
│   │   ├── Induction complete
│   │   └── Verification (date + verified by)
│   │
│   └── Impact:
│       ├── Affects Student.status (COMPLETED only if POE complete)
│       └── Used for graduation eligibility
│
└── Bulk Actions: PUT /api/poe/bulk

Progress Tracking (/progress)
├── Dashboard View (/progress)
│   ├── Data Sources:
│   │   ├── GET /api/progress - Overall
│   │   ├── GET /api/progress/group/[id]
│   │   ├── GET /api/progress/student/[id]
│   │   ├── GET /api/dashboard/charts
│   │   └── GET /api/dashboard/programme-health
│   │
│   ├── Displays:
│   │   ├── Group progress aggregates
│   │   ├── Module completion by group
│   │   ├── Student at-risk indicators
│   │   └── Credit accumulation
│   │
│   └── Tables Used:
│       ├── ModuleProgress (module level)
│       ├── UnitStandardProgress (unit level)
│       └── Student (credits)
│
├── Student Progress (/progress/student/[id])
│   ├── Data Source: GET /api/progress/student/[id]
│   ├── Shows:
│   │   ├── Module progress (per module)
│   │   ├── Unit standard progress (per unit)
│   │   ├── Credits earned
│   │   ├── Formatives passed
│   │   ├── Assessments results
│   │   └── Overall progress %
│   │
│   └── Impact:
│       ├── Calculated from assessments + formatives
│       ├── Affects Student.progress field
│       └── Used in at-risk alerts
│
└── Group Progress (/progress/group/[id])
    ├── Aggregated view of all students
    ├── Shows cohort-level metrics
    └── Used for group health assessment

Admin Section (/admin)
├── User Management
│   ├── GET /api/admin/users
│   ├── POST /api/admin/users
│   ├── PUT /api/admin/users/[id]
│   ├── DELETE /api/admin/users/[id]
│   └── POST /api/admin/users/[id]/password
│
├── Documents Management
│   ├── GET /api/ai/index-documents/list
│   ├── POST /api/ai/index-documents/index
│   ├── POST /api/ai/index-documents/reindex
│   └── DELETE /api/ai/index-documents/delete/[id]
│
├── Audit Trail
│   ├── GET /api/admin/audit
│   ├── GET /api/undo
│   └── POST /api/undo/[id] - Undo action
│
├── Data Validation
│   ├── GET /api/validation/data-integrity
│   ├── POST /api/validation/fix-duplicates
│   ├── POST /api/validation/fix-credits
│   └── POST /api/validation/generate-missing-assessments
│
└── System Cleanup
    └── POST /api/admin/cleanup

Settings/Profile (/settings)
├── User Profile
│   ├── GET /api/settings/profile
│   └── PUT /api/settings/profile
│
└── Preferences
    ├── GET /api/settings/preferences
    └── PUT /api/settings/preferences
```

---

## Data Flow Diagrams

### Real-time Data Update Cycle

```
┌─────────────────────────────────────────────────────────────┐
│                   REAL-TIME UPDATE FLOW                      │
└─────────────────────────────────────────────────────────────┘

USER ACTION (Frontend)
        ↓
    Dispatch Action
        ↓
Conditional Validation
        ↓
┌─────────────────────────┐
│  API Request            │
│  (POST/PUT/DELETE)      │
└─────────────────────────┘
        ↓
┌─────────────────────────────────────────┐
│  Backend Processing                     │
│  ├─ Validate input                      │
│  ├─ Check permissions                   │
│  ├─ Update database (Prisma)            │
│  ├─ Trigger calculations (if needed)    │
│  ├─ Create UndoHistory record           │
│  ├─ Log action                          │
│  └─ Return updated data                 │
└─────────────────────────────────────────┘
        ↓
┌─────────────────────────┐
│  Response Received      │
│  Success + Data         │
└─────────────────────────┘
        ↓
┌─────────────────────────────────────────┐
│  Frontend Updates                       │
│  ├─ Update context/state                │
│  ├─ Update SWR cache                    │
│  ├─ Trigger dependents                  │
│  ├─ Update UI                           │
│  └─ Show notification                   │
└─────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────┐
│  Cascade Invalidations                  │
│  ├─ Related API revalidations           │
│  ├─ Dashboard update triggers           │
│  ├─ Alert calculations                  │
│  └─ Progress recalculations             │
└─────────────────────────────────────────┘
```

### Assessment Submission Flow

```
Assessment Submitted
        ↓
Academic Record (Assessment table)
├─ studentId, unitStandardId
├─ score, result, method
├─ moderationStatus = PENDING
└─ attemptNumber tracking
        ↓
Formative Assessment Path:
├─ FormativeCompletion created
├─ moderationStatus = PENDING
├─ Awaits moderator review
└─ Once approved → triggers below
        ↓
Progress Calculation:
├─ Update UnitStandardProgress
│  ├─ formativesPassed++
│  ├─ status check
│  └─ summative eligibility check
├─ Update ModuleProgress
│  ├─ progress% recalculation
│  ├─ creditsEarned update
│  └─ status check (NOT_STARTED | IN_PROGRESS | COMPLETED)
└─ Update Student
   ├─ totalCreditsEarned (sum all modules)
   ├─ progress% (weighted avg)
   └─ status = AT_RISK if criteria met

        ↓
Alert Triggers:
├─ Summative not passed after N attempts → AT_RISK alert
├─ Module completion → RolloutPlan update (actualEndDate)
├─ Credits milestone → Achievement notification
└─ Group milestone → Group health update

        ↓
Dashboard Updates:
├─ Course progress tiles
├─ At-risk student count
├─ Progress trend charts
└─ Programme health metrics
```

### Attendance Marking Flow

```
Mark Attendance (Daily)
        ↓
Individual Attendance Record (Attendance table)
├─ studentId, sessionId, groupId
├─ date, status (PRESENT | ABSENT | LATE | EXCUSED)
├─ markedBy, markedAt
└─ qrCodeScan flag
        ↓
Attendance Alert Calculation:
├─ Calculate attendance rate (Present/Total)
├─ Check against AttendancePolicy thresholds
│  ├─ minimumPercentage (default 80%)
│  ├─ consecutiveAbsences (default 3)
│  ├─ warningThreshold (default 75%)
│  └─ criticalThreshold (default 60%)
└─ Create/Update AttendanceAlert if triggered
   ├─ type: LOW_ATTENDANCE | CONSECUTIVE_ABSENCES
   ├─ severity: WARNING | CRITICAL
   └─ Student status may change to AT_RISK
        ↓
Dashboard Updates:
├─ Attendance dashboard
├─ At-risk count
├─ Alerts feed
└─ Overall compliance metrics
```

### Rollout Planning Flow

```
Group Created/Updated
        ↓
Create GroupRolloutPlan (Master plan)
├─ Set module1StartDate, module1EndDate
├─ ... through module6
└─ Store as reference document (rolloutDocPath)
        ↓
Create RolloutPlan (per module tracking)
├─ For each module in curriculum:
│  ├─ groupId, moduleId, moduleNumber
│  ├─ projectedStartDate (calculated from group start + duration)
│  ├─ projectedEndDate
│  ├─ projectedSummativeDate (when summative should happen)
│  ├─ credits (from module definition)
│  └─ status = NOT_STARTED
│
└─ Index by [groupId, moduleId]
        ↓
As Module Progresses:
├─ Lessons scheduled (LessonPlan)
├─ Sessions created (Session)
├─ Attendance marked (Attendance)
├─ Formatives completed (FormativeCompletion)
├─ Summatives assessed (Assessment)
│
└─ Actual dates filled in:
   ├─ actualStartDate (first lesson)
   ├─ actualEndDate (last lesson/assessment)
   ├─ actualSummativeDate (summative date)
   └─ actualAssessmentDate (if different)
        ↓
Status Auto-Calculation:
├─ Compare projected vs actual dates
├─ Current date vs planned dates
├─ Status rules:
│  ├─ NOT_STARTED: before actualStartDate
│  ├─ IN_PROGRESS: between start and end
│  ├─ COMPLETED: actualEndDate < today
│  ├─ BEHIND: actualEndDate > projectedEndDate
│  └─ AT_RISK: projected to miss summative
│
└─ Trigger alert if AT_RISK
        ↓
Dashboard Rollout View:
├─ Shows all module statuses for each group
├─ Color-coded health indicators
├─ Days behind/ahead calculation
└─ Group-wide portfolio view
```

### Student At-Risk Detection

```
Student At-Risk Factor Detection System:

Attendance Risk:
├─ If attendance rate < minimumPercentage → Alert
├─ If consecutive absences >= threshold → Alert
├─ Update Student status if not already ACTIVE

Assessment Risk:
├─ If assessment score < passingScore × 2 (summative failures)
├─ If summative not passed after 3 attempts → Alert
├─ If assessment overdue without submission

Progress Risk:
├─ If credits earned < expected by this time → Alert
├─ If module completion rate < target
├─ If behind on formative assessments

Combined Risk Score:
├─ Count number of risk factors
├─ Alert severity: LOW | MEDIUM | HIGH | CRITICAL
└─ Update Student.status to AT_RISK if score high

Dashboard Red Flags:
├─ "At Risk Students" tile count
├─ Alerts feed showing all active risks
├─ Student detail cards show risk badge
└─ Group health score reflects at-risk count
```

---

## Dependency Chains

### Critical Dependency Path #1: Attendance → Alert → At-Risk Status

```
Attendance.create()
    ↓
Trigger: calculateAttendanceAlerts()
    ↓
Loop through StudentAttendanceMetrics
    ├─ Calculate: Present/Total rate
    ├─ Check: Against AttendancePolicy thresholds
    └─ Compare: Consecutive absences
    ↓
If Threshold Met:
├─ Create/Update AttendanceAlert
│  ├─ type, severity, message
│  └─ resolved = false
│
└─ Check Student at-risk criteria:
   ├─ If attendance < 60% (critical threshold)
   └─ Update Student.status = AT_RISK
    ↓
Cascade:
├─ Dashboard: "At Risk" count updates
├─ Student Page: Red flag appears
├─ Admin: Alert notification sent
└─ Group Health: Score recalculates
```

### Critical Dependency Path #2: Assessment → Progress → Completion

```
Assessment.create()/update()
    ↓
Academic Record Created:
├─ type: FORMATIVE | SUMMATIVE
├─ score, result: PASS | FAIL | PENDING
├─ moderationStatus: PENDING | APPROVED | REJECTED
└─ attemptNumber tracked
    ↓
Formative Path:
├─ Create FormativeCompletion
├─ moderationStatus = PENDING
└─ Await moderator approval
    ├─ ModeratedBy, ModeratedDate set
    └─ Trigger: "Formative Approved"
        ↓
    └─ Update UnitStandardProgress
       ├─ formativesPassed++
       └─ Check: Can now take summative?
    ↓
Summative Path:
├─ If result = PASS
│  ├─ Update UnitStandardProgress
│  │  └─ summativePassed = true
│  ├─ Update ModuleProgress
│  │  ├─ Check all units done?
│  │  ├─ status = COMPLETED (if all units done)
│  │  └─ creditsEarned += module.credits
│  └─ Update Student
│     ├─ totalCreditsEarned += credits
│     ├─ progress% = (totalCreditsEarned / maxCredits) * 100
│     └─ status = COMPLETED (if all modules done)
├─ If result = FAIL
│  ├─ AttendanceAlert: "Summative failed, attempt X/3"
│  ├─ After 3 attempts: status = AT_RISK
│  └─ May block progression
    ↓
Update RolloutPlan:
├─ If module COMPLETED
│  ├─ actualEndDate = today
│  ├─ status recalculates
│  └─ If ahead of schedule: positive alert
    ↓
Dashboard Cascades:
├─ Course progress tiles
├─ Programme health
├─ Credits earned
├─ At-risk status
└─ Completion timeline
```

### Critical Dependency Path #3: Rollout Plan → Module Schedule → Lessons/Sessions

```
RolloutPlan.create() / Group.assign(module)
    ↓
Set Projected Dates:
├─ projectedStartDate = groupStartDate + prevCoursesDuration
├─ projectedEndDate = projectedStartDate + moduleDuration
├─ projectedSummativeDate = projectedEndDate - bufferDays
└─ credits = module.credits
    ↓
Create Lessons (LessonPlan):
├─ Schedule lessons within rollout window
├─ Assign facilitators
├─ Each lesson may auto-create Session
└─ Update RolloutPlan.actualStartDate = firstLessonDate
    ↓
Create Sessions:
├─ From lessons or templates
├─ Assign to groups
├─ Enable attendance marking
└─ Connect to Attendance records
    ↓
Assessment Scheduling:
├─ Create FormativeAssessment schedule
├─ Create Summative Assessment with dueDate
└─ Schedule moderation timeline
    ↓
Actual Tracking:
├─ As students complete formatives → UnitStandardProgress updates
├─ As students complete summative → UnitStandardProgress.summativePassed = true
├─ All units done? → Module status = COMPLETED
├─ Update RolloutPlan.actualEndDate = lastAssessmentDate
└─ Status recalculates: NOT_STARTED | IN_PROGRESS | BEHIND | COMPLETED
    ↓
Dashboard Rollout View:
├─ Health color-coded
├─ Days ahead/behind
├─ Alert if AT_RISK
└─ Group portfolio shows progress
```

### Dependency Path #4: POE Checklist → Student Status → Completion

```
POE Checklist (POEChecklist table):
├─ module1POE, ..., module6POE (checkboxes + dates)
├─ assessmentsSigned, logbookComplete
├─ idCopyPresent, contractSigned
├─ inductionComplete, verifiedDate
└─ verifiedBy: user who verified
    ↓
Student Completion Criteria:
├─ All modules POE complete? ✓
├─ POEChecklist.module1POE = true
├─ POEChecklist.module2POE = true
├─ ... through module6POE
├─ POEChecklist.assessmentsSigned = true
├─ POEChecklist.logbookComplete = true
├─ SUM(totalCreditsEarned) >= 120 (all modules)
├─ All UnitStandardProgress.summativePassed = true
└─ Attendance rate >= 80%
    ↓
If ALL CRITERIA MET:
├─ Update Student.status = COMPLETED
├─ Create achievement notification
└─ Trigger graduation checklist
    ↓
Impact:
├─ Student removed from "Active" count
├─ Group health improves
├─ Dashboard completion metric increases
└─ Can generate completion certificate
```

---

## Cache Invalidation Map

### SWR Cache Invalidation Strategy

```
┌─────────────────────────────────────────────────────────────┐
│            SWR CACHE REVALIDATION STRATEGY                  │
└─────────────────────────────────────────────────────────────┘

When Action Occurs → Invalidate These Cache Keys:

STUDENT CREATED/UPDATED:
├─ /api/students (list may have changed)
├─ /api/students/[id] (detail changed)
├─ /api/students/[id]/progress
├─ /api/dashboard/stats (total count)
├─ /api/groups/[groupId]/members
├─ /api/groups/[groupId]/summary
├─ /api/dashboard/charts
└─ /api/dashboard/programme-health

STUDENT DELETED:
├─ All above + 
├─ /api/attendance?studentId=[id]
├─ /api/assessment?studentId=[id]
├─ /api/poe/[id]
└─ /api/progress/student/[id]

ATTENDANCE MARKED:
├─ /api/attendance (list)
├─ /api/attendance/stats
├─ /api/attendance/rates
├─ /api/attendance/history?studentId=[id]
├─ /api/students/[id]/progress (affects progress calc)
├─ /api/dashboard/stats (at-risk count may change)
├─ /api/dashboard/alerts
├─ /api/dashboard/charts
└─ /api/groups/[groupId]/health

ASSESSMENT SUBMITTED:
├─ /api/assessment (list)
├─ /api/assessment/[id] (detail)
├─ /api/assessment/stats
├─ /api/assessment/by-group?groupId=[id]
├─ /api/formatives/student/[id] (if formative)
├─ /api/students/[id]/progress (recalc)
├─ /api/progress/student/[id]
├─ /api/progress/group/[groupId]
├─ /api/dashboard/stats (credits, progress)
├─ /api/dashboard/charts
├─ /api/dashboard/programme-health
└─ /api/groups/[groupId]/health

FORMATIVE COMPLETION MODERATED:
├─ /api/formatives/student/[id]
├─ /api/formatives/moderation
├─ /api/students/[id]/progress
└─ /api/progress/student/[id]

GROUP CREATED/UPDATED:
├─ /api/groups (list)
├─ /api/groups/[id] (detail)
├─ /api/groups/[id]/summary
├─ /api/groups/[id]/health
├─ /api/groups/[id]/members
├─ /api/groups/[id]/rollout
├─ /api/rollout/group/[id]
├─ /api/dashboard/stats (group count)
├─ /api/dashboard/charts (distribution)
├─ /api/dashboard/programme-health
└─ /api/progress/group/[id]

LESSON PLAN CREATED/UPDATED:
├─ /api/lessons (list)
├─ /api/timetable
├─ /api/timetable?from=...&to=...
├─ /api/dashboard/schedule (if today)
└─ /api/groups/[groupId]/summary (schedule affected)

SESSION CREATED/UPDATED:
├─ /api/sessions (list)
├─ /api/sessions/[id]
├─ /api/dashboard/schedule
├─ /api/groups/[groupId]/summary
└─ /api/attendance (marking availability)

ROLLOUT PLAN UPDATED:
├─ /api/rollout (all)
├─ /api/rollout/status
├─ /api/rollout/group/[groupId]
├─ /api/rollout/health
├─ /api/groups/[groupId]/rollout
├─ /api/dashboard/programme-health
└─ /api/progress/group/[groupId]

POE CHECKLIST UPDATED:
├─ /api/poe (list)
├─ /api/poe/[studentId]
└─ /api/students/[id] (completion eligibility)

PLAN/REMINDER CREATED:
├─ /api/plans
├─ /api/reminders
├─ /api/dashboard/schedule
└─ /api/settings/preferences (if affects timing)

FORMATIVE ASSESSMENT CREATED:
├─ /api/formatives (list)
├─ /api/curriculum/[moduleId]/documents
├─ /api/modules/[moduleId]?includeUnitStandards=true
└─ Assessment strategy affects student workflows
```

### Manual Cache Invalidation Patterns

```typescript
// In components when action succeeds:

// Pattern 1: Invalidate specific key
mutate('/api/students');
mutate('/api/students/[id]/progress');

// Pattern 2: Invalidate multiple keys
Promise.all([
  mutate('/api/dashboard/stats'),
  mutate('/api/dashboard/alerts'),
  mutate('/api/groups/[id]/health')
]);

// Pattern 3: Invalidate with filter function
mutate(key => {
  return (
    key.includes('/api/students') ||
    key.includes('/api/dashboard')
  );
}, undefined, false); // false = don't revalidate yet
```

---

## Cross-Page Dependencies

### Page Dependency Matrix

```
                    ┌──────────────────────────────────────────────────┐
                    │      PAGES THAT DEPEND ON THIS PAGE/DATA         │
        PAGE        └──────────────────────────────────────────────────┘

DASHBOARD           ↑ Depends on: All other pages
                    ├─ /students (student count, statuses)
                    ├─ /groups (group count, health)
                    ├─ /assessments (pending count, stats)
                    ├─ /attendance (alert count, rates)
                    ├─ /progress (overall metrics)
                    ├─ /lessons (today's schedule)
                    └─ /poe (completion status)

STUDENTS LIST       ↑ Depends on:
                    ├─ GROUPS (to show group names)
                    ├─ USERS (facilitator names)
                    └─ Updates affect:
                        ├─ Dashboard (count)
                        ├─ Group detail (member list)
                        ├─ Student detail (linked pages)
                        └─ Progress (calculations)

STUDENT DETAIL      ↑ Depends on:
                    ├─ STUDENTS (base record)
                    ├─ GROUP (group assignment)
                    ├─ ASSESSMENTS (student assessments)
                    ├─ ATTENDANCE (attendance records)
                    ├─ POE (checklist status)
                    ├─ FORMATIVES (completion tracking)
                    ├─ PROGRESS (module/unit progress)
                    └─ MODULE (current module info)
                    Updates affect:
                        ├─ Dashboard (status changes)
                        ├─ Group detail (member summary)
                        ├─ Progress pages (calculations)
                        └─ Alerts (at-risk status)

GROUPS LIST         ↑ Depends on:
                    ├─ GROUP (list all)
                    ├─ COMPANY (company names)
                    └─ Updates affect:
                        ├─ Dashboard (count)
                        └─ Group detail (linked pages)

GROUP DETAIL        ↑ Depends on:
                    ├─ GROUP (base record with rollout)
                    ├─ STUDENTS (members)
                    ├─ ROLLOUT PLANS (module schedule)
                    ├─ UNIT STANDARD ROLLOUTS
                    ├─ ASSESSMENT (group assessments)
                    ├─ ATTENDANCE (group attendance)
                    ├─ PROGRESS (group progress)
                    ├─ CURRICULUM (modules/units)
                    ├─ SESSIONS (group sessions)
                    └─ SCHEDULES (group schedules)
                    Updates affect:
                        ├─ Dashboard (health metrics)
                        ├─ Progress (calculations)
                        └─ Rollout view (health)

ASSESSMENT          ↑ Depends on:
                    ├─ ASSESSMENT (assessment records)
                    ├─ STUDENT (student info)
                    ├─ UNIT STANDARD (unit info)
                    ├─ FORMATIVES (formative records)
                    ├─ FORMATIVE COMPLETION (moderation)
                    └─ Updates affect:
                        ├─ Progress (credit calc)
                        ├─ Student detail (updated records)
                        ├─ Dashboard (metrics)
                        ├─ Group detail (stats)
                        └─ At-risk alerts

ATTENDANCE          ↑ Depends on:
                    ├─ ATTENDANCE (records)
                    ├─ STUDENT (student info)
                    ├─ SESSION (session info)
                    ├─ ATTENDANCE POLICY (thresholds)
                    ├─ ATTENDANCE ALERT (warnings)
                    └─ Updates affect:
                        ├─ Student detail (attendance tab)
                        ├─ Group detail (attendance stat)
                        ├─ Dashboard (at-risk count)
                        ├─ Student status (at-risk)
                        └─ Alerts (new alerts)

CURRICULUM          ↑ Depends on:
                    ├─ MODULE (all 6 modules)
                    ├─ UNIT STANDARD (units per module)
                    ├─ ACTIVITY (activities per unit)
                    ├─ FORMATIVE (formative assessments)
                    ├─ CURRICULUM DOCUMENT (files)
                    └─ Updates affect:
                        ├─ Lesson planning
                        ├─ Assessment strategy
                        ├─ Group curriculum
                        └─ Rollout planning

LESSONS             ↑ Depends on:
                    ├─ LESSON PLAN (lesson list)
                    ├─ MODULE (lesson module)
                    ├─ USER (facilitator)
                    ├─ GROUP (lesson group)
                    ├─ SESSION (sessions from lessons)
                    └─ Updates affect:
                        ├─ Dashboard schedule
                        ├─ Timetable
                        ├─ Session availability
                        └─ Attendance marking

PROGRESS            ↑ Depends on:
                    ├─ MODULE PROGRESS (student progress per module)
                    ├─ UNIT STANDARD PROGRESS (per unit)
                    ├─ ASSESSMENT (scores and results)
                    ├─ FORMATIVE COMPLETION (formative passes)
                    ├─ STUDENT (credits, status)
                    ├─ ATTENDANCE (attendance rate for eligibility)
                    └─ Updates affect:
                        ├─ Dashboard (metrics)
                        ├─ Student detail (progress tab)
                        ├─ Group detail (aggregate)
                        ├─ Rollout status
                        └─ At-risk alerts

ROLLOUT             ↑ Depends on:
                    ├─ ROLLOUT PLAN (module schedules)
                    ├─ UNIT STANDARD ROLLOUT (unit schedules)
                    ├─ GROUP (group info)
                    ├─ MODULE (module info)
                    ├─ UNIT STANDARD (unit info)
                    ├─ LESSON PLAN (lesson dates)
                    ├─ SESSION (session dates)
                    ├─ ASSESSMENT (assessment dates)
                    └─ Updates affect:
                        ├─ Dashboard programme health
                        ├─ Group detail (rollout tab)
                        └─ At-risk alerts

POE                 ↑ Depends on:
                    ├─ POE CHECKLIST (checklist records)
                    ├─ STUDENT (student info, completion status)
                    ├─ ASSESSMENT (assessment records for signing)
                    └─ Updates affect:
                        ├─ Student detail (POE tab)
                        ├─ Student status (completed eligibility)
                        └─ Completion reports
```

### Data Propagation Timing

```
IMMEDIATE UPDATES (< 100ms):
├─ Local state update
├─ Context update
├─ Component re-render
└─ UI reflects change immediately

NEAR-IMMEDIATE (< 1s):
├─ API request completes
├─ SWR cache updates
├─ Dependent pages revalidate
├─ User sees updated data on refresh
└─ Notifications appear

DEFERRED (< 10s):
├─ Background calculations:
│  ├─ Progress recalculation
│  ├─ Alert threshold checks
│  ├─ At-risk status updates
│  └─ Health metrics aggregation
└─ Dashboard auto-refresh (15s interval)

EVENTUALLY CONSISTENT (< 1 minute):
├─ Cross-page cache invalidation
├─ Related endpoints revalidation
├─ Dashboard full refresh
└─ All dependent views updated

LONG-RUNNING (> 1 minute):
├─ Bulk operations (100+ records)
├─ Undo history cleanup (30-min window)
├─ Document indexing (async)
└─ Report generation (background task)
```

---

## Real-Time Updates Architecture

### Current Implementation

```
SWR Hook Pattern (Client-side caching + sync):
├─ Fetcher function (auto-retry on network error)
├─ Revalidation strategy:
│  ├─ On focus: revalidateOnFocus = true
│  ├─ On reconnect: revalidateOnReconnect = true
│  ├─ On interval: refreshInterval (configurable per endpoint)
│  └─ On manual trigger: mutate(key)
├─ Deduplication: dedupingInterval = 2000ms
└─ Cache persistence across page navigations

Dashboard Real-Time Refresh:
├─ Stats: refreshInterval = 15000ms (15 seconds)
├─ Recent Activity: refreshInterval = 0 (manual only)
├─ Alerts: refreshInterval = 0 (manual only)
├─ Schedule: refreshInterval = 0 (manual only)
├─ Charts: refreshInterval = 0 (manual only)
└─ Programme Health: refreshInterval = 0 (manual only)

Context-based State:
├─ AuthContext (user info, permissions)
├─ StudentContext (current student data)
├─ GroupsContext (group list)
└─ Local component state (UI state, forms)
```

### Potential Enhancements

```
WebSocket Implementation (for true real-time):
├─ Connection: ws://localhost:3000/api/socket
├─ Events:
│  ├─ attendance:marked (broadcast to group)
│  ├─ assessment:submitted (broadcast to group)
│  ├─ alert:created (broadcast to admins)
│  ├─ rollout:updated (broadcast to group)
│  └─ progress:changed (broadcast to student + facilitators)
│
├─ Benefits:
│  ├─ < 100ms latency vs 5-15s polling
│  ├─ Real-time alerts
│  ├─ Immediate feedback on bulk operations
│  └─ Attendance board live updates
│
└─ Implementation:
   ├─ Socket.io library
   ├─ Rooms by group/facilitator
   ├─ Event emitters in API handlers
   └─ Client-side listeners in pages/components

GraphQL Subscriptions (alternative):
├─ ActiveSubscription pattern
├─ Schema for real-time queries
└─ Apollo Client for caching + sync
```

---

## Data Impact Analysis

### Severity Levels When Changing Data

```
CRITICAL (Cascades to 50+ entities):
├─ Module created/modified
│  └─ Affects: All groups using this module, all students, all assessments
├─ Group created/deleted
│  └─ Affects: All students in group, all sessions, all schedules
├─ Group status changed (COMPLETED)
│  └─ Affects: All students status eligibility
└─ Student deleted
   └─ Affects: All assessments, attendance, progress, alerts

HIGH (Cascades to 20-50 entities):
├─ Assessment submitted/updated
│  ├─ Affects: Student progress, module progress, credits, status
│  └─ Triggers: Alert calculations, Rollout status updates
├─ Attendance marked/bulk updated
│  ├─ Affects: All affected students' at-risk status
│  └─ Triggers: Alert generation, status updates
├─ Formative moderation decision
│  ├─ Affects: Unit standard progress, summative eligibility
│  └─ Triggers: Progress calculations
└─ Rollout plan created/updated
   ├─ Affects: Lesson scheduling, session availability
   └─ Triggers: Dashboard refresh

MEDIUM (Cascades to 5-20 entities):
├─ Lesson plan created
│  ├─ Affects: Timetable, sessions, attendance marking
├─ POE checklist updated
│  ├─ Affects: Student completion eligibility
├─ Facilitator assigned/changed
│  ├─ Affects: Student records, lesson planning
└─ Group schedule updated
   └─ Affects: Session generation, timetable

LOW (Isolated changes):
├─ Plan/Reminder created
├─ Document uploaded
├─ User profile updated
└─ Preference changed
```

### Update Impact Summary Table

```
┌──────────────────────────────┬──────────────────┬──────────────────────────┐
│ ACTION                       │ SEVERITY         │ AFFECTED DATA            │
├──────────────────────────────┼──────────────────┼──────────────────────────┤
│ Create Student               │ HIGH             │ Group members, Dashboard │
│ Update Student Status        │ HIGH             │ Dashboard, At-risk count │
│ Delete Student               │ CRITICAL         │ All linked records       │
├──────────────────────────────┼──────────────────┼──────────────────────────┤
│ Create Assessment            │ HIGH             │ Progress, Credits, Alert │
│ Approve Assessment           │ HIGH             │ Progress unlock, Status  │
│ Delete Assessment            │ HIGH             │ Progress recalc          │
├──────────────────────────────┼──────────────────┼──────────────────────────┤
│ Mark Attendance              │ HIGH             │ Alert, Status, Progress  │
│ Bulk Mark Attendance         │ HIGH             │ Same + UndoHistory      │
│ Delete Attendance            │ MEDIUM           │ Stats recalc             │
├──────────────────────────────┼──────────────────┼──────────────────────────┤
│ Create Lesson                │ MEDIUM           │ Timetable, Sessions      │
│ Auto-generate Lesson (AI)    │ MEDIUM           │ Same + enriched content  │
│ Delete Lesson                │ MEDIUM           │ Session availability     │
├──────────────────────────────┼──────────────────┼──────────────────────────┤
│ Create Group                 │ CRITICAL         │ All rollout, schedules   │
│ Update Group Schedule        │ MEDIUM           │ Sessions, timetable      │
│ Delete Group                 │ CRITICAL         │ All students, all data   │
├──────────────────────────────┼──────────────────┼──────────────────────────┤
│ Create Rollout Plan          │ HIGH             │ Module scheduling        │
│ Update Rollout Status        │ MEDIUM           │ Alerts, dashboard        │
│ Create RolloutPlan per unit  │ MEDIUM           │ Unit scheduling          │
├──────────────────────────────┼──────────────────┼──────────────────────────┤
│ Create Module (curriculum)   │ CRITICAL         │ Groups, students, assess │
│ Update Module Code/Name      │ CRITICAL         │ All references updated   │
│ Delete Module                │ CRITICAL         │ Breaking change, cascade │
├──────────────────────────────┼──────────────────┼──────────────────────────┤
│ Approve POE Checklist        │ MEDIUM           │ Student completion elig. │
│ Update POE field             │ LOW              │ Single record            │
├──────────────────────────────┼──────────────────┼──────────────────────────┤
│ Approve Formative            │ HIGH             │ Progress, unlock summ.   │
│ Reject Formative             │ MEDIUM           │ Student blocked, alert   │
├──────────────────────────────┼──────────────────┼──────────────────────────┤
│ Create Plan/Reminder         │ LOW              │ Calendar, notifications  │
│ Update Reminder Schedule     │ LOW              │ Send timing only         │
├──────────────────────────────┼──────────────────┼──────────────────────────┤
│ Upload Document              │ LOW              │ Curriculum library       │
│ Index Document (AI)          │ LOW              │ Search index only        │
├──────────────────────────────┼──────────────────┼──────────────────────────┤
│ Change User Password         │ MEDIUM           │ Auth token invalidation  │
│ Update User Role             │ MEDIUM           │ Access permissions       │
└──────────────────────────────┴──────────────────┴──────────────────────────┘
```

### Undo/Rollback Capability

```
Actions Support 30-Minute Undo Window:

Undoable Actions:
├─ Assessment: submit, update, delete
├─ Attendance: mark, bulk mark, delete
├─ Formative Completion: submit, update
├─ Student: create, update, delete
├─ Group: create, update, delete
└─ POE Checklist: update any field

Undo History Record:
├─ userId: who made the change
├─ action: BULK_ATTENDANCE | ASSESSMENT | etc
├─ entityType: Assessment | Attendance | etc
├─ entityIds: JSON array of affected record IDs
├─ previousState: JSON of original values
├─ newState: JSON of updated values
├─ canUndo: boolean (false if past 30 min)
├─ undoneAt: datetime if already undone
├─ expiresAt: 30 minutes from creation
└─ createdAt: timestamp

Access UndoHistory via:
├─ GET /api/undo - List undo history
├─ POST /api/undo/[id] - Perform undo
└─ Auto-cleanup of expired records
```

---

## Data Consistency & Integrity

### Unique Constraints (Prevent Duplicates)

```
Student:
├─ studentId: UNIQUE
├─ email: UNIQUE (if provided)
└─ Per student can have only one record per module/unit

Assessment:
├─ studentId + unitStandardId + [no UNIQUE]
├─ But used with attemptNumber to track attempts
└─ Multiple records allowed for retakes

FormativeCompletion:
├─ [studentId, formativeId]: UNIQUE
├─ Only one completion record per student per formative
└─ But attempts tracked in attemptNumber field

ModuleProgress:
├─ [studentId, moduleId]: UNIQUE
└─ One record per student per module

UnitStandardProgress:
├─ [studentId, unitStandardId]: UNIQUE
└─ One record per student per unit

Attendance:
├─ [studentId, date, groupId]: UNIQUE
└─ One attendance record per day per group

RolloutPlan:
├─ [groupId, moduleId]: UNIQUE
└─ One schedule per module per group

UnitStandardRollout:
├─ [groupId, unitStandardId]: UNIQUE
└─ One schedule per unit per group
```

### Cascade Delete Behavior

```
When Student DELETED:
├─ CASCADE deletes:
│  ├─ Assessment (studentId)
│  ├─ Attendance (studentId)
│  ├─ FormativeCompletion (studentId)
│  ├─ ModuleProgress (studentId)
│  ├─ UnitStandardProgress (studentId)
│  ├─ CourseProgress (studentId)
│  ├─ POEChecklist (studentId)
│  └─ AttendanceAlert (studentId)
│
└─ Manual cleanup needed:
   └─ Remove from Group.students relation

When Session DELETED:
├─ CASCADE clears:
│  └─ Attendance.sessionId (nullable)
└─ Sessions exist but orphaned

When Group DELETED:
├─ CASCADE deletes:
│  ├─ Student (groupId)
│  ├─ Session (groupId)
│  ├─ RolloutPlan (groupId)
│  ├─ UnitStandardRollout (groupId)
│  ├─ GroupSchedule (groupId)
│  ├─ UnitStandardRollout (groupId)
│  ├─ GroupCourse (groupId)
│  ├─ GroupRolloutPlan (groupId)
│  ├─ FacilitatorTask (groupId)
│  ├─ Plan (groupId)
│  ├─ LessonPlan (groupId)
│  └─ Attendance (groupId)
│
└─ Set to NULL (if optional):
   ├─ Group.currentFacilitatedModuleId
   └─ Module.currentFacilitatedModuleId

When Module DELETED:
├─ CASCADE deletes:
│  ├─ UnitStandard (moduleId)
│  ├─ FormativeAssessment (moduleId via UnitStandard)
│  ├─ LessonPlan (moduleId)
│  ├─ RolloutPlan (moduleId)
│  ├─ CurriculumDocument (moduleId)
│  └─ CurriculumEmbedding (moduleId)
│
└─ CAUTION: Breaking change affecting all groups/students
```

### Transaction Atomicity

```
Critical Multi-Step Operations (Should be atomic):

Assess & Unlock:
├─ 1. Submit Formative Assessment
├─ 2. Moderate → Approve
├─ 3. Update FormativeCompletion.moderationStatus
├─ 4. Increment UnitStandardProgress.formativesPassed
├─ 5. Check if all formatives done → mark eligible for summative
└─ Either all succeed or all rollback

Calculate Progress & Update Status:
├─ 1. Count ModuleProgress.creditsEarned (sum all)
├─ 2. Update Student.totalCreditsEarned
├─ 3. Calculate Student.progress% 
├─ 4. Check eligibility criteria (attendance, assessments, POE)
├─ 5. Update Student.status (if changed)
└─ Transaction ensures consistent state

Bulk Assessment Update:
├─ 1. Validate all records
├─ 2. Save UndoHistory with previousState
├─ 3. Update all Assessment records
├─ 4. Recalculate all affected progress
├─ 5. Return results with rollback ID
└─ If any fails, return incomplete transaction indication
```

---

## Dependency Visualization

### Entity Dependency Graph

```
                        User
                      / | \ \
                     /  |  \ \
            LessonPlan  |   Session    Plan
                   |    |       |       |
                   |    |       |    Reminder
                Module  | GroupSchedule
                   |    |   |       |
         UnitStandard   | Group  ScheduleTemplate
              |  |      |    |
           Activity  |  Company
               |     |
        FormativeAssessment
             |
      FormativeCompletion (link to Student)
             |
          Student
           / | \
          /  |  \
    Assessment |     ModuleProgress
         |     |          |
    Module/Unit |      Module
            UnitStandardProgress
         |
    UnitStandard
         |
      Attendance ← Session
         |
     AttendanceAlert
         |
      AttendancePolicy
         
      POEChecklist ← Student
      
      RolloutPlan (Group + Module)
      UnitStandardRollout (Group + UnitStandard)
      GroupRolloutPlan (Group master)
      
      UndoHistory (audit of all changes)
```

---

## Summary: Data Integration Points

### Core Integration Hubs

**Hub #1: STUDENT**
```
Central entity connecting:
├─ Academic: Assessment, FormativeCompletion, ModuleProgress, UnitStandardProgress
├─ Attendance: Attendance, AttendanceAlert, AttendancePolicy
├─ Status: Student.status, Student.progress, Student.totalCreditsEarned
├─ Tracking: POEChecklist, CourseProgress
└─ Cascade impact: Dashboard, Group health, At-risk alerts
```

**Hub #2: ASSESSMENT**
```
Critical junction connecting:
├─ Student progress calculations
├─ Credit accumulation
├─ Moderation workflows
├─ Status eligibility checks
├─ Alert triggers
└─ Cascade impact: ModuleProgress, UnitStandardProgress, Student.status
```

**Hub #3: ROLLOUT PLAN**
```
Strategic scheduling hub connecting:
├─ Group delivery schedule (projected vs actual dates)
├─ Module timeline tracking
├─ Health indicator calculations
├─ At-risk detection
└─ Cascade impact: Group health, Dashboard metrics, Lessons/Sessions
```

**Hub #4: GROUP**
```
Organizational hub connecting:
├─ Student membership
├─ Curriculum assignment
├─ Schedule/Session management
├─ Rollout plans
├─ Health metrics aggregation
└─ Cascade impact: All student-related data, Dashboard, Reports
```

**Hub #5: DASHBOARD**
```
Real-time aggregation hub consuming:
├─ /api/dashboard/stats → Students, Groups, Progress
├─ /api/dashboard/charts → Assessment trends, Attendance, Distribution
├─ /api/dashboard/alerts → AttendanceAlert, At-risk Students
├─ /api/dashboard/schedule → Today's Sessions and Lessons
├─ /api/dashboard/programme-health → RolloutPlan status, Group health
└─ Updated via SWR every 15 seconds (stats) or manual trigger
```

---

## Conclusion

This audit documents a complex, multi-layered data system with:

- **20+ core entities** with precise relationships
- **100+ API endpoints** providing CRUD and aggregation
- **Multiple data flows** handling academic, attendance, and scheduling data
- **Deep cascading dependencies** where changes to core entities ripple through the system
- **Real-time cache invalidation** patterns to keep data consistent
- **Comprehensive audit trails** via UndoHistory for 30-minute rollback window
- **Severity-based impact analysis** showing what to watch when making changes

Key takeaway: **Data changes at the Student, Assessment, or Attendance level have CASCADING effects across 20+ related entities.** Always invalidate caches and verify impact before bulk operations.

