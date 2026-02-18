# Learnership LMS System Architecture

## Complete System Design & Entity Relationships

### Table of Contents
1. [System Overview](#system-overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Data Models & Relationships](#data-models--relationships)
4. [User Roles & Permissions](#user-roles--permissions)
5. [API Architecture](#api-architecture)
6. [Database Schema](#database-schema)
7. [Authentication Flow](#authentication-flow)
8. [Data Flow Examples](#data-flow-examples)
9. [Scalability & Performance](#scalability--performance)
10. [Security Architecture](#security-architecture)

---

## System Overview

The Learnership Management System is a comprehensive learning management platform designed to manage learnership programs, including student tracking, group management, assessments, attendance, and progress monitoring.

### Core Features

```
┌─────────────────────────────────────────┐
│       Learnership Management System      │
├─────────────────────────────────────────┤
│                                         │
│  ┌────────────────────────────────┐   │
│  │   User Management              │   │
│  │ - Authentication (JWT)         │   │
│  │ - Role-based access control    │   │
│  │ - User creation & management   │   │
│  └────────────────────────────────┘   │
│                                         │
│  ┌────────────────────────────────┐   │
│  │   Learner Management           │   │
│  │ - Student profiles             │   │
│  │ - Group assignments            │   │
│  │ - Progress tracking            │   │
│  └────────────────────────────────┘   │
│                                         │
│  ┌────────────────────────────────┐   │
│  │   Educational Content          │   │
│  │ - Unit standards definition    │   │
│  │ - Learning modules            │   │
│  │ - Assessment criteria         │   │
│  └────────────────────────────────┘   │
│                                         │
│  ┌────────────────────────────────┐   │
│  │   Assessment & Attendance      │   │
│  │ - Assessment scoring          │   │
│  │ - Session management          │   │
│  │ - Attendance tracking         │   │
│  └────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

## Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         DATABASE ENTITIES                         │
└──────────────────────────────────────────────────────────────────┘

                            ┌─────────┐
                            │  User   │
                            └────┬────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
            ┌───────▼────────┐      ┌────────▼──────┐
            │ Student        │      │ Admin/Manager │
            │ (extends User) │      │ (role:ADMIN)  │
            └───────┬────────┘      └───────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        │      ┌────▼────┐      │
        │      │  Group  │      │
        │      └────┬────┘      │
        │           │           │
        │    ┌──────┼──────┐    │
        │    │             │    │
        │    │             │    │
    ┌───▼────▼──┐  ┌──────▼──────┐
    │ Assessment │  │   Session   │
    └───┬────────┘  └──────┬──────┘
        │                  │
        │          ┌───────▼────────┐
        │          │   Attendance   │
        │          └────────────────┘
        │
    ┌───▼────────────────┐
    │ UnitStandard       │
    │ (learning standard)│
    └───────┬────────────┘
            │
    ┌───────▼──────┐
    │   Module     │
    │ (curriculum) │
    └──────────────┘
```

---

## Data Models & Relationships

### 1. User Model

```prisma
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  password        String    // bcrypt hashed
  firstName       String
  lastName        String
  role            Role      @default(USER)
  status          UserStatus @default(ACTIVE)
  
  // Relations
  students        Student[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([email])
  @@index([role])
}

enum Role {
  USER         // Regular user
  ADMIN        // System administrator
  MANAGER      // Program manager
  ASSESSOR     // Assessment reviewer
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}
```

**Key Features:**
- Email-based unique identification
- Role-based access control (4 roles)
- Status tracking (active/inactive/suspended)
- Timestamps for audit trail

**Constraints:**
- Email must be unique
- Email must be valid format
- Password must meet strength requirements
- Role must be one of the defined enum values

---

### 2. Student Model

```prisma
model Student {
  id              String    @id @default(cuid())
  firstName       String
  lastName        String
  email           String    @unique
  phoneNumber     String?   @unique
  idNumber        String?   @unique
  
  // Foreign Key
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Status
  status          StudentStatus @default(ACTIVE)
  enrollmentDate  DateTime
  completionDate  DateTime?
  
  // Relations
  groupId         String?
  group           Group?    @relation("StudentGroup", fields: [groupId], references: [id], onDelete: SetNull)
  
  assessments     Assessment[]
  sessions        Session[]
  attendances     Attendance[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([email])
  @@index([groupId])
  @@index([status])
}

enum StudentStatus {
  ACTIVE         // Currently enrolled
  COMPLETED      // Completed learnership
  WITHDRAWN      // Withdrew from program
  SUSPENDED      // Temporarily suspended
}
```

**Key Features:**
- Extends User model with learner-specific data
- Phone and ID number unique (optional but unique if provided)
- Tracks enrollment and completion dates
- Tracks student status throughout learnership

**Relationships:**
- One student → One group (can change groups)
- One student → Many assessments
- One student → Many sessions
- One student → Many attendance records

---

### 3. Group Model

```prisma
model Group {
  id              String    @id @default(cuid())
  name            String    @unique
  description     String?
  code            String    @unique         // Unique group identifier
  status          GroupStatus @default(ACTIVE)
  
  // Schedule Info
  startDate       DateTime
  endDate         DateTime
  scheduleType    ScheduleType // DAILY, WEEKLY, MONTHLY
  
  // Capacity
  maxCapacity     Int
  currentCapacity Int       @default(0)
  
  // Relations
  students        Student[] @relation("StudentGroup")
  sessions        Session[]
  unitStandards   UnitStandard[] @relation("GroupUnitStandards")
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([status])
  @@index([code])
}

enum GroupStatus {
  PLANNING       // Not yet started
  ACTIVE         // Currently running
  PAUSED         // Temporarily paused
  COMPLETED      // Completed
  CANCELED       // Canceled
}

enum ScheduleType {
  DAILY
  WEEKLY
  MONTHLY
}
```

**Key Features:**
- Groups have unique name and code
- Tracks capacity and current enrollment
- Multiple status states for group lifecycle
- Schedule information with flexible types

**Relationships:**
- One group → Many students
- One group → Many sessions
- One group → Many unit standards

---

### 4. UnitStandard Model (Curriculum)

```prisma
model UnitStandard {
  id              String    @id @default(cuid())
  code            String    @unique
  title           String
  description     String?
  credits         Int       // Qualification credits
  proficiency     String?   // Proficiency level required
  status          ContentStatus @default(ACTIVE)
  
  // Relations
  modules         Module[]  @relation("UnitModules")
  groups          Group[]   @relation("GroupUnitStandards")
  assessments     Assessment[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([code])
  @@index([status])
}

enum ContentStatus {
  DRAFT
  ACTIVE
  ARCHIVED
  DEPRECATED
}
```

**Key Features:**
- Represents NQF units or qualifications
- Tracks credits and proficiency levels
- Can have multiple modules

**Relationships:**
- One unit → Many modules
- One unit → Many groups
- One unit → Many assessments

---

### 5. Module Model (Content Delivery)

```prisma
model Module {
  id              String    @id @default(cuid())
  code            String    @unique
  title           String
  description     String?
  sequence        Int       // Order in unit standard
  duration        Int?      // Hours required
  status          ContentStatus @default(ACTIVE)
  
  // Assessment
  assessmentType  AssessmentType?
  passingScore    Int       @default(70)
  
  // Relations
  unitStandardId  String
  unitStandard    UnitStandard @relation("UnitModules", fields: [unitStandardId], references: [id])
  assessments     Assessment[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([unitStandardId])
  @@index([code])
}

enum AssessmentType {
  PRACTICAL      // Hands-on assessment
  THEORETICAL    // Written/oral test
  PROJECT        // Project-based
  PORTFOLIO      // Portfolio review
  COMBINED       // Mix of above
}
```

**Key Features:**
- Represents learning modules within unit standards
- Sequence determines order in curriculum
- Configurable assessment types and passing scores

**Relationships:**
- Many modules → One unit standard
- One module → Many assessments

---

### 6. Assessment Model

```prisma
model Assessment {
  id              String    @id @default(cuid())
  title           String
  description     String?
  
  // Assessment Details
  assessmentType  AssessmentType
  totalScore      Int       // Possible points
  passingScore    Int       @default(70)
  
  // Foreign Keys
  studentId       String
  student         Student   @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  moduleId        String
  module          Module    @relation(fields: [moduleId], references: [id])
  
  unitStandardId  String
  unitStandard    UnitStandard @relation(fields: [unitStandardId], references: [id])
  
  // Results
  status          AssessmentStatus @default(PENDING)
  score           Int?      // Actual score achieved (0-100%)
  percentage      Int?      // Score as percentage
  outcome         AssessmentOutcome? // PASS, FAIL, INCOMPLETE
  feedback        String?
  
  // Dates
  dueDate         DateTime
  submittedDate   DateTime?
  gradedDate      DateTime?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@unique([studentId, moduleId, unitStandardId]) // One assessment per student per module
  @@index([studentId])
  @@index([status])
  @@index([outcome])
}

enum AssessmentStatus {
  PENDING         // Not yet attempted
  IN_PROGRESS     // Currently being worked on
  SUBMITTED       // Submitted, awaiting grading
  GRADED          // Graded and feedback given
  REASSESSMENT    // Failed, reassessment scheduled
}

enum AssessmentOutcome {
  PASS
  FAIL
  INCOMPLETE
}
```

**Key Features:**
- Tracks complete assessment lifecycle
- Stores both raw score and percentage
- Multiple status states (pending → graded)
- Unique constraint: one assessment per student per module
- Supports reassessments

**Relationships:**
- Many assessments → One student
- Many assessments → One module
- Many assessments → One unit standard

---

### 7. Session Model (Learning Event)

```prisma
model Session {
  id              String    @id @default(cuid())
  title           String
  description     String?
  
  // Session Details
  sessionType     SessionType // CLASS, WORKSHOP, PRACTICAL, etc.
  capacity        Int?
  
  // Foreign Keys
  groupId         String
  group           Group     @relation(fields: [groupId], references: [id], onDelete: Cascade)
  
  // Dates & Times
  scheduledDate   DateTime
  startTime       DateTime
  endTime         DateTime
  duration        Int       // Minutes
  status          SessionStatus @default(SCHEDULED)
  
  // Content
  content         String?
  resources       String?
  
  // Relations
  attendances     Attendance[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([groupId])
  @@index([status])
  @@index([scheduledDate])
}

enum SessionType {
  CLASS           // Regular class
  WORKSHOP        // Workshop/practical
  ASSIGNMENT      // Assignment/project
  ASSESSMENT      // Assessment session
  ORIENTATION     // Induction/orientation
  OTHER           // Other type
}

enum SessionStatus {
  SCHEDULED       // Not yet started
  IN_PROGRESS     // Currently running
  COMPLETED       // Finished
  CANCELED        // Canceled
}
```

**Key Features:**
- Represents scheduled learning events
- Support for different session types
- Capacity tracking
- Time tracking (start, end, duration)

**Relationships:**
- Many sessions → One group
- One session → Many attendance records

---

### 8. Attendance Model

```prisma
model Attendance {
  id              String    @id @default(cuid())
  
  // Foreign Keys
  studentId       String
  student         Student   @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  sessionId       String
  session         Session   @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  groupId         String
  group           Group?    @relation(fields: [groupId], references: [id], onDelete: SetNull)
  
  // Attendance Info
  status          AttendanceStatus @default(PRESENT)
  timeIn          DateTime?
  timeOut         DateTime?
  remarks         String?
  
  // Verification
  verifiedBy      String?   // Facilitator ID
  verifiedAt      DateTime?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@unique([studentId, sessionId]) // One record per student per session
  @@index([studentId])
  @@index([sessionId])
  @@index([status])
}

enum AttendanceStatus {
  PRESENT         // Student attended
  ABSENT          // Student absent
  LATE            // Student arrived late
  EXCUSED         // Absent with good reason
  PARTIAL         // Attended part of session
}
```

**Key Features:**
- One attendance record per student per session
- Time tracking (in/out)
- Multiple attendance statuses
- Facilitator verification

**Relationships:**
- Many attendance → One student
- Many attendance → One session
- Many attendance → One group

---

## User Roles & Permissions

### Role Matrix

```
╔═══════════════════════════════════════════════════════════════╗
║              ROLE-BASED PERMISSIONS MATRIX                    ║
╠═════════╦════════╦═════════╦═════════╦══════════╦════════════╣
║ Feature ║  USER  ║  ADMIN  ║ MANAGER ║ ASSESSOR ║ LEARNER    ║
╠═════════╬════════╬═════════╬═════════╬══════════╬════════════╣
║ View    ║   ✓    ║    ✓    ║    ✓    ║    ✓     ║    ✓*      ║
║ Students║   -    ║    ✓    ║    ✓    ║    ✓     ║    - (own) ║
╠═════════╬════════╬═════════╬═════════╬══════════╬════════════╣
║ Create  ║   -    ║    ✓    ║    ✓    ║    -     ║    -       ║
║ Students║        ║         ║         ║          ║            ║
╠═════════╬════════╬═════════╬═════════╬══════════╬════════════╣
║ Manage  ║   -    ║    ✓    ║    ✓    ║    -     ║    -       ║
║ Groups  ║        ║         ║         ║          ║            ║
╠═════════╬════════╬═════════╬═════════╬══════════╬════════════╣
║ Grade   ║   -    ║    ✓    ║    ✓    ║    ✓     ║    -       ║
║ Assess. ║        ║         ║         ║          ║            ║
╠═════════╬════════╬═════════╬═════════╬══════════╬════════════╣
║ View    ║   -    ║    ✓    ║    -    ║    -     ║    ✓*      ║
║ Progress║        ║         ║         ║          ║ (own only) ║
╠═════════╬════════╬═════════╬═════════╬══════════╬════════════╣
║ Reports ║   -    ║    ✓    ║    ✓    ║    -     ║    -       ║
╠═════════╬════════╬═════════╬═════════╬══════════╬════════════╣
║ Manage  ║   -    ║    ✓    ║    -    ║    -     ║    -       ║
║ Users   ║        ║         ║         ║          ║            ║
╚═════════╩════════╩═════════╩═════════╩══════════╩════════════╝

* = Limited to own data only
- = No access
```

### Permission Mapping

```typescript
const PERMISSIONS = {
  // User Management
  'user:create': ['ADMIN', 'MANAGER'],
  'user:read': ['ADMIN', 'MANAGER', 'ASSESSOR'],
  'user:update': ['ADMIN', 'MANAGER'],
  'user:delete': ['ADMIN'],
  
  // Student Management
  'student:create': ['ADMIN', 'MANAGER'],
  'student:read': ['ADMIN', 'MANAGER', 'ASSESSOR'],
  'student:read:own': ['USER'], // Can read own profile
  'student:update': ['ADMIN', 'MANAGER'],
  'student:delete': ['ADMIN'],
  
  // Group Management
  'group:create': ['ADMIN', 'MANAGER'],
  'group:read': ['ADMIN', 'MANAGER', 'ASSESSOR'],
  'group:update': ['ADMIN', 'MANAGER'],
  'group:delete': ['ADMIN'],
  
  // Assessment
  'assessment:create': ['ADMIN', 'MANAGER'],
  'assessment:read': ['ADMIN', 'MANAGER', 'ASSESSOR'],
  'assessment:grade': ['ADMIN', 'MANAGER', 'ASSESSOR'],
  'assessment:read:own': ['USER'], // Can read own assessments
  
  // Attendance
  'attendance:read': ['ADMIN', 'MANAGER', 'ASSESSOR'],
  'attendance:create': ['ADMIN', 'MANAGER', 'ASSESSOR'],
  'attendance:verify': ['ADMIN', 'MANAGER', 'ASSESSOR'],
  
  // Reporting
  'report:view': ['ADMIN', 'MANAGER'],
  'report:export': ['ADMIN', 'MANAGER'],
};
```

---

## API Architecture

### RESTful Endpoints

#### User Management
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - User login
POST   /api/auth/refresh           - Refresh JWT token
POST   /api/users                  - Create user (admin)
GET    /api/users                  - List users (paginated)
GET    /api/users/:id              - Get user details
PUT    /api/users/:id              - Update user
DELETE /api/users/:id              - Delete user
```

#### Student Management
```
POST   /api/students               - Create student
GET    /api/students               - List students (paginated, filterable)
GET    /api/students/:id           - Get student details
PUT    /api/students/:id           - Update student
DELETE /api/students/:id           - Delete student
GET    /api/students/:id/progress  - Get student progress
```

#### Group Management
```
POST   /api/groups                 - Create group
GET    /api/groups                 - List groups (paginated)
GET    /api/groups/:id             - Get group details
PUT    /api/groups/:id             - Update group
DELETE /api/groups/:id             - Delete group
GET    /api/groups/:id/progress    - Get group progress summary
GET    /api/groups/:id/students    - List students in group
GET    /api/groups/:id/attendance  - Get group attendance stats
```

#### Assessment Management
```
POST   /api/assessments            - Create assessment
GET    /api/assessments            - List assessments
GET    /api/assessments/:id        - Get assessment details
PUT    /api/assessments/:id        - Update assessment
DELETE /api/assessments/:id        - Delete assessment
POST   /api/assessments/:id/grade  - Submit grade
GET    /api/assessments/student/:id - Get student assessments
```

#### Session & Attendance
```
POST   /api/sessions               - Create session
GET    /api/sessions               - List sessions
GET    /api/sessions/:id           - Get session details
PUT    /api/sessions/:id           - Update session
DELETE /api/sessions/:id           - Delete session
POST   /api/attendance             - Record attendance (bulk)
GET    /api/attendance             - List attendance records
GET    /api/attendance/:id         - Get attendance details
```

### Response Format

All API responses follow standardized format:

```json
{
  "success": true,
  "data": {},
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5,
    "hasMore": true
  },
  "timestamp": "2026-02-15T10:30:00Z",
  "requestId": "abc123"
}
```

---

## Database Schema

### Indexes for Performance

```sql
-- User indexes
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_role ON "User"(role);

-- Student indexes
CREATE INDEX idx_student_email ON "Student"(email);
CREATE INDEX idx_student_group_id ON "Student"(groupId);
CREATE INDEX idx_student_status ON "Student"(status);

-- Group indexes
CREATE INDEX idx_group_code ON "Group"(code);
CREATE INDEX idx_group_status ON "Group"(status);

-- Assessment indexes
CREATE INDEX idx_assessment_student_id ON "Assessment"(studentId);
CREATE INDEX idx_assessment_status ON "Assessment"(status);
CREATE INDEX idx_assessment_outcome ON "Assessment"(outcome);

-- Attendance indexes
CREATE INDEX idx_attendance_student_id ON "Attendance"(studentId);
CREATE INDEX idx_attendance_session_id ON "Attendance"(sessionId);
CREATE INDEX idx_attendance_status ON "Attendance"(status);

-- Session indexes
CREATE INDEX idx_session_group_id ON "Session"(groupId);
CREATE INDEX idx_session_status ON "Session"(status);
CREATE INDEX idx_session_date ON "Session"(scheduledDate);

-- Compound indexes for common queries
CREATE INDEX idx_student_group_status ON "Student"(groupId, status);
CREATE INDEX idx_assessment_student_module ON "Assessment"(studentId, moduleId);
CREATE INDEX idx_attendance_student_session ON "Attendance"(studentId, sessionId);
```

### Query Performance

```sql
-- Get student progress (common query)
SELECT 
  s.id, s.email,
  COUNT(a.id) as total_assessments,
  SUM(CASE WHEN a.outcome = 'PASS' THEN 1 ELSE 0 END) as passed,
  AVG(a.percentage) as avg_score
FROM Student s
LEFT JOIN Assessment a ON s.id = a.studentId
WHERE s.groupId = $1
GROUP BY s.id
ORDER BY avg_score DESC;
```

---

## Authentication Flow

### JWT Token Generation

```
1. User submits email + password
   ↓
2. Server validates credentials with bcrypt
   ↓
3. Server generates JWT token
   - Payload: { userId, role, email, iat, exp }
   - Signing algorithm: HS256
   - Expiry: 24 hours
   ↓
4. Return token to client
   ↓
5. Client stores token in HTTP-only cookie + localStorage
   ↓
6. Client includes token in Authorization header for subsequent requests
   - Header: "Authorization: Bearer <token>"
   ↓
7. Server validates token in middleware
   - Check signature
   - Check expiry
   - Check role permissions
   ↓
8. Request proceeds to handler with decoded user info
```

### Token Refresh

```
1. Client detects token expiry (1 hour before actual)
   ↓
2. Client sends refresh request with current token
   ↓
3. Server validates existing token (allows 1 hour past expiry)
   ↓
4. Server generates new token and returns it
   ↓
5. Client updates stored token
   ↓
6. No user interruption
```

### Security Headers

```
Strict-Transport-Security: max-age=31536000
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=()
```

---

## Data Flow Examples

### Example 1: Student Enrollment & Group Assignment

```
User (Manager) Actions:
┌─────────────────────────────────────────────┐
│ 1. Create Student                           │
│    POST /api/students                       │
│    {                                        │
│      firstName: "John",                     │
│      lastName: "Doe",                       │
│      email: "john.doe@example.com",         │
│      enrollmentDate: "2026-02-15"           │
│    }                                        │
└─────────────────────────────────────────────┘
              ↓ (validation)
        ┌─────────────────────┐
        │ Validate email      │
        │ Check uniqueness    │
        │ Verify phone format │
        └─────────────────────┘
              ↓ (success)
        ┌─────────────────────────────────────────┐
        │ 2. Database Insert                      │
        │    INSERT INTO Student (...)            │
        │    VALUES (...)                         │
        │    RETURNING id, email, groupId, ...    │
        └─────────────────────────────────────────┘
              ↓ (success - Student created with id: s-123)
        ┌─────────────────────────────────────────┐
        │ 3. Return Created Response              │
        │    201 Created                          │
        │    {                                    │
        │      success: true,                     │
        │      data: { id: "s-123", ... }         │
        │    }                                    │
        └─────────────────────────────────────────┘

Manager Assigns to Group:
┌─────────────────────────────────────────────┐
│ 4. Update Student with Group                │
│    PUT /api/students/s-123                  │
│    { groupId: "g-456" }                     │
└─────────────────────────────────────────────┘
              ↓ (validation)
        ┌─────────────────────────────────────┐
        │ Verify group exists                 │
        │ Check group capacity                │
        │ Validate group status is ACTIVE     │
        └─────────────────────────────────────┘
              ↓ (success)
        ┌─────────────────────────────────────┐
        │ Database Update                     │
        │ UPDATE Student SET groupId = g-456  │
        │ UPDATE Group SET currentCapacity... │
        └─────────────────────────────────────┘
              ↓ (success)
        ┌─────────────────────────────────────┐
        │ Return Updated Response             │
        │ 200 OK with updated student record  │
        └─────────────────────────────────────┘
```

### Example 2: Assessment Submission & Grading

```
Student Actions:
┌──────────────────────────────────┐
│ 1. View Assessment               │
│    GET /api/assessments/a-789    │
│    Response includes:            │
│    - Title, description          │
│    - Due date, assessment type   │
│    - Passing score required      │
└──────────────────────────────────┘

┌──────────────────────────────────────────┐
│ 2. Submit Assessment                     │
│    PUT /api/assessments/a-789            │
│    {                                     │
│      status: "SUBMITTED",                │
│      submittedDate: "2026-02-15T09:30Z"  │
│    }                                     │
└──────────────────────────────────────────┘
         ↓ (validation check)
    ┌─────────────────────────────┐
    │ Check submission deadline   │
    │ Verify student enrolled     │
    │ Confirm assessment pending  │
    └─────────────────────────────┘
         ↓ (success)
    ┌─────────────────────────────┐
    │ Update status: SUBMITTED    │
    │ Set submittedDate          │
    │ Creates log entry           │
    └─────────────────────────────┘

Assessor Actions (Later):
┌──────────────────────────────────────────┐
│ 3. Grade Assessment                      │
│    POST /api/assessments/a-789/grade     │
│    {                                     │
│      score: 82,                          │
│      feedback: "Good work! Points off.."|
│      outcome: "PASS"                     │
│    }                                     │
└──────────────────────────────────────────┘
         ↓ (validation)
    ┌─────────────────────────────┐
    │ Verify assessor permission  │
    │ Check score 0-100 range     │
    │ Calculate percentage        │
    │ Determine pass/fail         │
    └─────────────────────────────┘
         ↓ (success: 82% > 70% pass threshold)
    ┌─────────────────────────────┐
    │ Update Assessment:          │
    │ - status: GRADED            │
    │ - score: 82                 │
    │ - percentage: 82            │
    │ - outcome: PASS             │
    │ - feedback: "..."           │
    │ - gradedDate: now()         │
    └─────────────────────────────┘
         ↓
    ┌─────────────────────────────┐
    │ Return 200 OK               │
    │ Send notification to student│
    └─────────────────────────────┘

Student Views Result:
┌──────────────────────────────────┐
│ 4. Check Assessment Result       │
│    GET /api/assessments/a-789    │
│    - Score: 82%                  │
│    - Outcome: PASS               │
│    - Feedback visible            │
│    - Next steps (complete!)      │
└──────────────────────────────────┘
```

### Example 3: Attendance Tracking

```
Session Occurs:
┌──────────────────────────────────────────┐
│ 1. Session Created & Scheduled           │
│    POST /api/sessions                    │
│    {                                     │
│      title: "Module 1 Class",            │
│      groupId: "g-456",                   │
│      startTime: "2026-02-16T09:00Z",     │
│      endTime: "2026-02-16T12:00Z",       │
│      sessionType: "CLASS"                │
│    }                                     │
└──────────────────────────────────────────┘
         ↓ creates session with status: SCHEDULED

During Session:
┌──────────────────────────────────────────┐
│ 2. Record Attendance (Facilitator)       │
│    POST /api/attendance                  │
│    {                                     │
│      sessionId: "s-999",                 │
│      groupId: "g-456",                   │
│      "attendance": [                     │
│        {                                 │
│          studentId: "st-123",            │
│          status: "PRESENT",              │
│          timeIn: "2026-02-16T09:05Z"     │
│        },                                │
│        {                                 │
│          studentId: "st-124",            │
│          status: "LATE",                 │
│          timeIn: "2026-02-16T09:45Z"     │
│        },                                │
│        {                                 │
│          studentId: "st-125",            │
│          status: "ABSENT"                │
│        }                                 │
│      ]                                   │
│    }                                     │
└──────────────────────────────────────────┘
         ↓ (validation)
    ┌──────────────────────────────────────┐
    │ GET group students (from g-456)      │
    │ Verify all students in group         │
    │ Check one record per student per ...│
    │ Validate status values              │
    │ Check timeIn before timeOut         │
    └──────────────────────────────────────┘
         ↓ (success - all validations pass)
    ┌──────────────────────────────────────┐
    │ Bulk Insert Attendance Records       │
    │ INSERT INTO Attendance (...)         │
    │ VALUES                               │
    │ (st-123, s-999, g-456, PRESENT, ...), │
    │ (st-124, s-999, g-456, LATE, ...),    │
    │ (st-125, s-999, g-456, ABSENT, ...)   │
    └──────────────────────────────────────┘
         ↓ (success)
    ┌──────────────────────────────────────┐
    │ 3. Return Success Response           │
    │    {                                 │
    │      success: true,                  │
    │      data: {                         │
    │        recorded: 3,                  │
    │        failed: 0                     │
    │      }                               │
    │    }                                 │
    └──────────────────────────────────────┘

Manager Reviews Attendance:
┌──────────────────────────────────────────┐
│ 4. View Group Attendance Report          │
│    GET /api/groups/g-456/attendance      │
│    Returns attendance statistics:        │
│    - Total sessions: 15                  │
│    - Present: 42/45 (93%)               │
│    - Late: 2/45 (4%)                    │
│    - Absent: 1/45 (2%)                  │
│    - Per-student breakdown               │
└──────────────────────────────────────────┘
```

---

## Scalability & Performance

### Caching Strategy

```
Level 1 - Application Cache (Redis)
├─ User roles & permissions (1 hour TTL)
├─ Group details (1 day TTL)
├─ Student list by group (1 hour TTL)
├─ Module curriculum (30 days TTL)
└─ Assessment passing scores (30 days TTL)

Level 2 - Database Query Optimization
├─ Connection pooling (max 20)
├─ Query result pagination (20-100 items)
├─ Index on frequently filtered columns
└─ Lazy loading of relations

Level 3 - CDN (Static Assets)
├─ API documentation
├─ Client JavaScript bundles
└─ Images and static files
```

### Load Testing Results (Expected)

```
Single Server (8GB RAM, 4 CPU):
- Concurrent Users: 500
- Requests/Second: 2,000
- Average Response Time: 150ms
- 95th Percentile Latency: 500ms
- Error Rate: <0.1%

With Load Balancer (3 servers):
- Concurrent Users: 1,500
- Requests/Second: 6,000
- Maintains same response times
- Automatic failover
```

### Horizontal Scaling

```
Phase 1: Single Server
├─ Application + Database on same server
└─ Suitable for <1,000 active users

Phase 2: Separated Services
├─ Application servers (2-4)
├─ Dedicated database server
└─ Redis cache
└─ Suitable for 1,000-10,000 active users

Phase 3: Distributed System
├─ Application servers (4-8) behind load balancer
├─ Database with read replicas
├─ Redis cluster for caching
├─ Message queue (RabbitMQ/Kafka)
├─ Dedicated monitoring & logging
└─ Suitable for 10,000+ active users
```

---

## Security Architecture

### Data Protection

```
Encryption Levels:
- Passwords: bcryptjs (10 salt rounds)
- Tokens: JWT HS256 signed
- Database queries: Parameterized (Prisma)
- In Transit: HTTPS/TLS 1.3
- At Rest: Database encryption (optional)
```

### Access Control

```
Authentication:
- Email/Password login with JWT
- 24-hour token expiry
- HTTP-only cookie storage
- Rate limiting: 5 attempts/15 min

Authorization:
- Role-based access control (RBAC)
- Permission verification on each request
- Scope validation (can only access own data)
- Data isolation at query level
```

### Audit Trail

```
Logged Events:
- User login/logout
- Account modifications
- Grade submissions
- Attendance changes
- Bulk operations
- Administrative actions

Retention: 12 months minimum
Storage: Separate audit log database
```

---

## Conclusion

This comprehensive architecture provides:
- **Scalable Design**: From single server to distributed systems
- **Secure Foundation**: Multiple security layers from auth to data protection
- **Performance**: Indexed queries, caching, connection pooling
- **Maintainability**: Clear separation of concerns, documented APIs
- **Flexibility**: Supports various user roles and permission models
- **Extensibility**: Easy to add new features and modules

The system is production-ready and supports learnership management at scale.
