# Frontend Component Hierarchy - Next.js LMS Application

**Generated:** February 16, 2026
**Analysis:** Complete mapping of pages, components, contexts, hooks, and data flow patterns

---

## Table of Contents
1. [Application Architecture](#application-architecture)
2. [Page Structure & Routes](#page-structure--routes)
3. [Context Providers & State Management](#context-providers--state-management)
4. [Custom Hooks](#custom-hooks)
5. [Component Hierarchy](#component-hierarchy)
6. [Data Flow Patterns](#data-flow-patterns)
7. [API Integration](#api-integration)

---

## Application Architecture

### Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** 
  - Context API (AuthContext, GroupsContext, StudentContext)
  - SWR for server state
  - Local component state (useState)
- **Data Fetching:** SWR (stale-while-revalidate)
- **Date Handling:** date-fns
- **Charts:** Recharts
- **Icons:** Lucide React
- **PDF Generation:** jsPDF

### Provider Hierarchy
```
RootLayout
└── ErrorBoundary
    └── Providers (src/components/providers.tsx)
        ├── AuthProvider
        │   └── GroupsProvider
        │       └── StudentProvider
        │           └── MainLayout
        │               ├── Sidebar (conditional)
        │               ├── Header (conditional)
        │               └── Page Content
        │                   └── AIChat (global)
```

---

## Page Structure & Routes

### 1. Authentication Pages
#### **`/login` - Login Page**
- **File:** `src/app/login/page.tsx`
- **Auth:** Public
- **Components Used:** None (standalone form)
- **Contexts:** AuthContext (useAuth)
- **Hooks:** useState, useEffect
- **API Endpoints:** 
  - POST `/api/auth/login`
- **State Management:** 
  - Local state for form data, loading, error
- **Key Features:**
  - Form validation
  - Auto-redirect if authenticated
  - Token storage in localStorage

#### **`/register` - Registration Page**
- **File:** `src/app/register/page.tsx`
- **Auth:** Public
- **Similar pattern to login page

---

### 2. Main Dashboard Pages

#### **`/` - Dashboard (Home)**
- **File:** `src/app/page.tsx`
- **Auth:** Protected
- **Components Used:**
  - QuickActions
  - MiniCalendar
  - NextSessionPanel
  - SessionAttendanceModal
  - Toast
  - DashboardCharts (dynamic)
  - RecentActivity (dynamic)
  - DashboardAlerts (dynamic)
  - TodaysSchedule (dynamic)
  - StatCard (inline)
- **Contexts Used:**
  - AuthContext (useAuth)
  - GroupsContext (useGroups)
- **Hooks:** 
  - useSWR (for dashboard data)
  - useState (calendar, modals, UI state)
  - useEffect (auth check, data fetching, click outside)
  - useMemo
  - useRef
  - useToast (custom)
- **API Endpoints:**
  - GET `/api/dashboard/stats`
  - GET `/api/dashboard/programme-health`
  - GET `/api/sessions?date=...`
  - POST `/api/attendance/session/${id}`
- **State Management:**
  - SWR: Dashboard stats, programme health
  - Local state: Calendar selection, modals, UI toggles
- **Data Flow:**
  - Container component pattern
  - Fetches aggregated data
  - Passes down to presentational components
  - Dynamic imports for performance optimization

---

#### **`/students` - Students Management**
- **File:** `src/app/students/page.tsx` (1044 lines)
- **Auth:** Protected
- **Components Used:**
  - AddStudentModal
  - StudentDetailsModal
  - BulkAssessmentModal
  - CreditAdjustmentModal
- **Contexts Used:**
  - GroupsContext (useGroups)
- **Hooks:**
  - useStudents (custom hook)
  - useSWR (attendance rates, modules)
  - useState (17+ state variables)
  - useMemo (filtered/sorted students)
- **API Endpoints:**
  - GET `/api/students`
  - GET `/api/attendance/rates?studentIds=...`
  - GET `/api/modules`
  - PUT `/api/students/:id`
  - DELETE `/api/students/:id`
  - PUT `/api/students/:id/archive`
- **State Management:**
  - SWR: Students list, attendance data, modules
  - Local state: Filters, sorting, selection, modals, view mode
- **Features:**
  - Table/Grid view toggle
  - Advanced filtering (group, status, progress, module, alerts)
  - Multi-select with bulk actions
  - Inline editing capabilities
  - Progress alerts system
  - Compliance status tracking
- **Data Flow Pattern:** Container component with complex filtering logic

---

#### **`/students/[id]` - Student Detail Page**
- **File:** `src/app/students/[id]/page.tsx`
- **Auth:** Protected
- **Dynamic Route:** Individual student view
- **Expected Components:** 
  - StudentDetailsModal or dedicated detail view
  - Progress tracking components
  - Assessment history

---

#### **`/groups` - Groups Management**
- **File:** `src/app/groups/page.tsx` (1452 lines)
- **Auth:** Protected
- **Components Used:**
  - GroupModal
  - GroupDrawer
  - GroupUploadModal
  - AddStudentModal
  - GranularRolloutTable (likely)
- **Contexts Used:**
  - GroupsContext (useGroups)
- **Hooks:**
  - useSWR (groups with progress data)
  - useState (multiple)
  - useMemo (rollout status calculations)
  - useEffect
- **API Endpoints:**
  - GET `/api/groups`
  - POST `/api/groups`
  - PUT `/api/groups/:id`
  - DELETE `/api/groups/:id`
  - POST `/api/groups/upload` (bulk upload)
- **State Management:**
  - SWR: Groups list with real-time updates
  - Context: Global groups state
  - Local: Filters, search, modal states, view mode
- **Features:**
  - Rollout plan status tracking
  - Module progression monitoring
  - Group statistics (students, credits, progress)
  - Bulk upload functionality
  - Status indicators (NO_PLAN, NOT_STARTED, ON_TRACK, BEHIND, AT_RISK, COMPLETE)
- **Complex Logic:**
  - Rollout plan parsing from JSON in notes field
  - Date comparison for status calculation
  - Progress aggregation per group

---

#### **`/groups/[id]` - Group Detail Page**
- **File:** `src/app/groups/[id]/page.tsx`
- **Dynamic Route:** Individual group view
- **Expected detailed group management interface

---

#### **`/timetable` - Timetable Management**
- **File:** `src/app/timetable/page.tsx` (173 lines)
- **Auth:** Protected
- **Components Used:**
  - TimetableWeekView
  - TimetableDayView
  - TimetableGroupView
  - TimetableSessionModal
  - Toast
- **Contexts Used:**
  - GroupsContext (useGroups)
- **Hooks:**
  - useState (date, group, view mode)
  - useEffect (notifications, date sync, auto-select)
  - useMemo (date parsing)
  - useSearchParams (URL date parameter)
  - useSWRConfig (for mutations)
- **API Endpoints:**
  - GET `/api/sessions` (called from child components)
  - POST `/api/sessions`
  - PUT `/api/sessions/:id`
  - DELETE `/api/sessions/:id`
- **State Management:**
  - Local state: View mode, selected date/group
  - URL state: Date parameter for deep linking
- **Features:**
  - 3 view modes: Week, Day, Group
  - Notification support
  - Date navigation
  - Group filtering
  - Session creation/editing
- **Data Flow:** 
  - Container manages view state
  - Child components fetch their own data via SWR

---

#### **`/attendance` - Attendance Tracking**
- **File:** `src/app/attendance/page.tsx` (1184 lines)
- **Auth:** Protected
- **Components Used:**
  - Charts (LineChart, BarChart from Recharts)
  - Multiple inline components
- **Hooks:**
  - useStudents (custom)
  - useState (20+ state variables)
  - useMemo (student grouping)
  - useEffect (data fetching)
- **API Endpoints:**
  - GET `/api/attendance/alerts`
  - GET `/api/attendance/stats`
  - GET `/api/attendance/history`
  - GET `/api/attendance/rates`
  - POST `/api/attendance/bulk`
  - PUT `/api/attendance/:id`
- **State Management:**
  - SWR: Students data
  - Local state: Attendance records, selections, filters, view modes
- **Features:**
  - Multiple views: Mark, History, Analytics
  - Group collections (Montzelity with sub-groups)
  - Bulk actions
  - Real-time stats
  - Alert system
  - Export functionality
  - Low attendance tracking
- **Complex Logic:**
  - Group-based attendance marking
  - Statistical calculations
  - Compliance tracking
  - Trend analysis

---

#### **`/assessments` - Assessment Management**
- **File:** `src/app/assessments/page.tsx` (1634 lines)
- **Auth:** Protected
- **Components Used:**
  - Charts (BarChart, PieChart from Recharts)
  - Toast
  - Multiple inline forms and modals
- **Contexts Used:**
  - AuthContext (useAuth)
  - GroupsContext (useGroups)
- **Hooks:**
  - useCurriculum (custom)
  - useStudents (custom)
  - useState (30+ state variables)
  - useMemo (filtering)
  - useCallback
  - useEffect
  - useSearchParams (unit standard filter)
- **API Endpoints:**
  - GET `/api/unit-standards`
  - POST `/api/unit-standards`
  - PUT `/api/unit-standards/:id`
  - DELETE `/api/unit-standards/:id`
  - GET `/api/assessments`
  - POST `/api/assessments`
  - PUT `/api/assessments/:id`
  - POST `/api/assessments/bulk`
  - GET `/api/assessments/moderation`
  - POST `/api/assessments/moderate/:id`
- **State Management:**
  - SWR: Unit standards, assessments, students (via hooks/context)
  - Global mutation: Uses globalMutate for cross-endpoint sync
  - Local: View state, filters, editing states
- **Views:**
  1. Manage: Unit standards and assessments CRUD
  2. Moderation: Review and approve assessments
  3. Progress: Student progress tracking
  4. Compliance: SSETA compliance tracking
  5. Bulk: Bulk operations
  6. Export: Data export functionality
  7. Analytics: Assessment statistics and trends
- **Data Flow:** 
  - Complex container with multiple sub-views
  - Global state synchronization after mutations
  - Filtered data based on group selection

---

#### **`/assessments/generate` - Assessment Generation**
- **File:** `src/app/assessments/generate/page.tsx`
- **Expected AI-powered assessment generation

---

#### **`/progress` - Progress Tracking**
- **File:** `src/app/progress/page.tsx` (626 lines)
- **Auth:** Protected
- **Hooks:**
  - useProgress (custom)
  - useStudents (custom)
  - useState
  - useEffect
- **API Endpoints:**
  - GET `/api/progress?studentId=...`
  - GET `/api/groups`
  - GET `/api/groups/:id/progress`
- **State Management:**
  - SWR: Progress data via custom hook
  - Local: View mode (individual/group), selections
- **Features:**
  - Individual vs Group view toggle
  - Module progress tracking
  - Unit standard completion
  - Status monitoring (ON_TRACK, BEHIND, AT_RISK)
  - Date range filtering
- **Data Flow:** Uses custom hook abstraction for progress data

---

#### **`/curriculum` - Curriculum Management**
- **File:** `src/app/curriculum/page.tsx` (480 lines)
- **Auth:** Protected
- **Hooks:**
  - useSWR (curriculum data)
  - useState
- **API Endpoints:**
  - GET `/api/curriculum`
  - POST `/api/curriculum/upload`
- **Features:**
  - Module library
  - Document upload with AI processing
  - PDF generation (jsPDF)
  - Progress tracking
  - File management
- **Data Flow:** Direct SWR fetching

---

#### **`/curriculum/search` - Curriculum Search**
- **File:** `src/app/curriculum/search/page.tsx`
- **Expected search interface for curriculum content

---

#### **`/curriculum/builder` - Curriculum Builder**
- **File:** `src/app/curriculum/builder/page.tsx`
- **Expected curriculum creation/editing tool

---

#### **`/lessons` - Lesson Planning**
- **File:** `src/app/lessons/page.tsx` (878 lines)
- **Auth:** Protected
- **Contexts Used:**
  - GroupsContext (useGroups)
  - AuthContext (useAuth)
- **Hooks:**
  - useSWR (modules, unit standards, lessons, index stats)
  - useState (multiple)
  - useEffect
- **API Endpoints:**
  - GET `/api/modules`
  - GET `/api/unit-standards`
  - GET `/api/lessons`
  - POST `/api/ai/generate-lesson`
  - POST `/api/lessons`
  - GET `/api/ai/index-documents`
- **Features:**
  - Multiple tabs: List, Manual creation, AI generation
  - AI-powered lesson plan generation
  - Document-aware AI (uses indexed curriculum)
  - Step-by-step generation UI
  - Manual form input
  - Lesson management
- **Data Flow:**
  - AI generation with progress steps
  - Document context integration
  - Real-time lesson list updates

---

#### **`/lessons/[id]` - Lesson Detail**
- **File:** `src/app/lessons/[id]/page.tsx`
- **Dynamic Route:** Individual lesson view/edit

---

#### **`/ai` - AI Assistant**
- **File:** `src/app/ai/page.tsx` (822 lines)
- **Auth:** Protected
- **Hooks:**
  - useState (extensive state management)
  - useEffect
  - useRef (message scroll)
- **API Endpoints:**
  - GET `/api/ai/index-stats`
  - GET `/api/unit-standards`
  - POST `/api/ai/chat`
  - POST `/api/ai/search`
  - POST `/api/ai/generate`
  - POST `/api/ai/generate-assessment`
  - POST `/api/ai/index-documents`
- **Tabs:**
  1. Chat: Conversational AI with curriculum context
  2. Search: Semantic search through indexed documents
  3. Generate: Content generation (lesson plans, activities)
  4. Settings: Index management and stats
- **Features:**
  - RAG (Retrieval Augmented Generation)
  - Source citation
  - Document chunking display
  - Vector search (Pinecone)
  - Assessment question generation
  - Real-time index statistics
- **Data Flow:**
  - Message-based chat state
  - Search results with relevance scores
  - Document indexing status

---

#### **`/reports` - Reports & Analytics**
- **File:** `src/app/reports/page.tsx`
- **Expected reporting dashboard

---

#### **`/compliance` - Compliance Management**
- **File:** `src/app/compliance/page.tsx`
- **Expected SSETA compliance tracking

---

#### **`/moderation` - Assessment Moderation**
- **File:** `src/app/moderation/page.tsx`
- **Expected moderation queue and workflows

---

#### **`/poe` - POE Management**
- **File:** `src/app/poe/page.tsx`
- **Expected Portfolio of Evidence management

---

#### **`/assessment-checklist` - Assessment Checklist**
- **File:** `src/app/assessment-checklist/page.tsx`
- **Expected checklist for assessment completion

---

#### **`/settings` - Settings**
- **File:** `src/app/settings/page.tsx`
- **Expected user/system settings

---

#### **`/admin` - Admin Dashboard**
- **File:** `src/app/admin/page.tsx`
- **Auth:** Admin only
- **Expected admin overview

---

#### **`/admin/users` - User Management**
- **File:** `src/app/admin/users/page.tsx` (343 lines)
- **Auth:** Admin only
- **Contexts Used:**
  - AuthContext (useAuth) - with role check
- **Hooks:**
  - useState
  - useEffect
  - useRouter (redirect non-admins)
- **API Endpoints:**
  - GET `/api/users`
  - POST `/api/users`
  - PUT `/api/users/:id`
  - DELETE `/api/users/:id`
- **Features:**
  - CRUD operations for users
  - Role management (ADMIN, COORDINATOR, FACILITATOR)
  - User statistics (_count.students, _count.lessonPlans)
  - Access control
- **Data Flow:** Direct fetch with credentials

---

#### **`/admin/documents` - Document Management**
- **File:** `src/app/admin/documents/page.tsx`
- **Auth:** Admin only
- **Expected document administration

---

## Context Providers & State Management

### 1. **AuthContext** (`src/contexts/AuthContext.tsx`)
**Purpose:** Global authentication state

**State:**
- `user: User | null` - Current user object
- `token: string | null` - JWT token
- `isLoading: boolean` - Initial auth check
- `isAuthenticated: boolean` - Derived state

**Methods:**
- `login(token, user)` - Set auth state and localStorage
- `logout()` - Clear auth state and redirect

**Storage:** localStorage (`token`, `user`)

**Used By:**
- All protected pages (auth check)
- Header (user display)
- Sidebar (user info)
- API calls (token header)

**Pattern:** 
- Loads from localStorage on mount
- Provides token for API authentication
- Used in almost every page component

---

### 2. **GroupsContext** (`src/contexts/GroupsContext.tsx`)
**Purpose:** Global groups data management

**Data Fetching:** 
- useSWR on `/api/groups`
- Refresh: 30s interval, revalidate on focus
- Handles both wrapped and unwrapped API responses

**State:**
- `groups: Group[]` - List of all groups
- `isLoading: boolean`
- `error: any`

**Methods:**
- `addGroup(groupData)` - POST new group
- `updateGroup(id, updates)` - PUT group updates
- `deleteGroup(id)` - DELETE group

**Features:**
- Auto-revalidation
- Optimistic updates via SWR mutate
- Error handling
- Response normalization

**Used By:**
- Dashboard (filtering)
- Groups page (CRUD)
- Students page (group filter)
- Timetable (group selection)
- Assessments (group filtering)
- Lessons (group context)
- Progress (group view)

**Data Flow:**
- Single source of truth for groups
- Mutations trigger SWR revalidation
- Consumed via useGroups() hook

---

### 3. **StudentContext** (`src/contexts/StudentContext.tsx`)
**Purpose:** Global students data management

**Data Fetching:**
- useSWR on `/api/students`
- Custom fetcher with token auth
- Data transformation (computed `name` field, `site` from group)

**State:**
- `students: Student[]`
- `isLoading: boolean`
- `error: any`

**Methods:**
- `addStudent(data)` - POST with data transformation
- `updateStudent(id, updates)` - PUT updates
- `deleteStudent(id)` - DELETE student
- `refreshStudents()` - Manual revalidation

**Features:**
- Automatic name field computation
- Group name mapping to site
- Dashboard stats mutation on changes
- Error handling and logging

**Used By:**
- Students page
- Attendance page
- Progress page
- Assessments page (context of students)

**Note:** Also has `StudentContextSimple.tsx` variant (used in layout)

---

## Custom Hooks

### **`useStudents`** (`src/hooks/useStudents.ts`)
**Purpose:** Fetch students with optional filters

**Parameters:**
- `groupId?: string`
- `status?: string`

**Returns:**
```typescript
{
  students: Student[],
  isLoading: boolean,
  isError: any,
  mutate: () => void
}
```

**API:** GET `/api/students?groupId=...&status=...`

**Config:** Uses swrConfig.students from swr-config

**Used In:**
- Students page
- Attendance page
- Progress page
- Assessments page

---

### **`useCurriculum`** (`src/hooks/useCurriculum.ts`)
**Purpose:** Fetch curriculum modules and unit standards

**Returns:**
```typescript
{
  modules: Module[],
  unitStandards: UnitStandard[],
  isLoading: boolean,
  isError: any,
  mutate: () => void
}
```

**Features:**
- Flattens unitStandards from all modules
- Provides both hierarchical (modules) and flat (unitStandards) views

**API:** GET `/api/curriculum`

**Used In:**
- Assessments page
- Curriculum page
- Lessons page (indirectly)

---

### **`useDashboard`** (`src/hooks/useDashboard.ts`)
**Purpose:** Multiple dashboard data hooks

**Hooks Provided:**
1. `useDashboardStats()` - GET `/api/dashboard/stats` (2min refresh)
2. `useRecentActivity()` - GET `/api/dashboard/recent-activity` (no auto-refresh)
3. `useDashboardAlerts()` - GET `/api/dashboard/alerts` (no auto-refresh)
4. `useDashboardSchedule()` - GET `/api/dashboard/schedule` (no auto-refresh)
5. `useDashboardCharts(timeRange)` - GET `/api/dashboard/charts?range=...`
6. `useGlobalSearch(query, filter)` - GET `/api/search?q=...&filter=...`

**Optimization:**
- Disabled revalidateOnFocus for performance
- No auto-refresh on most endpoints (manual trigger)
- 5s deduplication interval
- Conditional fetching for search

**Used In:** Dashboard page and child components

---

### **`useProgress`** (`src/hooks/useProgress.ts`)
**Purpose:** Fetch student/group progress data

**Parameters:**
- `studentId?: string`

**Expected Returns:**
```typescript
{
  moduleProgress: ModuleProgress[],
  unitStandardProgress: UnitStandardProgress[],
  isLoading: boolean
}
```

**Used In:** Progress page

---

### **`useAttendance`** (`src/hooks/useAttendance.ts`)
**Purpose:** Fetch attendance records

**Parameters:**
- `sessionId?: string`
- `studentId?: string`
- `date?: string`

**Returns:**
```typescript
{
  attendance: Attendance[],
  isLoading: boolean,
  isError: any,
  mutate: () => void
}
```

**API:** GET `/api/attendance?sessionId=...&studentId=...&date=...`

**Used In:** Attendance-related components

---

### **`useLessons`** (`src/hooks/useLessons.ts`)
**Purpose:** Fetch lesson plans

**Expected API:** GET `/api/lessons`

---

### **`useAssessments`** (`src/hooks/useAssessments.ts`)
**Purpose:** Fetch assessments data

---

### **`useAssessmentStats`** (`src/hooks/useAssessmentStats.ts`)
**Purpose:** Assessment statistics

---

### **`useDashboardStats`** (`src/hooks/useDashboardStats.ts`)
**Purpose:** Dedicated dashboard stats hook

---

### **`useAI`** (`src/hooks/useAI.ts`)
**Purpose:** AI-related functionality

---

### **`useSites`** (`src/hooks/useSites.ts`)
**Purpose:** Site/location management

---

### **`useDebounce`** (`src/hooks/useDebounce.ts`)
**Purpose:** Debounce utility for search/input fields

---

## Component Hierarchy

### **Layout Components**

#### **MainLayout** (`src/components/MainLayout.tsx`)
**Type:** Layout Container
**Rendered By:** Root layout
**Purpose:** Conditional layout wrapper

**Structure:**
```
MainLayout
├── Sidebar (if not public)
└── main
    ├── Header (if not public)
    └── children (page content)
```

**State:**
- `isSidebarCollapsed: boolean` - Persisted in localStorage

**Behavior:**
- Shows simple wrapper for public pages (/login, /register)
- Shows full layout with Sidebar + Header for authenticated pages
- Dynamic margins based on sidebar state

---

#### **Sidebar** (`src/components/Sidebar.tsx`)
**Type:** Navigation Component
**Props:** `isCollapsed: boolean`, `onToggle: () => void`

**Structure:**
```
Sidebar
├── Logo / Brand
├── User Profile Section
├── Quick Access Links
│   ├── Home
│   ├── Groups
│   ├── Students
│   ├── Timetable
│   ├── Attendance
│   └── Reports
├── Management Links
│   ├── Assessments
│   ├── Progress
│   ├── POE Management
│   ├── Compliance
│   └── Moderation
├── Tools Links
│   ├── Lesson Planner
│   ├── Curriculum
│   ├── AI Assistant
│   └── Settings
├── Admin Links (conditional)
│   └── User Management
├── Theme Toggle (Dark/Light)
└── Logout Button
```

**Features:**
- Theme switching (dark/light modes)
- Collapsible state
- Active route highlighting
- Role-based navigation (admin section)
- localStorage persistence

**State:**
- `sidebarTheme: 'dark' | 'light'` - Persisted

---

#### **Header** (`src/components/Header.tsx`)
**Type:** Page Header
**Purpose:** Top navigation bar

**Structure:**
```
Header
├── Page Title (dynamic based on route)
├── Search Button (toggle)
├── Notifications Bell
│   └── Notification Dropdown
└── User Profile Menu
```

**Features:**
- Dynamic page title from pathname
- Notification count badge
- Click-outside to close dropdown
- Global search toggle

**State:**
- `showNotifications: boolean`
- `showSearch: boolean`
- `searchQuery: string`

---

### **Modal Components**

**Purpose:** Overlays for CRUD operations and detail views

1. **AddStudentModal** - Create new student
2. **EditStudentModal** - Edit student details
3. **StudentDetailsModal** - View student full details
4. **StudentProgressModal** - Student progress tracking modal
5. **GroupModal** - Create/edit group
6. **GroupUploadModal** - Bulk upload students to group
7. **AddNoteModal** - Add notes to student
8. **AssessmentModal** - Assessment CRUD
9. **CreateAssessmentModal** - Create assessment
10. **MarkAssessmentModal** - Mark/grade assessment
11. **BulkAssessmentModal** - Bulk assessment operations
12. **AssessmentResultModal** - View assessment results
13. **MarkAttendanceModal** - Mark attendance
14. **SessionAttendanceModal** - Session-specific attendance
15. **ScheduleLessonModal** - Schedule lesson/session
16. **RecurringSessionModal** - Create recurring sessions
17. **TimetableSessionModal** - Timetable session details
18. **CreditAdjustmentModal** - Adjust student credits
19. **StatDetailsModal** - Dashboard stat details
20. **EventDetailModal** - Calendar event details

**Common Pattern:**
- Props: `isOpen`, `onClose`, `onSave`, data props
- Local state: Form fields, loading, errors
- API calls: Fetch, POST, PUT
- Mutation: Trigger SWR revalidation on success

---

### **Dashboard Components**

**Container:** Dashboard page (`src/app/page.tsx`)

1. **DashboardStats** (`src/components/DashboardStats.tsx`)
   - Presentational
   - Props: Stats data
   - Displays key metrics in grid

2. **StatCard** (`src/components/StatCard.tsx`)
   - Presentational
   - Props: title, value, icon, suffix
   - Reusable metric display

3. **DashboardCharts** (`src/components/DashboardCharts.tsx`)
   - Container/Presentational hybrid
   - Uses useDashboardCharts hook
   - Recharts integration
   - Displays: Attendance trend, group distribution, course progress

4. **RecentActivity** (`src/components/RecentActivity.tsx`)
   - Container
   - Uses useRecentActivity hook
   - Activity feed with timestamps

5. **DashboardAlerts** (`src/components/DashboardAlerts.tsx`)
   - Container
   - Uses useDashboardAlerts hook
   - Alert list with severity indicators

6. **TodaysSchedule** (`src/components/TodaysSchedule.tsx`)
   - Container
   - Displays today's sessions
   - Quick attendance marking

7. **QuickActions** (`src/components/QuickActions.tsx`)
   - Presentational
   - Action buttons for common tasks

8. **MiniCalendar** (`src/components/MiniCalendar.tsx`)
   - Presentational/Interactive
   - Month view calendar
   - Date selection
   - Event indicators

9. **NextSessionPanel** (`src/components/NextSessionPanel.tsx`)
   - Container
   - Shows upcoming session
   - Quick actions

10. **TodayClassesDashboard** (`src/components/TodayClassesDashboard.tsx`)
    - Alternative today view

---

### **Student Management Components**

1. **StudentCard** (`src/components/StudentCard.tsx`)
   - Presentational
   - Props: Student data
   - Grid view card display
   - Progress indicators
   - Quick actions

2. **LearnerAssessmentTracker** (`src/components/LearnerAssessmentTracker.tsx`)
   - Container/Presentational
   - Assessment progress visualization
   - Per-student tracking

---

### **Group Management Components**

1. **GroupsManagement** (`src/components/GroupsManagement.tsx`)
   - Container
   - Full group CRUD interface
   - Table/grid views

2. **GroupDrawer** (`src/components/GroupDrawer.tsx`)
   - Side drawer for group details
   - Student list
   - Progress summary

3. **GroupDistributionChart** (`src/components/GroupDistributionChart.tsx`)
   - Presentational
   - Recharts visualization
   - Group size comparison

4. **GranularRolloutTable** (`src/components/GranularRolloutTable.tsx`)
   - Complex table
   - Rollout plan details
   - Module progression tracking

---

### **Timetable Components**

1. **TimetableWeekView** (`src/components/TimetableWeekView.tsx`)
   - Container
   - Week calendar grid
   - Session cards
   - Drag-and-drop (likely)

2. **TimetableDayView** (`src/components/TimetableDayView.tsx`)
   - Container
   - Single day detailed view
   - Timeline layout

3. **TimetableGroupView** (`src/components/TimetableGroupView.tsx`)
   - Container
   - Group-specific schedule
   - Multi-week view

4. **TimetableCalendarView** (`src/components/TimetableCalendarView.tsx`)
   - Calendar-style timetable

5. **SessionDetailPanel** (`src/components/SessionDetailPanel.tsx`)
   - Session information display
   - Attendance quick view

6. **SessionForm** (`src/components/SessionForm.tsx`)
   - Form for session creation/editing

7. **SessionHoverCard** (`src/components/SessionHoverCard.tsx`)
   - Tooltip/popover for session preview

8. **WeeklyCalendarView** (`src/components/WeeklyCalendarView.tsx`)
   - Alternative week view
   - Duplicate in `calendar/` subfolder

---

### **Attendance Components**

1. **AttendanceCalendar** (`src/components/AttendanceCalendar.tsx`)
   - Interactive calendar
   - Attendance marking interface
   - Color-coded status

2. **AttendanceTrendChart** (`src/components/AttendanceTrendChart.tsx`)
   - Line chart
   - Attendance over time
   - Group comparison

---

### **Progress & Reporting Components**

1. **ProgressReport** (`src/components/ProgressReport.tsx`)
   - Comprehensive progress view
   - Multiple metrics

2. **ProgressReport_NEW** (`src/components/ProgressReport_NEW.tsx`)
   - Updated version

3. **ModuleProgress** (`src/components/ModuleProgress.tsx`)
   - Module-specific progress

4. **ModuleProgressCard** (`src/components/ModuleProgressCard.tsx`)
   - Individual module card
   - Progress bar
   - Status indicator

5. **ModuleProgressionPanel** (`src/components/ModuleProgressionPanel.tsx`)
   - Panel/table view
   - Multiple modules

6. **CourseProgressChart** (`src/components/CourseProgressChart.tsx`)
   - Visual progress representation

---

### **Curriculum Components**

1. **CourseCreationForm** (`src/components/CourseCreationForm.tsx`)
   - Multi-step form
   - Course/module creation

2. **CourseCreationForm_NEW** (`src/components/CourseCreationForm_NEW.tsx`)
   - Updated version

3. **PlanForm** (`src/components/PlanForm.tsx`)
   - Rollout plan creation

---

### **Assessment Components**

1. **ModerationQueue** (`src/components/ModerationQueue.tsx`)
   - Queue management
   - Assessment review workflow

---

### **AI Components**

**AIChat** (`src/components/ai/AIChat.tsx`)
- Global floating chat widget
- Rendered in root layout
- Collapsible interface
- Persistent across pages

---

### **UI Components** (`src/components/ui/`)

**Purpose:** Reusable, presentational UI elements

1. **button.tsx** - Button variants
2. **input.tsx** - Input field
3. **FormInput.tsx** - Form input with label
4. **Alert.tsx** - Alert/notification box
5. **Tooltip.tsx** - Tooltip wrapper
6. **EmptyState.tsx** - Empty state placeholder
7. **scroll-area.tsx** - Scrollable container
8. **StudentCard.tsx** - Reusable student card (duplicate of main)
9. **ModuleProgressCard.tsx** - Reusable module card (duplicate of main)

---

### **Shared Utility Components**

1. **Toast** (`src/components/Toast.tsx`)
   - Global toast notification system
   - Custom `useToast` hook
   - Position variants

2. **ErrorBoundary** (`src/components/ErrorBoundary.tsx`)
   - React error boundary
   - Wraps entire app
   - Error logging and display

3. **GlobalSearch** (`src/components/GlobalSearch.tsx`)
   - Global search modal/overlay
   - Fuzzy search across entities

4. **ReminderWidget** (`src/components/ReminderWidget.tsx`)
   - Notification/reminder display

---

## Data Flow Patterns

### **Pattern 1: Context + SWR (Global State)**

**Used For:** Students, Groups, Auth

**Flow:**
```
Context Provider (top-level)
  └── useSWR (fetch data)
      └── Provides data via Context
          └── Consumer components (useContext hook)
              └── Display/mutate data
                  └── Trigger SWR revalidation
```

**Example: GroupsContext**
```typescript
// Provider
<GroupsProvider>
  // Uses useSWR internally
  {children}
</GroupsProvider>

// Consumer
const { groups, updateGroup } = useGroups();
// Uses groups directly
// updateGroup triggers mutate('/api/groups')
```

**Advantages:**
- Single source of truth
- Automatic revalidation
- Prevents prop drilling
- Shared across multiple pages

---

### **Pattern 2: Custom Hook + SWR (Scoped State)**

**Used For:** Dashboard data, Progress, Curriculum, Attendance

**Flow:**
```
Page Component
  └── Custom Hook (e.g., useDashboard)
      └── useSWR internally
          └── Returns data + methods
              └── Page uses data directly
```

**Example: useCurriculum**
```typescript
// Hook
export function useCurriculum() {
  const { data, mutate } = useSWR('/api/curriculum', fetcher);
  return { modules: data?.data || [], mutate };
}

// Usage
const { modules, mutate } = useCurriculum();
```

**Advantages:**
- Encapsulated logic
- Reusable across components
- Easy testing
- Clear data dependencies

---

### **Pattern 3: Direct SWR in Component (Local State)**

**Used For:** Page-specific data, one-off fetches

**Flow:**
```
Component
  └── useSWR('/api/endpoint')
      └── Render with data
```

**Example:**
```typescript
const { data, isLoading } = useSWR('/api/attendance/stats', fetcher);
```

**Advantages:**
- Simple and direct
- No abstraction overhead
- Good for unique endpoints

---

### **Pattern 4: Container/Presentational Split**

**Used For:** Complex pages with business logic

**Flow:**
```
Container Component (Smart)
  ├── Data fetching (hooks, SWR)
  ├── Business logic
  ├── State management
  └── Presentational Components (Dumb)
      ├── Props: data, callbacks
      └── UI rendering only
```

**Example: Dashboard**
```typescript
// Container
function DashboardPage() {
  const { stats } = useDashboardStats();
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  return (
    <>
      <DashboardStats stats={stats} />
      <MiniCalendar 
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />
    </>
  );
}

// Presentational
function DashboardStats({ stats }) {
  return <div>{stats.totalStudents}</div>;
}
```

**Advantages:**
- Separation of concerns
- Easy to test presentational components
- Reusable UI components
- Clear data flow (props down)

---

### **Pattern 5: Modal with Mutation**

**Used For:** CRUD operations via modals

**Flow:**
```
Page Component
  └── Shows Modal (state: isOpen)
      └── Modal Component
          ├── Local form state
          ├── API call (POST/PUT/DELETE)
          └── On success:
              ├── Call SWR mutate
              ├── Close modal
              └── Show toast
```

**Example:**
```typescript
// Page
const [showModal, setShowModal] = useState(false);
const { mutate } = useStudents();

// Modal
function AddStudentModal({ onClose, onSuccess }) {
  const handleSubmit = async (data) => {
    const res = await fetch('/api/students', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    });
    if (res.ok) {
      onSuccess(); // Triggers mutate in parent
      onClose();
    }
  };
}

// Call mutate from parent after modal success
const handleModalSuccess = () => {
  mutate(); // Revalidates students list
};
```

**Advantages:**
- Optimistic updates
- Centralized mutation logic
- Consistent UX pattern

---

### **Pattern 6: Global Mutation (Cross-Endpoint Sync)**

**Used For:** Operations that affect multiple endpoints

**Flow:**
```
Component Action
  └── API mutation (POST/PUT/DELETE)
      └── On success:
          ├── mutate(specificEndpoint)
          ├── globalMutate(relatedEndpoint1)
          ├── globalMutate(relatedEndpoint2)
          └── mutate(dashboardEndpoint)
```

**Example: Assessments page**
```typescript
import { mutate as globalMutate } from 'swr';

const handleSaveAssessment = async () => {
  await fetch('/api/assessments', { method: 'POST', ... });
  
  // Sync multiple endpoints
  globalMutate('/api/students'); // Updates student progress
  globalMutate('/api/groups'); // Updates group stats
  globalMutate('/api/groups/progress'); // Updates progress dashboard
  mutate('/api/assessments'); // Local revalidation
};
```

**Advantages:**
- Keeps all related data in sync
- Prevents stale data
- No manual refresh needed

---

### **Pattern 7: URL State (Deep Linking)**

**Used For:** Shareable/bookmarkable state

**Flow:**
```
URL Parameter
  └── useSearchParams (read)
      └── Component state (sync)
          └── User action
              └── router.push (update URL)
```

**Example: Timetable page**
```typescript
const searchParams = useSearchParams();
const dateParam = searchParams.get('date');
const [selectedDate, setSelectedDate] = useState(
  dateParam ? new Date(dateParam) : new Date()
);

// When date changes, update URL
const handleDateChange = (date) => {
  setSelectedDate(date);
  router.push(`/timetable?date=${date.toISOString()}`);
};
```

**Advantages:**
- Shareable links
- Browser history support
- Persistent state across page refresh

---

### **Pattern 8: Optimistic Updates**

**Used For:** Immediate UI feedback while API processes

**Flow:**
```
User Action
  ├── Update local state immediately
  ├── Optimistically update cache
  └── API call
      ├── On success: Keep optimistic update
      └── On error: Rollback to previous state
```

**Example:**
```typescript
const { data, mutate } = useSWR('/api/students', fetcher);

const updateStudent = async (id, updates) => {
  // Optimistic update
  mutate(
    (current) => current.map(s => 
      s.id === id ? { ...s, ...updates } : s
    ),
    false // Don't revalidate immediately
  );
  
  // API call
  try {
    await fetch(`/api/students/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify(updates) 
    });
    mutate(); // Revalidate on success
  } catch (error) {
    mutate(); // Rollback on error
  }
};
```

---

### **Data Flow Summary by Feature**

| Feature | Pattern | State Location | Data Source |
|---------|---------|----------------|-------------|
| Authentication | Context + localStorage | AuthContext | `/api/auth/*` |
| Groups List | Context + SWR | GroupsContext | `/api/groups` |
| Students List | Custom Hook + Context | useStudents + StudentContext | `/api/students` |
| Dashboard Stats | Custom Hook + SWR | useDashboard hooks | `/api/dashboard/*` |
| Timetable | Direct SWR + URL state | Local + URL params | `/api/sessions` |
| Attendance | Direct SWR + Local state | Local state | `/api/attendance/*` |
| Assessments | Direct SWR + Local state | Local state | `/api/assessments`, `/api/unit-standards` |
| Progress | Custom Hook + SWR | useProgress | `/api/progress` |
| Curriculum | Direct SWR | Local state | `/api/curriculum` |
| Lessons | Direct SWR | Local state | `/api/lessons` |
| AI Features | Local state + API | Local state | `/api/ai/*` |
| Modals | Local state | Component state | Various endpoints |

---

## API Integration

### **Fetcher Function** (`src/lib/swr-config.ts`)

```typescript
export const fetcher = async (url: string) => {
  const token = localStorage.getItem('token');
  const res = await fetch(url, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
  return res.json();
};
```

**Pattern:** All SWR hooks use this fetcher with automatic auth header

---

### **SWR Configuration**

**Global Config** (from swr-config.ts):
- Automatic token injection
- Error retry logic
- Deduplication
- Revalidation strategies

**Page-Specific Configs:**
- Dashboard: Longer intervals (2min), minimal auto-revalidate
- Students: Standard revalidation
- Groups: 30s refresh interval, revalidate on focus

---

### **API Endpoint Patterns**

#### **REST Conventions:**
- GET `/api/resource` - List
- GET `/api/resource/:id` - Get one
- POST `/api/resource` - Create
- PUT `/api/resource/:id` - Update
- DELETE `/api/resource/:id` - Delete

#### **Query Parameters:**
- Filtering: `?groupId=123&status=ACTIVE`
- Pagination: `?page=1&limit=20` (if implemented)
- Date ranges: `?startDate=...&endDate=...`

#### **Response Format:**
```typescript
// Standard success response
{
  success: true,
  data: [...] or {...}
}

// Error response
{
  success: false,
  error: "Error message"
}
```

**Note:** Some endpoints return unwrapped arrays, handled by contexts

---

### **Key API Endpoints by Feature**

#### **Authentication**
- POST `/api/auth/login` - Login
- POST `/api/auth/logout` - Logout
- POST `/api/auth/register` - Register (if exists)

#### **Dashboard**
- GET `/api/dashboard/stats` - Overall statistics
- GET `/api/dashboard/recent-activity` - Activity feed
- GET `/api/dashboard/alerts` - System alerts
- GET `/api/dashboard/schedule` - Today's schedule
- GET `/api/dashboard/charts?range=30` - Chart data
- GET `/api/dashboard/programme-health` - Group health metrics

#### **Students**
- GET `/api/students` - List all
- GET `/api/students?groupId=...&status=...` - Filtered list
- GET `/api/students/:id` - Get one
- POST `/api/students` - Create
- PUT `/api/students/:id` - Update
- DELETE `/api/students/:id` - Delete
- PUT `/api/students/:id/archive` - Archive student
- POST `/api/students/bulk` - Bulk operations

#### **Groups**
- GET `/api/groups` - List all with progress
- GET `/api/groups/:id` - Get one
- GET `/api/groups/:id/progress` - Group progress details
- POST `/api/groups` - Create
- PUT `/api/groups/:id` - Update
- DELETE `/api/groups/:id` - Delete
- POST `/api/groups/upload` - Bulk upload

#### **Attendance**
- GET `/api/attendance` - List records
- GET `/api/attendance?sessionId=...&date=...` - Filtered
- GET `/api/attendance/rates?studentIds=...` - Attendance rates
- GET `/api/attendance/stats?startDate=...&endDate=...` - Statistics
- GET `/api/attendance/history` - Historical data
- GET `/api/attendance/alerts` - Attendance alerts
- POST `/api/attendance/session/:id` - Mark session attendance
- POST `/api/attendance/bulk` - Bulk marking
- PUT `/api/attendance/:id` - Update record

#### **Assessments**
- GET `/api/assessments` - List all
- GET `/api/assessments?studentId=...` - By student
- GET `/api/assessments/moderation` - Moderation queue
- POST `/api/assessments` - Create
- PUT `/api/assessments/:id` - Update/mark
- DELETE `/api/assessments/:id` - Delete
- POST `/api/assessments/bulk` - Bulk operations
- POST `/api/assessments/moderate/:id` - Moderate

#### **Unit Standards**
- GET `/api/unit-standards` - List all
- POST `/api/unit-standards` - Create
- PUT `/api/unit-standards/:id` - Update
- DELETE `/api/unit-standards/:id` - Delete

#### **Curriculum**
- GET `/api/curriculum` - Modules with unit standards
- POST `/api/curriculum/upload` - Upload documents
- GET `/api/modules` - Module list

#### **Lessons**
- GET `/api/lessons` - List all
- GET `/api/lessons/:id` - Get one
- POST `/api/lessons` - Create
- PUT `/api/lessons/:id` - Update
- DELETE `/api/lessons/:id` - Delete

#### **Sessions (Timetable)**
- GET `/api/sessions` - List all
- GET `/api/sessions?date=...&groupId=...` - Filtered
- POST `/api/sessions` - Create
- PUT `/api/sessions/:id` - Update
- DELETE `/api/sessions/:id` - Delete

#### **Progress**
- GET `/api/progress?studentId=...` - Student progress
- GET `/api/groups/progress` - All groups progress

#### **AI**
- POST `/api/ai/chat` - Chat with AI
- POST `/api/ai/search` - Semantic search
- POST `/api/ai/generate` - Generate content
- POST `/api/ai/generate-lesson` - Generate lesson plan
- POST `/api/ai/generate-assessment` - Generate questions
- GET `/api/ai/index-stats` - Index statistics
- POST `/api/ai/index-documents` - Trigger indexing

#### **Users (Admin)**
- GET `/api/users` - List all users
- POST `/api/users` - Create user
- PUT `/api/users/:id` - Update user
- DELETE `/api/users/:id` - Delete user

#### **Search**
- GET `/api/search?q=...&filter=...` - Global search

---

## State Management Summary

### **State Layers:**

1. **Global Context State (App-wide)**
   - AuthContext: User authentication
   - GroupsContext: All groups
   - StudentContext: All students

2. **SWR Cache (Server State)**
   - All API responses cached by endpoint
   - Auto-revalidation
   - Optimistic updates

3. **URL State (Shareable State)**
   - Timetable date
   - Assessment filters
   - Search queries

4. **Local Component State (UI State)**
   - Modal open/close
   - Form inputs
   - Filters and selections
   - View modes
   - Expanded sections

5. **localStorage (Persistent UI Preferences)**
   - Auth token
   - Sidebar collapsed state
   - Theme preference

---

## Component Reusability Matrix

### **Highly Reusable (Used in 5+ places)**
- StatCard (dashboard metrics)
- Toast (notifications)
- Button (ui/button)
- Input (ui/input)
- Modal components (various)

### **Moderately Reusable (2-4 places)**
- StudentCard (students, groups, dashboard)
- ModuleProgressCard (progress, dashboard)
- Calendar components (dashboard, timetable, attendance)

### **Single Use (Page-specific)**
- Most page containers
- Specialized forms
- Complex business logic components

---

## Performance Optimizations

### **Code Splitting**
- Dynamic imports for heavy components (DashboardCharts, RecentActivity)
- Lazy loading of modals
- Route-based splitting (Next.js default)

### **SWR Optimizations**
- Disabled revalidateOnFocus on static data
- Deduplication intervals
- Conditional fetching (search only when query exists)
- Longer refresh intervals for slow-changing data

### **Memoization**
- useMemo for expensive calculations (filtering, sorting)
- useCallback for stable callbacks
- React.memo on pure presentational components (likely)

### **Data Loading**
- Parallel data fetching (multiple useSWR in one component)
- Suspense boundaries (ComponentSkeleton on dashboard)
- Progressive loading (step-by-step AI generation)

---

## Architecture Patterns Summary

### **Adopted Patterns:**
1. ✅ **Container/Presentational** - Clear separation on complex pages
2. ✅ **Context API** - For global app state (auth, groups, students)
3. ✅ **Custom Hooks** - Abstraction layer over SWR
4. ✅ **SWR** - Server state management with cache
5. ✅ **Composition** - Building complex UIs from simple components
6. ✅ **Controlled Components** - Form inputs with state
7. ✅ **Render Props** - Toast with useToast hook
8. ✅ **HOC** - ErrorBoundary wrapping app
9. ✅ **Dynamic Imports** - Performance optimization
10. ✅ **URL State** - Deep linking support

### **State Management Philosophy:**
- **Server state → SWR**: All API data
- **Global UI state → Context**: Auth, shared entities
- **Local UI state → useState**: Component-specific
- **Persistent preferences → localStorage**: Theme, layout
- **Shareable state → URL params**: Filters, selections

### **Component Design Philosophy:**
- **Small, focused components** where possible
- **Container components** handle data and logic
- **Presentational components** are pure and reusable
- **Co-location** of related components (modals/, calendar/, ui/)
- **Consistent naming**: Modal suffix, Card suffix, View suffix

---

## Developer Guidelines (Inferred)

### **When to use Context:**
- Data needed by many components across different pages
- Avoid prop drilling
- Global app state (auth, user, common entities)

### **When to use Custom Hook:**
- Reusable data fetching logic
- Complex derived state
- Shared behavior across components

### **When to use Direct SWR:**
- Page-specific data
- Simple, one-off fetches
- When custom hook would be overkill

### **When to use Local State:**
- UI-only state (open/closed, selected, etc.)
- Form inputs
- Temporary data

### **File Organization:**
- Pages in `src/app/` (route-based)
- Reusable components in `src/components/`
- Subfolders for related components (ui/, modals/, calendar/)
- Contexts in `src/contexts/`
- Hooks in `src/hooks/`
- Utilities in `src/lib/`

---

## Dependency Graph Visualization

```
Pages
├── Use Contexts (AuthContext, GroupsContext, StudentContext)
├── Use Custom Hooks (useStudents, useCurriculum, useDashboard, etc.)
│   └── Custom Hooks use SWR internally
├── Use Direct SWR (for page-specific data)
└── Render Components
    ├── Layout Components (MainLayout, Sidebar, Header)
    ├── Modal Components (various)
    ├── Business Components (DashboardStats, AttendanceCalendar, etc.)
    └── UI Components (Button, Input, Alert, etc.)

Contexts
└── Use SWR for data fetching
    └── Provide data + methods to consumers

All SWR Calls
└── Use shared fetcher (with auth token)
    └── Call API endpoints
        └── Return standardized responses
```

---

## Future Recommendations

### **Potential Improvements:**
1. **TypeScript interfaces**: Centralize in `src/types/index.ts`
2. **Form library**: Consider React Hook Form for complex forms
3. **Validation**: Zod or Yup for schema validation
4. **Component library**: Consider shadcn/ui for more components
5. **Testing**: Add unit tests for hooks and presentational components
6. **Storybook**: Document and develop UI components in isolation
7. **Performance monitoring**: Add React DevTools profiling
8. **Error tracking**: Integrate Sentry or similar
9. **Analytics**: Track user interactions
10. **Accessibility**: ARIA labels, keyboard navigation

### **Refactoring Opportunities:**
1. Consolidate duplicate components (StudentCard, ModuleProgressCard in multiple places)
2. Extract common modal logic into a base Modal component
3. Create consistent table component
4. Standardize error handling
5. Unify API response format handling

---

## Component Count Summary

- **Pages:** 27
- **Layout Components:** 3 (MainLayout, Sidebar, Header)
- **Modal Components:** ~20
- **Dashboard Components:** 10
- **Business Logic Components:** ~30
- **UI Components:** 9
- **Contexts:** 3 (Auth, Groups, Students)
- **Custom Hooks:** 12
- **Total Components:** **80+**

---

## Conclusion

This Next.js application follows modern React patterns with a clear separation of concerns:

- **Data fetching** is centralized through SWR and custom hooks
- **Global state** is managed via Context API for auth and common entities
- **Component hierarchy** follows container/presentational pattern
- **Code is organized** by feature and reusability
- **Performance** is optimized with dynamic imports and smart caching
- **Developer experience** is enhanced with TypeScript and consistent patterns

The architecture is scalable, maintainable, and follows React best practices. The heavy use of SWR for server state management provides excellent UX with automatic revalidation and optimistic updates.

---

**Document End**
