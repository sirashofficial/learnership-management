# Data Dependencies Quick Reference Guide

**Last Updated:** February 2026  
**System:** Learnership Management System (YEHA)  
**Scope:** Complete data dependency mapping

---

## 🎯 One-Page Summary

### Core Entities (20 major tables)

**Key Foundation:**
- `User` (Facilitators/Admins)
- `Company` (Organizations)
- `Group` (Training cohorts)
- `Module` (6-module curriculum)

**Learning Path:**
- `Student` → `ModuleProgress` → `UnitStandardProgress` → `Assessment` → Credits
- `FormativeAssessment` → `FormativeCompletion` (moderated) → Unlock Summative
- `Assessment` (Summative) → Credit earned → `RolloutPlan` updated

**Compliance & Tracking:**
- `Attendance` → `AttendanceAlert` → `Student.status = AT_RISK`
- `POEChecklist` → Completion eligibility
- `RolloutPlan` + `UnitStandardRollout` → Project vs actual tracking

**Scheduling:**
- `LessonPlan` → `Session` → `Attendance` marking
- `GroupSchedule` + `ScheduleTemplate` → Generate sessions

**Audit & Undo:**
- `UndoHistory` (30-min rollback window)
- `FacilitatorTask` (to-dos)

---

## 🔴 Critical Cascades (High Impact Changes)

| Change | Cascades To | Severity | Cache Keys |
|--------|-----------|----------|-----------|
| **Delete Student** | All assessments, attendance, progress | CRITICAL | 20+ |
| **Delete Group** | All students, sessions, rollouts | CRITICAL | 25+ |
| **Modify Module** | All groups using this module, all students | CRITICAL | 20+ |
| **Submit Assessment** | Progress calc, credits, status, alerts | HIGH | 15+ |
| **Bulk Mark Attendance** | Alerts, at-risk status, group health | HIGH | 12+ |
| **Create Group** | Initialize 6 RolloutPlans, 24+ UnitStdRollouts | HIGH | 15+ |
| **Approve Formative** | UnitStdProgress, unlock summative | HIGH | 10+ |
| **Update POE** | Student completion eligibility | MEDIUM | 5+ |

---

## 📊 Data Dependency Levels

```
Level 0: User, Company, Module, AttendancePolicy
  ↓
Level 1: Group, UnitStandard, ScheduleTemplate
  ↓
Level 2: Student, FormativeAssessment, RolloutPlan, LessonPlan
  ↓
Level 3: Session, Assessment, Progress records, Attendance
  ↓
Level 4: POEChecklist, AttendanceAlert, UndoHistory
```

---

## 🗺️ Page to Data Mapping

| Page | GET Endpoints | Database Tables | Write Actions |
|------|---------------|-----------------|---------------|
| **Dashboard** | `/api/dashboard/*` | Student, Assessment, Attendance, Group | None (read-only) |
| **Students** | `/api/students*` | Student, Group, ModuleProgress | POST, PUT, DELETE |
| **Student Detail** | `/api/students/[id]*`, `/api/progress/student/[id]` | Student + 8 related tables | Limited updates |
| **Assessments** | `/api/assessment*` | Assessment, Student, UnitStandard | POST, PUT (bulk) |
| **Attendance** | `/api/attendance*` | Attendance, Student, Session | POST (bulk mark) |
| **Groups** | `/api/groups*` | Group, Student, RolloutPlan | POST, PUT |
| **Group Detail** | `/api/groups/[id]*` | Group + 12 related tables | Limited |
| **Curriculum** | `/api/curriculum`, `/api/modules` | Module, UnitStandard, FormativeAssessment | None |
| **Lessons** | `/api/lessons`, `/api/timetable` | LessonPlan, Session | POST, PUT, DELETE |
| **Rollout** | `/api/rollout*` | RolloutPlan, UnitStandardRollout | POST, PUT |
| **Progress** | `/api/progress*` | ModuleProgress, UnitStandardProgress, Student | POST (recalc) |
| **POE** | `/api/poe*` | POEChecklist | PUT |

---

## 🔗 Critical Query Flows

### Flow 1: Assessment → Progress Update
```
Assessment.create() 
  → Formative? Create FormativeCompletion (PENDING)
  → Moderator approves → Update UnitStandardProgress.formativesPassed++
  → All formatives done? → Eligible for summative
  → Summative approved? → UnitStandardProgress.summativePassed = true
  → All units done? → ModuleProgress.status = COMPLETED
  → All modules done? → Student.status = COMPLETED
```

### Flow 2: Attendance → Alert System
```
Attendance.create() (bulk)
  → Calculate attendance rate per student
  → Compare vs AttendancePolicy thresholds
  → Below threshold? → Create AttendanceAlert
  → Critical threshold? → Update Student.status = AT_RISK
  → Notify: Facilitator, Dashboard
```

