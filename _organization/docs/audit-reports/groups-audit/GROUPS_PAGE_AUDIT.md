# Groups Page Comprehensive Audit
**Date:** February 18, 2026  
**File:** `src/app/groups/page.tsx` (1635 lines)

---

## 📊 CRITICAL ISSUES (Must Fix)

### 1. **Unstable useEffect Dependency** ⚠️ CRITICAL
**Location:** Line 577  
**Issue:**
```tsx
useEffect(() => {
  // ...
}, [activeGroups.map((group: any) => group.id).join(',')]);
```
**Problem:**
- Creates new array on every render, even if activeGroups haven't changed
- Dependency comparison fails, causing infinite loops
- Batched attendance API requests fire repeatedly

**Fix:**
```tsx
useEffect(() => {
  // ...
}, [activeGroups]); // Or memoize the dependency properly
```

---

### 2. **API Rate Limiting - Parallel Requests Issue**
**Location:** Lines 553-563  
**Issue:**
```tsx
const responses = await Promise.all(
  activeGroups.map((group: any) =>
    fetch(`/api/attendance/stats?groupId=${group.id}&startDate=${startDate}&endDate=${endDate}`)
  )
);
```
**Problem:**
- Makes simultaneous requests for ALL groups (46+ in your case)
- Triggers "too many requests" errors
- No batching or throttling mechanism
- No error handling if one request fails

**Fix:**
- Implement batching (5-10 requests at a time)
- Add error handling and retry logic
- Consider combining into single batch endpoint

---

### 3. **Excessive Type Casting with `any`**
**Location:** Throughout (50+ occurrences)  
**Issue:**
```tsx
(groups || []).filter((g: any) => {
(group: any) =>
(group?.students || []).forEach((student: any) => {
```
**Impact:**
- No type safety
- Hidden bugs won't be caught until runtime
- Makes code hard to maintain

**Fix:**
- Create proper TypeScript interfaces
- Replace `any` with specific types

---

### 4. **Missing Error Handling for Data Fetching**
**Location:** Lines 454-457, 541-575  
**Issue:**
```tsx
const { data: actualProgressData } = useSWR(
  '/api/groups/progress',
  (url: string) => fetch(url, { credentials: 'include' }).then((res) => res.json()),
  { revalidateOnFocus: false }
);
// No error handling for this useSWR
```
**Problems:**
- useSWR errors not handled
- Network failures silently fail
- Users don't know why data isn't loading

---

## ⚠️ MAJOR ISSUES

### 5. **Too Many State Variables**
**Location:** Lines 443-454  
**Issue:**
- 12+ individual `useState` declarations
- Hard to manage and track
- Makes component harder to test

```tsx
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

**Fix:** Consolidate into logical state objects:
```tsx
const [ui, setUi] = useState({
  viewMode: 'grid' as 'grid' | 'list',
  searchQuery: '',
  expandedCompanies: [],
  expandedCollections: ['montzelity'],
});

const [modals, setModals] = useState({
  showGroupModal: false,
  showUploadModal: false,
  showAddStudentModal: false,
  showMergeModal: false,
});
```

---

### 6. **No Memoization for Computed Values**
**Location:** Lines 516-539 (programmeRows calculation)  
**Issue:**
```tsx
const programmeRows = activeGroups.map((group: any) => {
  // Complex calculations
  // ... but no useMemo wrapping this
});
```
**Problem:**
- Recomputes on every render
- Expensive calculations (date parsing, filtering, etc.)
- Component will re-render slowly

---

### 7. **Inefficient Student Count Logic**
**Location:** Lines 122-170 (`getUniqueStudentTotal`, `getGroupStudentCount`)  
**Issue:**
- Complex deduplication logic
- Creates Set objects on every call
- Duplicate code between functions

---

### 8. **Missing Null/Undefined Checks**
**Location:** Multiple places  
```tsx
// Line 566: assumes payload structure without checking
const attendanceRate = payload?.data?.attendanceRate ?? payload?.attendanceRate ?? 0;

