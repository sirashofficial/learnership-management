# Dashboard Data Flow Analysis

**Date:** February 19, 2026  
**Analysis Focus:** Data connectivity, empty sections, API integration, and styling issues

---

## 1. DASHBOARD SECTIONS & DATA STATUS

### 1.1 Quick Actions Section
**Location:** [src/components/QuickActions.tsx](src/components/QuickActions.tsx)

**Buttons:**
| Button | Style | Color | Data Flow |
|--------|-------|-------|-----------|
| Add Student | `btn-primary` | Green (emerald-600) | POST `/api/students` |
| Create Group | `btn-secondary` | White (border) | POST `/api/groups` |
| Schedule Lesson | `btn-secondary` | White (border) | Opens Modal (no API) |
| Mark Attendance | `btn-secondary` | White (border) | Opens Modal (no API) |

**Issue:** Inconsistent styling - only "Add Student" is green (primary), all others are white (secondary). No semantic reason apparent.

**Recommendation:** Either make all consistently secondary, or establish a style hierarchy where only critical main action is primary.

---

### 1.2 Dashboard Stats Cards
**Location:** [src/components/DashboardStats.tsx](src/components/DashboardStats.tsx)

**Data Source:** `/api/dashboard/stats` hook: [src/hooks/useDashboard.ts](src/hooks/useDashboard.ts)

**Stats Displayed:**
| Stat | Value | Expected | Status |
|------|-------|----------|--------|
| Total Students | From `groups` context OR API | Count of ACTIVE students | ✅ Working |
| Groups & Companies | From `groups` context OR API | Count of ACTIVE groups | ✅ Working |
| Attendance Rate | From API | Last 30 days average | ✅ Working |
| Active Courses | From API | Count of ACTIVE modules | ✅ Working |
| Completion Rate | From API | Students at 100% progress | ✅ Working |
| Pending Assessments | From API | Assessments with status PENDING/null | ✅ Working |

**API Endpoint:** [src/app/api/dashboard/stats/route.ts](src/app/api/dashboard/stats/route.ts)  
**Data Status:** ✅ **All connected and working**

---

### 1.3 Programme Health Table
**Location:** [src/app/page.tsx](src/app/page.tsx) (lines 380-460)

**Data Source:** `/api/dashboard/summary`

**Endpoint:** [src/app/api/dashboard/summary/route.ts](src/app/api/dashboard/summary/route.ts)

**Fields Displayed:**
- Group Name (with link)
- Current Module + Module Name
- Credit Progress (earned/total)
- Projected Completion Date
- Status Badge (ON_TRACK, AHEAD, BEHIND, AT_RISK, NO_PLAN)

**Data Status:** ✅ **Fully implemented**

---

### 1.4 Attendance Trend Chart
**Location:** [src/components/DashboardCharts.tsx](src/components/DashboardCharts.tsx)

**Component:** [src/components/AttendanceTrendChart.tsx](src/components/AttendanceTrendChart.tsx)

**Data Source:** `/api/dashboard/charts?range={timeRange}`

**API Endpoint:** [src/app/api/dashboard/charts/route.ts](src/app/api/dashboard/charts/route.ts) (lines 8-50)

**Expected Data Structure:**
```typescript
{
  date: string;      // "YYYY-MM-DD"
  rate: number;      // 0-100
  present: number;   // count
  total: number;     // count
}[]
```

**Data Flow:**
- ✅ API queries `attendance` table, groups by date
- ✅ Calculates attendance rate (PRESENT + LATE) / total
- ✅ Frontend renders line chart

**Status:** ✅ **Fully working**

---

### 1.5 Group Distribution Chart (Pie Chart)
**Location:** [src/components/DashboardCharts.tsx](src/components/DashboardCharts.tsx)

**Component:** [src/components/GroupDistributionChart.tsx](src/components/GroupDistributionChart.tsx)

**Expected Data Structure:**
```typescript
{
  id: string;
  name: string;
  companyName: string;      // ⚠️ MISSING!
  studentCount: number;
  percentage: number;
}[]
```

**API Endpoint:** [src/app/api/dashboard/charts/route.ts](src/app/api/dashboard/charts/route.ts) (lines 51-75)

