# Groups Page - Comprehensive Code Review & Audit
**Date:** February 18, 2026  
**File:** `src/app/groups/page.tsx` (1678 lines)  
**Reviewer:** AI Code Review Analysis

---

## 🔴 CRITICAL ISSUES (Must Fix)

### 1. **Excessive Type Casting with `any` - Type Safety Violations**
**Severity:** CRITICAL  
**Lines:** Throughout (50+ occurrences)  
**Issue:**
```tsx
// ❌ BAD - No type safety
const getGroupStudentCount = (group: any) => {
(group: any) =>
(group?.students || []).forEach((student: any) => {
```

**Impact:**
- Zero type safety at runtime
- Hidden bugs won't caught until runtime
- Makes refactoring dangerous
- Typescript provides no intellisense

**Fix:** Create proper interfaces
```tsx
interface Student {
  id: string;
  firstName: string | null;
  lastName: string | null;
  studentId?: string;
}

interface GroupWithStudents {
  id: string;
  name: string;
  students?: Student[];
  _count?: { students: number };
  // ... other fields
}
```

---

### 2. **Missing Error Handling for Critical Data**
**Severity:** CRITICAL  
**Lines:** 457-461, 474-479  
**Issue:**
```tsx
// ❌ NO ERROR HANDLING - Silent failures
const { data: actualProgressData, error: progressError } = useSWR(
  '/api/groups/progress',
  // ...
);

// Error is logged but data not validated
if (progressError) {
  console.error('Error fetching group progress:', progressError);
  // But component still renders with undefined data!
}
```

**Problems:**
- Error state exists but not handled in UI
- `actualProgressData` could be malformed
- No fallback values or error messages for users
- Silently fails if API returns unexpected shape

**Fix:**
```tsx
const { data: actualProgressData, error: progressError, isLoading: progressLoading } = useSWR(
  '/api/groups/progress',
  fetcher,
  { revalidateOnFocus: false }
);

if (progressError) {
  // Handle in UI
  return <ErrorBoundary message="Failed to load group progress" />;
}

if (progressLoading) {
  return <LoadingSkeleton />;
}
```

---

### 3. **Duplicated Student Deduplication Logic**
**Severity:** HIGH  
**Lines:** 122-170  
**Issue:**
```tsx
// ❌ Nearly identical code in two functions
const getGroupStudentCount = (group: any) => {
  const students = Array.isArray(group?.students) ? group.students : [];
  if (students.length > 0) {
    const keys = new Set<string>();
    students.forEach((student: any) => {
      const first = String(student?.firstName || '').trim().toLowerCase();
      const last = String(student?.lastName || '').trim().toLowerCase();
      if (first || last) {
        keys.add(`name:${first} ${last}`.trim());
        return;
      }
      const id = student?.id || student?.studentId;
      if (id) keys.add(`id:${id}`);
    });
    return keys.size;
  }
  return group?._count?.students || 0;
};

// ❌ DUPLICATED CODE - Same logic
const getUniqueStudentTotal = (groupList: any[]) => {
  const keys = new Set<string>();
  groupList.forEach((group) => {
    const students = Array.isArray(group?.students) ? group.students : [];
    if (students.length > 0) {
      students.forEach((student: any) => {
        // ... SAME LOGIC REPEATED
      });
    }
    // ...
  });
  return keys.size;
};
```

