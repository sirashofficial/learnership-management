# COMPLETE SYSTEM ARCHITECTURE OVERVIEW

## EXECUTIVE SUMMARY

**Application Type:** SSETA NVC Level 2 Learnership Management System  
**Primary Purpose:** Training management for facilitators to track students, groups, attendance, assessments, and curriculum delivery  
**Current State:** Phase 3 Complete - Production-ready with optimizations

---

## 1. PROJECT STRUCTURE

```
Learnership Management/
â”‚
â”œâ”€â”€ ðŸ“ src/                          # Source code (Next.js App Router)
â”‚   â”œâ”€â”€ ðŸ“ app/                      # Frontend Pages (Route-based)
â”‚   â”‚   â”œâ”€â”€ page.tsx                 # Dashboard (/)
â”‚   â”‚   â”œâ”€â”€ layout.tsx               # Root layout with providers
â”‚   â”‚   â”œâ”€â”€ loading.tsx              # Dashboard loading skeleton
â”‚   â”‚   â”œâ”€â”€ globals.css              # Global styles
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ ðŸ“ students/             # Student management
â”‚   â”‚   â”‚   â”œâ”€â”€ page.tsx             # Students list page
â”‚   â”‚   â”‚   â””â”€â”€ loading.tsx          # Loading skeleton
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ ðŸ“ groups/               # Group management
â”‚   â”‚   â”‚   â””â”€â”€ page.tsx
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ ðŸ“ attendance/           # Attendance tracking
â”‚   â”‚   â”‚   â””â”€â”€ page.tsx
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ ðŸ“ assessments/          # Assessment management
â”‚   â”‚   â”‚   â”œâ”€â”€ page.tsx
â”‚   â”‚   â”‚   â””â”€â”€ loading.tsx
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ ðŸ“ timetable/            # Schedule/Calendar
â”‚   â”‚   â”‚   â”œâ”€â”€ page.tsx
â”‚   â”‚   â”‚   â”œâ”€â”€ page.tsx.backup      # Backup version
â”‚   â”‚   â”‚   â””â”€â”€ loading.tsx
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ ðŸ“ progress/             # Progress tracking
â”‚   â”‚   â”‚   â””â”€â”€ page.tsx
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ ðŸ“ curriculum/           # Curriculum library
â”‚   â”‚   â”‚   â””â”€â”€ page.tsx
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ ðŸ“ lessons/              # Lesson planner
â”‚   â”‚   â”‚   â””â”€â”€ page.tsx
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ ðŸ“ poe/                  # Portfolio of Evidence
â”‚   â”‚   â”‚   â””â”€â”€ page.tsx
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ ðŸ“ compliance/           # Compliance tracking
â”‚   â”‚   â”‚   â””â”€â”€ page.tsx
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ ðŸ“ settings/             # User settings
â”‚   â”‚   â”‚   â””â”€â”€ page.tsx
â”‚   â”‚   â”‚
â”‚   â”‚   â”œâ”€â”€ ðŸ“ admin/                # Admin area
â”‚   â”‚   â”‚   â”œâ”€â”€ page.tsx             # Admin dashboard
â”‚   â”‚   â”‚   â””â”€â”€ ðŸ“ users/
â”‚   â”‚   â”‚       â””â”€â”€ page.tsx         # User management
â”‚   â”‚   â”‚
â”‚   â”‚   â””â”€â”€ ðŸ“ api/                  # **BACKEND API ROUTES**
â”‚   â”‚       â”œâ”€â”€ ðŸ“ students/         # Student CRUD
â”‚   â”‚       â”‚   â”œâ”€â”€ route.ts         # GET, POST students
â”‚   â”‚       â”‚   â””â”€â”€ [id]/route.ts    # GET, PATCH, DELETE by ID
â”‚   â”‚       â”œâ”€â”€ ðŸ“ groups/           # Group CRUD
â”‚   â”‚       â”‚   â”œâ”€â”€ route.ts
â”‚   â”‚       â”‚   â””â”€â”€ [id]/route.ts
â”‚   â”‚       â”œâ”€â”€ ðŸ“ attendance/       # Attendance API
â”‚   â”‚       â”‚   â”œâ”€â”€ route.ts
â”‚   â”‚       â”‚   â””â”€â”€ history/route.ts
â”‚   â”‚       â”œâ”€â”€ ðŸ“ assessments/      # Assessment API
â”‚   â”‚       â”‚   â””â”€â”€ route.ts
â”‚   â”‚       â”œâ”€â”€ ðŸ“ lessons/          # Lesson plans API
â”‚   â”‚       â”‚   â””â”€â”€ route.ts
â”‚   â”‚       â”œâ”€â”€ ðŸ“ timetable/        # Schedule API
â”‚   â”‚       â”‚   â”œâ”€â”€ route.ts
â”‚   â”‚       â”‚   â””â”€â”€ [id]/route.ts
â”‚   â”‚       â”œâ”€â”€ ðŸ“ poe/              # POE API
â”‚   â”‚       â”‚   â””â”€â”€ route.ts
â”‚   â”‚       â”œâ”€â”€ ðŸ“ recurring-sessions/ # Recurring schedule
â”‚   â”‚       â”‚   â””â”€â”€ route.ts
â”‚   â”‚       â”œâ”€â”€ ðŸ“ dashboard/        # Dashboard data
â”‚   â”‚       â”‚   â”œâ”€â”€ stats/route.ts
â”‚   â”‚       â”‚   â””â”€â”€ schedule/route.ts
â”‚   â”‚       â”œâ”€â”€ ðŸ“ settings/         # User settings
â”‚   â”‚       â”‚   â”œâ”€â”€ profile/route.ts
â”‚   â”‚       â”‚   â””â”€â”€ security/route.ts
â”‚   â”‚       â””â”€â”€ ðŸ“ auth/             # Authentication
â”‚   â”‚           â”œâ”€â”€ login/route.ts
â”‚   â”‚           â””â”€â”€ register/route.ts
â”‚   â”‚
â”‚   â”œâ”€â”€ ðŸ“ components/               # **REUSABLE UI COMPONENTS**
â”‚   â”‚   â”œâ”€â”€ Sidebar.tsx              # Main navigation
â”‚   â”‚   â”œâ”€â”€ Header.tsx               # Page headers
â”‚   â”‚   â”œâ”€â”€ DashboardStats.tsx       # Stats cards
â”‚   â”‚   â”œâ”€â”€ DashboardCharts.tsx      # Charts (lazy loaded)
â”‚   â”‚   â”œâ”€â”€ DashboardAlerts.tsx      # Alert system (lazy loaded)
â”‚   â”‚   â”œâ”€â”€ TodaysSchedule.tsx       # Today's lessons (lazy loaded)
â”‚   â”‚   â”œâ”€â”€ RecentActivity.tsx       # Activity feed (lazy loaded)
â”‚   â”‚   â”œâ”€â”€ QuickActions.tsx         # Quick action buttons
â”‚   â”‚   â”œâ”€â”€ AddStudentModal.tsx      # Add/edit student
â”‚   â”‚   â”œâ”€â”€ StudentDetailsModal.tsx  # Student details
â”‚   â”‚   â”œâ”€â”€ StudentProgressModal.tsx # Progress tracking
â”‚   â”‚   â”œâ”€â”€ GroupModal.tsx           # Add/edit group
â”‚   â”‚   â”œâ”€â”€ GroupsManagement.tsx     # Group management UI
â”‚   â”‚   â”œâ”€â”€ ScheduleLessonModal.tsx  # Schedule lesson
â”‚   â”‚   â”œâ”€â”€ MarkAttendanceModal.tsx  # Quick attendance
â”‚   â”‚   â”œâ”€â”€ AttendanceCalendar.tsx   # Calendar view
â”‚   â”‚   â”œâ”€â”€ LessonDetailsModal.tsx   # Lesson details
â”‚   â”‚   â”œâ”€â”€ AddLessonModal.tsx       # Add/edit lesson
â”‚   â”‚   â”œâ”€â”€ MonthView.tsx            # Monthly calendar
â”‚   â”‚   â”œâ”€â”€ ListView.tsx             # List view
â”‚   â”‚   â”œâ”€â”€ TimelineView.tsx         # Timeline view
â”‚   â”‚   â”œâ”€â”€ FilterPanel.tsx          # Filter controls
â”‚   â”‚   â””â”€â”€ ErrorBoundary.tsx        # Error handling
â”‚   â”‚
â”‚   â”œâ”€â”€ ðŸ“ contexts/                 # **STATE MANAGEMENT**
â”‚   â”‚   â”œâ”€â”€ AuthContext.tsx          # Authentication state
â”‚   â”‚   â”œâ”€â”€ GroupsContext.tsx        # Groups state
â”‚   â”‚   â”œâ”€â”€ StudentContext.tsx       # Student state (full)
â”‚   â”‚   â””â”€â”€ StudentContextSimple.tsx # Student state (simple)
â”‚   â”‚
â”‚   â”œâ”€â”€ ðŸ“ hooks/                    # **CUSTOM HOOKS**
â”‚   â”‚   â”œâ”€â”€ useStudents.ts           # Fetch students data
â”‚   â”‚   â”œâ”€â”€ useGroups.ts             # Fetch groups data
â”‚   â”‚   â”œâ”€â”€ useAttendance.ts         # Fetch attendance
â”‚   â”‚   â”œâ”€â”€ useAssessmentStats.ts    # Assessment stats
â”‚   â”‚   â”œâ”€â”€ useCurriculum.ts         # Curriculum data
â”‚   â”‚   â”œâ”€â”€ useProgress.ts           # Progress tracking
â”‚   â”‚   â””â”€â”€ useDashboard.ts          # Dashboard data
â”‚   â”‚
â”‚   â””â”€â”€ ðŸ“ lib/                      # **UTILITIES & HELPERS**
â”‚       â”œâ”€â”€ prisma.ts                # Database client singleton
â”‚       â”œâ”€â”€ auth.ts                  # JWT authentication
â”‚       â”œâ”€â”€ api-utils.ts             # API response helpers
â”‚       â”œâ”€â”€ validations.ts           # Zod validation schemas
â”‚       â”œâ”€â”€ logger.ts                # Structured logging
â”‚       â”œâ”€â”€ rate-limiter.ts          # Rate limiting
â”‚       â”œâ”€â”€ sanitize.ts              # Input sanitization
â”‚       â””â”€â”€ utils.ts                 # General utilities
â”‚
â”œâ”€â”€ ðŸ“ prisma/                       # **DATABASE**
â”‚   â”œâ”€â”€ schema.prisma                # Database schema (SQLite)
â”‚   â”œâ”€â”€ dev.db                       # SQLite database file
â”‚   â”œâ”€â”€ seed.ts                      # Sample data seeder
â”‚   â”œâ”€â”€ add-indexes.ts               # Performance indexes script
â”‚   â”œâ”€â”€ migrate-data.ts              # Migration script (Siteâ†’Group)
â”‚   â””â”€â”€ ðŸ“ migrations/
â”‚       â””â”€â”€ add_performance_indexes.sql
â”‚
â”œâ”€â”€ ðŸ“ docs/                         # Documentation
â”‚   â”œâ”€â”€ GETTING_STARTED.md
â”‚   â””â”€â”€ BACKEND_SETUP.md
â”‚
â”œâ”€â”€ ðŸ“ public/                       # Static assets
â”‚
â”œâ”€â”€ ðŸ“„ Configuration Files
â”‚   â”œâ”€â”€ package.json                 # Dependencies
â”‚   â”œâ”€â”€ tsconfig.json                # TypeScript config
â”‚   â”œâ”€â”€ next.config.mjs              # Next.js config
â”‚   â”œâ”€â”€ tailwind.config.ts           # Tailwind CSS
â”‚   â”œâ”€â”€ postcss.config.mjs           # PostCSS
â”‚   â”œâ”€â”€ .eslintrc.json               # ESLint rules
â”‚   â”œâ”€â”€ .env.example                 # Environment template
â”‚   â”œâ”€â”€ .env                         # Environment variables
â”‚   â””â”€â”€ .env.local                   # Local overrides
â”‚
â””â”€â”€ ðŸ“„ Utility Scripts
    â”œâ”€â”€ check-db.js                  # Database checker
    â”œâ”€â”€ check-status.js              # System status
    â”œâ”€â”€ check-groups.js              # Groups checker
    â”œâ”€â”€ make-admin.js                # Make user admin
    â””â”€â”€ show-data-source.js          # Data source viewer
```