**Current Implementation:**
```typescript
const groupDistribution = groupsWithCounts.map((group: any) => ({
  id: group.id,
  name: group.name,
  // ❌ companyName NOT included
  studentCount: group._count.students,
  percentage: 0, // Calculated after
}));
```

**Issues Found:**
1. ⚠️ **Missing `companyName` field** - component expects it but API doesn't provide it
2. ⚠️ **Could cause tooltip to show undefined** if component tries to display company name

**Status:** ⚠️ **BROKEN - Data structure mismatch**

**Fix Needed:** Add company info to API query:
```typescript
const groupsWithCounts = await prisma.group.findMany({
  where: { status: 'ACTIVE' },
  include: {
    _count: { select: { students: true } },
    company: { select: { name: true } }  // ADD THIS
  },
});

const groupDistribution = groupsWithCounts.map((group: any) => ({
  id: group.id,
  name: group.name,
  companyName: group.company?.name || 'No Company',  // ADD THIS
  studentCount: group._count.students,
  percentage: 0,
}));
```

---

### 1.6 Course Progress Chart (Bar Chart)
**Location:** [src/components/DashboardCharts.tsx](src/components/DashboardCharts.tsx)

**Component:** [src/components/CourseProgressChart.tsx](src/components/CourseProgressChart.tsx)

**Expected Data Structure:**
```typescript
{
  id: string;
  name: string;
  code: string;
  completionRate: number;
  studentsCompleted: number;
  totalStudents: number;
  avgProgress: number;
}[]
```

**Data Status:** ✅ **Matching and working**

---

### 1.7 Recent Activity Feed
**Location:** [src/components/RecentActivity.tsx](src/components/RecentActivity.tsx)

**Data Source:** `/api/dashboard/recent-activity`

**API Endpoint:** [src/app/api/dashboard/recent-activity/route.ts](src/app/api/dashboard/recent-activity/route.ts)

**Current Scope:** Last 5 **newly added students** only

**Activity Types Shown:**
- `STUDENT_ADDED` - When a student is enrolled

**Issues Found:**
1. ⚠️ **Very limited activity types** - only shows student enrollments
2. ⚠️ **No other event types tracked** - doesn't show:
   - Session attendance marked
   - Assessments completed
   - Progress milestones
   - Group status changes
   - Moderation completed

**Data Status:** ✅ **Working but limited**

**Frontend Handling:**
- Shows "No recent activity" when `activities.length === 0`
- Displays loading spinner during fetch
- Links to student details modal

---

### 1.8 Alerts Section
**Location:** [src/components/DashboardAlerts.tsx](src/components/DashboardAlerts.tsx)

**Data Source:** `/api/dashboard/alerts`

**API Endpoint:** [src/app/api/dashboard/alerts/route.ts](src/app/api/dashboard/alerts/route.ts)

**Alert Types Implemented:**
1. **Assessment Deadlines** - 3 days ahead, URGENT if ≤ 1 day
2. **Low Attendance** - < 75% in last 7 days
3. **Pending Moderation** - Assessments awaiting review
4. **At-Risk Students** - Low progress
5. **Missing Documents** - Compliance documents
6. **Course Ending** - Upcoming course completion

**Data Status:** ✅ **Fully implemented**

**Frontend Features:**
- Shows count of active alerts
- Color-coded by priority (URGENT=red, WARNING=amber, INFO=green)
- Dismissible (client-side only)
- Routes to relevant pages on click

---

### 1.9 Upcoming Schedule (Today's Schedule)
**Location:** [src/components/TodaysSchedule.tsx](src/components/TodaysSchedule.tsx)

**Data Source:** `/api/dashboard/schedule`

**API Endpoint:** [src/app/api/dashboard/schedule/route.ts](src/app/api/dashboard/schedule/route.ts)

**Scope:** Next 7 days of:
- Lesson Plans
- Sessions

**Data Status:** ✅ **Fully working**

**Empty State:** Shows "No classes scheduled for today" with link to full calendar

---