// Should validate response structure first
```

---

## 🔧 MEDIUM ISSUES

### 9. **No Loading States for Modal Operations**
**Locations:** Modal components  
**Issue:**
- No loading indicators while saving
- User can't tell if action is processing

---

### 10. **Hardcoded Module Information**
**Location:** Lines 276-283  
**Issue:**
```tsx
const MODULE_INFO = [
  { number: 1, name: 'Numeracy', credits: 16 },
  // ... hardcoded in component
];
```
**Fix:** Move to constants file or fetch from API

---

### 11. **Complex Date Parsing Logic**
**Location:** Lines 83-99 (`parsePlanDate`)  
**Issue:**
- Multiple date format conversions
- No validation of parsed dates
- Error handling only returns null

---

### 12. **Search Functionality Not Optimized**
**Location:** Lines 502-510  
**Issue:**
- Filter happens on every keystroke
- No debouncing
- No highlighting of matches

---

## 📈 PERFORMANCE ISSUES

### 13. **Unnecessary Re-renders**
- Multiple filters creating new arrays on every render
- No React.memo on child components
- Collection/company structure recreated every render

### 14. **Event Handler Not Memoized**
**Location:** Lines 580+  
```tsx
const toggleCompany = (companyName: string) => {
  // Recreated on every render
  // Passed to child components, causing re-renders
};
```

---

## 🎨 UX/ACCESSIBILITY ISSUES

### 15. **Missing Accessibility Features**
- No ARIA labels on buttons
- No semantic HTML in some places
- Search input missing proper labels
- Loading spinner not announced to screen readers

### 16. **No Empty States**
- What happens when there are no groups?
- What happens when search returns no results?
- Currently just renders empty sections

### 17. **Confirmation Dialog Uses `confirm()`**
**Location:** Line 589  
```tsx
if (!confirm(confirmMessage)) {
  return;
}
```
**Issue:**
- Browser default confirm is limited
- Can't be styled
- Not accessible

**Fix:** Use a proper modal component

---

## 🧪 TESTING ISSUES

### 18. **Hard to Test**
- Too many responsibilities
- Direct API calls mixed with UI logic
- No separation of concerns
- Lots of conditional rendering logic

---

## 📋 CODE QUALITY ISSUES

### 19. **Inconsistent Naming**
- `montzelityCollection` vs `allOtherGroups` (different patterns)
- `drawerMeta` (unclear abbreviation)
- Mix of `get*` and `extract*` prefixes

### 20. **Large Conditional Rendering**
- Multiple large ternary operators in JSX
- Complex nested conditionals
- Makes UI logic hard to follow

---

## 🔒 SECURITY ISSUES

### 21. **No Input Validation**
- Search query not sanitized
- Group names not validated before display
- Student data not validated

---

## 📊 SUMMARY

| Category | Count | Severity |
|----------|-------|----------|
| Critical Issues | 3 | 🔴 |
| Major Issues | 8 | 🟠 |
| Medium Issues | 4 | 🟡 |
| Performance Issues | 4 | 🟡 |
| UX/Accessibility | 4 | 🟡 |
| Code Quality | 2 | 🟢 |
| **Total** | **25** | - |

---

## ✅ IMMEDIATE FIXES RECOMMENDED

### Priority 1 (Do First)
1. Fix useEffect dependency issue (line 577)
2. Fix API rate limiting (parallel requests)
3. Add error handling for data fetching
4. Replace `confirm()` dialog with proper modal

### Priority 2 (Do Next)
5. Consolidate state variables
6. Add memoization for computed values
7. Add loading/error states
8. Improve type safety (reduce `any` types)

### Priority 3 (Nice to Have)
9. Add empty states
10. Improve accessibility
11. Refactor large component
12. Add proper error boundaries

---

## 📝 REFACTORING RECOMMENDATIONS

### Split Component
Consider splitting into:
- `GroupsListContainer.tsx` (data fetching, state)
- `GroupsGrid.tsx` (grid view rendering)
- `GroupsList.tsx` (list view rendering)
- `GroupStatistics.tsx` (stats cards)

### Extract Logic
- Date parsing utilities
- Student counting utilities
- Progress calculation utilities
- Filter functions

### Create Hooks
- `useGroupAttendance()` - Handle attendance fetching with batching
- `useGroupFiltering()` - Handle search/filter logic
- `useGroupProgress()` - Handle progress data fetching

---

## 🎯 NEXT STEPS

1. Review this audit with the team
2. Create tickets for each issue
3. Prioritize by severity and impact
4. Assign ownership
5. Set timeline for fixes

