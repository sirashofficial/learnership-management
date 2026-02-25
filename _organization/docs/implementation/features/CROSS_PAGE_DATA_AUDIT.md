# Cross-Page Data Dependencies Audit
## How Groups Connect to Attendance, Dashboard, Assessments, Students

---

## 📊 DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE (Prisma)                                  │
│  ┌─────────┐  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Groups  │  │  Students   │  │ Assessments  │  │ Attendance   │           │
│  └────┬────┘  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘           │
└───────┼──────────────┼─────────────────┼────────────────┼───────────────────┘
        │              │                 │                │
        │ FK:groupId   │ FK:studentId    │ FK:groupId    │
        │              │                 │                │
        ▼              ▼                 ▼                ▼
    ┌──────────────────────────────────────────────────────────────────┐
    │                      API ENDPOINTS                               │
    │ ┌──────────────────────────────────────────────────────────────┐ │
    │ │ /api/groups              → Group list + students + counts    │ │
    │ │ /api/groups/progress     → Calculate actual progress         │ │
    │ │ /api/students            → List all students + groups        │ │
    │ │ /api/assessments         → All assessments (raw, not filtered)│ │
    │ │ /api/attendance/stats    → Attendance calculations           │ │
    │ └──────────────────────────────────────────────────────────────┘ │
    └──────────────────────────────────────────────────────────────────┘
        │                      │                       │
        │ useGroups()          │ useStudents()         │ useSWR()
        │                      │                       │
        ▼                      ▼                       ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                   FRONTEND PAGES                                │
    │ ┌─────────────────────────────────────────────────────────────┐ │
    │ │ Groups Page      ✓ Uses useGroups                           │ │
    │ │ Dashboard        ✓ Uses useGroups                           │ │
    │ │ Students Page    ✓ Uses useGroups + useStudents            │ │
    │ │ Assessments      ✓ Uses useGroups + useStudents             │ │
    │ │ Attendance       ✗ Reconstructs from useStudents (NO groups)│ │
    │ └─────────────────────────────────────────────────────────────┘ │
    └─────────────────────────────────────────────────────────────────┘
```

---

## 🔴 CRITICAL DATA INCONSISTENCIES

### 1. **Attendance Page Gets Groups Wrong** ⚠️ CRITICAL

**Problem:** Attendance page doesn't use `useGroups` - reconstructs groups from student data

**Code (Line 67-83 of attendance/page.tsx):**
```typescript
const { students: apiStudents, isLoading } = useStudents();  // ← No useGroups!

// Reconstructs groups manually:
const groupedStudents = useMemo(() => {
  const groups: { [key: string]: any } = {};
  apiStudents.forEach((student) => {
    const groupId = student.group?.id || 'no-group';
    if (!groups[groupId]) {
      groups[groupId] = {
        id: groupId,
        name: student.group?.name || 'No Group',  // ← Just grabbes from student data
        students: [],
        group: student.group,
      };
    }
    groups[groupId].students.push(student);
  });
  return groups;
}, [apiStudents]);
```

**Issues:**
- ❌ Different groups data than Groups page (which uses useGroups directly)
- ❌ Groups page shows 46 students, Attendance shows different count
- ❌ Group metadata missing (startDate, endDate, status, etc.)
- ❌ If a group has no students, it's not shown (invisible!)
- ❌ No group statistics available (attendance rate by group, etc.)

**What Should Happen:**
```typescript
const { groups } = useGroups();  // Use the same data source

// Then, attach student counts:
const groupsWithStudents = useMemo(() => {
  return groups.map(group => {
    const studentsInGroup = apiStudents.filter(
      s => s.group?.id === group.id
    );
    return {
      ...group,
      students: studentsInGroup,
    };
  });
}, [groups, apiStudents]);
```

---

### 2. **Attendance Calculations Differ Across Pages**

**Where Attendance Calculated:**
1. **Attendance Page**: Groups reconstructed from students
2. **Groups Page**: Fetches from `/api/attendance/stats?groupId={id}&startDate=...&endDate=...`
3. **Dashboard**: Uses dynamically fetched stats
4. **Compliance Page**: Separate stats fetch

**Formula in `/api/attendance/stats` (Line 100):**
```typescript
const attendanceRate = total > 0 ? ((present + late) / total) * 100 : 0;
```

**Problem:** 
- Formula divides by total **records**, not students
- Same formula used everywhere, but different data sources
- Can show different results for same group on different pages

**Example Inconsistency:**
```
Groups Page: Shows 75% attendance (from batch API call)
Attendance Page: Shows 82% (from reconstructed data)
Dashboard: Shows 73% (from different time range)

