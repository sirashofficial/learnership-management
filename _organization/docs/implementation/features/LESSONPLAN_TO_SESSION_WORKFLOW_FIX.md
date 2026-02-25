# LessonPlan to Session Workflow Fix

**Date:** February 24, 2026  
**Status:** ✅ RESOLVED  
**Impact:** Critical - Unblocked attendance tracking for 810 lesson plans

---

## Problem Summary

**Symptom:** Attendance could not be marked because 0 Sessions existed in the database, despite having 810 LessonPlans.

**Root Cause:** The `/api/timetable` endpoint was creating `LessonPlan` records (not `Session` records). The UI displayed these as "sessions" in the timetable, but attendance records require actual `Session` model records with a `sessionId` foreign key.

**Impact:**
- 810 LessonPlans existed but were unusable for attendance tracking
- Facilitators could not mark attendance
- Attendance reporting was blocked

---

## Solution Implemented

### 1. Created API Endpoint for Conversion
**File:** `src/app/api/sessions/create-from-lessons/route.ts`

New endpoint that converts LessonPlans to Sessions:
- **POST** `/api/sessions/create-from-lessons` - Batch convert LessonPlans to Sessions
- **GET** `/api/sessions/create-from-lessons` - Preview what would be converted
- Supports `dryRun` mode for testing
- Prevents duplicates by checking groupId, date, startTime, endTime

### 2. Created Batch Conversion Script
**File:** `scripts/convert-lessons-to-sessions.js`

Command-line tool to convert existing LessonPlans:
```bash
# Preview what would be converted (dry run)
node scripts/convert-lessons-to-sessions.js

# Actually convert all LessonPlans to Sessions
node scripts/convert-lessons-to-sessions.js --run

# Force convert (even if duplicates exist)
node scripts/convert-lessons-to-sessions.js --force
```

**Results:**
- Converted all 810 LessonPlans to Sessions
- 100% success rate (0 errors)
- All sessions have groups and facilitators assigned

### 3. Created Verification Scripts
**Files:**
- `scripts/verify-session-creation.js` - Validates Sessions exist and are properly configured
- `scripts/test-attendance-workflow.js` - Tests end-to-end attendance marking

---

## Verification Results

### Before Fix:
```
📚 LessonPlans: 810
📅 Sessions: 0 ❌
✅ Attendance: 0 ❌
```

### After Fix:
```
📚 LessonPlans: 810 ✅
📅 Sessions: 810 ✅
✅ Attendance: 3 ✅ (test records created)
👥 Sessions with groups: 810/810 ✅
👨‍🏫 Sessions with facilitators: 810/810 ✅
```

### Test Results:
✅ 3 test attendance records created successfully  
✅ LessonPlan → Session → Attendance workflow operational  
✅ All 810 sessions ready for attendance tracking

---

## Data Flow (Fixed)

```
┌─────────────────┐
│   LessonPlan    │ ← Created by facilitators via /api/lessons or /api/timetable
│  (810 records)  │    Contains: title, date, startTime, endTime, module, group
└────────┬────────┘
         │
         │ [CONVERSION] (scripts/convert-lessons-to-sessions.js)
         ↓
┌─────────────────┐
│     Session     │ ← Required for attendance tracking
│  (810 records)  │    Contains: title, date, startTime, endTime, module, group
└────────┬────────┘
         │
         │ [MARK ATTENDANCE] (UI or API)
         ↓
┌─────────────────┐
│   Attendance    │ ← Links to sessionId
│   (3+ records)  │    Contains: sessionId, studentId, status, date
└─────────────────┘
```

---

## Schema Relationships

```prisma
model LessonPlan {
  id            String   @id @default(uuid())
  title         String
  date          DateTime
  startTime     String
  endTime       String
  moduleId      String
  facilitatorId String
  groupId       String?
  module        Module   @relation(...)
  facilitator   User     @relation(...)
  group         Group?   @relation(...)
}

model Session {
  id            String       @id @default(uuid())
  title         String
  module        String       // Note: String, not relation
  date          DateTime
  startTime     String
  endTime       String
  groupId       String
  facilitatorId String
  group         Group        @relation(...)
  facilitator   User         @relation(...)
  attendance    Attendance[] // ← Enables attendance tracking
}

model Attendance {
  id        String   @id @default(uuid())
  sessionId String?  // ← Must link to Session
  studentId String
  date      DateTime
  status    String
  session   Session? @relation(...)
  student   Student  @relation(...)
}
```

---

## Usage Guide

### For Developers

**To convert existing LessonPlans to Sessions:**
```bash
# 1. Preview what will be converted
node scripts/verify-session-creation.js

# 2. Convert (dry run first)
node scripts/convert-lessons-to-sessions.js

# 3. Actually convert
node scripts/convert-lessons-to-sessions.js --run

# 4. Verify success
node scripts/verify-session-creation.js
```

**To test attendance workflow:**
```bash
node scripts/test-attendance-workflow.js
```

**Via API:**
```bash
# Preview conversion
GET /api/sessions/create-from-lessons

# Convert (dry run)
POST /api/sessions/create-from-lessons
{
  "dryRun": true
}

# Actually convert
POST /api/sessions/create-from-lessons
{
  "dryRun": false
}

# Convert specific LessonPlans
POST /api/sessions/create-from-lessons
{
  "lessonPlanIds": ["id1", "id2", "id3"],
  "dryRun": false
}
```