---

## 2. TECHNOLOGY STACK

### **Frontend**

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.2.23 | React framework with App Router |
| React | 18.3.1 | UI library |
| TypeScript | 5.4.5 | Type safety |
| Tailwind CSS | 3.4.1 | Utility-first CSS |
| Lucide React | 0.344.0 | Icon library |
| SWR | 2.2.5 | Data fetching & caching |
| date-fns | 3.3.1 | Date manipulation |
| Recharts | 2.12.2 | Charting library |

### **Backend**

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js API Routes | 14.2.23 | Backend API |
| Prisma ORM | 5.11.0 | Database ORM |
| SQLite | - | Development database |
| bcryptjs | 2.4.3 | Password hashing |
| jsonwebtoken | 9.0.2 | JWT authentication |
| Zod | 3.22.4 | Schema validation |

### **State Management**

- **React Context API** - Global state (Auth, Groups, Students)
- **SWR** - Server state caching with:
  - Stale-while-revalidate strategy
  - Request deduplication
  - Automatic revalidation
  - Optimistic updates

### **Routing**

- **Next.js App Router** - File-based routing with:
  - Server components
  - Client components (`'use client'`)
  - Dynamic routes `[id]`
  - API routes in `/api`

### **CSS Framework**

- **Tailwind CSS 3.4** with:
  - Dark mode support
  - Custom color palette
  - Responsive utilities
  - Custom animations

---

## 3. DATABASE SCHEMA

**Database Type:** SQLite (dev.db)  
**ORM:** Prisma  
**Location:** `prisma/dev.db`

