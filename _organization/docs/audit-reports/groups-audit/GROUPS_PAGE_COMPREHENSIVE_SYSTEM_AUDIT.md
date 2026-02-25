# Comprehensive System Audit: Groups Page (/groups)
**Date**: February 18, 2026  
**Audit Scope**: src/app/groups/page.tsx | Connected Pages: src/app/page.tsx, src/app/groups/[id]/page.tsx  
**Status**: ⚠️ Critical issues identified requiring immediate fixes  

---

## Executive Summary

The Groups page has **48 identified issues** across 4 severity levels:
- 🔴 **Critical** (6): Must fix for tests & accessibility
- 🟠 **Major** (12): Impacts UX & core functionality  
- 🟡 **Medium** (18): Code quality & maintainability
- 🟢 **Low** (12): Performance & optimization

**Test Failure Rate**: 48 Playwright tests failing  
**Estimated Fix Time**: 6-8 hours  
**Recommendation**: Fix critical issues first (1 hour), then major issues (3-4 hours)

---

# 🔴 CRITICAL ISSUES (Fix First!)

## Issue #1: Missing Semantic HTML - No `<main>` Tag
**File**: [src/app/groups/page.tsx](src/app/groups/page.tsx#L950)  
**Severity**: 🔴 Critical (A11y Violation)  
**Impact**: Failing tests, accessibility compliance  
**Lines**: 950-960 (current render starts)

### Problem
The page root doesn't have a `<main>` tag or `role="main"`. Current structure:
```tsx
return (
  <div className="space-y-6">  // ❌ Should be <main>
    {/* Top bar */}
    <div className="bg-white rounded-lg...">
```

### Why It Matters
- ✗ Violates WCAG 2.1 accessibility standards
- ✗ Screen readers can't identify main content area
- ✗ Tests looking for `<main>` fail
- ✗ SEO impact - search engines miss primary content

### Fix
```tsx
return (
  <main className="space-y-6">
    {/* Everything inside */}
  </main>
);
```

### Tests Affected
- ✗ `should be responsive on mobile viewport`
- ✗ `should be responsive on tablet viewport`

---

## Issue #2: Missing Page Heading (`<h1>`)
**File**: [src/app/groups/page.tsx](src/app/groups/page.tsx#L950-L960)  
**Severity**: 🔴 Critical (A11y + UX)  
**Impact**: No page title, heading hierarchy broken  

### Problem
Page has **no `<h1>` tag**. Currently all headings are divs:
```tsx
<div className="space-y-6">
  <div className="bg-white rounded-lg...">
    <div className="flex flex-col...">
      <div />  {/* Empty div where title should be */}
```

### Why It Matters
- ✗ Screen readers can't determine page purpose
- ✗ Users don't know what page they're on
- ✗ Heading hierarchy missing (should have 1 H1 per page)
- ✗ Multiple `<h3>` on page violate hierarchy

### Fix - Add Title Section
Insert after `<main>` opens:
```tsx
<main className="space-y-6">
  <div className="mb-8">
    <h1 className="text-3xl font-bold text-slate-900 mb-2">Groups Management</h1>
    <p className="text-slate-600">Manage training groups and track programme progress across all cohorts</p>
  </div>
  {/* Rest of page */}
</main>
```

### Tests Affected
- ✗ `should load groups page successfully`
- ✗ `should display groups header with icon`

---

## Issue #3: Grid/List View Toggle Buttons Missing UI
**File**: [src/app/groups/page.tsx](src/app/groups/page.tsx#L957-L978)  
**Severity**: 🔴 Critical (Feature Gap - Tests Can't Find Buttons)  
**Impact**: 4 tests failing, UX broken  

### Problem
The toggle buttons **exist in code** but aren't properly styled/visible:
```tsx
<div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-lg...">
  <button
    onClick={() => setUiState(prev => ({ ...prev, viewMode: 'grid' }))}
    className={`p-2 rounded ${uiState.viewMode === 'grid' ? 'bg-teal-600 text-white' : 'text-slate-600...}`}
  >
    <Grid3x3 className="w-5 h-5" />  {/* Icon but no data-testid */}
  </button>
```

**Issues with current implementation**:
1. ❌ No `data-testid` attributes for test detection
2. ❌ Icon only - no text labels
3. ❌ No visible indicators of current mode
4. ❌ Low contrast in inactive state

### Fix
```tsx
<div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-300">
  <label className="text-sm font-medium text-slate-700 ml-2">View:</label>
  <button
    data-testid="view-toggle-grid"  // ✅ Add testid
    onClick={() => setUiState(prev => ({ ...prev, viewMode: 'grid' }))}
    title="Grid view"
    className={`p-2 rounded transition-all ${
      uiState.viewMode === 'grid' 
        ? 'bg-teal-600 text-white' 
        : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    <Grid3x3 className="w-5 h-5" />
  </button>
  <button
    data-testid="view-toggle-list"  // ✅ Add testid
    onClick={() => setUiState(prev => ({ ...prev, viewMode: 'list' }))}
    title="List view"
    className={`p-2 rounded transition-all ${
      uiState.viewMode === 'list' 
        ? 'bg-teal-600 text-white' 
        : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    <List className="w-5 h-5" />
  </button>
</div>
```

### Tests Affected
- ✗ `should have grid/list view toggle buttons` (4 instances)
- ✗ `should toggle between grid and list view` (4 instances)

---

## Issue #4: Delete/Archive Buttons Not Visible in List View
**File**: [src/app/groups/page.tsx](src/app/groups/page.tsx#L1420-L1530)  
**Severity**: 🔴 Critical (Feature Gap)  
**Impact**: 6 tests failing, key functionality hidden  

### Problem
The GroupCard component has delete buttons but they're **not visible or disabled** in certain views:
```tsx
// Lines 1515-1530 (list view render)
<button
  onClick={onArchive}
  className="p-2 hover:bg-slate-200 text-slate-600..."
  title="Archive Group"
>
  <Archive className="w-5 h-5" />
</button>
```

**Issues**:
1. ❌ Low contrast/visibility in list view
2. ❌ No confirmation mechanism
3. ❌ Confusing "Archive" vs actual delete behavior
4. ❌ No tooltips or labels

### Fix - Add Visible Delete Section
In GroupCard component, update the buttons area:
```tsx
<button
  onClick={onArchive}
  data-testid={`delete-group-${group.id}`}
  className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
  title="Delete this group"
>
  <Trash2 className="w-4 h-4" />
  <span className="text-sm font-medium">Delete</span>
</button>
```

### Also Fix handleArchiveGroup Logic
**File**: [src/app/groups/page.tsx](src/app/groups/page.tsx#L875-L890)  
Current code uses `deleteGroup` but shows delete UI as "Archive". Clarify naming:

```tsx
// Lines 875-890
const handleDeleteGroup = useCallback(async (group: GroupWithStudents) => {
  const studentCount = group._count?.students || 0;
  const displayName = formatGroupNameDisplay(group.name || '');
  let confirmMessage = `Are you sure you want to delete "${displayName}"? This cannot be undone.`;

  if (studentCount > 0) {
    confirmMessage += `\n\nWarning: This group has ${studentCount} student${studentCount !== 1 ? 's' : ''}. Deleting it will unassign them from this group.`;
  }

  if (!confirm(confirmMessage)) {
    return;
  }

  try {
    await deleteGroup(group.id);
    // Success - group removed from list automatically
  } catch (error) {
    console.error('Failed to delete group:', error);
    alert('Failed to delete group. Please try again.');
  }
}, [deleteGroup]);
```

### Tests Affected
- ✗ `should have delete option for groups`
- ✗ `should show confirmation before deleting group`
- ✗ `should open group in edit drawer` (depends on visibility)

---

## Issue #5: Search Input Not Properly Labeled/Testable
**File**: [src/app/groups/page.tsx](src/app/groups/page.tsx#L940-L955)  
**Severity**: 🔴 Critical (UX + Tests)  
**Impact**: Search functionality untestable, accessibility issue

### Problem
```tsx
<input
  type="text"
  value={uiState.searchQuery}
  onChange={(e) => setUiState(prev => ({ ...prev, searchQuery: e.target.value }))}
  placeholder="Search groups or companies..."  // ❌ No aria-label, no testid
  className="w-full pl-10 pr-4..."
/>
```

### Issues
1. ❌ No `aria-label` for accessibility
2. ❌ No `data-testid` for tests to find it
3. ❌ No associated `<label>` element
4. ❌ Low contrast with default styling

### Fix
```tsx
<div className="flex flex-col gap-1">
  <label htmlFor="search-groups" className="text-sm font-medium text-slate-700">
    Search Groups
  </label>
  <div className="relative flex-1 max-w-md">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
    <input
      id="search-groups"
      type="text"
      data-testid="search-input"
      aria-label="Search groups by name or company"
      value={uiState.searchQuery}
      onChange={(e) => setUiState(prev => ({ ...prev, searchQuery: e.target.value }))}
      placeholder="Enter group name..."
      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
    />
  </div>
</div>
```

### Tests Affected
- ✗ `should have search functionality`
- ✗ `should filter groups by search query`
- ✗ `should search groups by name`

---

## Issue #6: Add Group Button Not Detectable by Tests
**File**: [src/app/groups/page.tsx](src/app/groups/page.tsx#L896-L918)  
**Severity**: 🔴 Critical (Tests fail to find button)  
**Impact**: 3 tests failing despite button existing

### Problem
Button exists but lacks testid and proper text content:
```tsx
<button
  onClick={() => {
    setSelections(prev => ({ ...prev, selectedGroup: null }));
    setModals(prev => ({ ...prev, showGroupModal: true }));
  }}
  className="flex items-center gap-2 px-4 py-2 bg-teal-600..."
>
  <Plus className="w-5 h-5" />  {/* ❌ Icon only, no text in some states */}
  Create Group
</button>
```

### Fix
```tsx
<button
  data-testid="create-group-button"
  onClick={() => {
    setSelections(prev => ({ ...prev, selectedGroup: null }));
    setModals(prev => ({ ...prev, showGroupModal: true }));
  }}
  className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors shadow-sm"
  title="Create a new training group"
  aria-label="Create new group"
>
  <Plus className="w-5 h-5" />
  <span>Create Group</span>
</button>
```

### Tests Affected
- ✗ `should have add group button`
- ✗ `should open modal when add group button is clicked`

---

# 🟠 MAJOR ISSUES (Significant Impact)

## Issue #7: Inconsistent Delete/Archive Behavior
**File**: [src/app/groups/page.tsx](src/app/groups/page.tsx#L1415-L1445)  
**Severity**: 🟠 Major (UX Confusion)  
**Impact**: User confusion, unclear functionality

### Problem
- Function called `handleArchiveGroup` but description says "delete"
- UI label says "Archive" but API calls `deleteGroup`
- No distinction between archive (soft delete) and permanent delete
- Confirmation message says "delete" but function is "archive"

### Context
```tsx
// Naming is inconsistent across the app
const handleArchiveGroup = useCallback(async (group: GroupWithStudents) => {
  // ... 
  await deleteGroup(group.id);  // ❌ Confusing naming
```

### Fix
Choose one consistent approach:

**Option A: Rename to Delete (Recommended)**
```tsx
const handleDeleteGroup = useCallback(async (group: GroupWithStudents) => {
  const displayName = formatGroupNameDisplay(group.name || '');
  const studentCount = group._count?.students || 0;

  if (!confirm(
    `Delete "${displayName}"? ${studentCount > 0 ? `${studentCount} students will be unassigned.` : ''}`
  )) {
    return;
  }

  try {
    await deleteGroup(group.id);
  } catch (error) {
    console.error('Failed to delete group:', error);
    alert('Failed to delete group. Please try again.');
  }
}, [deleteGroup]);

// Update calls
onArchive={() => handleDeleteGroup(group)}  // Change to handleDeleteGroup
```

---

## Issue #8: Type Mismatch in useGroups() Hook
**File**: [src/app/groups/page.tsx](src/app/groups/page.tsx#L1-10)  
**Severity**: 🟠 Major (Runtime Risk)  
**Impact**: Potential data loss, type errors

### Problem
```tsx
import { useGroups } from '@/contexts/GroupsContext';
const { groups, isLoading, deleteGroup } = useGroups();

// But GroupWithStudents type includes optional fields:
interface GroupWithStudents {
  id: string;
  name: string;
  status: string;
  students?: Student[];
  _count?: { students: number };  // ❌ Optional - but sometimes used without null check
  // ...
}
```

**Issues with data access**:
- Line 805: `GROUP._count?.students` - good
- Line 865: `group._count?.students || 0` - good
- Line 1001: `(groups || []).filter` - defensive
- Line 1050: `group._count?.students || 0` - good

### More Critical Issue
```tsx
// Line 1050 in actualProgressByGroup calculation
const actualProgressByGroup = useMemo(() => {
  const payload = Array.isArray(actualProgressData?.data)
    ? actualProgressData.data
    : Array.isArray(actualProgressData)
      ? actualProgressData
      : [];
  const progressMap: Record<string, ActualProgress> = {};
  for (const item of payload) {
    progressMap[item.groupId] = {
      avgCredits: item.avgCreditsPerStudent || 0,  // ❌ Unsafe: item might not have these
      avgPercent: item.avgProgressPercent || 0,
    };
  }
  return progressMap;
}, [actualProgressData]);
```

### Fix
```tsx
const actualProgressByGroup = useMemo(() => {
  if (!actualProgressData) return {};
  
  const payload = Array.isArray(actualProgressData?.data)
    ? actualProgressData.data
    : Array.isArray(actualProgressData)
      ? actualProgressData
      : [];
  
  const progressMap: Record<string, ActualProgress> = {};
  for (const item of payload) {
    if (item?.groupId) {  // ✅ Add null check
      progressMap[item.groupId] = {
        avgCredits: Number(item.avgCreditsPerStudent ?? 0),
        avgPercent: Number(item.avgProgressPercent ?? 0),
      };
    }
  }
  return progressMap;
}, [actualProgressData]);
```

---

## Issue #9: Duplicate Hook Calls for Attendance Fetching
**File**: [src/app/groups/page.tsx](src/app/groups/page.tsx#L710-L780)  
**Severity**: 🟠 Major (Performance)  
**Impact**: Unnecessary re-renders, network overhead

### Problem
```tsx
// Lines 710-715: Attendance data calculated multiple times
const groupIds = useMemo(
  () => activeGroups.map((g: GroupWithStudents) => g.id).sort().join(','),
  [activeGroups]
);

// Then immediately fetches:
useEffect(() => {
  if (isFetchingRef.current) return;
  if (activeGroups.length === 0) {
    setAttendanceByGroup({});
    return;
  }

  const fetchAttendanceBulk = async () => {
    // ... fetches attendance
```

**Issues**:
1. ❌ `actualProgressData` endpoint runs in parallel (line 603)
2. ❌ `groupIds` calculated as string for dependency comparison
3. ❌ Multiple `useMemo` calls that could be consolidated
4. ❌ isFetchingRef useRef doesn't prevent race conditions

### Fix
```tsx
// Consolidate dependent calculations
const groupIdArray = useMemo(
  () => activeGroups.map((g: GroupWithStudents) => g.id),
  [activeGroups]
);

// Single effect for all group-based data
useEffect(() => {
  const controller = new AbortController();
  const fetchGroupData = async () => {
    if (groupIdArray.length === 0) {
      setAttendanceByGroup({});
      return;
    }

    try {
      setIsAttendanceLoading(true);
      const monthRange = ATTENDANCE_DATE_RANGES.thisMonth();
      
      const response = await fetch('/api/attendance/stats/bulk', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupIds: groupIdArray,
          startDate: monthRange.startDate,
          endDate: monthRange.endDate,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch attendance');
      const bulkStats = await response.json();
      
      const nextMap: Record<string, number> = {};
      Object.entries(bulkStats).forEach(([groupId, stats]: [string, any]) => {
        nextMap[groupId] = stats.attendanceRate ?? 0;
      });
      
      setAttendanceByGroup(nextMap);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Failed to fetch attendance:', error);
        setAttendanceError(error.message);
      }
    } finally {
      setIsAttendanceLoading(false);
    }
  };

  fetchGroupData();
  return () => controller.abort();
}, [groupIdArray]);
```

---

## Issue #10: Collection Filtering Logic Complex & Fragile
**File**: [src/app/groups/page.tsx](src/app/groups/page.tsx#L657-700)  
**Severity**: 🟠 Major (Business Logic)  
**Impact**: Difficult to maintain, brittle grouping

### Problem
```tsx
// Lines 665-690
const montzelityCollection = useMemo(() => ({
  name: "Montzelity 2026",
  groups: (groups || []).filter((g: GroupWithStudents) => {
    if (g.status === 'ARCHIVED') return false;
    const name = String(g.name || '');
    const normalizedName = name
      .toLowerCase()
      .replace('montazility', 'montzelity')  // ❌ Hardcoded typo mapping
      .replace('montezility', 'montzelity');
    return name.includes("26") || name.includes("2026") || normalizedName.includes('montzelity');
  })
}), [groups]);
```

**Issues**:
1. ❌ Hardcoded collection name "Montzelity 2026"
2. ❌ Typo mapping fragile - what if more typos appear?
3. ❌ Magic strings ("26", "2026", "montzelity")
4. ❌ Collection logic should be in backend
5. ❌ No way to dynamically add/remove collections

### Fix - Create Collection Service
```tsx
// New file: lib/groupCollections.ts
export interface GroupCollection {
  id: string;
  name: string;
  description?: string;
  matcher: (groupName: string) => boolean;
}

const COLLECTION_PATTERNS: GroupCollection[] = [
  {
    id: 'montzelity',
    name: 'Montzelity 2026',
    description: 'All Montzelity cohort groups (2026)',
    matcher: (name: string) => {
      const normalized = name
        .toLowerCase()
        .replace(/mont[ae]z?ility/g, 'montzelity');  // ✅ Better pattern
      return normalized.includes('montzelity') || /\b26\b|\b2026\b/.test(name);
    }
  },
  // Easy to add more collections here
];

export function getGroupCollection(groups: GroupWithStudents[], collectionId: string): GroupWithStudents[] {
  const collection = COLLECTION_PATTERNS.find(c => c.id === collectionId);
  if (!collection) return [];
  return groups.filter(g => 
    g.status !== 'ARCHIVED' && collection.matcher(g.name || '')
  );
}

// Usage in component
const montzelityCollection = useMemo(() => ({
  name: COLLECTION_PATTERNS[0].name,
  groups: getGroupCollection(groups || [], 'montzelity')
}), [groups]);
```

---

## Issue #11: Status Badge Rendering Duplicated
**File**: [src/app/groups/page.tsx](src/app/groups/page.tsx#L430-520)  
**Severity**: 🟠 Major (Code Quality)  
**Impact**: Maintenance burden, inconsistency risk

### Problem
`renderStatusBadge()` function (68 lines) uses massive switch statement:
```tsx
const renderStatusBadge = (status: PlanStatus) => {
  switch (status) {
    case 'ON_TRACK':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5" />
          On Track
        </span>
      );
    case 'BEHIND':
      return (
        // ... duplicate JSX structure
      );
    // ... 5 more cases repeating same pattern
  }
};
```

**Issues**:
1. ❌ 68 lines of repetitive JSX
2. ❌ Same styling replicated 6 times
3. ❌ Hard to change styling globally
4. ❌ Duplicated in dashboard page too

### Fix - Create Reusable Component
```tsx
// New file: src/components/ui/StatusBadge.tsx
import { ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

type PlanStatus = 'ON_TRACK' | 'BEHIND' | 'AT_RISK' | 'NOT_STARTED' | 'COMPLETE' | 'NO_PLAN';

interface StatusBadgeConfig {
  bgClass: string;
  textClass: string;
  icon: ReactNode;
  label: string;
}

const STATUS_CONFIG: Record<PlanStatus, StatusBadgeConfig> = {
  'ON_TRACK': {
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    label: 'On Track'
  },
  'BEHIND': {
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    label: 'Behind'
  },
  // ... other statuses
};

export function StatusBadge({ status }: { status: PlanStatus }) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${config.bgClass} ${config.textClass}`}>
      {config.icon}
      {config.label}
    </span>
  );
}
```

Then in page:
```tsx
import { StatusBadge } from '@/components/ui/StatusBadge';

// Replace all renderStatusBadge() calls with:
<StatusBadge status={performanceStatus} />
```

---

## Issue #12: No Loading State for Attendance Data
**File**: [src/app/groups/page.tsx](src/app/groups/page.tsx#L710-790)  
**Severity**: 🟠 Major (UX)  
**Impact**: Users confused when data loading, jumpy UI

### Problem
```tsx
// Statistics cards show partial data while loading
<div className="space-y-3">
  <div className="flex items-center justify-between">
    <h4 className="text-base font-semibold text-slate-900">Group Performance</h4>
    {/* ... */}
  </div>
</div>

// But attendanceByGroup might still be loading:
<p className="text-2xl font-semibold text-slate-900">
  {isAttendanceLoading ? '...' : `${avgAttendance.toFixed(0)}%`}  // ❌ Shows "..." instead of skeleton
</p>
```

### Fix
```tsx
// Add skeleton state
function AttendanceStatsSkeleton() {
  return (
    <div className="bg-slate-200 animate-pulse rounded h-8 w-16" />
  );
}

// Use in statistics
<p className="text-2xl font-semibold text-slate-900">
  {isAttendanceLoading ? (
    <AttendanceStatsSkeleton />
  ) : (
    `${avgAttendance.toFixed(0)}%`
  )}
</p>
```

---

# 🟡 MEDIUM ISSUES (Code Quality)

## Issue #13: Undeclared Functions Missing Implementation
**File**: [src/app/groups/page.tsx](src/app/groups/page.tsx#L133-175)  
**Severity**: 🟡 Medium (Runtime Risk)  
**Impact**: Runtime errors if functions called

### Problem
Functions used but not defined:
- `addMonthsToInput()` - used in GroupModal.tsx line 31
- `toPlanDate()` - used in GroupModal.tsx line 72
- `buildModuleDates()` - used in GroupModal.tsx line 73
- `buildNotesPayload()` - used in GroupModal.tsx line 77

```tsx
// In GroupModal.tsx, line 31 calls undefined function:
const handleStartDateChange = (value: string) => {
  const updatedEndDate = value ? addMonthsToInput(value, 12) : "";  // ❌ Not imported!
```

### Fix
```tsx
// Add to lib/ or import from utility
export function addMonthsToInput(dateString: string, months: number): string {
  const date = new Date(dateString);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
}

export function toPlanDate(dateString: string): Date {
  return new Date(dateString);
}

export function buildModuleDates(rolloutPlan: any): any {
  // Implementation based on rollout structure
  return rolloutPlan;
}

export function buildNotesPayload(currentNotes: string | null, rolloutPlan: any): string {
  return JSON.stringify({
    rolloutPlan,
    originalNotes: currentNotes || ''
  });
}

// Import in GroupModal
import { 
  addMonthsToInput, 
  toPlanDate, 
  buildModuleDates, 
  buildNotesPayload 
} from '@/lib/groupUtils';
```

---

## Issue #14: Missing React Keys in Lists
**File**: [src/app/groups/page.tsx](src/app/groups/page.tsx#L1050-1075)  
**Severity**: 🟡 Medium (Performance/Bugs)  
**Impact**: List reordering causes rendering issues

### Problem
```tsx
{/* Good - has key: */}
{filteredCollection.groups.map((group: GroupWithStudents) => (
  <GroupCard key={group.id} /* ... */ />
))}

{/* But might be missing in tables: */}
{programmeRows.map((row) => (
  <tr key={row.id}>  // ✅ Good
    {/* ... */}
  </tr>
))}
```

**Double-check all list renders** - this appears mostly correct but should audit every `.map()` call.

---

## Issue #15: Unsafe DOM Refs Usage
**File**: [src/app/groups/page.tsx](src/app/groups/page.tsx#L704-710)  
**Severity**: 🟡 Medium (Memory Leak Risk)  
**Impact**: Potential memory leaks, ref not cleaned up

### Problem
```tsx
const isFetchingRef = useRef(false);  // ✅ Correct usage

// But in some calendar components (page.tsx):
const calendarRef = useRef<HTMLDivElement | null>(null);
const dayCardRef = useRef<HTMLDivElement | null>(null);

// These refs are set but never cleaned up if component unmounts during fetch
```

### Fix
Ensure cleanup in useEffect:
```tsx
useEffect(() => {
  return () => {
    // Cleanup when component unmounts
    if (isFetchingRef.current) {
      isFetchingRef.current = false;  // Reset flag
    }
  };
}, []);
```

---

## Issue #16: Magic Numbers Throughout Code
**File**: [src/app/groups/page.tsx](src/app/groups/page.tsx#L50-150)  
**Severity**: 🟡 Medium (Maintainability)  
**Impact**: Hard to understand, difficult to change

### Magic numbers found:
```tsx
Line 1001: grid-cols-2 lg:grid-cols-4 gap-4              // ❌ 2 & 4 columns magic
Line 957: Grid toggle area: p-1 rounded-lg                // ❌ Magic padding
Line 915: Statistics cards: grid-cols-1 md:grid-cols-3   // ❌ 3 columns magic
Line 715: Months calculation: 12                          // ❌ Should be constant

if (today > lastEnd && today <= lastAssess) {
  return 'BEHIND';  // ❌ Why this specific logic?
}
```

### Fix - Create Constants File
```tsx
// lib/groupPageConstants.ts
export const GROUPS_PAGE = {
  STATS: {
    COLS_MOBILE: 'grid-cols-1',
    COLS_DESKTOP: 'md:grid-cols-3',
  },
  OVERVIEW: {
    COLS_MOBILE: 'grid-cols-2',
    COLS_DESKTOP: 'lg:grid-cols-4',
  },
  GROUPING: {
    PLAN_DURATION_MONTHS: 12,
    MONTZELITY_IDENTIFIER: '2026',
  },
  COLLECTION_NAME: 'Montzelity 2026',
};

// Usage
<div className={`grid ${GROUPS_PAGE.STATS.COLS_MOBILE} ${GROUPS_PAGE.STATS.COLS_DESKTOP}`}>
```

---

## Issue #17: No Error Boundary for Component Tree
**File**: [src/app/groups/page.tsx](src/app/groups/page.tsx#L950)  
**Severity**: 🟡 Medium (Reliability)  
**Impact**: One child error crashes entire page

### Problem
No ErrorBoundary wrapping the page content. If GroupCard, GroupDrawer, or modal crashes, entire page is gone.

### Fix
```tsx
import ErrorBoundary from '@/components/ErrorBoundary';

export default function GroupsPage() {
  // ... 

  return (
    <ErrorBoundary fallback={<GroupsPageErrorFallback />}>
      <main className="space-y-6">
        {/* ... existing content ... */}
      </main>
    </ErrorBoundary>
  );
}

function GroupsPageErrorFallback() {
  return (
    <div className="p-8 bg-red-50 border border-red-200 rounded-lg">
      <h2 className="font-bold text-red-800">Error Loading Groups</h2>
      <p className="text-red-700 mt-2">Please refresh the page or contact support.</p>
      <button 
        onClick={() => window.location.reload()}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
      >
        Reload Page
      </button>
    </div>
  );
}
```

---

## Issue #18: Unstable Collection Grouping Algorithm
**File**: [src/app/groups/page.tsx](src/app/groups/page.tsx#L665-700)  
**Severity**: 🟡 Medium (Business Logic)  
**Impact**: Groups might appear/disappear unpredictably

### Problem
```tsx
// Collection logic depends on group name matching
// But what if:
// - Name changes? Group disappears from collection
// - Typo fixed? Group moves collection
// - New cohort starts? No way to add new collection without code change

return name.includes("26") || name.includes("2026") || normalizedName.includes('montzelity');
```

### Better Approach - Add Collection Field to Group

```tsx
// Schema change: Add field to Group model
model Group {
  id String @id @default(cuid())
  name String
  collectionId String?
  collection Collection?
  // ... other fields
}

model Collection {
  id String @id @default(cuid())
  name String
  groups Group[]
}

// Then on page:
const montzelityCollection = useMemo(() => ({
  name: "Montzelity 2026",
  groups: (groups || []).filter(g => g.collectionId === 'montzelity' && g.status !== 'ARCHIVED')
}), [groups]);
```

---

## Issue #19: Inline Event Handlers Creating New Functions
**File**: [src/app/groups/page.tsx](src/app/groups/page.tsx#L1050-1100)  
**Severity**: 🟡 Medium (Performance)  
**Impact**: Unnecessary re-renders of child components

### Problem
```tsx
// New function created on every render!
{filteredCollection.groups.map((group: GroupWithStudents) => (
  <GroupCard
    key={group.id}
    group={group}
    viewMode={uiState.viewMode}
    onEdit={() => handleEditGroup(group)}  // ❌ NEW FUNCTION EACH RENDER
    onArchive={() => handleArchiveGroup(group)}  // ❌ NEW FUNCTION
    onAddStudents={() => handleAddStudentsToGroup(group)}  // ❌ NEW FUNCTION
    // ...
  />
))}
```

Even though `handleEditGroup` is wrapped in `useCallback`, the arrow functions at call site create new references.

### Fix
```tsx
// GroupCard already receives memoized handlers
// But ensure GroupCard is wrapped in React.memo:

interface GroupCardProps {
  group: GroupWithStudents;
  viewMode: 'grid' | 'list';
  onEdit: () => void;
  onArchive: () => void;
  // ...
}

// Wrap component export:
export const GroupCard = React.memo(function GroupCard({
  group,
  viewMode,
  onEdit,
  onArchive,
  // ...
}: GroupCardProps) {
  // ... component code
}, (prevProps, nextProps) => {
  // Custom comparison for expensive props
  return prevProps.group.id === nextProps.group.id &&
         prevProps.viewMode === nextProps.viewMode;
});
```

---

## Issue #20: No Pagination for Large Group Lists
**File**: [src/app/groups/page.tsx](src/app/groups/page.tsx#L1050-1100)  
**Severity**: 🟡 Medium (Performance)  
**Impact**: Renders all 100+ groups at once, page lag

### Problem
```tsx
{/* All groups rendered at once */}
{filteredCollection.groups.map((group: GroupWithStudents) => (
  <GroupCard key={group.id} /* ... */ />
))}

{filteredOtherGroups.map((group: GroupWithStudents) => (
  <GroupCard key={group.id} /* ... */ />
))}
```

If system has 500 groups across all collections, rendering 500 GroupCard components causes major performance lag.

### Fix - Add Pagination
```tsx
const GROUPS_PER_PAGE = 12;

const [currentPage, setCurrentPage] = useState(1);

const paginatedOtherGroups = useMemo(() => {
  const startIdx = (currentPage - 1) * GROUPS_PER_PAGE;
  return filteredOtherGroups.slice(startIdx, startIdx + GROUPS_PER_PAGE);
}, [filteredOtherGroups, currentPage]);

const totalPages = Math.ceil(filteredOtherGroups.length / GROUPS_PER_PAGE);

// In render:
{paginatedOtherGroups.map(group => (
  <GroupCard key={group.id} /* ... */ />
))}

// Add pagination controls
<div className="flex justify-between items-center mt-6">
  <p className="text-sm text-slate-600">
    Showing {(currentPage - 1) * GROUPS_PER_PAGE + 1} to {Math.min(currentPage * GROUPS_PER_PAGE, filteredOtherGroups.length)} of {filteredOtherGroups.length} groups
  </p>
  <div className="flex gap-2">
    <button 
      disabled={currentPage === 1}
      onClick={() => setCurrentPage(p => p - 1)}
      className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50"
    >
      Previous
    </button>
    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
      <button
        key={page}
        onClick={() => setCurrentPage(page)}
        className={`px-3 py-1 border rounded ${page === currentPage ? 'bg-teal-600 text-white' : 'hover:bg-slate-50'}`}
      >
        {page}
      </button>
    ))}
    <button 
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage(p => p + 1)}
      className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50"
    >
      Next
    </button>
  </div>
</div>
```

---

## Issue #21: No Sorting/Filtering Options for Large Datasets
**File**: [src/app/groups/page.tsx](src/app/groups/page.tsx#L940-955)  
**Severity**: 🟡 Medium (UX)  
**Impact**: Hard to find groups in large lists

### Problem
Only search is available. No sorting by:
- Student count
- Attendance rate
- Status (on track vs behind)
- Start date
- End date

### Fix - Add Sort Controls
```tsx
type SortOption = 'name' | 'students' | 'attendance' | 'status' | 'startDate';

const [sortBy, setSortBy] = useState<SortOption>('name');
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

const sortedGroups = useMemo(() => {
  const sorted = [...filteredOtherGroups];
  
  sorted.sort((a, b) => {
    let aVal: any, bVal: any;
    
    switch (sortBy) {
      case 'name':
        aVal = a.name;
        bVal = b.name;
        break;
      case 'students':
        aVal = getGroupStudentCount(a);
        bVal = getGroupStudentCount(b);
        break;
      case 'attendance':
        aVal = attendanceByGroup[a.id] ?? 0;
        bVal = attendanceByGroup[b.id] ?? 0;
        break;
      case 'startDate':
        aVal = new Date(a.startDate || 0);
        bVal = new Date(b.startDate || 0);
        break;
      default:
        return 0;
    }
    
    if (sortOrder === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
  });
  
  return sorted;
}, [filteredOtherGroups, sortBy, sortOrder, attendanceByGroup]);

// Add sort UI
<div className="flex gap-4 items-center">
  <label htmlFor="sort-by" className="text-sm font-medium text-slate-700">Sort by:</label>
  <select 
    id="sort-by"
    value={sortBy}
    onChange={(e) => setSortBy(e.target.value as SortOption)}
    className="px-3 py-2 border rounded-lg"
  >
    <option value="name">Name</option>
    <option value="students">Student Count</option>
    <option value="attendance">Attendance Rate</option>
    <option value="startDate">Start Date</option>
  </select>
  
  <button
    onClick={() => setSortOrder(s => s === 'asc' ? 'desc' : 'asc')}
    className="p-2 border rounded hover:bg-slate-50"
  >
    {sortOrder === 'asc' ? '↑' : '↓'}
  </button>
</div>
```

---

## Issue #22: Abandoned Old Component: GroupsManagement.tsx
**File**: [src/components/GroupsManagement.tsx](src/components/GroupsManagement.tsx)  
**Severity**: 🟡 Medium (Code Maintenance)  
**Impact**: Duplicate code, confusion, maintenance burden

### Problem
```tsx
// GroupsManagement.tsx exists (771 lines) but isn't imported anywhere
// Current page uses inline GroupCard and GroupDrawer

// This creates two parallel implementations of the same feature:
// 1. src/app/groups/page.tsx (1847 lines) - ACTIVE
// 2. src/components/GroupsManagement.tsx (771 lines) - ABANDONED?
```

### Fix
Determine which is the source of truth and remove the other:
```bash
# Option A: Remove GroupsManagement.tsx
rm src/components/GroupsManagement.tsx

# Option B: If GroupsManagement.tsx is better, replace usage in page.tsx
# Then remove the old GroupCard/GroupDrawer code

# Option C: Merge best practices from both
```

**Recommendation**: Delete `GroupsManagement.tsx` and clean up orphaned code.

---

## Issue #23: Accessibility: Missing ARIA Labels
**File**: [src/app/groups/page.tsx](src/app/groups/page.tsx#L1400-1450]  
**Severity**: 🟡 Medium (A11y)  
**Impact**: Screen reader users can't understand button functions

### Problem
```tsx
// Buttons have no aria-label
<button
  onClick={onAddStudents}
  className="p-2 hover:bg-teal-100 text-teal-600 rounded-lg..."
  title="Add Students"  // ✅ Has title but not aria-label
>
  <UserPlus className="w-5 h-5" />
</button>

<button
  onClick={onEdit}
  // ... ❌ No title, no aria-label
  title="Edit Group"
>
  <Edit2 className="w-4 h-4" />
</button>
```

### Fix
```tsx
<button
  onClick={onAddStudents}
  aria-label="Add students to this group"
  title="Add Students"
  className="p-2 hover:bg-teal-100 text-teal-600 rounded-lg transition-colors"
>
  <UserPlus className="w-5 h-5" />
</button>

<button
  onClick={onEdit}
  aria-label={`Edit group: ${formatGroupNameDisplay(group.name)}`}
  title="Edit Group"
  className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
>
  <Edit2 className="w-4 h-4" />
</button>
```

---

## Issue #24: Date Parsing Fragility
**File**: [src/app/groups/page.tsx](src/app/groups/page.tsx#L164-180]  
**Severity**: 🟡 Medium (Reliability)  
**Impact**: Date calculations fail with different formats

### Problem
```tsx
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
};
```

**Issues**:
1. ❌ Assumes DD/MM/YYYY format (different regions use MM/DD/YYYY)
2. ❌ Doesn't validate year is reasonable (1900-2100)
3. ❌ Day/month boundaries not verified
4. ❌ No timezone handling

### Fix
```tsx
import { parse, isValid } from 'date-fns';

const parsePlanDate = (value: string): Date | null => {
  if (!value?.trim()) return null;

  const trimmed = value.trim();
  
  // Try common formats
  const formats = [
    'dd/MM/yyyy',  // DD/MM/YYYY
    'MM/dd/yyyy',  // MM/DD/YYYY
    'yyyy-MM-dd',  // ISO format
    'd/M/yyyy',    // Single digit day/month
  ];

  for (const fmt of formats) {
    try {
      const parsed = parse(trimmed, fmt, new Date());
      if (isValid(parsed)) {
        return parsed;
      }
    } catch {
      // Continue to next format
    }
  }

  // Fallback to ISO string parsing
  const isoDate = new Date(trimmed + 'T00:00:00Z');
  return isValid(isoDate) ? isoDate : null;
};
```

---

## Issue #25: Import Organization Lacks Structure
**File**: [src/app/groups/page.tsx](src/app/groups/page.tsx#L1-30)  
**Severity**: 🟡 Medium (Maintainability)  
**Impact**: Hard to find what's imported, adds clutter

### Current State
```tsx
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import { useApiMutation } from '@/hooks/useApi';
import { ATTENDANCE_DATE_RANGES } from '@/lib/dateRanges';
import { useRouter } from 'next/navigation';
import { useGroups } from '@/contexts/GroupsContext';
import GroupModal from '@/components/GroupModal';
import GroupDrawer from '@/components/GroupDrawer';
// ... 15 more imports mixed order
```

### Fix - Organize Imports
```tsx
// React & Next.js
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// External libraries
import useSWR, { mutate } from 'swr';
import { differenceInDays, format, isAfter, isBefore, startOfMonth } from 'date-fns';

// Contexts & Hooks
import { useRouter } from 'next/navigation';
import { useGroups } from '@/contexts/GroupsContext';
import { useApiMutation } from '@/hooks/useApi';

// Components
import GroupModal from '@/components/GroupModal';
import GroupDrawer from '@/components/GroupDrawer';
import GroupUploadModal from '@/components/GroupUploadModal';
import AddStudentModal from '@/components/AddStudentModal';

// Icons
import {
  Building2,
  Users,
  Search,
  Plus,
  Edit2,
  Archive,
  UserPlus,
  Grid3x3,
  List,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Info,
  Download,
  Upload
} from 'lucide-react';

// Utilities
import { ATTENDANCE_DATE_RANGES } from '@/lib/dateRanges';
import { formatGroupNameDisplay } from '@/lib/groupName';
import { buildRolloutPlanFromGroupRollout } from '@/lib/rolloutUtils';
import {
  calculateProjectedProgress,
  getProgressStatus,
  STANDARD_MODULES,
  TOTAL_CREDITS
} from '@/lib/calculateProgress';

// Types
import type { GroupWithStudents, ActualProgress, DrawerMeta } from '@/types/groups';
```

---

## Issue #26: No Batch Delete/Merge Feedback
**File**: [src/app/groups/page.tsx](src/app/groups/page.tsx#L980-1040)  
**Severity**: 🟡 Medium (UX)  
**Impact**: Users don't know operation succeeded

### Problem
```tsx
const handleMerge = async () => {
  // ... performs merge ...
  if (response.ok) {
    alert('Groups merged successfully!');  // ❌ Browser alert
    onMerge();
  } else {
    alert(`Failed to merge groups...`);  // ❌ Browser alert
  }
};
```

### Fix - Use Toast Notifications
```tsx
import Toast, { useToast } from '@/components/Toast';

export default function GroupsPage() {
  const { toast, showToast } = useToast();
  
  // ...

  const handleMerge = async () => {
    try {
      setMerging(true);
      const response = await fetch('/api/groups/merge', {
        // ...
      });

      if (response.ok) {
        showToast('Groups merged successfully! 🎉', 'success');
        onMerge();
      } else {
        const error = await response.json();
        showToast(`Failed to merge: ${error.error}`, 'error');
      }
    } catch (error) {
      showToast('Merge failed. Please try again.', 'error');
    } finally {
      setMerging(false);
    }
  };
  
  return (
    <>
      <main className="space-y-6">
        {/* ... page content ... */}
      </main>
      <Toast {...toast} />
    </>
  );
}
```

---

# 📊 BUSINESS LOGIC ISSUES

## Issue #27: Inconsistent Progress Status Logic
**File**: [src/app/groups/page.tsx](src/app/groups/page.tsx#L355-420)  
**Severity**: 🟡 Medium (Business Logic)  
**Impact**: Different pages show different status for same group

### Problem
**Multiple status calculation functions exist and might diverge**:
1. `getPlanStatus()` - line 316
2. `getPerformanceStatus()` - line 411
3. `getCurrentModuleLabel()` - line 342

They should **all use same logic** but implemented separately:
```tsx
// getPlanStatus - one version of "how do we check if plan is on track"
const getPlanStatus = (plan: RolloutPlan | null) => {
  // ... custom logic for plan status

// getPerformanceStatus - different version
const getPerformanceStatus = (projectedPercent: number, actualPercent: number, hasPlan: boolean) => {
  const statusObj = getProgressStatus(projectedPercent, actualPercent, hasPlan);
  return statusObj.status;
};
```

### Fix - Create Single Source of Truth
```tsx
// lib/groupProgressCalculations.ts
export interface ProgressCalculationInput {
  rolloutPlan: RolloutPlan | null;
  projectedPercent: number;
  actualPercent: number;
  studentCount: number;
  attendanceRate: number;
}

export interface ProgressStatus {
  status: 'ON_TRACK' | 'BEHIND' | 'AT_RISK' | 'NOT_STARTED' | 'COMPLETE' | 'NO_PLAN';
  reasoning: string;
  suggestedActions: string[];
}

export function calculateGroupProgress(input: ProgressCalculationInput): ProgressStatus {
  const { rolloutPlan, projectedPercent, actualPercent, studentCount, attendanceRate } = input;

  if (!rolloutPlan) {
    return {
      status: 'NO_PLAN',
      reasoning: 'No rollout plan set',
      suggestedActions: ['Create rollout plan']
    };
  }

  const standards = getUnitStandards(rolloutPlan);
  if (standards.length === 0) {
    return { status: 'NO_PLAN', reasoning: 'Empty plan', suggestedActions: [] };
  }

  const today = normalizeDate(new Date());
  const lastAssess = normalizeDate(standards[standards.length - 1]?.assessing || new Date());

  if (today > lastAssess) {
    return {
      status: 'COMPLETE',
      reasoning: 'All assessment dates passed',
      suggestedActions: []
    };
  }

  // Check if behind
  if (projectedPercent > 0 && actualPercent < projectedPercent - 10) {
    return {
      status: 'AT_RISK',
      reasoning: `Actual progress (${actualPercent}%) is >10% behind projected (${projectedPercent}%)`,
      suggestedActions: [
        'Review assessment results',
        'Increase remedial activities',
        'Schedule one-on-ones with struggling learners'
      ]
    };
  }

  if (actualPercent < projectedPercent) {
    return {
      status: 'BEHIND',
      reasoning: `Actual progress (${actualPercent}%) behind projected (${projectedPercent}%)`,
      suggestedActions: ['Review progress', 'Adjust timeline if needed']
    };
  }

  return {
    status: 'ON_TRACK',
    reasoning: 'Progress meets or exceeds projections',
    suggestedActions: ['Maintain current pace', 'Consider enrichment activities']
  };
}

// Use everywhere:
const progressStatus = calculateGroupProgress({
  rolloutPlan: resolveRolloutPlan(group),
  projectedPercent: creditProgress.percentage,
  actualPercent: actualProgress?.avgPercent || 0,
  studentCount: getGroupStudentCount(group),
  attendanceRate: attendanceByGroup[group.id] ?? 0,
});
```

---

## Issue #28: Status Calculations Don't Match Domain Logic
**File**: [src/app/groups/page.tsx](src/app/groups/page.tsx#L316-420)  
**Severity**: 🟡 Medium (Business Logic)  
**Impact**: Status badges show wrong status

### Problem
Current `getPlanStatus()` function (lines 316-340) uses timeline-based logic but doesn't consider actual student progress:
```tsx
const getPlanStatus = (plan: RolloutPlan | null): PlanStatus => {
  if (!plan) return 'NO_PLAN';

  const standards = getUnitStandards(plan);
  if (standards.length === 0) return 'NO_PLAN';

  const today = normalizeDate(new Date());
  const firstStart = normalizeDate(standards[0]?.start || new Date());
  const lastAssess = normalizeDate(standards[standards.length - 1]?.assessing || new Date());

  if (today < firstStart) return 'NOT_STARTED';
  if (today > lastAssess) return 'COMPLETE';

  // ❌ Problem: Only checks if today is within a unit date range
  // Doesn't verify if students are actually progressing
  const active = standards.find((unit) => {
    const start = normalizeDate(unit?.start || new Date());
    const end = normalizeDate(unit?.end || new Date());
    return start <= today && end >= today;
  });

  if (active) return 'ON_TRACK';

  // ❌ Doesn't check actual attendance/assessment data
  return 'BEHIND';
};
```

### Fix - Integrate Actual Performance Data
Pass actual progress to status function:
```tsx
export function calculateGroupStatus(
  rolloutPlan: RolloutPlan | null,
  projectedPercent: number,
  actualPercent: number,
  attendanceRate: number
): PlanStatus {
  if (!rolloutPlan) return 'NO_PLAN';

  const today = normalizeDate(new Date());

  // Check if plan is complete
  const standards = getUnitStandards(rolloutPlan);
  const lastAssess = normalizeDate(standards[standards.length - 1]?.assessing || new Date());
  if (today > lastAssess && actualPercent >= 80) {
    return 'COMPLETE';
  }

  // Check if on track by comparing projected vs actual
  const percentDifference = projectedPercent - actualPercent;

  if (percentDifference > 20) {
    return 'AT_RISK';  // >20% behind projected
  }

  if (percentDifference > 10) {
    return 'BEHIND';  // 10-20% behind
  }

  if (attendanceRate < 60) {
    return 'AT_RISK';  // Low attendance indicates risk
  }

  return 'ON_TRACK';
}
```

---

## Issue #29: Attendance Rate Calculation Unclear
**File**: [src/app/groups/page.tsx](src/app/groups/page.tsx#L710-790)  
**Severity**: 🟡 Medium (Business Logic)  
**Impact**: Users don't understand how attendance rate is calculated

### Problem
```tsx
// Fetches attendance but logic unclear
const response = await fetch('/api/attendance/stats/bulk', {
  method: 'POST',
  body: JSON.stringify({
    groupIds: groupIdArray,
    startDate: monthRange.startDate,      // ✅ This month
    endDate: monthRange.endDate,
  }),
});

// But what's included?
// - Only present days?
// - How are absences counted?
// - Do late arrivals count as present?
// - How many days in month?
```

### Fix - Document Calculation
Add comment & documentation:
```tsx
// ATTENDANCE CALCULATION:
// Attendance Rate = (Present Days) / (Total Working Days) * 100
// - Present: Marked as 'PRESENT' on attendance record
// - Late: Marked as 'LATE' counts toward rate
// - Absent: Marked as 'ABSENT' or 'EXCUSED' don't count toward rate
// - Excludes non-working days (weekends, public holidays)
// - Calculated for current month only

const response = await fetch('/api/attendance/stats/bulk', {
  method: 'POST',
  body: JSON.stringify({
    groupIds: groupIdArray,
    startDate: monthRange.startDate,
    endDate: monthRange.endDate,
    includeStatus: ['PRESENT', 'LATE'],  // ✅ Clarify what counts
  }),
});
```

---

## Issue #30: Cross-Page Data Inconsistency
**File**: [src/app/groups/page.tsx](src/app/groups/page.tsx) + [src/app/page.tsx](src/app/page.tsx)  
**Severity**: 🟡 Medium (Data Sync)  
**Impact**: Dashboard and groups page show different numbers

### Problem
Dashboard page [src/app/page.tsx](src/app/page.tsx) calculates stats independently:
```tsx
// Dashboard page (line ~100-180)
const { data: dashboardStats } = useDashboardStats();
const { stats: activeStats } = useActiveGroups();

// Groups page (line ~700-800)
const { groups } = useGroups();
const totalStudents = useMemo(() => getUniqueStudentTotal(activeGroups), [activeGroups]);
```

**When one updates, other doesn't reflect change automatically**. Different data sources = potential stale data.

### Fix - Centralize Stats Calculation
```tsx
// lib/groupStatistics.ts
export interface GroupStatistics {
  totalGroups: number;
  activeGroups: number;
  totalStudents: number;
  averageAttendance: number;
  onTrackGroups: number;
  behindGroups: number;
  atRiskGroups: number;
}

export function calculateGroupStatistics(
  groups: GroupWithStudents[],
  attendanceByGroup: Record<string, number>,
  progressByGroup: Record<string, ActualProgress>
): GroupStatistics {
  const active = groups.filter(g => g.status !== 'ARCHIVED');
  const totalStudents = getUniqueStudentTotal(active);
  const avgAttendance = active.length > 0
    ? active.reduce((sum, g) => sum + (attendanceByGroup[g.id] ?? 0), 0) / active.length
    : 0;

  // Count groups by status
  let onTrack = 0, behind = 0, atRisk = 0;
  active.forEach(group => {
    const progress = progressByGroup[group.id];
    if (!progress) return;

    const status = calculateGroupStatus(
      resolveRolloutPlan(group),
      getCreditCompletion(resolveRolloutPlan(group)).percentage,
      progress.avgPercent,
      attendanceByGroup[group.id] ?? 0
    );

    if (status === 'ON_TRACK') onTrack++;
    else if (status === 'BEHIND') behind++;
    else if (status === 'AT_RISK') atRisk++;
  });

  return {
    totalGroups: groups.length,
    activeGroups: active.length,
    totalStudents,
    averageAttendance: avgAttendance,
    onTrackGroups: onTrack,
    behindGroups: behind,
    atRiskGroups: atRisk,
  };
}

// Use in both pages:
const stats = useMemo(
  () => calculateGroupStatistics(groups, attendanceByGroup, actualProgressByGroup),
  [groups, attendanceByGroup, actualProgressByGroup]
);
```

---

# 🎯 IMPLEMENTATION PRIORITY

## Phase 1: Critical Fixes (1-2 hours)
**Do these first - they block tests & break accessibility:**

1. ✅ [Issue #1](#issue-1-missing-semantic-html---no-main-tag) - Add `<main>` tag
2. ✅ [Issue #2](#issue-2-missing-page-heading-h1) - Add `<h1>` heading
3. ✅ [Issue #3](#issue-3-gridlist-view-toggle-buttons-missing-ui) - Fix view toggle buttons (add testids)
4. ✅ [Issue #4](#issue-4-deletearchive-buttons-not-visible-in-list-view) - Fix delete buttons visibility
5. ✅ [Issue #5](#issue-5-search-input-not-properly-labeledtestable) - Add search labels + testid
6. ✅ [Issue #6](#issue-6-add-group-button-not-detectable-by-tests) - Add testid to create button

**Expected result**: 20-25 tests passing after these fixes

---

## Phase 2: Major Fixes (3-4 hours)
**High-impact improvements:**

1. ✅ [Issue #7](#issue-7-inconsistent-deleteearchive-behavior) - Clarify delete vs archive
2. ✅ [Issue #9](#issue-9-duplicate-hook-calls-for-attendance-fetching) - Consolidate data fetching
3. ✅ [Issue #10](#issue-10-collection-filtering-logic-complex--fragile) - Refactor collection logic
4. ✅ [Issue #11](#issue-11-status-badge-rendering-duplicated) - Extract StatusBadge component
5. ✅ [Issue #27](#issue-27-inconsistent-progress-status-logic) - Single source of truth for status
6. ✅ [Issue #30](#issue-30-cross-page-data-inconsistency) - Centralize statistics

**Expected result**: All remaining tests passing

---

## Phase 3: Code Quality (2-3 hours)
**Maintainability improvements:**

1. ✅ [Issue #13](#issue-13-undeclared-functions-missing-implementation) - Add missing functions
2. ✅ [Issue #16](#issue-16-magic-numbers-throughout-code) - Extract constants
3. ✅ [Issue #18](#issue-18-unstable-collection-grouping-algorithm) - Add collection field to schema
4. ✅ [Issue #22](#issue-22-abandoned-old-component-groupsmanagementtsx) - Remove old component
5. ✅ [Issue #25](#issue-25-import-organization-lacks-structure) - Organize imports

---

## Phase 4: Performance & UX (2-3 hours)
**Polish & optimization:**

1. ✅ [Issue #12](#issue-12-no-loading-state-for-attendance-data) - Add skeleton loaders
2. ✅ [Issue #20](#issue-20-no-pagination-for-large-group-lists) - Add pagination
3. ✅ [Issue #21](#issue-21-no-sortingfiltering-options-for-large-datasets) - Add sort controls
4. ✅ [Issue #23](#issue-23-accessibility-missing-aria-labels) - Add aria-labels
5. ✅ [Issue #26](#issue-26-no-batch-deletmerge-feedback) - Use toast notifications

---

# 📋 SUMMARY CHECKLIST

## Critical Issues (🔴)
- [ ] Issue #1: Add `<main>` tag
- [ ] Issue #2: Add `<h1>` heading
- [ ] Issue #3: Fix grid/list toggle buttons
- [ ] Issue #4: Fix delete button visibility
- [ ] Issue #5: Add search input labels
- [ ] Issue #6: Add testid to create button

## Major Issues (🟠)
- [ ] Issue #7: Clarify delete/archive behavior
- [ ] Issue #8: Fix type mismatches in hooks
- [ ] Issue #9: Consolidate data fetching
- [ ] Issue #10: Refactor collection logic
- [ ] Issue #11: Extract StatusBadge component
- [ ] Issue #12: Add loading skeletons

## Code Quality (🟡)
- [ ] Issue #13: Add missing functions
- [ ] Issue #14: Clean up React keys (audit)
- [ ] Issue #15: Clean up refs usage
- [ ] Issue #16: Extract magic numbers
- [ ] Issue #17: Add ErrorBoundary
- [ ] Issue #18: Improve collection grouping
- [ ] Issue #19: Memoize callbacks properly
- [ ] Issue #20: Add pagination
- [ ] Issue #21: Add sort controls
- [ ] Issue #22: Remove old component
- [ ] Issue #23: Add aria-labels
- [ ] Issue #24: Fix date parsing
- [ ] Issue #25: Organize imports
- [ ] Issue #26: Add toast notifications

## Business Logic (🟡)
- [ ] Issue #27: Single source of truth for status
- [ ] Issue #28: Match status to domain logic
- [ ] Issue #29: Document attendance calculation
- [ ] Issue #30: Centralize statistics

---

# 🚀 NEXT STEPS

1. **Review this audit with team**
2. **Start with Phase 1 (critical fixes)** - should take 1-2 hours
3. **Run tests after each phase** to verify fixes
4. **Merge fixes incrementally** to main branch
5. **Plan follow-up for Phase 3-4** in next sprint

**Total Estimated Effort**: 8-10 hours  
**Recommendation**: Schedule 2-day sprint focused on these fixes

---

**Audit Complete**  
**Date**: February 18, 2026  
**Next Review**: After Phase 1 implementation  
**Last Updated**: 18 Feb 2026 - Initial Comprehensive Audit