### For Facilitators

**The UI should now allow:**
1. View sessions in timetable (existing functionality)
2. Click a session
3. Click "Mark Attendance" button
4. Mark students as PRESENT/ABSENT/LATE/EXCUSED
5. Attendance saves against the Session record

---

## Going Forward

### Creating New Sessions

**Option A: Keep current workflow (recommended for now)**
- Facilitators create "sessions" via `/api/timetable` (creates LessonPlan)
- Run conversion script periodically: `node scripts/convert-lessons-to-sessions.js --run`

**Option B: Auto-create Sessions (future enhancement)**
- Modify `/api/timetable` POST to create BOTH LessonPlan AND Session
- Or create a trigger/hook that auto-creates Session when LessonPlan is created

**Option C: Unified model (major refactor)**
- Merge LessonPlan and Session models into one entity
- Update all references throughout codebase
- Requires migration of existing data

### Recommended: Option A + Scheduled Task
Set up a cron job or scheduled task to run conversion script daily:
```bash
# Every day at 2 AM
0 2 * * * cd /app && node scripts/convert-lessons-to-sessions.js --run
```

---

## Files Modified/Created

### New Files:
- ✅ `src/app/api/sessions/create-from-lessons/route.ts` - API endpoint for converting LessonPlans to Sessions
- ✅ `src/app/api/sessions/route.ts` - General Session API (GET/POST/DELETE)
- ✅ `scripts/convert-lessons-to-sessions.js` - Batch conversion script
- ✅ `scripts/verify-session-creation.js` - Verification script
- ✅ `scripts/test-attendance-workflow.js` - Workflow test script
- ✅ `scripts/test-session-api.js` - API endpoint test script
- ✅ `LESSONPLAN_TO_SESSION_WORKFLOW_FIX.md` - This documentation

### No Files Modified:
- All existing code remains unchanged
- No breaking changes
- Backward compatible

### New API Endpoints Created:

#### `/api/sessions` (GET)
Fetch sessions with filtering:
- `?groupId=xxx` - Filter by group
- `?date=2026-02-24` - Filter by specific date
- `?from=2026-02-01&to=2026-02-28` - Date range
- `?facilitatorId=xxx` - Filter by facilitator

Returns sessions with attendance statistics.

#### `/api/sessions` (POST)
Create a new session:
```json
{
  "title": "Training Session",
  "module": "Module 1",
  "date": "2026-02-24",
  "startTime": "09:00",
  "endTime": "16:00",
  "groupId": "xxx",
  "facilitatorId": "xxx",
  "notes": "Optional notes"
}
```

#### `/api/sessions` (DELETE)
Delete multiple sessions:
```json
{
  "ids": ["session-id-1", "session-id-2"]
}
```

#### `/api/sessions/create-from-lessons` (GET)
Preview LessonPlan to Session conversion (dry run).

#### `/api/sessions/create-from-lessons` (POST)
Convert LessonPlans to Sessions:
```json
{
  "lessonPlanIds": ["id1", "id2"],  // optional - omit to convert all
  "dryRun": false
}
```

---

## Testing Checklist

- [x] 810 Sessions created from 810 LessonPlans
- [x] All Sessions have groupId assigned
- [x] All Sessions have facilitatorId assigned
- [x] Attendance can be marked against Sessions
- [x] Test attendance records created successfully
- [x] No duplicate Sessions created
- [x] Script is idempotent (can run multiple times safely)
- [x] Dry run mode works correctly
- [x] API endpoints work correctly

---

## Success Metrics

| Metric | Before | After | Status |
|--------|--------|-------|--------|
| LessonPlans | 810 | 810 | ✅ Preserved |
| Sessions | 0 | 810 | ✅ Created |
| Sessions with groups | 0 | 810 | ✅ Complete |
| Sessions with facilitators | 0 | 810 | ✅ Complete |
| Attendance records | 0 | 3+ | ✅ Working |
| Attendance workflow | ❌ Blocked | ✅ Operational | ✅ Fixed |

---

## Next Steps (Optional Enhancements)

1. **Auto-conversion:** Add automatic Session creation when LessonPlan is created
2. **Bidirectional sync:** Keep LessonPlan and Session in sync when either is updated
3. **UI indicator:** Show which LessonPlans have corresponding Sessions
4. **Bulk operations:** Add UI for bulk session creation/management
5. **Scheduled task:** Set up cron job for periodic conversion
6. **Link models:** Add optional `sessionId` field to LessonPlan for tracking relationship

---

## Support

**Scripts:** All in `scripts/` directory  
**API:** `src/app/api/sessions/create-from-lessons/`  
**Documentation:** This file  

**Quick commands:**
```bash
# Check current state
node scripts/verify-session-creation.js

# Convert new LessonPlans
node scripts/convert-lessons-to-sessions.js --run

# Test attendance
node scripts/test-attendance-workflow.js
```

---

**Fix completed:** February 24, 2026  
**Attendance tracking:** ✅ OPERATIONAL  
**Sessions available:** 810  
**Ready for production:** ✅ YES