### **Tables & Relationships**

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                     DATABASE SCHEMA DIAGRAM                       â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”       â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”       â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   Company   â”‚â—„â”€â”€â”€â”€â”€â”€â”‚    Group    â”‚â”€â”€â”€â”€â”€â”€â–ºâ”‚   Student   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜       â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜       â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                             â”‚                      â”‚
                             â”‚                      â”‚
                             â–¼                      â–¼
                      â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”       â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                      â”‚   Session   â”‚       â”‚ Attendance  â”‚
                      â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜       â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                             â”‚                      â”‚
                             â”‚                      â”‚
                             â–¼                      â–¼
                      â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”       â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                      â”‚ LessonPlan  â”‚       â”‚ Assessment  â”‚
                      â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜       â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                                   â”‚
                                                   â–¼
                                            â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                                            â”‚POEChecklist â”‚
                                            â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### **Detailed Table Schemas**

#### **1. User**

```prisma
User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String
  password      String
  role          String    @default("FACILITATOR")
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  students      Student[]
  lessonPlans   LessonPlan[]
  sessions      Session[]
}
```

**Indexes:** email (unique)

---

#### **2. Company**

```prisma
Company {
  id            String    @id @default(uuid())
  name          String    @unique
  contactPerson String?
  email         String?
  phone         String?
  address       String?
  industry      String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  groups        Group[]
}
```

**Indexes:** name (unique)

---

#### **3. Group**

```prisma
Group {
  id            String    @id @default(uuid())
  name          String
  contactName   String?
  contactPhone  String?
  coordinator   String?
  startDate     DateTime
  endDate       DateTime
  status        String    @default("ACTIVE")
  notes         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Foreign Keys
  companyId     String?
  
  // Relations
  company       Company?  @relation(fields: [companyId], references: [id])
  students      Student[]
  sessions      Session[]
  lessonPlans   LessonPlan[]
  courses       GroupCourse[]
}
```

**Indexes:** 
- `companyId` (performance)
- `status` (performance)

---

#### **4. Student**

```prisma
Student {
  id            String    @id @default(uuid())
  studentId     String    @unique
  firstName     String
  lastName      String
  email         String?
  phone         String?
  idNumber      String?
  progress      Int       @default(0)
  status        String    @default("ACTIVE")
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Foreign Keys
  groupId       String
  facilitatorId String
  
  // Relations
  group         Group     @relation(fields: [groupId], references: [id])
  facilitator   User      @relation(fields: [facilitatorId], references: [id])
  attendance    Attendance[]
  assessments   Assessment[]
  poeChecklist  POEChecklist?
  progress      CourseProgress[]
}
```

**Indexes:**
- `studentId` (unique)
- `groupId` (performance)
- `status` (performance)
- `email` (performance)

---

#### **5. Session**

```prisma
Session {
  id            String    @id @default(uuid())
  title         String
  date          DateTime
  startTime     String
  endTime       String
  module        String
  venue         String?
  notes         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Foreign Keys
  groupId       String
  facilitatorId String
  
  // Relations
  group         Group     @relation(fields: [groupId], references: [id])
  facilitator   User      @relation(fields: [facilitatorId], references: [id])
}
```

**Indexes:**
- `groupId` (performance)
- `date` (performance)

---

#### **6. Attendance**

```prisma
Attendance {
  id            String    @id @default(uuid())
  date          DateTime
  status        String    // PRESENT, ABSENT, LATE, EXCUSED
  reason        String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Foreign Keys
  studentId     String
  
  // Relations
  student       Student   @relation(fields: [studentId], references: [id])
}
```

**Indexes:**
- `studentId` (performance)
- `date` (performance)
- `status` (performance)
- `studentId, date` (composite for unique lookup)

---

#### **7. Assessment**

```prisma
Assessment {
  id            String    @id @default(uuid())
  title         String
  assessmentType String
  method        String
  date          DateTime
  score         Int?
  result        String?
  feedback      String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Foreign Keys
  studentId     String
  moduleId      String?
  
  // Relations
  student       Student   @relation(fields: [studentId], references: [id])
}
```

**Indexes:**
- `studentId` (performance)
- `moduleId` (performance)
- `date` (performance)

---

#### **8. LessonPlan**

```prisma
LessonPlan {
  id            String    @id @default(uuid())
  title         String
  date          DateTime
  startTime     String
  endTime       String
  venue         String?
  objectives    String?
  activities    String?
  materials     String?
  assessment    String?
  description   String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Foreign Keys
  groupId       String
  moduleId      String
  facilitatorId String
  
  // Relations
  group         Group     @relation(fields: [groupId], references: [id])
  module        Module    @relation(fields: [moduleId], references: [id])
  facilitator   User      @relation(fields: [facilitatorId], references: [id])
}
```

**Indexes:**
- `groupId` (performance)
- `moduleId` (performance)
- `date` (performance)

---

#### **9. POEChecklist**

```prisma
POEChecklist {
  id            String    @id @default(uuid())
  module1POE    Boolean   @default(false)
  module2POE    Boolean   @default(false)
  module3POE    Boolean   @default(false)
  module4POE    Boolean   @default(false)
  module5POE    Boolean   @default(false)
  module6POE    Boolean   @default(false)
  assessmentSigned Boolean @default(false)
  logbookComplete  Boolean @default(false)
  status        String    @default("NOT_STARTED")
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Foreign Keys
  studentId     String    @unique
  
  // Relations
  student       Student   @relation(fields: [studentId], references: [id])
}
```

**Indexes:**
- `studentId` (unique)
- `status` (performance)

---

#### **10. Module**

```prisma
Module {
  id            String    @id @default(uuid())
  name          String
  code          String
  description   String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Foreign Keys
  courseId      String
  
  // Relations
  course        Course    @relation(fields: [courseId], references: [id])
  lessonPlans   LessonPlan[]
  unitStandards UnitStandard[]
}
```

**Indexes:**
- `courseId` (performance)

---

#### **11. Course**

```prisma
Course {
  id            String    @id @default(uuid())
  name          String
  modules       Json      // Flexible structure
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  modules       Module[]
  groupCourses  GroupCourse[]
}
```

---

#### **12. GroupCourse**

```prisma
GroupCourse {
  id                String    @id @default(uuid())
  plannedStartDate  DateTime
  plannedEndDate    DateTime
  actualStartDate   DateTime?
  actualEndDate     DateTime?
  status            String
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Foreign Keys
  groupId           String
  courseId          String
  
  // Relations
  group             Group     @relation(fields: [groupId], references: [id])
  course            Course    @relation(fields: [courseId], references: [id])
  progress          CourseProgress[]
}
```

---

#### **13. CourseProgress**

```prisma
CourseProgress {
  id            String    @id @default(uuid())
  moduleIndex   Int
  status        String
  completedDate DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Foreign Keys
  studentId     String
  groupCourseId String
  
  // Relations
  student       Student   @relation(fields: [studentId], references: [id])
  groupCourse   GroupCourse @relation(fields: [groupCourseId], references: [id])
}
```

---

### **Database Performance**

**17 Performance Indexes Added:**
- Student: 3 indexes (groupId, status, email)
- Attendance: 4 indexes (studentId, date, status, composite)
- Assessment: 3 indexes (studentId, moduleId, date)
- Session: 2 indexes (groupId, date)
- POEChecklist: 2 indexes (studentId, status)
- Group: 2 indexes (companyId, status)
- LessonPlan: 3 indexes (groupId, moduleId, date)

---

## 4. API/BACKEND ENDPOINTS

### **Authentication Endpoints**

| Method | Endpoint | Purpose | Request Body | Response | Tables |
|--------|----------|---------|--------------|----------|--------|
| POST | `/api/auth/login` | User login | `{ email, password }` | `{ token, user }` | User |
| POST | `/api/auth/register` | New user registration | `{ email, name, password, role }` | `{ token, user }` | User |