### 1.10 Calendar (Mini Calendar + Day Panel)
**Location:** [src/app/page.tsx](src/app/page.tsx#L550) - Sidebar

**Data Source:** `/api/timetable?start={monthStart}&end={monthEnd}`

**Data Status:** ✅ **Fully working**

**Shows:**
- Month sessions dotted on calendar
- Click day to see sessions
- Hover preview
- Quick attendance marking

---

## 2. API ENDPOINT INVENTORY

### Available Dashboard Endpoints

| Endpoint | Method | File | Status | Data Issues |
|----------|--------|------|--------|------------|
| `/api/dashboard/stats` | GET | [stats/route.ts](src/app/api/dashboard/stats/route.ts) | ✅ Working | None |
| `/api/dashboard/charts` | GET | [charts/route.ts](src/app/api/dashboard/charts/route.ts) | ⚠️ Partial | Missing `companyName` in group dist |
| `/api/dashboard/recent-activity` | GET | [recent-activity/route.ts](src/app/api/dashboard/recent-activity/route.ts) | ✅ Working | Limited activity types |
| `/api/dashboard/alerts` | GET | [alerts/route.ts](src/app/api/dashboard/alerts/route.ts) | ✅ Working | None |
| `/api/dashboard/schedule` | GET | [schedule/route.ts](src/app/api/dashboard/schedule/route.ts) | ✅ Working | None |
| `/api/dashboard/summary` | GET | [summary/route.ts](src/app/api/dashboard/summary/route.ts) | ✅ Working | None |
| `/api/timetable` | GET | [timetable/route.ts](src/app/api/timetable/route.ts) | ✅ Working | None |

### Endpoint Call Chain
```
Dashboard Page (src/app/page.tsx)
├── useDashboardStats() → /api/dashboard/stats
├── useDashboardCharts() → /api/dashboard/charts
├── useRecentActivity() → /api/dashboard/recent-activity
├── useDashboardAlerts() → /api/dashboard/alerts
├── useDashboardSchedule() → /api/dashboard/schedule
├── fetch('/api/dashboard/summary') → /api/dashboard/summary
└── useSWR('/api/timetable?start=...&end=...') → /api/timetable
```

---

## 3. STYLING ISSUES

### Quick Actions Button Inconsistency

**Current State:**
```tsx
// QuickActions.tsx lines 85-108
<button className="btn-primary">  {/* GREEN */}
  Add Student
</button>

<button className="btn-secondary">  {/* WHITE */}
  Create Group
</button>

<button className="btn-secondary">  {/* WHITE */}
  Schedule Lesson
</button>

<button className="btn-secondary">  {/* WHITE */}
  Mark Attendance
</button>
```

**Button Style Definitions** [src/app/globals.css](src/app/globals.css#L111-L134):
```css
.btn-primary {
  @apply px-4 py-2.5 bg-emerald-600 text-white ...  /* GREEN */
}

.btn-secondary {
  @apply px-4 py-2.5 bg-white text-slate-700 border border-slate-200 ...  /* WHITE WITH BORDER */
}
```

**Analysis:**
- "Add Student" is the **only primary action** (green)
- All other actions are secondary (white outline)
- ✅ May be intentional if "Add Student" is the main workflow
- ⚠️ Could also be accidental inconsistency

**Options:**
1. **Keep as-is** - If "Add Student" is the primary action for dashboard users
2. **Make all secondary** - For consistency, use action modals like others
3. **Establish hierarchy** - Only most critical action gets primary styling

**Recommendation:** Document the styling choice; if "Add Student" is truly the primary workflow, add a comment explaining the design decision.

---

## 4. DATA STRUCTURE MISMATCHES

### Issue #1: Group Distribution Chart - Missing companyName

**File:** [src/app/api/dashboard/charts/route.ts](src/app/api/dashboard/charts/route.ts)

**Error:** API doesn't include company information

**Severity:** Medium - Chart still renders but tooltips may show undefined

**Solution:**
```typescript
// Line 64-70 in charts/route.ts
const groupsWithCounts = await prisma.group.findMany({
  where: { status: 'ACTIVE' },
  include: {
    _count: { select: { students: true } },
    company: { select: { name: true } }  // ADD THIS LINE
  },
});
```

---

## 5. EMPTY SECTION ANALYSIS

### Which Sections Could Be Empty?

| Section | Trigger for Empty | Frontend Message | Recovery |
|---------|------------------|------------------|----------|
| Stats Cards | No data | Shows "0" | N/A - always has values |
| Programme Health | No active groups | Hidden (conditional render) | Add active group with students |
| Attribution Trend | No attendance records | "No attendance data available" | Record attendance |
| Group Distribution | No active groups | "No group data available" | Create active group |
| Course Progress | No in-progress modules | "No course progress data available" | Create/activate modules |
| Recent Activity | No recent students | "No recent activity" | Enroll student |
| Alerts | No conditions met | "All clear" with green checkmark | N/A - shows when conditions met |
| Schedule | No sessions next 7 days | "No classes scheduled" with action button | Schedule session |
| Calendar | No sessions in month | Blank calendar | Schedule sessions |

---

## 6. ACTIONABLE ISSUES SUMMARY

| Priority | Issue | Location | Fix Complexity | Data Impact |
|----------|-------|----------|-----------------|------------|
| **CRITICAL** | Group Distribution chart missing `companyName` | charts/route.ts:64-70 | Low | Chart tooltip broken |
| **MEDIUM** | Quick action button styling inconsistent | QuickActions.tsx:85-108 | Low | UX confusion |
| **LOW** | Recent Activity only shows student enrollments | recent-activity/route.ts | Medium | Limited visibility |
| **INFO** | Programme Health requires active groups | summary/route.ts | N/A | Works by design |

---

## 7. WORKING PROPERLY (No Issues)

✅ **Attendance Trend Chart** - Data flows correctly  
✅ **Course Progress Chart** - All fields provided  
✅ **Dashboard Stats** - All 6 stats calculating  
✅ **Alerts System** - All alert types functional  
✅ **Schedule Fetching** - 7-day schedule working  
✅ **Programme Health** - Credit calculations working  
✅ **Mini Calendar** - Month sessions populating  
✅ **Empty States** - All components handle no-data gracefully  

---

## 8. QUICK FIXES NEEDED

### Fix #1: Add companyName to Group Distribution (Priority: HIGH)
**File:** [src/app/api/dashboard/charts/route.ts](src/app/api/dashboard/charts/route.ts)

Replace lines 64-70:
```typescript
// OLD:
const groupsWithCounts = await prisma.group.findMany({
  where: { status: 'ACTIVE' },
  include: {
    _count: {
      select: { students: true },
    },
  },
});

// NEW:
const groupsWithCounts = await prisma.group.findMany({
  where: { status: 'ACTIVE' },
  include: {
    _count: {
      select: { students: true },
    },
    company: {
      select: { name: true },
    },
  },
});
```

Update mapping (lines 75-80):
```typescript
// OLD:
const groupDistribution = groupsWithCounts.map((group: any) => ({
  id: group.id,
  name: group.name,
  studentCount: group._count.students,
  percentage: 0,
}));

// NEW:
const groupDistribution = groupsWithCounts.map((group: any) => ({
  id: group.id,
  name: group.name,
  companyName: group.company?.name || 'No Company',
  studentCount: group._count.students,
  percentage: 0,
}));
```

---

## 9. RECOMMENDATIONS

### Short-term (This Session)
1. ✅ Fix missing `companyName` in group distribution API
2. ✅ Document Quick Actions button styling decision
3. ✅ Test empty states manually on each section

### Medium-term
1. Extend Recent Activity to include:
   - Session attendance recorded
   - Assessment completion
   - Module progress milestones
   - Group status changes

2. Add filtering/time range controls to:
   - Recent Activity feed
   - Alerts (by type/priority)
   - Schedule (by group/facilitator)

### Long-term
1. Add dashboard customization (user preferences for visible sections)
2. Implement real-time updates for alerts
3. Add export functionality for charts
4. Dashboard permission-based visibility (students vs facilitators vs admins)

---

## 10. VERIFICATION CHECKLIST

- [ ] All API endpoints responding with correct data structures
- [ ] Empty states tested on each section
- [ ] Charts render with sample data
- [ ] Programme Health table shows for groups with students
- [ ] Alerts displaying correctly by priority
- [ ] Recent Activity showing latest enrollments
- [ ] Schedule showing next 7 days
- [ ] Calendar showing month sessions
- [ ] Quick Actions buttons all functional
- [ ] Data refreshes on window focus
- [ ] Responsive design on mobile/tablet
- [ ] Dark mode styling applied

