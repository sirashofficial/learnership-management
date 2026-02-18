# System Audit Issues Reference

Complete catalog of 39 issues found during audits of Groups Page, Attendance Page, and cross-page dependencies.

## Index by Category

**Code Quality Issues**: 25 issues
**Business Logic Issues**: 7 issues  
**Cross-Page Integration Issues**: 7 issues

---

## Code Quality Issues (25)

### Groups Page (src/app/groups/page.tsx)

#### Structure & Organization (6 issues)
1. **Component too large** (1662 lines)
   - Combines group display, stats, creation, deletion, filtering
   - Severity: Major
   - Fix: Split into GroupList, GroupCard, GroupStats, GroupFilters sub-components

2. **Too many useState variables** (15+ state variables)
   - Scattered state management, hard to follow
   - Severity: Medium
   - Fix: Consider using useReducer for complex state

3. **Mixed concerns in JSX** (rows 500-600)
   - API calls, calculations, rendering mixed together
   - Severity: Medium
   - Fix: Extract hooks for each concern

4. **No TypeScript enums** (uses string literals)
   - Status: "ON_TRACK", "AT_RISK", "OFF_TRACK" scattered throughout
   - Severity: Minor
   - Fix: Create Status enum

5. **Inconsistent naming conventions**
   - `activeGroups` vs `selectedGroups`, `groupStats` vs `stats`
   - Severity: Minor
   - Fix: Standardize naming

6. **Dead code** (lines 800-850)
   - Commented out error logging functions
   - Severity: Minor
   - Fix: Remove or restore

#### Dependencies & Performance (5 issues)
7. **Unstable useEffect dependency** (line 577)
   ```
   [activeGroups.map(g => g.id).join(',')]  // WRONG - new array every render
   ```
   - Causes infinite loop of API calls
   - Severity: Critical ✅ FIXED (changed to [activeGroups])
   - Fix: Use [activeGroups] directly

8. **46+ simultaneous API requests** (makeAttendanceRequest loop)
   - Causes "too many requests" errors
   - Severity: Critical ✅ FIXED (implemented batching)
   - Fix: Batch requests (5 at a time with delays)

9. **Missing memoization** (useMemo for calculations)
   - Progress calculation runs on every render
   - Severity: Major
   - Fix: Wrap in useMemo with [activeGroups] dependency

10. **No response caching** (makes same API call twice)
    - Fetches group stats, then fetches individual group data
    - Severity: Medium
    - Fix: Cache responses for 30 seconds

11. **N+1 query pattern** (fetches then maps with additional requests)
    - Gets all groups, then fetches metadata for each
    - Severity: Major
    - Fix: Combine into single batch API call

#### Error Handling (4 issues)
12. **No error state handling** (API errors silently fail)
    - User doesn't know data failed to load
    - Severity: Major
    - Fix: Add error state and display error message

13. **Unhandled promise rejections** (async/await missing try-catch)
    - Multiple locations in useEffect
    - Severity: Major
    - Fix: Wrap all async calls in try-catch

14. **Fallback logic removes data** (line 450)
    ```
    const groupsToShow = error ? [] : groups  // loses data on error
    ```
    - Severity: Major
    - Fix: Return last-known-good data on error

15. **Generic error messages** ("Something went wrong")
    - Users can't debug issues
    - Severity: Minor
    - Fix: Include error code, status, details

#### Type Safety (3 issues)
16. **Excessive `any` types** (5+ instances)
    - Progress data typed as `any`
    - Severity: Medium
    - Fix: Create GroupProgress, AttendanceStats interfaces

17. **Missing null checks** (line 600)
    ```
    group.metadata.name  // no check if metadata exists
    ```
    - Severity: Major
    - Fix: Use optional chaining: `group.metadata?.name`

18. **Wrong type assumptions** (API returns different shape than expected)
    - Severity: Major
    - Fix: Validate response schema with zod/yup