---

### **Student Endpoints**

| Method | Endpoint | Purpose | Request Body | Response | Tables |
|--------|----------|---------|--------------|----------|--------|
| GET | `/api/students` | List all students | - | `{ data: Student[] }` | Student, Group, User |
| GET | `/api/students/[id]` | Get student details | - | `{ data: Student }` | Student, Attendance, Assessment, POEChecklist |
| POST | `/api/students` | Create new student | `{ firstName, lastName, studentId, groupId, email?, phone? }` | `{ data: Student }` | Student |
| PATCH | `/api/students/[id]` | Update student | `{ firstName?, lastName?, email?, phone?, progress?, status? }` | `{ data: Student }` | Student |
| DELETE | `/api/students/[id]` | Delete student | - | `{ success: true }` | Student |

---

### **Group Endpoints**

| Method | Endpoint | Purpose | Request Body | Response | Tables |
|--------|----------|---------|--------------|----------|--------|
| GET | `/api/groups` | List all groups | - | `{ data: Group[] }` | Group, Company, Student (count) |
| GET | `/api/groups/[id]` | Get group details | - | `{ data: Group }` | Group, Student, Session |
| POST | `/api/groups` | Create new group | `{ name, companyId?, startDate, endDate, contactName?, coordinator? }` | `{ data: Group }` | Group |
| PATCH | `/api/groups/[id]` | Update group | `{ name?, status?, endDate?, notes? }` | `{ data: Group }` | Group |
| DELETE | `/api/groups/[id]` | Archive group | - | `{ success: true }` | Group |

---

### **Attendance Endpoints**

| Method | Endpoint | Purpose | Request Body | Response | Tables |
|--------|----------|---------|--------------|----------|--------|
| GET | `/api/attendance` | Get attendance records | `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` | `{ data: Attendance[] }` | Attendance, Student |
| GET | `/api/attendance/history` | Get historical data | `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` | `{ data: AttendanceHistory[] }` | Attendance, Student |
| POST | `/api/attendance` | Mark attendance | `{ studentId, date, status, reason? }` | `{ data: Attendance }` | Attendance |

---

### **Assessment Endpoints**

| Method | Endpoint | Purpose | Request Body | Response | Tables |
|--------|----------|---------|--------------|----------|--------|
| GET | `/api/assessments` | List assessments | `?studentId=uuid` | `{ data: Assessment[] }` | Assessment, Student |
| POST | `/api/assessments` | Create assessment | `{ studentId, title, assessmentType, method, date, score?, result?, feedback? }` | `{ data: Assessment }` | Assessment |
| PATCH | `/api/assessments/[id]` | Update assessment | `{ score?, result?, feedback? }` | `{ data: Assessment }` | Assessment |

---

### **Timetable/Lesson Endpoints**

| Method | Endpoint | Purpose | Request Body | Response | Tables |
|--------|----------|---------|--------------|----------|--------|
| GET | `/api/timetable` | Get lessons for date range | `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` | `{ lessons: LessonPlan[] }` | LessonPlan, Group, Module, User |
| GET | `/api/timetable/[id]` | Get lesson details | - | `{ data: LessonPlan }` | LessonPlan |
| POST | `/api/timetable` | Create lesson | `{ title, date, startTime, endTime, groupId, moduleId, venue?, objectives? }` | `{ data: LessonPlan }` | LessonPlan |
| PATCH | `/api/timetable/[id]` | Update lesson | `{ title?, date?, startTime?, endTime? }` | `{ data: LessonPlan }` | LessonPlan |
| DELETE | `/api/timetable/[id]` | Delete lesson | - | `{ success: true }` | LessonPlan |

---

### **Session Endpoints**

| Method | Endpoint | Purpose | Request Body | Response | Tables |
|--------|----------|---------|--------------|----------|--------|
| GET | `/api/recurring-sessions` | Get recurring sessions | - | `{ data: Session[] }` | Session |
| POST | `/api/recurring-sessions` | Create recurring sessions | `{ groupId, title, module, startTime, endTime, dayOfWeek, venue? }` | `{ data: Session[] }` | Session |

---

### **POE Endpoints**

| Method | Endpoint | Purpose | Request Body | Response | Tables |
|--------|----------|---------|--------------|----------|--------|
| GET | `/api/poe` | Get POE checklists | - | `{ data: POEChecklist[] }` | POEChecklist, Student |
| POST | `/api/poe` | Create/Update POE | `{ studentId, module1POE?, module2POE?, ..., status? }` | `{ data: POEChecklist }` | POEChecklist |

---

### **Dashboard Endpoints**

| Method | Endpoint | Purpose | Request Body | Response | Tables |
|--------|----------|---------|--------------|----------|--------|
| GET | `/api/dashboard/stats` | Get dashboard statistics | - | `{ totalStudents, activeGroups, pendingAssessments, averageProgress, atRiskStudents, upcomingSessions }` | Student, Group, Assessment, Attendance, Session |
| GET | `/api/dashboard/schedule` | Get today's schedule | `?date=YYYY-MM-DD` | `{ schedule: ScheduleItem[] }` | LessonPlan, Session, Group, User |

---

### **Settings Endpoints**

| Method | Endpoint | Purpose | Request Body | Response | Tables |
|--------|----------|---------|--------------|----------|--------|
| GET | `/api/settings/profile` | Get user profile | - | `{ name, email, role }` | User |
| POST | `/api/settings/profile` | Update profile | `{ name?, email? }` | `{ data: User }` | User |
| POST | `/api/settings/security` | Change password | `{ currentPassword, newPassword }` | `{ success: true }` | User |

---

### **API Response Format**

**Success:**
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## 5. FRONTEND PAGES/COMPONENTS

### **Page Hierarchy**

```
/ (Dashboard)
â”œâ”€â”€ /students (Student Management)
â”œâ”€â”€ /groups (Group Management)
â”œâ”€â”€ /attendance (Attendance Tracking)
â”œâ”€â”€ /assessments (Assessment Management)
â”œâ”€â”€ /timetable (Schedule/Calendar)
â”œâ”€â”€ /progress (Progress Reports)
â”œâ”€â”€ /curriculum (Curriculum Library)
â”œâ”€â”€ /lessons (Lesson Planner)
â”œâ”€â”€ /poe (Portfolio of Evidence)
â”œâ”€â”€ /compliance (Compliance Tracking)
â”œâ”€â”€ /settings (User Settings)
â””â”€â”€ /admin
    â”œâ”€â”€ / (Admin Dashboard)
    â””â”€â”€ /users (User Management)
```

---

### **Component Map**

#### **Layout Components**

| Component | Used On | Purpose |
|-----------|---------|---------|
| `Sidebar.tsx` | All pages | Main navigation |
| `Header.tsx` | All pages | Page title & breadcrumbs |
| `ErrorBoundary.tsx` | All pages | Error handling |

---

#### **Dashboard Components**