Same group = 3 different percentages!
```

---

### 3. **Progress Calculations Are Fragmented**

**Three Different Methods:**

**Method 1: Groups Page (Lines 459-473)**
```typescript
// Uses actualProgressData from /api/groups/progress
const actualProgressByGroup = useMemo(() => {
  const payload = Array.isArray(actualProgressData?.data) ? actualProgressData.data : [];
  // Calculates: avgCredits, avgPercent
}, [actualProgressData]);
```

**Method 2: Dashboard**
```typescript
// Uses useDashboardStats hook
const { stats: dashboardStats } = useDashboardStats();
// Returns different structure
```

**Method 3: Students Page**
```typescript
// Calculates progress individually per student
// Different from group-level calculations
```

**Issues:**
- ❌ Each page calculates progress differently
- ❌ No consistency in methodology
- ❌ Dashboard progress ≠ Groups progress ≠ Student progress
- ❌ "Projected vs Actual" not used consistently

---

### 4. **Group Filter Dropdown Inconsistencies**

**Students Page (Line 547-563):**
```typescript
{groups?.map((group: any) => (
  <option key={group.id} value={group.id}>
    {formatGroupNameDisplay(group.name)} - {group.company?.name}
  </option>
))}
```
- Shows groups from context

**Assessments Page (Line 1564):**
```typescript
<select value={selectedGroup} onChange={...}>
  {groups?.map(g => <option value={g.id}>{g.name}</option>)}