#### Testing & Maintainability (2 issues)
19. **Hard to test** (tightly coupled to API)
    - Can't unit test without mocking entire API
    - Severity: Medium
    - Fix: Extract business logic to separate function

20. **No prop validation** (uses Props interface incorrectly)
    - Missing required fields in type definition
    - Severity: Minor
    - Fix: Add strict prop checking

#### Styling & UI (2 issues)
21. **Hardcoded colors** (rgb(255,0,0) scattered)
    - Hard to maintain theme consistency
    - Severity: Minor
    - Fix: Move to CSS variables or theme config

22. **Inline styles** (style={{}} in JSX)
    - Can't reuse styles, hard to maintain
    - Severity: Minor
    - Fix: Move to CSS modules

### Attendance Page (src/app/attendance/page.tsx)

#### Structure (2 issues)
23. **Mixed UI and logic** (1230 lines)
    - Attendance form, group selection, student list all in one component
    - Severity: Major
    - Fix: Extract AttendanceForm, StudentList, GroupSelector

24. **No separation of concerns** (state, effects, rendering intertwined)
    - Severity: Medium
    - Fix: Create custom hooks (useGroupSelection, useAttendanceForm)

#### Code Duplication (1 issue)
25. **Repeated calculation logic** (calculates same metrics 3 ways)
    - Severity: Major
    - Fix: Extract to utils/calculations.ts (see Business Logic section)

---

## Business Logic Issues (7)

### Groups Page Progress Logic

1. **"On Track" status ignores timeline** (line 350)
   ```
   status = progress > targetProgress ? "ON_TRACK" : "AT_RISK"
   ```
   - Problem: 20% on Day 1 = ON_TRACK, but also 20% on Day 90 = ON_TRACK
   - Should consider: current date vs deadline
   - Severity: Critical
   - Example: Group started Week 1, has 20% progress, deadline in 12 weeks = "OFF_TRACK" but system says "ON_TRACK"
   - Fix: Compare (targetProgress - currentProgress) / (daysRemaining / totalDays)

2. **Progress calculated as simple average of credits** (line 420)
   ```
   avgProgressPercent = (avgCreditsPerStudent / 140) * 100
   ```
   - Problem: Doesn't account for module structure or weights
   - Problem: 140 seems hardcoded, what if curriculum changes?
   - Severity: Major
   - Fix: Get total credits from curriculum, weight by importance

3. **Projected vs Actual progress not shown** (line 380)
   - Current: Shows only actual progress
   - Missing: Projected progress based on timeline
   - Severity: Major
   - Fix: Calculate: projectedProgress = (daysElapsed / totalDays) * 100
   - Then show Actual vs Projected bar chart

### Attendance Page Logic

4. **Attendance % formula is wrong** (line 200)
   ```
   attendancePercent = (presentCount + lateCount) / totalRecords * 100
   ```
   - Problem: Doesn't account for different classes per student
   - Problem: If 1 of 46 students missing = ~2% impact, but system shows 0.2%
   - Should be: average of per-student attendance rates
   - Severity: Critical
   - Example: Group of 46, 1 student hated 10 classes, others attended all = should show ~2% impact
   - Fix: Sum of (studentPresent / studentTotal) / 46

5. **No distinction between "Present" and "Late"** (line 210)
   - Both counted as "attended", but late should have different weight
   - Severity: Major
   - Fix: Calculate as: (present * 1.0 + late * 0.5) / total

6. **Enrolled students not reflected in attendance** (line 150)
   - If new student added via Students page, doesn't appear in attendance
   - Severity: Major
   - Fix: Refresh attendance form when attendance page loads, check for new students

### Students Page Logic

7. **Student status not consistent with groups** (in integrationSection)
   - Student marked as "progressing" but group shows "OFF_TRACK"
   - Severity: Major
   - Fix: Pull status from group context, not independent calculation
   - Issue: No calculation in students page yet, but space for conflict

---

## Cross-Page Integration Issues (7)

### Data Sources & Synchronization

