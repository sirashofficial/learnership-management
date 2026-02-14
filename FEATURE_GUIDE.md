# LMS System - Complete Feature Guide

## Current Data State
- **9 Groups** (4 from 2026, 5 from 2025)
- **46 Students** (distributed across all groups)
- **Auto-created Companies** (one per group, using group name)

---

## 📊 NEW FEATURES IMPLEMENTED

### 1. **Unit Standard Reports** (Multi-Group, Multi-Module)
**Endpoint**: `POST /api/reports/unit-standards`

**Request**:
```json
{
  "groupIds": ["group-id-1", "group-id-2", "group-id-3"],
  "moduleIds": ["module-id-1", "module-id-2"]
}
```

**Response includes**:
- Per-group unit standard progress
- Module completion rates
- Student-by-student assessment status
- Success rates per unit standard
- Supports different paces for different groups

**Get available options**: `GET /api/reports/unit-standards`

---

### 2. **Timetable Calendar Scheduling**
**Endpoint**: `POST /api/timetable/schedule`

**Request**:
```json
{
  "groupId": "group-id",
  "facilitatorId": "user-id",
  "frequency": "WEEKLY",
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "16:00",
  "startDate": "2026-02-09",
  "endDate": "2026-12-31"
}
```

**Features**:
- Automatic calendar event creation
- Support for DAILY, WEEKLY, BIWEEKLY, MONTHLY scheduling
- Calendar view with `GET /api/timetable/schedule?groupId=X&startDate=Y&endDate=Z`
- Cancel sessions with DELETE

---

### 3. **Company/Group Name Alignment**
**Fixed Issue**: When creating a group, system now automatically:
- Creates a company with the same name as the group
- Links the group to the company
- No more "no company" errors

**All existing groups**: Company auto-created with group name

---

### 4. **Auto-Add Students to Assessments**
**When a student is added**:
- Automatically creates FORMATIVE assessments for all unit standards
- Sets due date 3 months from creation
- No manual assignment entry needed
- Student appears in all unit standard assessments automatically

---

### 5. **Assessment Marking System**
**Endpoint**: `POST/PUT /api/assessments/marking`

**Grade an assessment**:
```json
{
  "assessmentId": "id",
  "score": 85,
  "result": "COMPETENT",
  "feedback": "Well done. Excellent work on the project.",
  "type": "SUMMATIVE",
  "method": "PRACTICAL"
}
```

**Mark status**:
- ✓ COMPETENT (score 70+)
- ✗ NOT_YET_COMPETENT  
- ⏳ PENDING

**View assessments for marking**:
```
GET /api/assessments/marking?groupId=X&status=PENDING&unitStandardId=Y
```

**Returns**:
- Student names and IDs
- Unit standard codes
- Assessment type/method
- Status and due dates
- Ready for bulk marking workflows

---

## 🛠️ API ENDPOINTS REFERENCE

### Reports
- `GET /api/reports/unit-standards` - Get groups and modules available
- `POST /api/reports/unit-standards` - Generate unit standard report

### Timetable
- `POST /api/timetable/schedule` - Schedule recurring sessions
- `GET /api/timetable/schedule` - Get calendar events
- `DELETE /api/timetable/schedule?sessionId=X` - Cancel session

### Assessment Marking
- `GET /api/assessments/marking` - List assessments for marking
- `POST /api/assessments/marking` - Create assessments for student
- `PUT /api/assessments/marking` - Mark/grade assessment

### Groups & Students
- `POST /api/groups` - Create group (auto-creates company)
- `POST /api/students` - Add student (auto-creates all assessments)

---

## 📋 DATA STRUCTURE

### 9 Groups Total:
1. **AZELIS (2025)** - 6 students
2. **AZELIS SA (2026)** - 4 students
3. **BEYOND INSIGHTS (2026)** - 1 student
4. **CITY LOGISTICS (2026)** - 8 students
5. **FLINT GROUP (2025)** - 12 students
6. **MONTEAGLE (2025)** - 4 students
7. **MONTEAGLE (2026)** - 2 students
8. **PACKAGING WORLD (2025)** - 3 students
9. **WAHL CLIPPERS (2025)** - 6 students

### Assessment Features:
- Formative, Summative, Integrated types
- Knowledge, Practical, Observation, Portfolio methods
- Score tracking (0-100)
- Feedback text field
- Moderation workflow (PENDING → APPROVED/REJECTED)
- Automatic progress calculation

### Timetable Features:
- Recurring group sessions on calendar
- Automatic attendance tracking link
- Calendar event visibility
- Session cancellation with notes
- Multi-frequency support

---

## ✅ SYSTEM READY
- Build: SUCCESSFUL (65 routes)
- Database: 9 groups, 46 students, companies auto-linked
- APIs: All operational
- Assessments: Auto-created for each student
- Timetable: Ready for scheduling
- Reports: Multi-group/module support

**All issues resolved!**