| Component | Used On | Purpose | Data Source |
|-----------|---------|---------|-------------|
| `DashboardStats.tsx` | Dashboard | Stats cards | `/api/dashboard/stats` |
| `DashboardCharts.tsx` | Dashboard | Progress charts | `/api/dashboard/stats` |
| `DashboardAlerts.tsx` | Dashboard | Alert system | `/api/dashboard/stats` |
| `TodaysSchedule.tsx` | Dashboard | Today's lessons | `/api/dashboard/schedule` |
| `RecentActivity.tsx` | Dashboard | Activity feed | `/api/dashboard/stats` |
| `QuickActions.tsx` | Dashboard | Quick buttons | - |

---

#### **Modal Components**

| Component | Used On | Purpose | API Calls |
|-----------|---------|---------|-----------|
| `AddStudentModal.tsx` | Students, Dashboard | Add/edit student | POST/PATCH `/api/students` |
| `StudentDetailsModal.tsx` | Students | View/edit details | GET `/api/students/[id]` |
| `StudentProgressModal.tsx` | Students | Progress tracking | GET `/api/students/[id]` |
| `GroupModal.tsx` | Groups, Dashboard | Add/edit group | POST/PATCH `/api/groups` |
| `ScheduleLessonModal.tsx` | Dashboard | Quick schedule | POST `/api/timetable` |
| `MarkAttendanceModal.tsx` | Dashboard | Quick attendance | POST `/api/attendance` |
| `LessonDetailsModal.tsx` | Timetable | View lesson | GET `/api/timetable/[id]` |
| `AddLessonModal.tsx` | Timetable | Add/edit lesson | POST/PATCH `/api/timetable` |

---

#### **View Components**

| Component | Used On | Purpose |
|-----------|---------|---------|
| `MonthView.tsx` | Timetable | Monthly calendar |
| `ListView.tsx` | Timetable | List view |
| `TimelineView.tsx` | Timetable | Timeline view |
| `AttendanceCalendar.tsx` | Attendance | Calendar view |
| `FilterPanel.tsx` | Multiple | Filter controls |

---

#### **Management Components**

| Component | Used On | Purpose | API Calls |
|-----------|---------|---------|-----------|
| `GroupsManagement.tsx` | Groups | Group CRUD | GET/POST/PATCH/DELETE `/api/groups` |

---

### **Shared Components Pattern**

**Most pages follow this structure:**

```
Page
â”œâ”€â”€ Header (page title)
â”œâ”€â”€ Stats/Summary section
â”œâ”€â”€ Action buttons (Add, Filter, Export)
â”œâ”€â”€ Data table/grid
â”‚   â””â”€â”€ Individual items with actions
â””â”€â”€ Modals (Add/Edit/View)
```

---

## 6. DATA FLOW MAP

### **Student Management Flow**

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    STUDENT MANAGEMENT                       â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

User Action â†’ Component â†’ API â†’ Database â†’ Response â†’ State â†’ UI

1. ADD STUDENT:
   Students Page
   â””â”€â–º AddStudentModal
       â””â”€â–º POST /api/students
           â””â”€â–º INSERT INTO Student
               â””â”€â–º { success, data }
                   â””â”€â–º mutate('/api/students')
                       â””â”€â–º SWR cache updated
                           â””â”€â–º UI refreshes

2. VIEW STUDENTS:
   Students Page (mount)
   â””â”€â–º useStudents() hook
       â””â”€â–º SWR fetch('/api/students')
           â””â”€â–º GET /api/students
               â””â”€â–º SELECT * FROM Student JOIN Group
                   â””â”€â–º { data: Student[] }
                       â””â”€â–º Render table

3. EDIT STUDENT:
   Student Details Modal
   â””â”€â–º onSave()
       â””â”€â–º PATCH /api/students/[id]
           â””â”€â–º UPDATE Student SET ...
               â””â”€â–º { success, data }
                   â””â”€â–º mutate('/api/students')
                       â””â”€â–º Close modal + refresh

4. DELETE STUDENT:
   Student Details Modal
   â””â”€â–º onDelete()
       â””â”€â–º DELETE /api/students/[id]
           â””â”€â–º DELETE FROM Student WHERE id=...
               â””â”€â–º { success: true }
                   â””â”€â–º mutate('/api/students')
                       â””â”€â–º Remove from UI
```

---

### **Group Management Flow**

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                     GROUP MANAGEMENT                        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

1. CREATE GROUP:
   Groups Page
   â””â”€â–º GroupModal
       â””â”€â–º POST /api/groups
           â””â”€â–º INSERT INTO Group (companyId, name, startDate, endDate)
               â””â”€â–º { data: Group }
                   â””â”€â–º GroupsContext.addGroup()
                       â””â”€â–º UI updates

2. ASSIGN STUDENTS TO GROUP:
   Group Details
   â””â”€â–º AddStudentModal
       â””â”€â–º POST /api/students with groupId
           â””â”€â–º INSERT INTO Student (groupId, ...)
               â””â”€â–º Group student count updated
                   â””â”€â–º Refresh groups

3. VIEW GROUP PROGRESS:
   Groups Page
   â””â”€â–º useGroups() + useStudents()
       â””â”€â–º Calculate: students.filter(s => s.groupId === group.id)
           â””â”€â–º Show count + progress
```

---

### **Attendance Tracking Flow**

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                   ATTENDANCE TRACKING                       â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

1. MARK ATTENDANCE (Single):
   Attendance Page
   â””â”€â–º Select student + status
       â””â”€â–º POST /api/attendance
           â””â”€â–º INSERT INTO Attendance (studentId, date, status, reason)
               â””â”€â–º { data: Attendance }
                   â””â”€â–º Local state updated
                       â””â”€â–º Save button â†’ persist all

2. BULK MARK:
   Attendance Page
   â””â”€â–º Select multiple students
       â””â”€â–º Set bulk action (e.g., "PRESENT")
           â””â”€â–º Multiple POST /api/attendance calls
               â””â”€â–º Promise.all([...])
                   â””â”€â–º Show success message

3. VIEW HISTORY:
   Attendance Page â†’ History Tab
   â””â”€â–º GET /api/attendance/history?startDate=...&endDate=...
       â””â”€â–º SELECT * FROM Attendance 
           WHERE date BETWEEN ... 
           JOIN Student
           â””â”€â–º { data: AttendanceRecord[] }
               â””â”€â–º Render calendar/chart

4. ATTENDANCE REPORTS:
   Dashboard / Compliance Page
   â””â”€â–º Calculate stats:
       - Total sessions
       - Present / Absent / Late counts
       - Attendance rate = (present / total) * 100
       â””â”€â–º Identify at-risk students (< 80%)
```

---

### **Lesson Planning & Timetable Flow**

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚              LESSON PLANNING & TIMETABLE                    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

1. CREATE SINGLE LESSON:
   Lessons Page / Timetable
   â””â”€â–º AddLessonModal
       â””â”€â–º POST /api/timetable
           â””â”€â–º INSERT INTO LessonPlan
               (title, date, startTime, endTime, groupId, moduleId)
               â””â”€â–º { data: LessonPlan }
                   â””â”€â–º mutate('/api/timetable')
                       â””â”€â–º Show on calendar

2. CREATE RECURRING SESSIONS:
   Timetable â†’ Recurring Modal
   â””â”€â–º POST /api/recurring-sessions
       â””â”€â–º For each week (startDate â†’ endDate):
           INSERT INTO Session
           (groupId, dayOfWeek, startTime, endTime)
           â””â”€â–º { data: Session[] }
               â””â”€â–º Show in schedule

3. VIEW WEEKLY TIMETABLE:
   Timetable Page
   â””â”€â–º SWR fetch('/api/timetable?startDate=...&endDate=...')
       â””â”€â–º GET LessonPlans + Sessions for week
           â””â”€â–º Merge both types
               â””â”€â–º Group by day + venue
                   â””â”€â–º Render calendar grid

4. TODAY'S SCHEDULE (Dashboard):
   Dashboard
   â””â”€â–º TodaysSchedule component
       â””â”€â–º GET /api/dashboard/schedule?date=today
           â””â”€â–º SELECT LessonPlans + Sessions
               WHERE date = today
               JOIN Group, User
               â””â”€â–º { schedule: ScheduleItem[] }
                   â””â”€â–º Show upcoming lessons
```