1. **Three different group data sources** (Severity: Critical)
   - Groups Page: `useGroups()` context
   - Attendance Page: Reconstructs groups from student data (line 67-150)
   - Dashboard: Fetches from `/api/groups/summary`
   - Problem: Same group shows different data (different student counts, different progress)
   - Impact: If group added, Attendance page still shows old list
   - Fix: All pages use `useGroups()` context exclusively

2. **Student count differs across pages** (Severity: Critical)
   ```
   Students Page: Shows 46 students (pageSize=1000)
   Attendance Page: Shows 20 students (reconstructed)
   Dashboard: Shows 46 students (/api/students?limit=100)
   ```
   - Fix: ✅ Set consistent pageSize across all useStudents calls

3. **Attendance % calculated three different ways** (Severity: Critical)
   ```
   Groups Page: creditProgress.percentage
   Attendance Page: (present + late) / total
   Dashboard: pulls from /api/attendance/stats
   ```
   - Problem: Same group shows 73% on Groups page, 82% on Attendance page
   - All should use same formula (per-student average)
   - Fix: Create utils/calculateAttendance.ts, use everywhere

4. **Progress data from multiple endpoints** (Severity: Major)
   - Groups page: `/api/groups/progress` (actual)
   - Groups page: `MODULE_INFO` hardcoded (projected)
   - Dashboard: `/api/progress/summary` (different calculation)
   - Students page: calculates inline
   - Fix: Single endpoint `/api/progress?type=actual|projected`

### Hardcoded Data

5. **Hardcoded group list in attendance page** (Severity: Critical)
   - Location: [src/app/attendance/page.tsx](src/app/attendance/page.tsx#L67-L150)
   - Groups: BUSINESS_FUNDAMENTALS, DIGITAL_CITIZENSHIP, etc. hardcoded
   - Problem: New groups added to DB don't appear in attendance
   - Fix: Remove lines 67-150, use `useGroups()` instead

6. **Hardcoded MODULE_INFO in groups page** (Severity: Major)
   - Location: [src/app/groups/page.tsx](src/app/groups/page.tsx#L600)
   - Contains curriculum structure, used for projected progress
   - Problem: If curriculum changes in DB, page still uses old data
   - Fix: Fetch from `/api/curriculum` instead

### Real-Time Synchronization

7. **No data sync when user navigates between pages** (Severity: Major)
   - User adds student on Students page
   - User navigates to Attendance page
   - New student doesn't appear (SWR cache is 30 seconds old)
   - Fix: Call mutate() on context when returning to page (focus event)
   - Or: Use WebSocket for real-time updates

---

## Summary Statistics

| Category | Count | Critical | Major | Medium | Minor |
|----------|-------|----------|-------|--------|-------|
| Code Quality | 25 | 2 | 9 | 8 | 6 |
| Business Logic | 7 | 4 | 3 | 0 | 0 |
| Integration | 7 | 3 | 3 | 1 | 0 |
| **TOTAL** | **39** | **9** | **15** | **9** | **6** |

## Status

✅ **Fixed** (3):
- Groups page useEffect dependency
- Groups page batch processing for attendance requests
- Students page pagination (20 → 46 students)

🔴 **Needs Fixing** (36):
- 6 Code Quality issues
- 7 Business Logic issues
- 7 Integration issues
- Plus immediate P0 items from later planning

## Time Estimates

| Priority | Tasks | Hours |
|----------|-------|-------|
| P0 Critical | Fix Attendance page + standardize progress | 4-5 |
| P1 Important | Remove hardcoded data + data sync | 6-8 |
| P2 Nice-to-Have | Refactor code quality + optimize perf | 8-10 |
| **Total** | | **18-23** |

## How to Use This Reference

When fixing issues:
1. Look up the issue number (e.g., "Business Logic #1")
2. Read the problem and fix suggestion
3. If marked ✅, it's already complete
4. If 🔴, it needs implementation

When auditing new components:
1. Check this list for similar patterns
2. Look for same issues in your component
3. Refer to severity levels for priority