</select>
```
- Shows groups from context

**Attendance Page (Line ~67-150)**
```typescript
// Groups hardcoded:
const groupCollections: GroupCollection[] = [
  {
    id: "montzelity",
    name: "MONTZELITY (LP) - 2026",
    subGroupNames: [
      "AZELIS SA (LP) - 2026",
      // ...
    ]
  }
];
```
- ❌ **HARDCODED!** Not from database
- ❌ Hidden groups if not in this list
- ❌ Doesn't match actual groups in DB
- ❌ Requires manual maintenance

---

### 5. **Student Count Mismatch Issue** (You Already Found!)

| Page | Count | Method |
|------|-------|--------|
| Students Page | 20 (fixed to 46 with pagination fix) | API with pageSize |
| Groups Page | 46 | Deduplicates by name/ID |
| Dashboard | 46 | From groups with deduplication |
| Attendance | Different | Reconstructs from students |

**Different data sources = different counts**

---

## 🟠 DATA SYNCHRONIZATION ISSUES

### 6. **No Real-Time Sync Between Pages**

**Current Problem:**
- User adds student to group on Students page
- Groups page doesn't update (needs manual refresh)
- Attendance page doesn't see new student (needs page reload)

**Why:**
- Each page fetches independently
- No WebSocket or event system
- SWR has 30s refresh interval (hardcoded in contexts)
- Manual `mutate()` calls scattered throughout code

**Example (Assessments Page, Line 118-122):**
```typescript
const fetchAssessments = async () => {
  try {
    const res = await fetch('/api/assessments', { credentials: 'include' });
    const data = await res.json();
    setAssessments(Array.isArray(data) ? data : data.data || []);
    // Manual mutates:
    globalMutate('/api/students');
    globalMutate('/api/groups');
    globalMutate('/api/groups/progress');
  } catch (error) {
    console.error('Error fetching assessments:', error);
  }
};
```

**Issues:**
- ❌ Only mutates when assessments fetched
- ❌ Doesn't mutate when user navigates away
- ❌ Doesn't work if user opens multiple pages
- ❌ Race conditions possible

---

### 7. **Attendance Data Inconsistency**

**Where Attendance Stored:**

**Option A: useStudents Hook** (Attendance page reconstructs from here)
```
student.attendance[]  // ← Not fetched by useStudents!
```

**Option B: Separate useSWR** (Students page)
```typescript
const { data: attendanceData } = useSWR(
  `/api/attendance/rates?studentIds=${studentIds}`
);
```

**Option C: Direct API** (Attendance page)
```typescript
const groupStats = await fetch(
  `/api/attendance/stats?groupId=${groupId}&startDate=...&endDate=...`
);
```

**Problem:**
- ❌ No single source of truth for attendance
- ❌ Each page fetches differently
- ❌ Different date ranges → different results
- ❌ Can't see real-time updates

---

## 📋 SUMMARY TABLE

| Component | Data Source | Issue | Impact |
|-----------|-------------|-------|--------|
| Groups Page | `useGroups()` ✓ | None | Clean |
| Dashboard | `useGroups()` ✓ | None | Clean |
| Students Page | `useGroups()` ✓ | None | Clean |
| Assessments | `useGroups()` ✓ | None | Clean |
| **Attendance** | **Reconstructed** ❌ | Missing group data | Wrong group list |
| Progress | 3 different APIs ❌ | Fragmented | Inconsistent |
| Attendance Rate | Multiple formulas ❌ | Different results | 3 different %'s |
| Student Count | useStudents() paging | Fixed but fragile | 46 vs 20 |
| Group Filter | `useGroups()` vs hardcoded ❌ | Attendance hardcoded | Hidden groups |

---

## 🔧 CRITICAL FIXES NEEDED

### P0 - Breaking Issues (Do First)
1. **Attendance page must use `useGroups()`** instead of reconstructing
2. **Standardize progress calculation** - use single formula everywhere
3. **Fix attendance percentage formula** - per-student average, not record-based
4. **Remove hardcoded group list** from attendance page

### P1 - Data Consistency (Do Next)
5. **Create data sync layer** - fix race conditions
6. **Standardize attendance data structure** - single API for all pages
7. **Add group metadata to attendance** - currently missing
8. **Document data flow** - which page owns which data

### P2 - Nice to Have
9. **Add real-time sync** - WebSocket or polling
10. **Centralize calculations** - utility functions, not duplicated logic
11. **Add data validation** - catch inconsistencies earlier
12. **Add caching layer** - reduce API calls

---

## 🎯 RECOMMENDED ARCHITECTURE

### Current (Broken):
```
Page A → API → Data → Cache (30s)
Page B → API → Data → Cache (30s)
Page C → hardcoded list
Result: Inconsistent data, multiple sources of truth
```

### Proposed (Better):
```
All Pages → GroupsContext (caches /api/groups)
         → AttendanceContext (caches /api/attendance)
         → ProgressContext (caches /api/groups/progress)
         ↓
    Single source of truth per domain
    Real-time sync via events
    Consistent calculations
```

---

## 🚨 AFFECTED USER FLOWS

### Flow 1: Add Student
```
❌ Current:
   1. User adds student on Groups page
   2. Students page doesn't see them immediately
   3. Attendance page doesn't see them
   4. Assessment counts are wrong

✓ After Fix:
   1. User adds student
   2. All pages update instantly
   3. Counts correct everywhere
```

### Flow 2: Mark Attendance
```
❌ Current:
   1. User marks attendance on Attendance page
   2. Attendance % changes
   3. Groups page shows different %
   4. Dashboard shows yet another %

✓ After Fix:
   1. User marks attendance
   2. Single source updates
   3. All pages show same %
```

### Flow 3: Record Assessment
```
❌ Current:
   1. User records COMPETENT assessment
   2. Student progress updates
   3. Wait 30s for cache refresh
   4. Groups page shows 30% behind

✓ After Fix:
   1. User records assessment
   2. Immediate update across all pages
   3. Consistent progress everywhere
```

---

## 📝 ACTION ITEMS

| # | Issue | Where | Fix | Priority |
|---|-------|-------|-----|----------|
| 1 | Attendance reconstructs groups | attendance/page.tsx | Use useGroups() | P0 |
| 2 | Progress calculated 3 ways | multiple | Create utils/progress.ts | P0 |
| 3 | Attendance % wrong formula | api/attendance/stats | Per-student average | P0 |
| 4 | Hardcoded group list | attendance/page.tsx | Remove, use DB | P0 |
| 5 | No data sync | contexts/ | Add event system | P1 |
| 6 | Different attendance APIs | multiple | Standardize endpoint | P1 |
| 7 | Race conditions | assessments/page.tsx | debounce mutates | P1 |