---

### **Assessment Flow**

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                   ASSESSMENT MANAGEMENT                     â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

1. CREATE ASSESSMENT:
   Assessments Page
   â””â”€â–º Select students + assessment details
       â””â”€â–º POST /api/assessments
           â””â”€â–º INSERT INTO Assessment
               (studentId, title, assessmentType, method, date)
               â””â”€â–º { data: Assessment }
                   â””â”€â–º Add to list

2. UPDATE RESULTS:
   Assessments Page â†’ Edit
   â””â”€â–º Enter score, result, feedback
       â””â”€â–º PATCH /api/assessments/[id]
           â””â”€â–º UPDATE Assessment SET score=..., result=...
               â””â”€â–º { data: Assessment }
                   â””â”€â–º Update UI

3. MODERATION QUEUE:
   Assessments â†’ Moderation Tab
   â””â”€â–º Filter assessments WHERE result = 'PENDING'
       â””â”€â–º Moderator reviews
           â””â”€â–º Update result to 'PASS' or 'FAIL'
               â””â”€â–º PATCH /api/assessments/[id]

4. ASSESSMENT STATS (Dashboard):
   Dashboard
   â””â”€â–º GET /api/dashboard/stats
       â””â”€â–º Calculate:
           - Total assessments
           - Pending moderation count
           - Pass rate
           â””â”€â–º Show on dashboard
```

---

### **Dashboard Data Sources**

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                     DASHBOARD ASSEMBLY                      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

Dashboard Page
â”œâ”€â–º DashboardStats
â”‚   â””â”€â–º useDashboardStats() â†’ GET /api/dashboard/stats
â”‚       â””â”€â–º Parallel queries:
â”‚           â”œâ”€â–º COUNT(*) FROM Student WHERE status='ACTIVE'
â”‚           â”œâ”€â–º COUNT(*) FROM Group WHERE status='ACTIVE'
â”‚           â”œâ”€â–º COUNT(*) FROM Assessment WHERE result='PENDING'
â”‚           â”œâ”€â–º AVG(progress) FROM Student
â”‚           â”œâ”€â–º Students with attendance < 80%
â”‚           â””â”€â–º Sessions WHERE date > today LIMIT 5
â”‚
â”œâ”€â–º DashboardCharts
â”‚   â””â”€â–º Same data + process for charts
â”‚       â””â”€â–º Recharts renders LineChart, BarChart
â”‚
â”œâ”€â–º TodaysSchedule
â”‚   â””â”€â–º GET /api/dashboard/schedule?date=today
â”‚       â””â”€â–º LessonPlans + Sessions for today
â”‚
â”œâ”€â–º RecentActivity
â”‚   â””â”€â–º Latest records:
â”‚       â”œâ”€â–º Recent students (ORDER BY createdAt DESC)
â”‚       â”œâ”€â–º Recent attendance (ORDER BY date DESC)
â”‚       â””â”€â–º Recent assessments (ORDER BY date DESC)
â”‚
â””â”€â–º QuickActions
    â””â”€â–º Open modals for quick add (no API until save)
```

---

## 7. STATE MANAGEMENT

### **Global State (Context API)**

#### **AuthContext** (`src/contexts/AuthContext.tsx`)

```tsx
State:
- user: User | null
- token: string | null
- isLoading: boolean

Methods:
- login(email, password)
- register(email, name, password, role)
- logout()

Storage: localStorage.getItem('token')
```

---

#### **GroupsContext** (`src/contexts/GroupsContext.tsx`)

```tsx
State:
- groups: Group[]
- companies: Company[]
- isLoading: boolean

Methods:
- addGroup(groupData)
- updateGroup(id, updates)
- deleteGroup(id)
- addCompany(companyData)

Data Source: Fetches from /api/groups on mount
```

---

#### **StudentContext** (`src/contexts/StudentContext.tsx`)

```tsx
State:
- students: Student[]
- attendanceData: { [studentId]: AttendanceRecord[] }

Methods:
- addStudent(studentData)
- updateStudent(id, updates)
- deleteStudent(id)
- markAttendance(studentId, date, status, reason)

Note: Has mock data fallback for offline testing
```

---

### **Server State (SWR)**

**Configuration:** (`src/app/layout.tsx`)

```tsx
<SWRConfig value={{
  fetcher: (url) => fetch(url).then(res => res.json()),
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
  errorRetryCount: 3,
}}>
```

**Custom Hooks for Data Fetching:**

| Hook | Endpoint | Returns | Used On |
|------|----------|---------|---------|
| `useStudents()` | `/api/students` | `{ students, isLoading, isError, mutate }` | Students, Dashboard, Groups |
| `useGroups()` | `/api/groups` | `{ groups, isLoading, mutate }` | Groups, Students, Timetable |
| `useAttendance()` | `/api/attendance` | `{ attendance, isLoading, mutate }` | Attendance, Compliance |
| `useCurriculum()` | `/api/curriculum` | `{ modules, isLoading, mutate }` | Assessments, Curriculum |
| `useProgress()` | `/api/progress` | `{ moduleProgress, isLoading }` | Progress, Compliance |
| `useDashboard()` | `/api/dashboard/stats` | `{ stats, schedule, isLoading }` | Dashboard |

**SWR Benefits:**
- Automatic caching
- Background revalidation
- Optimistic updates with `mutate()`
- Request deduplication
- Stale-while-revalidate pattern

---

### **Component State Flow**

```
Global Context (Auth, Groups, Students)
         â”‚
         â”œâ”€â–º Persistent across entire app
         â””â”€â–º localStorage sync for auth token

SWR Cache (API responses)
         â”‚
         â”œâ”€â–º Automatic background refresh
         â”œâ”€â–º Shared between components
         â””â”€â–º Manual revalidation via mutate()

Local Component State (useState)
         â”‚
         â”œâ”€â–º Modal open/close
         â”œâ”€â–º Form inputs
         â”œâ”€â–º UI toggles (filters, views)
         â””â”€â–º Temporary selections
```

---

## 8. AUTHENTICATION & USER SYSTEM

### **Authentication Flow**