### Flow 3: Group Creation → Initialization
```
Group.create()
  → Create GroupRolloutPlan (1 master plan)
  → Create RolloutPlan (1 per module × 6)
  → Create UnitStandardRollout (1 per unit × ~24)
  → Assign Module to group
  → Create GroupCourse (curriculum mapping)
  → Ready for student enrollment
```

### Flow 4: Formative Completion → Unlock Summative
```
FormativeAssessment → Student takes formative
  → Submit FormativeCompletion (score, status=PENDING)
  → Moderator reviews → Mark APPROVED/REJECTED
  → If APPROVED → UnitStandardProgress.formativesPassed++
  → Check: All formatives for unit done?
    → YES: UnitStandardProgress eligible for summative
    → NO: Need more formatives
  → Unlock Assessment (summative) for student
```

---

## 🟢 Cache Invalidation Quick Reference

**After each action, invalidate these SWR cache keys:**

**POST/PUT/DELETE Assessment:**
```
/api/assessment (list)
/api/assessment/[id]
/api/assessment/stats
/api/progress/*
/api/students/[id]
/api/dashboard/*
/api/groups/[id]/*
```

**POST/PUT/DELETE Attendance (bulk):**
```
/api/attendance/*
/api/attendance/stats
/api/attendance/alerts
/api/students/[id]/progress
/api/dashboard/stats
/api/dashboard/alerts
/api/groups/[id]/health
```

**PUT Student (status change):**
```
/api/students
/api/students/[id]
/api/groups/[id]/members
/api/dashboard/stats
/api/progress/*
```

**POST/PUT Formative Completion (approval):**
```
/api/formatives/*
/api/formatives/student/[id]
/api/assessment*
/api/progress/student/[id]
```

---

## 📋 Unique Constraints (Prevent Duplicates)

```sql
Student.studentId UNIQUE
Assessment (studentId, unitStandardId) + attemptNumber tracked
FormativeCompletion [studentId, formativeId] UNIQUE
ModuleProgress [studentId, moduleId] UNIQUE
UnitStandardProgress [studentId, unitStandardId] UNIQUE
Attendance [studentId, date, groupId] UNIQUE
RolloutPlan [groupId, moduleId] UNIQUE
UnitStandardRollout [groupId, unitStandardId] UNIQUE
```

---

## 🗑️ Cascade Delete Behavior

| Delete Operation | Cascades To | Caution |
|-----------------|-------------|---------|
| Student | Assessment, Attendance, Progress, FormativeCompletion, POEChecklist, AttendanceAlert | Permanent, no recovery |
| Group | ALL students in group, sessions, rollouts, schedules | CRITICAL - affects entire cohort |
| Module | UnitStandard, FormativeAssessment, RolloutPlan | Breaking change for all groups |
| Session | Attendance (sessionId set to NULL, not deleted) | Attendance records orphaned |
| Assessment | None (standalone records) | Safe to delete |

---

## ⚠️ Bulk Operation Checklist

Before doing bulk updates:
- [ ] Validate all records exist
- [ ] Save `UndoHistory` record
- [ ] Check permissions
- [ ] Count affected records
- [ ] Test on staging database
- [ ] Plan cache invalidation
- [ ] Prepare rollback strategy
- [ ] Document what's being changed
- [ ] Notify affected users
- [ ] Monitor for errors during execution

**Undo Window:** 30 minutes (via `/api/undo/[id]`)

---

## 📈 Real-Time Refresh Rates

| Endpoint | Refresh Interval | Manual Override |
|----------|-----------------|-----------------|
| `/api/dashboard/stats` | 15 seconds | Yes (mutate) |
| `/api/dashboard/charts` | Manual only | Yes |
| `/api/dashboard/alerts` | Manual only | Yes |
| `/api/dashboard/schedule` | Manual only | Yes |
| All other endpoints | Manual only | Yes |

Browser focus refocus: Auto-revalidate all endpoints  
Network reconnect: Auto-revalidate all endpoints

---

## 🚨 Top 5 Things That Break Data Consistency

1. **Modifying Module records** → Affects all groups using this module
2. **Deleting Group without archiving** → Orphans all students and their data
3. **Skipping cache invalidation** → Stale data shown to users
4. **Not creating UndoHistory for bulk ops** → Can't rollback
5. **Updating assessment score without moderation** → Breaks workflow

---

## 📞 API Response Patterns

**Success Response:**
```json
{
  "success": true,
  "data": {...} or [...]
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

**Standard URL Parameters:**
```
?groupId=xxx         Filter by group
?studentId=xxx       Filter by student
?status=ACTIVE       Filter by status
?from=2024-01-01     Date range start
&to=2024-12-31       Date range end
?includeRelations=true   Include related data
?page=1&pageSize=20  Pagination
```

---

## 🔍 Data Integrity Validation

Run these checks regularly:

```bash
GET /api/validation/data-integrity
# Returns: Missing assessments, duplicate records, orphaned data