**Impact:**
- DRY (Don't Repeat Yourself) violation
- Bug fixes must be applied in 2 places
- Maintenance nightmare
- Inconsistent behavior possible

**Fix:**
```tsx
const deduplicateStudentKeys = (students: Student[]): Set<string> => {
  const keys = new Set<string>();
  students.forEach((student) => {
    const first = String(student?.firstName || '').trim().toLowerCase();
    const last = String(student?.lastName || '').trim().toLowerCase();
    if (first || last) {
      keys.add(`name:${first} ${last}`.trim());
      return;
    }
    const id = student?.id || student?.studentId;
    if (id) keys.add(`id:${id}`);
  });
  return keys;
};

const getGroupStudentCount = (group: GroupWithStudents): number => {
  const students = Array.isArray(group?.students) ? group.students : [];
  if (students.length > 0) {
    return deduplicateStudentKeys(students).size;
  }
  return group?._count?.students || 0;
};

const getUniqueStudentTotal = (groupList: GroupWithStudents[]): number => {
  const allKeys = new Set<string>();
  groupList.forEach((group) => {
    const students = Array.isArray(group?.students) ? group.students : [];
    if (students.length > 0) {
      deduplicateStudentKeys(students).forEach((key) =>
        allKeys.add(key)
      );
    } else {
      const fallback = group?._count?.students || 0;
      for (let i = 0; i < fallback; i += 1) {
        allKeys.add(`fallback:${group.id}:${i}`);
      }
    }
  });
  return allKeys.size;
};
```

---

### 4. **Too Many State Variables - Component State Chaos**
**Severity:** HIGH  
**Lines:** 443-475  
**Issue:**
```tsx
// ❌ 14+ individual useState declarations
const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
const [searchQuery, setSearchQuery] = useState('');
const [expandedCompanies, setExpandedCompanies] = useState<string[]>([]);
const [expandedCollections, setExpandedCollections] = useState<string[]>(['montzelity']);
const [showGroupModal, setShowGroupModal] = useState(false);
const [showUploadModal, setShowUploadModal] = useState(false);
const [showAddStudentModal, setShowAddStudentModal] = useState(false);
const [showMergeModal, setShowMergeModal] = useState(false);
const [selectedGroup, setSelectedGroup] = useState<any>(null);
const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]);
const [attendanceByGroup, setAttendanceByGroup] = useState<Record<string, number>>({});
const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
const [drawerGroup, setDrawerGroup] = useState<any | null>(null);
const [drawerMeta, setDrawerMeta] = useState<{...} | null>(null);
```

**Problems:**
- Hard to track state changes
- Difficult to test
- Performance issues from multiple setState calls
- Cognitive overload when reading code

**Fix:** Consolidate into logical objects
```tsx
const [uiState, setUiState] = useState({
  viewMode: 'grid' as const,
  searchQuery: '',
  expandedCompanies: [] as string[],
  expandedCollections: ['montzelity'],
});

const [modals, setModals] = useState({
  group: false,
  upload: false,
  addStudent: false,
  merge: false,
});

const [selections, setSelections] = useState({
  selectedGroup: null as GroupWithStudents | null,
  selectedForMerge: [] as string[],
});

const [drawer, setDrawer] = useState({
  isOpen: false,
  group: null as GroupWithStudents | null,
  meta: null as DrawerMeta | null,
});
```

---

## ⚠️ MAJOR ISSUES

### 5. **No Memoization for Expensive Computations**
**Severity:** HIGH  
**Lines:** 516-539  
**Issue:**
```tsx
// ❌ Recomputed on every render
const programmeRows = activeGroups.map((group: any) => {
  const storedPlan = resolveRolloutPlan(group);
  const creditProgress = getCreditCompletion(storedPlan);
  const actualProgress = actualProgressByGroup[group.id] || group.actualProgress;
  const actualPercent = actualProgress?.avgPercent || 0;
  const status = getPerformanceStatus(creditProgress.percentage, actualPercent, Boolean(storedPlan));
  // ... more expensive calculations
});
```

**Impact:**
- Complex calculations run on every render
- Performance degrades with more groups
- Unnecessary DOM updates and re-renders

**Fix:**
```tsx
const programmeRows = useMemo(() => {
  return activeGroups.map((group: GroupWithStudents) => {
    const storedPlan = resolveRolloutPlan(group);
    const creditProgress = getCreditCompletion(storedPlan);
    const actualProgress = actualProgressByGroup[group.id] || group.actualProgress;
    const actualPercent = actualProgress?.avgPercent || 0;
    const status = getPerformanceStatus(
      creditProgress.percentage,
      actualPercent,
      Boolean(storedPlan)
    );
    return {
      id: group.id,
      name: group.name,
      learners: getGroupStudentCount(group),
      attendance: attendanceByGroup[group.id] ?? 0,
      currentModule: getCurrentModuleLabel(storedPlan),
      status,
    };
  });
}, [activeGroups, actualProgressByGroup, attendanceByGroup]);
```

---

### 6. **Complex Date Parsing Logic Without Validation**
**Severity:** MEDIUM  
**Lines:** 83-99  
**Issue:**
```tsx
// ❌ Complex with minimal error handling
const parsePlanDate = (value: string) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.includes('/')) {
    const [day, month, year] = trimmed.split('/').map((part) => Number(part));
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
  // ❌ No validation of parsed dates
  // ❌ No handling of invalid ranges (month > 12, day > 31)
};
```

**Problems:**
- Returns null on error (no error details)
- No validation of date ranges
- Could accept invalid dates like 2026-13-45
- Used in 20+ places throughout code

**Fix:** Create a validated date parser
```tsx
interface ParsedDate {
  date: Date | null;
  error?: string;
}

const parsePlanDate = (value: string): ParsedDate => {
  if (!value) return { date: null };
  
  const trimmed = value.trim();
  if (!trimmed) return { date: null };

  let parsed: Date | null = null;

  if (trimmed.includes('/')) {
    const parts = trimmed.split('/').map(p => Number(p));
    if (parts.length !== 3 || parts.some(isNaN)) {
      return { date: null, error: 'Invalid date format DD/MM/YYYY' };
    }
    const [day, month, year] = parts;
    
    // Validate ranges
    if (month < 1 || month > 12) {
      return { date: null, error: 'Month must be 1-12' };
    }
    if (day < 1 || day > 31) {
      return { date: null, error: 'Day must be 1-31' };
    }
    
    parsed = new Date(year, month - 1, day);
  } else {
    parsed = new Date(trimmed);
  }

  if (!parsed || Number.isNaN(parsed.getTime())) {
    return { date: null, error: 'Invalid date value' };
  }

  return { date: parsed };
};
```

---

### 7. **Incomplete API Error Handling**
**Severity:** MEDIUM  
**Lines:** 628-657  
**Issue:**
```tsx
// ❌ Try-catch but no error state management
const fetchAttendanceBulk = async () => {
  isFetchingRef.current = true;
  setIsAttendanceLoading(true);

  try {
    const response = await fetch('/api/attendance/stats/bulk', {
      // ...
    });

    if (!response.ok) {
      throw new Error('Failed to fetch bulk attendance stats');
    }

    const bulkStats = await response.json();
    // ... process data
  } catch (error) {
    console.error('Failed to fetch bulk attendance stats:', error);
    setAttendanceByGroup({});
    // ❌ No error state set for UI to display
    // ❌ User doesn't know what went wrong
  } finally {
    setIsAttendanceLoading(false);
    // ...
  }
};
```

**Fix:**
```tsx
const fetchAttendanceBulk = async () => {
  isFetchingRef.current = true;
  setIsAttendanceLoading(true);
  setAttendanceError(null);

  try {
    const response = await fetch('/api/attendance/stats/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        groupIds: activeGroupIds,
        startDate: monthRange.startDate,
        endDate: monthRange.endDate,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || 
        `API error: ${response.status} ${response.statusText}`
      );
    }

    const bulkStats = await response.json();
    validateBulkStatsResponse(bulkStats); // Validate response shape
    
    const nextMap = transformBulkStatsToMap(bulkStats);
    setAttendanceByGroup(nextMap);
  } catch (error) {
    console.error('Failed to fetch bulk attendance stats:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    setAttendanceError(errorMsg);
    setAttendanceByGroup({});
  } finally {
    setIsAttendanceLoading(false);
    setTimeout(() => {
      isFetchingRef.current = false;
    }, 1000);
  }
};
```

---

## 🔧 MEDIUM ISSUES

### 8. **Large Monolithic Component - Hard to Test**
**Severity:** MEDIUM  
**Issue:** Main component is 1678 lines and handles:
- Data fetching and state management
- UI rendering (3 view modes)
- Modal dialogs (4 different modals)
- Drawer component
- Complex filtering logic
- Student card rendering

**Fix:** Break into smaller components:
```
GroupsPage.tsx 
├── GroupsPageContainer (hooks, state, orchestration)
├── GroupsStatistics.tsx
├── GroupsFiltersBar.tsx
├── GroupsCollection.tsx (Montzelity)
├── GroupsList.tsx (other groups)
├── GroupCardGrid.tsx / GroupCardList.tsx
└── Modals/
    ├── GroupModal
    ├── UploadModal
    ├── AddStudentModal
    └── MergeGroupsModal
```

---

### 9. **Inefficient Filtering Logic**
**Severity:** MEDIUM  
**Lines:** 489-507  
**Issue:**
```tsx
// ❌ Filters run twice - once for collection, once separately
const filteredCollection = {
  ...montzelityCollection,
  groups: montzelityCollection.groups.filter((g: any) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
};

const filteredOtherGroups = allOtherGroups.filter((g: any) =>
  g.name.toLowerCase().includes(searchQuery.toLowerCase())
);
```

**Problem:**
- Repeated string conversions
- Can be optimized with memoization

**Fix:**
```tsx
const lowerSearchQuery = useMemo(
  () => searchQuery.toLowerCase(),
  [searchQuery]
);

const filteredGroups = useMemo(() => {
  const predicate = (g: GroupWithStudents) =>
    g.name.toLowerCase().includes(lowerSearchQuery);

  return {
    montzelity: montzelityCollection.groups.filter(predicate),
    other: allOtherGroups.filter(predicate),
  };
}, [montzelityCollection.groups, allOtherGroups, lowerSearchQuery]);
```

---

### 10. **No Validation of Roll-out Plan Data**
**Severity:** MEDIUM  
**Lines:** Multiple places where `rolloutPlan` is used  
**Issue:**
```tsx
// ❌ No validation before accessing nested properties
const storedPlan = resolveRolloutPlan(group);
const creditProgress = getCreditCompletion(storedPlan);
// Could fail if storedPlan has unexpected structure
```

**Fix:** Add schema validation
```tsx
import { z } from 'zod';

const RolloutPlanSchema = z.object({
  modules: z.array(z.object({
    moduleNumber: z.number(),
    unitStandards: z.array(z.object({
      startDate: z.string(),
      endDate: z.string(),
      assessingDate: z.string(),
    })),
  })),
});

type RolloutPlan = z.infer<typeof RolloutPlanSchema>;

const validateRolloutPlan = (plan: unknown): RolloutPlan | null => {
  try {
    return RolloutPlanSchema.parse(plan);
  } catch {
    console.warn('Invalid rollout plan structure');
    return null;
  }
};
```

---

## ✅ POSITIVE FINDINGS

### What's Working Well:

1. **✅ Bulk API Optimization** - Uses `/api/attendance/stats/bulk` instead of N+1 requests
2. **✅ Stable Dependencies** - Uses `useMemo` for `groupIds` string to prevent dependency issues
3. **✅ Ref Pattern** - Uses `isFetchingRef` to prevent duplicate requests
4. **✅ User Feedback** - Confirmation dialogs before destructive actions
5. **✅ Accessibility** - Good heading hierarchy and ARIA labels
6. **✅ Error Messages** - User-friendly error dialogs instead of silent failures
7. **✅ State Refresh** - Page visibility listener to refresh data on focus

---

## 📋 SUMMARY OF RECOMMENDATIONS

| Priority | Issue | Impact | Effort |
|----------|-------|--------|--------|
| 🔴 CRITICAL | Replace `any` with proper types | Type safety, IDE support | 4h |
| 🔴 CRITICAL | Add error handling in UI | User experience | 2h |
| 🔴 CRITICAL | Remove duplicate student logic | Maintainability | 1h |
| 🟡 HIGH | Consolidate state variables | Code clarity | 2h |
| 🟡 HIGH | Add memoization | Performance | 1.5h |
| 🟡 HIGH | Validate date inputs | Data integrity | 1.5h |
| 🟡 MEDIUM | Add API error states | UX | 1h |
| 🟢 LOW | Extract into smaller components | Testability | 4h |

---

## 🚀 QUICK WIN IMPROVEMENTS (1-2 hours)
1. Remove duplicate `deduplicateStudentKeys` function
2. Add memoization to `programmeRows`
3. Consolidate modal state variables
4. Add missing error states for UI display