```
1. LOGIN:
   Login Page
   â””â”€â–º Enter email + password
       â””â”€â–º POST /api/auth/login
           â””â”€â–º Compare bcrypt hash
               â””â”€â–º Generate JWT token
                   â””â”€â–º Return { token, user }
                       â””â”€â–º Store in localStorage
                           â””â”€â–º AuthContext.setUser()
                               â””â”€â–º Redirect to Dashboard

2. REGISTRATION:
   Register Page
   â””â”€â–º Enter details
       â””â”€â–º POST /api/auth/register
           â””â”€â–º Hash password with bcryptjs
               â””â”€â–º INSERT INTO User
                   â””â”€â–º Generate JWT token
                       â””â”€â–º Return { token, user }
                           â””â”€â–º Auto-login

3. PROTECTED ROUTES:
   Every page
   â””â”€â–º Check AuthContext.user
       â””â”€â–º If null â†’ redirect to /login
       â””â”€â–º If present â†’ render page

4. API AUTHENTICATION:
   Every API request
   â””â”€â–º Check Authorization header
       â””â”€â–º Extract JWT token
           â””â”€â–º Verify with jsonwebtoken
               â””â”€â–º If valid â†’ proceed
               â””â”€â–º If invalid â†’ 401 Unauthorized
```

---

### **User Roles**

| Role | Permissions | Access Level |
|------|-------------|--------------|
| **ADMIN** | Full system access | Can manage users, groups, all data |
| **FACILITATOR** | Standard access | Can manage own students, groups, attendance |
| **VIEWER** | Read-only | Can view reports, no editing |

---

### **Session Management**

```
Storage: localStorage
Key: 'token'
Value: JWT token (expires in 24h)

Token Payload:
{
  userId: string,
  email: string,
  role: string,
  iat: timestamp,
  exp: timestamp
}

Auto-logout:
- Token expiry (24 hours)
- Manual logout button
- Invalid token detection
```

---

### **User Data Management**

```
User Profile:
â”œâ”€â–º Stored in User table
â”œâ”€â–º Editable via /settings/profile
â”œâ”€â–º Fields: name, email
â””â”€â–º Password change via /settings/security

User Context:
â”œâ”€â–º Available globally via AuthContext
â”œâ”€â–º Used for:
â”‚   â”œâ”€â–º Display name in header
â”‚   â”œâ”€â–º Role-based UI rendering
â”‚   â”œâ”€â–º Filter data by facilitatorId
â”‚   â””â”€â–º Audit trail (createdBy tracking)
```

---

## 9. FILE INTERCONNECTIONS

### **Critical Dependency Map**

```
prisma/schema.prisma
â””â”€â–º Defines entire database structure
    â””â”€â–º Used by:
        â”œâ”€â–º All API route handlers
        â”œâ”€â–º src/lib/prisma.ts (client)
        â””â”€â–º Prisma generate command

src/lib/prisma.ts
â””â”€â–º Database client singleton
    â””â”€â–º Imported by:
        â””â”€â–º Every API route in src/app/api/**/route.ts

src/lib/auth.ts
â””â”€â–º JWT verification & generation
    â””â”€â–º Used by:
        â”œâ”€â–º /api/auth/login
        â”œâ”€â–º /api/auth/register
        â””â”€â–º Middleware for protected routes

src/contexts/AuthContext.tsx
â””â”€â–º Global auth state
    â””â”€â–º Wraps entire app in layout.tsx
        â””â”€â–º Used by:
            â”œâ”€â–º All pages for user data
            â”œâ”€â–º Header component
            â””â”€â–º Protected route checks

src/app/layout.tsx
â””â”€â–º Root layout
    â”œâ”€â–º Wraps with AuthProvider
    â”œâ”€â–º Wraps with GroupsProvider
    â”œâ”€â–º Wraps with SWRConfig
    â””â”€â–º Includes Sidebar on all pages

src/components/Sidebar.tsx
â””â”€â–º Main navigation
    â””â”€â–º Used on every page via layout.tsx
        â””â”€â–º Links to all routes
```

---

### **Component Dependencies**

```
Dashboard (/)
â”œâ”€â–º DashboardStats
â”œâ”€â–º DashboardCharts
â”‚   â””â”€â–º Uses Recharts library
â”œâ”€â–º DashboardAlerts
â”œâ”€â–º TodaysSchedule
â”œâ”€â–º RecentActivity
â””â”€â–º QuickActions
    â”œâ”€â–º Opens AddStudentModal
    â”œâ”€â–º Opens GroupModal
    â”œâ”€â–º Opens ScheduleLessonModal
    â””â”€â–º Opens MarkAttendanceModal

Students Page
â”œâ”€â–º useStudents() hook
â”œâ”€â–º AddStudentModal
â”œâ”€â–º StudentDetailsModal
â”‚   â””â”€â–º StudentProgressModal (nested)
â””â”€â–º EditStudentModal

Groups Page
â”œâ”€â–º useGroups() hook
â”œâ”€â–º GroupsManagement component
â”‚   â”œâ”€â–º GroupModal
â”‚   â””â”€â–º Confirmation dialogs
â””â”€â–º Student assignment

Attendance Page
â”œâ”€â–º useAttendance() hook
â”œâ”€â–º AttendanceCalendar
â”œâ”€â–º MarkAttendanceModal
â””â”€â–º FilterPanel

Timetable Page
â”œâ”€â–º MonthView
â”œâ”€â–º ListView
â”œâ”€â–º TimelineView
â”œâ”€â–º AddLessonModal
â”œâ”€â–º LessonDetailsModal
â””â”€â–º FilterPanel
```

---

### **API Route Dependencies**

```
All API Routes
â””â”€â–º Import from:
    â”œâ”€â–º src/lib/prisma.ts (database)
    â”œâ”€â–º src/lib/auth.ts (authentication)
    â”œâ”€â–º src/lib/validations.ts (Zod schemas)
    â””â”€â–º src/lib/api-utils.ts (response helpers)

/api/students/route.ts
â””â”€â–º Depends on:
    â”œâ”€â–º User table (facilitatorId)
    â”œâ”€â–º Group table (groupId)
    â””â”€â–º Called by useStudents() hook

/api/groups/route.ts
â””â”€â–º Depends on:
    â”œâ”€â–º Company table (companyId)
    â”œâ”€â–º Student table (count)
    â””â”€â–º Called by useGroups() hook

/api/dashboard/stats/route.ts
â””â”€â–º Aggregates from:
    â”œâ”€â–º Student table
    â”œâ”€â–º Group table
    â”œâ”€â–º Assessment table
    â”œâ”€â–º Attendance table
    â””â”€â–º Session table
```

---

### **Utility Dependencies**

```
src/lib/utils.ts
â””â”€â–º Common utilities
    â””â”€â–º Used by:
        â””â”€â–º Many components for formatting, calculations

date-fns
â””â”€â–º Date manipulation
    â””â”€â–º Used by:
        â”œâ”€â–º Timetable components
        â”œâ”€â–º Attendance calendar
        â”œâ”€â–º Dashboard schedule
        â””â”€â–º Date filters

Tailwind CSS
â””â”€â–º Styling
    â””â”€â–º Used by:
        â””â”€â–º All components via className

Lucide React
â””â”€â–º Icons
    â””â”€â–º Used by:
        â”œâ”€â–º Sidebar navigation
        â”œâ”€â–º Buttons
        â”œâ”€â–º Status indicators
        â””â”€â–º Dashboard cards
```

---

### **Circular Dependencies**

**No circular dependencies detected.** The codebase follows a clean dependency hierarchy:

```
Database Layer (Prisma)
    â†“
API Layer (Route handlers)
    â†“
Data Hooks (SWR)
    â†“
Context Providers
    â†“
Components
    â†“
Pages
```

