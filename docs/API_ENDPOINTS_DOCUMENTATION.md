# Complete API Endpoints Documentation

## Table of Contents
1. [Authentication](#authentication)
2. [Students](#students)
3. [Groups](#groups)
4. [Attendance](#attendance)
5. [Assessments](#assessments)
6. [Timetable/Lessons](#timetablelessons)
7. [Dashboard](#dashboard)
8. [Reports](#reports)
9. [AI Features](#ai-features)
10. [Plans/Calendar](#planscalendar)
11. [Modules](#modules)
12. [Unit Standards](#unit-standards)
13. [Formatives](#formatives)
14. [POE](#poe)
15. [Settings](#settings)
16. [Users](#users)
17. [Reminders](#reminders)
18. [Search](#search)
19. [Admin](#admin)

---

## Authentication

### POST /api/auth/login
- **Purpose**: User authentication and login
- **Auth Required**: No
- **Rate Limit**: 5 requests per minute
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "id": "string",
        "name": "string",
        "email": "string",
        "role": "ADMIN | FACILITATOR | MODERATOR"
      },
      "token": "JWT token"
    }
  }
  ```
- **Database Tables**: `User`
- **Notes**: Sets HTTP-only cookie `auth_token` with 7-day expiry

### POST /api/auth/register
- **Purpose**: Create new user account
- **Auth Required**: No
- **Rate Limit**: 3 requests per hour
- **Request Body**:
  ```json
  {
    "email": "string",
    "name": "string",
    "password": "string",
    "role": "FACILITATOR | ADMIN | MODERATOR"
  }
  ```
- **Response**: User object + JWT token
- **Database Tables**: `User`

### POST /api/auth/logout
- **Purpose**: Logout (client-side token removal)
- **Auth Required**: No
- **Request Body**: None
- **Response**: Success message
- **Database Tables**: None

### GET /api/auth/me
- **Purpose**: Get current authenticated user profile
- **Auth Required**: Yes
- **Request Params**: None
- **Response**: User object with id, email, name, role, timestamps
- **Database Tables**: `User`

---

## Students

### GET /api/students
- **Purpose**: List all students with optional filters and CSV export
- **Auth Required**: No
- **Query Params**:
  - `groupId`: Filter by group
  - `status`: Filter by status (ACTIVE, INACTIVE, GRADUATED, WITHDRAWN)
  - `format`: Export format (csv or json)
- **Response**: Array of students with group, facilitator details
- **Database Tables**: `Student`, `Group`, `User` (facilitator)

### POST /api/students
- **Purpose**: Create new student
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "firstName": "string",
    "lastName": "string",
    "idNumber": "string",
    "email": "string (optional)",
    "phone": "string (optional)",
    "groupId": "string",
    "facilitatorId": "string (optional)",
    "studentId": "string (optional - auto-generated)",
    "status": "ACTIVE | INACTIVE",
    "progress": "number (0-100)"
  }
  ```
- **Response**: Created student object
- **Database Tables**: `Student`, `Group`, `User`
- **Notes**: Auto-generates studentId from group name prefix if not provided

### GET /api/students/[id]
- **Purpose**: Get single student details
- **Auth Required**: No
- **Response**: Student with group, facilitator, recent attendance (10), assessments
- **Database Tables**: `Student`, `Group`, `User`, `Attendance`, `Assessment`

### PUT /api/students/[id]
- **Purpose**: Update student details
- **Auth Required**: Yes
- **Request Body**: Partial student fields to update
- **Response**: Updated student object
- **Database Tables**: `Student`

### DELETE /api/students/[id]
- **Purpose**: Delete student
- **Auth Required**: No (should be Yes)
- **Response**: Success message
- **Database Tables**: `Student`

### GET /api/students/[id]/progress
- **Purpose**: Get detailed module and unit standard progress for student
- **Auth Required**: No
- **Response**:
  ```json
  {
    "student": {
      "id": "string",
      "name": "string",
      "totalCreditsEarned": "number",
      "totalCreditsRequired": 138,
      "overallProgress": "number (0-100)",
      "currentModule": "object"
    },
    "moduleProgress": ["array of module progress objects"],
    "unitStandardProgress": ["array of unit standard progress"]
  }
  ```
- **Database Tables**: `Student`, `ModuleProgress`, `UnitStandardProgress`, `Module`, `UnitStandard`

---

## Groups

### GET /api/groups
- **Purpose**: List all groups with progress calculations
- **Auth Required**: No
- **Query Params**:
  - `status`: Filter by status
- **Response**: Array of groups with:
  - Students list
  - Session count
  - Rollout plan
  - Actual progress (avgCreditsPerStudent, avgProgressPercent)
- **Database Tables**: `Group`, `Student`, `Session`, `GroupRolloutPlan`, `Assessment`, `UnitStandard`
- **Notes**: Calculates actual progress from COMPETENT assessments

### POST /api/groups
- **Purpose**: Create new group
- **Auth Required**: No (should be Yes)
- **Request Body**:
  ```json
  {
    "name": "string",
    "location": "string",
    "coordinator": "string",
    "startDate": "date",
    "endDate": "date",
    "status": "ACTIVE | INACTIVE | COMPLETED"
  }
  ```
- **Response**: Created group object
- **Database Tables**: `Group`

### GET /api/groups/[id]
- **Purpose**: Get single group details
- **Auth Required**: No
- **Response**: Group with students, sessions (10 recent), rollout plan, unit standard rollouts, lesson plans
- **Database Tables**: `Group`, `Student`, `Session`, `GroupRolloutPlan`, `UnitStandardRollout`, `LessonPlan`

### PUT /api/groups/[id]
- **Purpose**: Update group details
- **Auth Required**: No (should be Yes)
- **Request Body**: Partial group fields
- **Response**: Updated group
- **Database Tables**: `Group`

### DELETE /api/groups/[id]
- **Purpose**: Delete group
- **Auth Required**: No (should be Yes)
- **Response**: Deleted group id and student count
- **Database Tables**: `Group`, cascades to related records

### POST /api/groups/upload
- **Purpose**: Upload and parse rollout plan document (PDF/DOCX)
- **Auth Required**: No (should be Yes)
- **Request Body**: File upload with group info
- **Response**: Parsed rollout plan with unit standards and dates
- **Database Tables**: `Group`, `GroupRolloutPlan`, `UnitStandardRollout`
- **Notes**: Extracts unit standard dates and workplace activity dates from documents

### GET /api/groups/progress
- **Purpose**: Get actual assessment progress for groups
- **Auth Required**: Yes
- **Query Params**:
  - `groupId`: Single group (optional)
- **Response**: Array of group progress data with actual credits earned
- **Database Tables**: `Group`, `Student`, `Assessment`, `UnitStandard`

### POST /api/groups/auto-rollout
- **Purpose**: Auto-generate 12-month rollout plans for groups
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "groupIds": ["array of group IDs (optional)"],
    "overwrite": "boolean"
  }
  ```
- **Response**: Processing results for each group
- **Database Tables**: `Group`, `GroupRolloutPlan`

### GET /api/groups/auto-rollout
- **Purpose**: Check which groups are missing rollout plans
- **Auth Required**: Yes
- **Response**: Statistics and list of groups without plans
- **Database Tables**: `Group`, `GroupRolloutPlan`

### POST /api/groups/[id]/rollout
- **Purpose**: Create or update rollout plan for specific group
- **Auth Required**: No (should be Yes)
- **Request Body**:
  ```json
  {
    "rolloutPlan": {
      "module1StartDate": "date",
      "module1EndDate": "date",
      ...
      "module6StartDate": "date",
      "module6EndDate": "date"
    }
  }
  ```
- **Response**: Created/updated rollout plan
- **Database Tables**: `GroupRolloutPlan`

### GET /api/groups/[id]/assessment-status
- **Purpose**: Get assessment status for group
- **Auth Required**: No
- **Database Tables**: `Group`, `Assessment`

### POST /api/groups/[id]/lessons/generate
- **Purpose**: Generate lessons for group
- **Auth Required**: No
- **Database Tables**: `Group`, `LessonPlan`

### POST /api/groups/merge
- **Purpose**: Merge multiple groups
- **Auth Required**: No
- **Database Tables**: `Group`, `Student`

### POST /api/groups/auto-calculate
- **Purpose**: Auto-calculate group progress
- **Auth Required**: No
- **Database Tables**: `Group`, `Assessment`

---

## Attendance

### GET /api/attendance
- **Purpose**: Query attendance records with filters
- **Auth Required**: No
- **Query Params**:
  - `sessionId`: Filter by session
  - `studentId`: Filter by student
  - `groupId`: Filter by group
  - `date`: Filter by date
  - `status`: Filter by status (PRESENT, ABSENT, LATE, EXCUSED)
- **Response**: Array of attendance records with student and session details
- **Database Tables**: `Attendance`, `Student`, `Session`, `Group`

### POST /api/attendance
- **Purpose**: Mark attendance (single or bulk)
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "records": [
      {
        "studentId": "string",
        "sessionId": "string (optional)",
        "groupId": "string",
        "date": "date",
        "status": "PRESENT | ABSENT | LATE | EXCUSED",
        "notes": "string",
        "markedBy": "string",
        "qrCodeScan": "boolean"
      }
    ]
  }
  ```
- **Response**: Array of created/updated attendance records
- **Database Tables**: `Attendance`, `Student`
- **Notes**: Uses upsert based on studentId_date_groupId composite key

### POST /api/attendance/bulk
- **Purpose**: Mark attendance for multiple students with same status
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "studentIds": ["array of student IDs"],
    "sessionId": "string (optional)",
    "groupId": "string",
    "date": "date",
    "status": "PRESENT | ABSENT | LATE | EXCUSED",
    "markedBy": "string",
    "notes": "string"
  }
  ```
- **Response**: Array of attendance records
- **Database Tables**: `Attendance`
- **Notes**: Requires notes/reason for ABSENT status

### PUT /api/attendance/bulk
- **Purpose**: Copy attendance from previous session
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "sourceDate": "date",
    "targetDate": "date",
    "groupId": "string"
  }
  ```
- **Response**: Copied attendance records
- **Database Tables**: `Attendance`

### GET /api/attendance/stats
- **Purpose**: Get attendance statistics and analytics
- **Auth Required**: No
- **Query Params**:
  - `studentId`: Individual student stats
  - `groupId`: Group stats
  - `startDate`: Date range start
  - `endDate`: Date range end
- **Response**:
  - For student: total, present, late, absent, excused, attendanceRate, consecutiveAbsences
  - For group: aggregated stats, at-risk students, trends
- **Database Tables**: `Attendance`, `Student`

### GET /api/attendance/rates
- **Purpose**: Get attendance rates
- **Auth Required**: No
- **Database Tables**: `Attendance`

### GET /api/attendance/export
- **Purpose**: Export attendance data
- **Auth Required**: No
- **Database Tables**: `Attendance`

### GET /api/attendance/history
- **Purpose**: Get attendance history
- **Auth Required**: No
- **Database Tables**: `Attendance`

### GET /api/attendance/policies
- **Purpose**: Get attendance policies
- **Auth Required**: No
- **Database Tables**: None (configuration)

### POST /api/attendance/batch
- **Purpose**: Batch attendance operations
- **Auth Required**: No
- **Database Tables**: `Attendance`

### GET /api/attendance/alerts
- **Purpose**: Get attendance alerts (low attendance, consecutive absences)
- **Auth Required**: No
- **Database Tables**: `Attendance`, `Student`

---

## Assessments

### GET /api/assessments
- **Purpose**: Query assessments with filters
- **Auth Required**: Yes
- **Query Params**:
  - `studentId`: Filter by student
  - `groupId`: Filter by group
  - `result`: Filter by result (COMPETENT, NOT_YET_COMPETENT, PENDING)
  - `type`: Filter by type (FORMATIVE, SUMMATIVE, WORKPLACE, INTEGRATED)
  - `method`: Filter by method (KNOWLEDGE, PRACTICAL, OBSERVATION, PORTFOLIO)
  - `moderationStatus`: Filter by moderation status
- **Response**: Array of assessments with student, group, unit standard, module details
- **Database Tables**: `Assessment`, `Student`, `Group`, `UnitStandard`, `Module`

### POST /api/assessments
- **Purpose**: Create new assessment
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "studentId": "string",
    "unitStandardId": "string",
    "type": "FORMATIVE | SUMMATIVE | WORKPLACE | INTEGRATED",
    "method": "KNOWLEDGE | PRACTICAL | OBSERVATION | PORTFOLIO",
    "dueDate": "date",
    "notes": "string",
    "result": "string (optional)",
    "score": "number 0-100 (optional)",
    "feedback": "string (optional)"
  }
  ```
- **Response**: Created assessment
- **Database Tables**: `Assessment`
- **Notes**: Sets attemptNumber to 1, moderationStatus to PENDING

### PUT /api/assessments
- **Purpose**: Update/mark assessment
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "id": "string",
    "result": "COMPETENT | NOT_YET_COMPETENT | PENDING",
    "score": "number",
    "feedback": "string",
    "notes": "string",
    "assessedDate": "date",
    "moderationStatus": "string"
  }
  ```
- **Response**: Updated assessment
- **Database Tables**: `Assessment`, `UnitStandardProgress`, `Student`
- **Notes**: Auto-updates student progress for COMPETENT results

### GET /api/assessments/[id]
- **Purpose**: Get single assessment details
- **Auth Required**: No
- **Response**: Assessment with student, group, unit standard, module
- **Database Tables**: `Assessment`, `Student`, `UnitStandard`

### PUT /api/assessments/[id]
- **Purpose**: Update assessment (supports 3-state result)
- **Auth Required**: No
- **Request Body**: Same as PUT /api/assessments
- **Response**: Updated assessment
- **Database Tables**: `Assessment`, `UnitStandardProgress`
- **Notes**: Recalculates student progress when result changes

### PATCH /api/assessments/[id]
- **Purpose**: Same as PUT (alias)
- **Auth Required**: No
- **Database Tables**: `Assessment`

### DELETE /api/assessments/[id]
- **Purpose**: Delete assessment
- **Auth Required**: No
- **Response**: Success message
- **Database Tables**: `Assessment`

### POST /api/assessments/[id]/complete
- **Purpose**: Mark assessment as complete
- **Auth Required**: No
- **Database Tables**: `Assessment`

### GET /api/assessments/stats
- **Purpose**: Get assessment statistics
- **Auth Required**: No
- **Query Params**:
  - `studentId`: Student-specific stats
  - `groupId`: Group-specific stats
- **Response**:
  ```json
  {
    "total": "number",
    "pending": "number",
    "completed": "number",
    "competent": "number",
    "notYetCompetent": "number",
    "overdue": "number",
    "pendingModeration": "number",
    "byType": { "formative": "number", "summative": "number" },
    "byMethod": { "KNOWLEDGE": "number", ... }
  }
  ```
- **Database Tables**: `Assessment`

### POST /api/assessments/bulk-generate
- **Purpose**: Generate all required assessments for a student
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "studentId": "string"
  }
  ```
- **Response**: Created assessment count and breakdown
- **Database Tables**: `Assessment`, `Student`, `Module`, `UnitStandard`
- **Notes**: Creates FORMATIVE assessments for all unit standards, skips existing

### GET /api/assessments/by-group
- **Purpose**: Get assessments organized by module and unit standard for group
- **Auth Required**: No
- **Query Params**:
  - `groupId`: Required
  - `moduleId`: Optional filter
- **Response**: Hierarchical structure: modules -> unit standards -> student assessments
- **Database Tables**: `Student`, `Module`, `UnitStandard`, `Assessment`

### POST /api/assessments/moderate
- **Purpose**: Moderate assessment (approve/reject)
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "assessmentId": "string",
    "moderationStatus": "APPROVED | REJECTED | PENDING",
    "moderationNotes": "string"
  }
  ```
- **Response**: Updated assessment
- **Database Tables**: `Assessment`, `UnitStandardProgress`, `Student`
- **Notes**: Updates progress if approved as competent

### GET /api/assessments/export
- **Purpose**: Export assessment data
- **Auth Required**: No
- **Query Params**:
  - `format`: csv or json
  - `groupId`: Filter by group
  - `moduleId`: Filter by module
  - `result`: Filter by result
- **Response**: CSV or JSON file download
- **Database Tables**: `Assessment`, `Student`, `UnitStandard`

### POST /api/assessments/bulk-update
- **Purpose**: Bulk update assessments
- **Auth Required**: No
- **Database Tables**: `Assessment`

### POST /api/assessments/bulk-pass
- **Purpose**: Bulk mark assessments as competent
- **Auth Required**: No
- **Database Tables**: `Assessment`

### POST /api/assessments/bulk
- **Purpose**: Bulk assessment operations
- **Auth Required**: No
- **Database Tables**: `Assessment`

### GET /api/assessments/analytics
- **Purpose**: Get assessment analytics
- **Auth Required**: No
- **Database Tables**: `Assessment`

### GET /api/assessments/marking
- **Purpose**: Get assessments for marking
- **Auth Required**: No
- **Database Tables**: `Assessment`

### GET /api/assessments/templates
- **Purpose**: Get assessment templates
- **Auth Required**: No
- **Database Tables**: None (static templates)

---

## Timetable/Lessons

### GET /api/timetable
- **Purpose**: Get timetable sessions/lesson plans
- **Auth Required**: No
- **Query Params**:
  - `start` or `startDate`: Start date (required)
  - `end` or `endDate`: End date (required)
  - `groupId`: Filter by group
- **Response**: Array of lesson plans with date, time, venue, group details
- **Database Tables**: `LessonPlan`, `Group`

### POST /api/timetable
- **Purpose**: Create timetable session
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "title": "string",
    "date": "date",
    "startTime": "string",
    "endTime": "string",
    "groupId": "string",
    "venue": "string"
  }
  ```
- **Response**: Created lesson plan
- **Database Tables**: `LessonPlan`

### GET /api/timetable/[id]
- **Purpose**: Get single timetable entry
- **Auth Required**: No
- **Database Tables**: `LessonPlan`

### PUT /api/timetable/[id]
- **Purpose**: Update timetable entry
- **Auth Required**: No
- **Database Tables**: `LessonPlan`

### DELETE /api/timetable/[id]
- **Purpose**: Delete timetable entry
- **Auth Required**: No
- **Database Tables**: `LessonPlan`

### GET /api/timetable/[id]/audit
- **Purpose**: Get audit trail for timetable entry
- **Auth Required**: No
- **Database Tables**: `LessonPlan` (audit fields)

### GET /api/lessons
- **Purpose**: Get lesson plans
- **Auth Required**: No
- **Query Params**:
  - `from`: Start date
  - `to`: End date
- **Response**: Array of lesson plans with module, facilitator, group
- **Database Tables**: `LessonPlan`, `Module`, `User`, `Group`

### POST /api/lessons
- **Purpose**: Create lesson plan
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "title": "string",
    "description": "string",
    "date": "date",
    "startTime": "string",
    "endTime": "string",
    "venue": "string",
    "objectives": ["array"],
    "materials": ["array"],
    "activities": ["array"],
    "notes": "string",
    "aiGenerated": "boolean",
    "moduleId": "string",
    "facilitatorId": "string",
    "groupId": "string"
  }
  ```
- **Response**: Created lesson plan
- **Database Tables**: `LessonPlan`

### GET /api/lessons/[id]
- **Purpose**: Get single lesson plan
- **Auth Required**: No
- **Database Tables**: `LessonPlan`

### PUT /api/lessons/[id]
- **Purpose**: Update lesson plan
- **Auth Required**: No
- **Database Tables**: `LessonPlan`

### DELETE /api/lessons/[id]
- **Purpose**: Delete lesson plan
- **Auth Required**: No
- **Database Tables**: `LessonPlan`

---

## Dashboard

### GET /api/dashboard/stats
- **Purpose**: Get dashboard statistics with trends
- **Auth Required**: No
- **Response**:
  ```json
  {
    "students": { "total": "number", "trend": "number", "trendPercentage": "number" },
    "groups": { "total": "number", "trend": "number", "trendPercentage": "number" },
    "courses": { "total": "number", "trend": "number", "trendPercentage": "number" },
    "assessments": { "pending": "number", "trend": "number", "trendPercentage": "number" },
    "attendance": { "rate": "number", "trend": "number", "trendPercentage": "number" },
    "completion": { "rate": "number", "trend": "number", "trendPercentage": "number" }
  }
  ```
- **Database Tables**: `Student`, `Group`, `Module`, `Assessment`, `Attendance`
- **Notes**: Compares current vs 30 days ago

### GET /api/dashboard/summary
- **Purpose**: Get comprehensive dashboard summary
- **Auth Required**: No
- **Response**:
  ```json
  {
    "totalStudents": "number",
    "totalGroups": "number",
    "attendanceRate": "number",
    "pendingAssessments": "number",
    "activeCourses": "number",
    "groupsFullyComplete": "number",
    "programmeHealth": ["array of group health metrics"]
  }
  ```
- **Database Tables**: `Student`, `Group`, `Attendance`, `Assessment`, `GroupRolloutPlan`
- **Notes**: Calculates projected vs actual progress for groups

### GET /api/dashboard/today-classes
- **Purpose**: Get today's classes with progress and status
- **Auth Required**: Yes
- **Response**: Array of today's sessions with:
  - Group name and students
  - Current module based on rollout plan
  - Module progress percentage
  - On-track status
  - Warnings if any
- **Database Tables**: `Session`, `Group`, `Student`, `GroupRolloutPlan`

### GET /api/dashboard/schedule
- **Purpose**: Get schedule data
- **Auth Required**: No
- **Database Tables**: `LessonPlan`, `Session`

### GET /api/dashboard/recent-activity
- **Purpose**: Get recent activity feed
- **Auth Required**: No
- **Database Tables**: Multiple (assessments, attendance, students)

### GET /api/dashboard/charts
- **Purpose**: Get chart data for dashboard
- **Auth Required**: No
- **Database Tables**: Various

### GET /api/dashboard/alerts
- **Purpose**: Get dashboard alerts
- **Auth Required**: No
- **Database Tables**: Various

---

## Reports

### GET /api/reports/group-progress
- **Purpose**: Generate group progress report
- **Auth Required**: No
- **Query Params**:
  - `groupId`: Required
  - `format`: csv or json (default csv)
- **Response**: CSV/JSON file with:
  - Student details
  - Total credits and progress %
  - Module-specific progress
  - Alert status (On Track / At Risk / Stalled)
- **Database Tables**: `Group`, `Student`, `ModuleProgress`, `Assessment`

### GET /api/reports/unit-standards
- **Purpose**: Generate unit standards report
- **Auth Required**: No
- **Database Tables**: `UnitStandard`, `Assessment`

### POST /api/reports/daily
- **Purpose**: Generate daily training report
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "date": "date",
    "groupIds": ["array of group IDs (max 10)"],
    "facilitator": "string",
    "groupTrainingData": "object",
    "observations": "string",
    "challengesFaced": "string"
  }
  ```
- **Response**: Formatted daily report with:
  - Attendance per group
  - Formative completions
  - Training activities
  - Observations and challenges
- **Database Tables**: `Group`, `Student`, `Attendance`, `FormativeCompletion`

### POST /api/reports/daily/generate-ai
- **Purpose**: Generate AI-enhanced daily report
- **Auth Required**: No
- **Database Tables**: Various

---

## AI Features

### POST /api/ai/chat
- **Purpose**: AI chat with curriculum context
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "messages": [
      { "role": "user | assistant", "content": "string" }
    ],
    "studentId": "string (optional)",
    "moduleFilter": "number (optional)"
  }
  ```
- **Response**:
  ```json
  {
    "response": "string",
    "sources": ["array of source documents"],
    "context": { "documentsUsed": "number", "studentContext": "boolean" }
  }
  ```
- **Database Tables**: `Student`, `ModuleProgress`
- **External**: Pinecone (vector search), Gemini AI
- **Notes**: Retrieves relevant curriculum documents using semantic search

### POST /api/ai/semantic-search
- **Purpose**: Semantic search in curriculum documents
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "query": "string",
    "topK": "number (default 5)",
    "moduleNumber": "number (optional)",
    "category": "string (optional)",
    "includeContent": "boolean (default true)"
  }
  ```
- **Response**: Array of search results with relevance scores
- **External**: Pinecone
- **Notes**: Also supports GET method with query params

### POST /api/ai/generate-lesson
- **Purpose**: AI-generate lesson plan for unit standard
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "unitStandardId": "string",
    "duration": "number (default 60 minutes)",
    "learningOutcomes": "string (optional)",
    "notes": "string (optional)",
    "groupId": "string (optional)"
  }
  ```
- **Response**: Structured lesson plan with:
  - Overview, objectives
  - Introduction, main content, activity, assessment, wrap-up
  - Resources needed
  - Differentiation notes
- **Database Tables**: `UnitStandard`, `Module`
- **External**: Pinecone, Gemini AI

### POST /api/ai/generate-assessment
- **Purpose**: AI-generate assessment questions
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "unitStandardId": "string (or unitStandardCode)",
    "type": "formative | summative",
    "count": "number (default 5)"
  }
  ```
- **Response**: Generated questions with unit standard details
- **Database Tables**: `UnitStandard`, `Module`
- **External**: Pinecone, Cohere AI

### GET /api/ai/generate-assessment
- **Purpose**: List available unit standards for assessment generation
- **Auth Required**: No
- **Query Params**:
  - `moduleId`: Filter by module
- **Database Tables**: `UnitStandard`, `Module`

### POST /api/ai/index-documents
- **Purpose**: Index curriculum documents into vector database
- **Auth Required**: No
- **Request Body**: Document content and metadata
- **Response**: Indexing status
- **External**: Pinecone
- **Notes**: Splits documents into chunks, categorizes by module

### GET /api/ai/index-documents
- **Purpose**: Get index statistics
- **Auth Required**: No
- **Response**: Document count and index stats
- **External**: Pinecone

### POST /api/ai/index-documents/upload
- **Purpose**: Upload document for indexing
- **Auth Required**: No
- **Database Tables**: None
- **External**: Pinecone

### POST /api/ai/index-documents/retry
- **Purpose**: Retry failed document indexing
- **Auth Required**: No
- **External**: Pinecone

### DELETE /api/ai/index-documents/delete
- **Purpose**: Delete documents from index
- **Auth Required**: No
- **External**: Pinecone

### GET /api/ai/index-documents/list
- **Purpose**: List indexed documents
- **Auth Required**: No
- **External**: Pinecone

### GET /api/ai/recommendations
- **Purpose**: Get AI recommendations
- **Auth Required**: No
- **Database Tables**: Various

---

## Plans/Calendar

### GET /api/plans
- **Purpose**: Get calendar plans
- **Auth Required**: Yes
- **Query Params**:
  - `startDate`: Filter start date
  - `endDate`: Filter end date
- **Response**: Array of plans (currently stubbed)
- **Database Tables**: None (Plan table not implemented)
- **Notes**: Returns empty array, feature partially implemented

### POST /api/plans
- **Purpose**: Create new plan
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "title": "string",
    "description": "string",
    "startDate": "date",
    "endDate": "date",
    "groupId": "string"
  }
  ```
- **Response**: 501 Not Implemented
- **Database Tables**: None
- **Notes**: Temporarily disabled

### GET /api/plans/[id]
- **Purpose**: Get single plan
- **Auth Required**: Yes
- **Database Tables**: None

### PUT /api/plans/[id]
- **Purpose**: Update plan
- **Auth Required**: Yes
- **Database Tables**: None

### DELETE /api/plans/[id]
- **Purpose**: Delete plan
- **Auth Required**: Yes
- **Database Tables**: None

---

## Modules

### GET /api/modules
- **Purpose**: List all modules
- **Auth Required**: No
- **Query Params**:
  - `includeUnitStandards`: Include unit standards (default false)
- **Response**: Array of modules with counts (unit standards, students, progress)
- **Database Tables**: `Module`, `UnitStandard`

### GET /api/modules/[id]
- **Purpose**: Get single module details
- **Auth Required**: No
- **Database Tables**: `Module`, `UnitStandard`

### POST /api/modules
- **Purpose**: Create module
- **Auth Required**: No
- **Database Tables**: `Module`

### PUT /api/modules/[id]
- **Purpose**: Update module
- **Auth Required**: No
- **Database Tables**: `Module`

### DELETE /api/modules/[id]
- **Purpose**: Delete module
- **Auth Required**: No
- **Database Tables**: `Module`

---

## Unit Standards

### GET /api/unit-standards
- **Purpose**: List all unit standards
- **Auth Required**: No
- **Query Params**:
  - `moduleId`: Filter by module
- **Response**: Array of unit standards with module, assessments, activity counts
- **Database Tables**: `UnitStandard`, `Module`, `Assessment`

### POST /api/unit-standards
- **Purpose**: Create new unit standard
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "code": "string",
    "title": "string",
    "credits": "number",
    "level": "number",
    "type": "Core | Elective",
    "moduleId": "string",
    "content": "string (optional)"
  }
  ```
- **Response**: Created unit standard
- **Database Tables**: `UnitStandard`
- **Notes**: Checks for duplicate code

### GET /api/unit-standards/[id]
- **Purpose**: Get single unit standard
- **Auth Required**: No
- **Database Tables**: `UnitStandard`, `Module`

### PUT /api/unit-standards/[id]
- **Purpose**: Update unit standard
- **Auth Required**: Yes
- **Database Tables**: `UnitStandard`

### DELETE /api/unit-standards/[id]
- **Purpose**: Delete unit standard
- **Auth Required**: Yes
- **Database Tables**: `UnitStandard`

---

## Formatives

### GET /api/formatives
- **Purpose**: List formative assessments
- **Auth Required**: No
- **Query Params**:
  - `moduleId`: Filter by module
- **Response**: Array of formative assessments with module, unit standard, completions
- **Database Tables**: `FormativeAssessment`, `Module`, `UnitStandard`, `FormativeCompletion`

### POST /api/formatives
- **Purpose**: Create formative assessment
- **Auth Required**: No
- **Database Tables**: `FormativeAssessment`

### GET /api/formatives/completion
- **Purpose**: Get formative completion data
- **Auth Required**: No
- **Database Tables**: `FormativeCompletion`

### POST /api/formatives/completion
- **Purpose**: Mark formative as complete
- **Auth Required**: No
- **Database Tables**: `FormativeCompletion`

---

## POE

### GET /api/poe
- **Purpose**: Get POE checklist
- **Auth Required**: No
- **Query Params**:
  - `studentId`: Filter by student
  - `groupId`: Filter by group
- **Response**: Array of POE checklists with student details
- **Database Tables**: `POEChecklist`, `Student`, `Group`

### POST /api/poe
- **Purpose**: Create POE checklist for student
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "studentId": "string",
    "module1POE": "boolean",
    "module2POE": "boolean",
    ...
    "module6POE": "boolean",
    "assessmentsSigned": "boolean",
    "logbookComplete": "boolean",
    "logbookSigned": "boolean",
    "idCopyPresent": "boolean",
    "contractSigned": "boolean",
    "inductionComplete": "boolean",
    "notes": "string"
  }
  ```
- **Response**: Created POE checklist
- **Database Tables**: `POEChecklist`

### PUT /api/poe
- **Purpose**: Update POE checklist
- **Auth Required**: No
- **Request Body**: POE fields to update (by id or studentId)
- **Response**: Updated POE checklist
- **Database Tables**: `POEChecklist`
- **Notes**: Supports upsert by studentId

---

## Settings

### GET /api/settings/profile
- **Purpose**: Get user profile settings
- **Auth Required**: No (uses x-user-id header)
- **Response**: User profile data
- **Database Tables**: `User`

### PUT /api/settings/profile
- **Purpose**: Update user profile
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "name": "string",
    "email": "string",
    "phone": "string",
    "organization": "string",
    "bio": "string"
  }
  ```
- **Response**: Updated user profile
- **Database Tables**: `User`

### GET /api/settings/notifications
- **Purpose**: Get notification preferences
- **Auth Required**: No
- **Response**:
  ```json
  {
    "emailNotifications": "boolean",
    "pushNotifications": "boolean",
    "attendanceAlerts": "boolean",
    "assessmentReminders": "boolean",
    "weeklyReports": "boolean",
    "dailyDigest": "boolean",
    "moderationAlerts": "boolean",
    "studentProgressUpdates": "boolean"
  }
  ```
- **Database Tables**: None (file-based storage)

### PUT /api/settings/notifications
- **Purpose**: Update notification preferences
- **Auth Required**: No
- **Request Body**: Notification settings object
- **Response**: Updated settings
- **Database Tables**: None (file-based)

### GET /api/settings/security
- **Purpose**: Get security settings
- **Auth Required**: No
- **Database Tables**: None

### PUT /api/settings/security
- **Purpose**: Update security settings
- **Auth Required**: No
- **Database Tables**: `User`

### GET /api/settings/appearance
- **Purpose**: Get appearance settings
- **Auth Required**: No
- **Database Tables**: None

### PUT /api/settings/appearance
- **Purpose**: Update appearance settings
- **Auth Required**: No
- **Database Tables**: None

### GET /api/settings/reminders
- **Purpose**: Get reminder settings
- **Auth Required**: No
- **Database Tables**: None

### PUT /api/settings/reminders
- **Purpose**: Update reminder settings
- **Auth Required**: No
- **Database Tables**: None

### GET /api/settings/system
- **Purpose**: Get system settings
- **Auth Required**: No
- **Database Tables**: None

### PUT /api/settings/system
- **Purpose**: Update system settings (admin only)
- **Auth Required**: Yes
- **Database Tables**: None

---

## Users

### GET /api/users
- **Purpose**: List all users (Admin only)
- **Auth Required**: No (should be Yes - Admin)
- **Response**: Array of users with role, student count, lesson plan count
- **Database Tables**: `User`

### POST /api/users
- **Purpose**: Create new user (Admin only)
- **Auth Required**: No (should be Yes - Admin)
- **Request Body**:
  ```json
  {
    "email": "string",
    "name": "string",
    "password": "string",
    "role": "FACILITATOR | ADMIN | MODERATOR"
  }
  ```
- **Response**: Created user
- **Database Tables**: `User`
- **Notes**: Hashes password with bcrypt

### GET /api/users/[id]
- **Purpose**: Get single user
- **Auth Required**: No
- **Database Tables**: `User`

### PUT /api/users/[id]
- **Purpose**: Update user
- **Auth Required**: No
- **Database Tables**: `User`

### DELETE /api/users/[id]
- **Purpose**: Delete user
- **Auth Required**: No
- **Database Tables**: `User`

### PUT /api/users/[id]/password
- **Purpose**: Change user password
- **Auth Required**: Yes
- **Database Tables**: `User`

---

## Reminders

### GET /api/reminders
- **Purpose**: Get reminders
- **Auth Required**: Yes
- **Query Params**:
  - `date`: Filter by date
- **Response**: Array of reminders with plan details
- **Database Tables**: `Reminder`, `Plan`

### POST /api/reminders
- **Purpose**: Create reminder
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "planId": "string",
    "message": "string",
    "venue": "string",
    "sendTo": "string",
    "scheduledAt": "date"
  }
  ```
- **Response**: Created reminder
- **Database Tables**: `Reminder`

### GET /api/reminders/[id]
- **Purpose**: Get single reminder
- **Auth Required**: Yes
- **Database Tables**: `Reminder`

### PUT /api/reminders/[id]
- **Purpose**: Update reminder
- **Auth Required**: Yes
- **Database Tables**: `Reminder`

### DELETE /api/reminders/[id]
- **Purpose**: Delete reminder
- **Auth Required**: Yes
- **Database Tables**: `Reminder`

### POST /api/reminders/[id]/mark-read
- **Purpose**: Mark reminder as read
- **Auth Required**: Yes
- **Database Tables**: `Reminder`

### POST /api/reminders/send-pending-emails
- **Purpose**: Send pending reminder emails (cron job)
- **Auth Required**: No
- **Database Tables**: `Reminder`

---

## Search

### GET /api/search
- **Purpose**: Global search across students, groups, courses
- **Auth Required**: No
- **Query Params**:
  - `q`: Search query (required)
  - `filter`: all | students | groups | courses (default all)
- **Response**: Array of search results with type, title, subtitle, description, status, data
- **Database Tables**: `Student`, `Group`, `Module`
- **Notes**: Searches firstName, lastName, studentId, email, idNumber for students; name, location, coordinator for groups

---

## Admin

### POST /api/admin/cleanup
- **Purpose**: Admin cleanup operations
- **Auth Required**: Yes (Bearer token)
- **Request Body**:
  ```json
  {
    "action": "delete-old-groups | get-cleanup-preview",
    "groupsToKeep": ["array of group names"]
  }
  ```
- **Response**: Cleanup statistics
- **Database Tables**: All (cascading deletes)
- **Notes**: Deletes groups not in keeplist and all related data

---

## Other Endpoints

### GET /api/test-endpoint
- **Purpose**: Test endpoint
- **Auth Required**: No
- **Response**: Test data
- **Database Tables**: None

### GET /api/curriculum
- **Purpose**: Get curriculum data
- **Auth Required**: No
- **Database Tables**: `Module`, `UnitStandard`

### GET /api/companies
- **Purpose**: Get companies (if Company model exists)
- **Auth Required**: No
- **Database Tables**: `Company`

### POST /api/companies
- **Purpose**: Create company
- **Auth Required**: No
- **Database Tables**: `Company`

### GET /api/schedule-templates
- **Purpose**: Get schedule templates
- **Auth Required**: No
- **Database Tables**: None

### POST /api/schedule-templates
- **Purpose**: Create schedule template
- **Auth Required**: No
- **Database Tables**: None

### GET /api/sessions/generate
- **Purpose**: Generate training sessions
- **Auth Required**: No
- **Database Tables**: `Session`

### GET /api/recurring-sessions
- **Purpose**: Get recurring sessions
- **Auth Required**: No
- **Database Tables**: `Session`

### GET /api/progress
- **Purpose**: Get progress data
- **Auth Required**: No
- **Database Tables**: Various progress tables

### GET /api/group-schedules
- **Purpose**: Get group schedules
- **Auth Required**: No
- **Database Tables**: `GroupSchedule`

### GET /api/debug/groups-notes
- **Purpose**: Debug endpoint to view group notes/rollout plans
- **Auth Required**: No
- **Database Tables**: `Group`

---

## Summary Statistics

### Total Endpoints: 99+ route files

### Authentication Breakdown:
- **No Auth Required**: ~70% of endpoints
- **Auth Required**: ~30% of endpoints
- **Admin Only**: ~5% of endpoints

### Primary Database Models:
- **Student** - Core entity for learners
- **Group** - Training cohorts
- **Assessment** - Student assessments
- **Attendance** - Attendance tracking
- **UnitStandard** - Curriculum components
- **Module** - Course modules
- **User** - System users/facilitators
- **LessonPlan** - Training sessions
- **GroupRolloutPlan** - Training schedules
- **POEChecklist** - Portfolio of Evidence

### External Services:
- **Pinecone** - Vector database for semantic search
- **Google Gemini AI** - Lesson and content generation
- **Cohere AI** - Assessment question generation

### Common Response Format:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Common Error Response:
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

---

## Notes

1. **Authentication**: Most endpoints lack proper authentication middleware despite having `requireAuth` function available. This is a security concern.

2. **Rate Limiting**: Only login (5/min) and register (3/hour) have rate limiting implemented.

3. **File Uploads**: Handled in `/api/groups/upload` for rollout plan documents (PDF/DOCX parsing).

4. **Real-time Features**: No WebSocket endpoints detected. All communication is REST-based.

5. **CSV Export**: Available for students, attendance, assessments, reports.

6. **Progress Calculation**: Complex logic across multiple endpoints to calculate student/group progress from COMPETENT assessments and unit standard completions.

7. **AI Integration**: Deep integration with vector search and LLMs for curriculum-aware features.

8. **Rollout Plans**: Sophisticated system for managing training schedules with document parsing and auto-generation.

9. **Moderation**: Assessment moderation workflow with PENDING/APPROVED/REJECTED statuses.

10. **Composite Keys**: Attendance uses composite key (studentId_date_groupId) for upsert operations.

---

**Generated**: 2026-02-16  
**Source**: Comprehensive scan of `src/app/api` directory