POST /api/validation/fix-duplicates
# Removes: Duplicate progress records

POST /api/validation/fix-credits
# Recalculates: Student.totalCreditsEarned

POST /api/validation/generate-missing-assessments
# Creates: Missing assessment records for new students
```

---

## 📝 Audit Trail

**UndoHistory captures:**
- Who made the change (userId)
- What action (BULK_ATTENDANCE, ASSESSMENT, etc.)
- Which records affected (entityIds array)
- Previous values (previousState JSON)
- New values (newState JSON)
- When it expires (30 minutes)
- Whether it's been undone

Access: `GET /api/undo`  
Undo: `POST /api/undo/[id]`

---

## 💡 Performance Optimization Tips

**Heavy Queries (May be slow):**
- `/api/dashboard/stats` - Aggregates multiple tables
- `/api/assessment?groupId=X` - Joins multiple tables
- `/api/progress/group/[id]` - Aggregates all students' progress
- `/api/attendance/rates` - Calculates rates for many students

**Optimization:**
- Use SWR cache (15s for dashboard/stats)
- Add pagination for large result sets
- Filter by date range when possible
- Use database indexes on common filters

**Indexes present on:**
- Student: studentId, groupId, status
- Assessment: [unitStandardId], [studentId, unitStandardId]
- Attendance: date, [studentId, date], [groupId, date]
- RolloutPlan: [groupId]
- UndoHistory: userId, expiresAt, canUndo

---

## 🎓 Key Learning Paths

### Student → Credits → Completion

```
Student enrolled in Group
  → Assigned 6 Modules
  → Each Module has ~4 Unit Standards
  → Per Unit Standard:
    1. Complete Formative Assessments (multiple)
    2. All formatives passed? Eligible for summative
    3. Pass Summative assessment → Credit earned
    4. All units in module passed? Module complete
  → All 6 modules complete + 120 credits + POE = Graduated
```

### Rollout Tracking

```
Projected Schedule (Planned):
- Module 1: Jan 15 - Feb 15 (projected dates)
- Summative: Feb 10 (projected)

Actual Execution (Real):
- First lesson: Jan 16 (actualStartDate set)
- Formatives: Jan 20-30
- Summative: Feb 12 (actualSummativeDate set)
- Last assessment moderated: Feb 13 (actualEndDate set)

Status Calculation:
- Projected vs actual comparison
- If actualEndDate > projectedEndDate → Status = BEHIND
- If actualEndDate < projectedEndDate → Status = AHEAD
- If summative not passed → Status = AT_RISK
```

---

## 🔐 Permission & Access Patterns

| Role | Can Create | Can Update | Can Delete | Can See |
|------|-----------|-----------|-----------|---------|
| **FACILITATOR** | LessonPlan, Session, Attendance, Assessment | Own LessonPlans, Attendance marks | Own LessonPlans | Own groups & students |
| **ADMIN** | All entities | All entities | All (carefully!) | All |
| **VIEWER** | None | None | None | All (read-only) |

---

## 🏥 Database Health Check

**To verify data consistency:**

```bash
# 1. Check for missing records
GET /api/validation/data-integrity

# 2. Fix any issues found
POST /api/validation/fix-duplicates
POST /api/validation/fix-credits

# 3. Verify UI reflects updates
# Navigate pages, refresh dashboard
```

---

## 📚 Related Documentation

- [COMPLETE_DATA_DEPENDENCIES_AUDIT.md](COMPLETE_DATA_DEPENDENCIES_AUDIT.md) - Full audit with detailed analysis
- [DATA_DEPENDENCIES_SITE_MAP.md](DATA_DEPENDENCIES_SITE_MAP.md) - Visual maps and diagrams
- [docs/LEARNERSHIP_SYSTEM_ARCHITECTURE.md](docs/LEARNERSHIP_SYSTEM_ARCHITECTURE.md) - System architecture overview
- [docs/API_ENDPOINTS_DOCUMENTATION.md](docs/API_ENDPOINTS_DOCUMENTATION.md) - Complete API reference

---

## 🚀 Quick Start: Making a Change

**Steps 1-2:** Understand impact
```
1. What data am I changing? (Student? Assessment? Group?)
2. What tables cascade from this change?
3. What pages will be affected?
4. How many users will see stale data if cache not invalidated?
```

**Steps 3-4:** Implement safely
```
3. Make the database change
4. Save UndoHistory (if bulk operation)
```

**Steps 5-6:** Keep in sync
```
5. Invalidate all related SWR cache keys
6. Trigger revalidation (automatic or manual)
```

**Steps 7-8:** Verify
```
7. Check that dependent pages show fresh data
8. Run /api/validation/data-integrity to verify consistency
```

---

**Version:** 1.0  
**Last Audit:** February 2026  
**Maintained By:** Development Team  
**Next Review:** Quarterly