---

## 10. EXTERNAL INTEGRATIONS

### **Third-Party Libraries**

| Library | Purpose | Version | Usage |
|---------|---------|---------|-------|
| **Next.js** | Framework | 14.2.23 | Entire application |
| **React** | UI library | 18.3.1 | Frontend components |
| **Prisma** | ORM | 5.11.0 | Database operations |
| **SWR** | Data fetching | 2.2.5 | Client-side caching |
| **Recharts** | Charts | 2.12.2 | Dashboard visualizations |
| **date-fns** | Date utils | 3.3.1 | Date formatting |
| **Lucide React** | Icons | 0.344.0 | UI icons |
| **Tailwind CSS** | Styling | 3.4.1 | CSS framework |
| **bcryptjs** | Hashing | 2.4.3 | Password security |
| **jsonwebtoken** | Auth | 9.0.2 | JWT tokens |
| **Zod** | Validation | 3.22.4 | Schema validation |

---

### **External APIs**

**Currently: NONE**

The system is fully self-contained with no external API dependencies. All data is:
- Stored locally in SQLite database
- Processed server-side
- No third-party service calls

**Potential Future Integrations:**
- Email service (SendGrid, AWS SES) for notifications
- SMS service (Twilio) for attendance alerts
- Cloud storage (AWS S3, Azure) for POE documents
- Calendar sync (Google Calendar) for timetable
- Backup service (cloud database sync)

---

### **CDN Resources**

**Currently: NONE**

All assets are bundled locally:
- No external CDN dependencies
- All libraries installed via npm
- Fonts and icons bundled with Tailwind

---

### **Environment Variables**

```env
# Database
DATABASE_URL="file:./dev.db"

# Authentication
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="24h"

# Application
NODE_ENV="development"
NEXT_PUBLIC_API_URL="http://localhost:3000"

# Future integrations
# EMAIL_SERVICE_KEY=""
# SMS_SERVICE_KEY=""
# CLOUD_STORAGE_KEY=""
```

---

## 11. KEY FEATURES SUMMARY

### **Core Functionality**

1. **Student Management**
   - CRUD operations
   - Group assignment
   - Progress tracking
   - Status management (Active/Inactive/Graduated)

2. **Group Management**
   - Create groups with company association
   - Manage group lifecycle
   - Track group progress
   - Student assignment

3. **Attendance Tracking**
   - Daily attendance marking
   - Bulk actions
   - Historical reports
   - Attendance rate calculations
   - At-risk student identification

4. **Assessment Management**
   - Multiple assessment types
   - Score recording
   - Moderation queue
   - Pass/fail tracking
   - Feedback system

5. **Timetable/Scheduling**
   - Single lesson creation
   - Recurring sessions
   - Multiple view modes (Month/List/Timeline)
   - Today's schedule on dashboard
   - Conflict detection

6. **Progress Tracking**
   - Module completion
   - Course progress
   - Individual student progress
   - Group progress overview

7. **Portfolio of Evidence (POE)**
   - Module checklist
   - Completion tracking
   - Status management

8. **Compliance Reporting**
   - Attendance compliance
   - Assessment completion
   - Progress metrics
   - At-risk identification

9. **Dashboard**
   - Real-time statistics
   - Progress charts
   - Alerts/notifications
   - Today's schedule
   - Recent activity
   - Quick actions

10. **User Management** (Admin)
    - User CRUD
    - Role assignment
    - Access control

---

## SYSTEM ARCHITECTURE DIAGRAM

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                         CLIENT BROWSER                          â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚               React Components (UI Layer)                 â”‚   â”‚
â”‚  â”‚  Dashboard | Students | Groups | Attendance | Timetable  â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚                               â”‚                                  â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚         State Management (Context + SWR)                  â”‚   â”‚
â”‚  â”‚    AuthContext | GroupsContext | StudentContext          â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚                               â”‚                                  â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚              Custom Hooks (Data Fetching)                 â”‚   â”‚
â”‚  â”‚  useStudents | useGroups | useAttendance | useDashboard  â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                               â”‚
                           HTTP/HTTPS
                               â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                     NEXT.JS SERVER (PORT 3000)                  â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚            API Routes (Backend Logic)                     â”‚   â”‚
â”‚  â”‚  /api/students | /api/groups | /api/attendance           â”‚   â”‚
â”‚  â”‚  /api/assessments | /api/timetable | /api/dashboard      â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚                               â”‚                                  â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚         Middleware & Utilities                            â”‚   â”‚
â”‚  â”‚  Authentication | Validation | Rate Limiting              â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚                               â”‚                                  â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚               Prisma ORM Client                           â”‚   â”‚
â”‚  â”‚          (Database Abstraction Layer)                     â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                               â”‚
                          SQL Queries
                               â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                      SQLite DATABASE                            â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚  User | Student | Group | Company | Attendance           â”‚   â”‚
â”‚  â”‚  Assessment | LessonPlan | Session | POEChecklist        â”‚   â”‚
â”‚  â”‚  Module | Course | GroupCourse | CourseProgress          â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚                         (dev.db file)                           â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## PERFORMANCE OPTIMIZATIONS

### **Implemented Optimizations**

1. **Database Indexes** (17 total)
   - Strategic indexes on frequently queried columns
   - Composite indexes for common JOIN operations
   - Improves query performance by 10-100x

2. **SWR Caching**
   - Client-side data caching
   - Request deduplication
   - Background revalidation
   - Reduces unnecessary API calls

3. **Lazy Loading**
   - Dashboard charts loaded on-demand
   - Heavy components split with `React.lazy()`
   - Improves initial page load time

4. **Optimistic Updates**
   - Immediate UI updates before API confirmation
   - Better perceived performance
   - Rollback on error

5. **Code Splitting**
   - Next.js automatic route-based splitting
   - Reduces initial bundle size
   - Faster page transitions

6. **Server Components**
   - Next.js Server Components where possible
   - Reduced client-side JavaScript
   - Faster initial render

---

## DEPLOYMENT CONSIDERATIONS

### **Development Environment**

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

# Start development server
npm run dev

# Access at http://localhost:3000
```

---

### **Production Deployment**

**Requirements:**
- Node.js 18.17 or higher
- PostgreSQL or MySQL (replace SQLite)
- Environment variables configured

**Build Process:**
```bash
# Install production dependencies
npm ci --production

# Generate Prisma client
npx prisma generate

# Build Next.js app
npm run build

# Start production server
npm start
```

**Recommended Hosting:**
- Vercel (optimized for Next.js)
- AWS EC2 + RDS
- Azure App Service
- Digital Ocean Droplet

---

## FUTURE ENHANCEMENTS

**Planned Features:**
1. Email notifications for attendance/assessments
2. SMS alerts for at-risk students
3. Document upload for POE
4. Real-time collaboration
5. Mobile app (React Native)
6. Reporting exports (PDF, Excel)
7. Calendar integrations
8. Bulk import/export
9. Advanced analytics dashboard
10. Multi-tenant support

---

## DOCUMENTATION GENERATED

**Date:** February 6, 2026  
**Version:** 1.0  
**System Status:** Production-ready (Phase 3 Complete)  
**Database:** SQLite (dev), PostgreSQL/MySQL recommended for production

---

**END OF ARCHITECTURE DOCUMENTATION**

