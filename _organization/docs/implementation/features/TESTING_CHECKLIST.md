# Cross-Page Cache Invalidation: Testing Checklist

**Use this checklist to verify that all mutations properly invalidate cross-page caches.**

---

## Quick Testing Setup

1. Open DevTools (F12) → Console tab
2. Open Dashboard in one window/tab
3. Open target page (Assessments, Students, Attendance) in another tab
4. Keep both visible (split screen if possible)
5. Watch console for `🔄 Invalidating cache for event:` messages

---

## Test Case 1: Mark Assessment

**Location**: Assessments page → Mark Assessment

### Steps:
1. ✅ Note Dashboard stats before change
2. ✅ Go to Assessments page
3. ✅ Mark a student's assessment as **COMPETENT**
4. ✅ Check console for: `🔄 Invalidating cache for event: assessment:mark`
5. ✅ Check console for: `✅ Cache invalidated for event: assessment:mark`

### Expected Results:
- [ ] Assessments page shows updated assessment
- [ ] Dashboard stats are immediately updated
- [ ] Student progress increases
- [ ] Group progress increases
- [ ] Recent activity shows new assessment marking
- [ ] Alerts update if applicable

### Key Cache Keys Invalidated:
```
/api/assessments
/api/students
/api/groups
/api/groups/progress
/api/dashboard/stats
/api/dashboard/alerts
/api/dashboard/recent-activity
```

---

## Test Case 2: Add New Learner

**Location**: Students page → Add Student

### Steps:
1. ✅ Note Dashboard student count before change
2. ✅ Go to Students page
3. ✅ Click "Add Student" button
4. ✅ Fill form and submit
5. ✅ Check console for: `🔄 Invalidating cache for event: student:add`
6. ✅ Check console for: `✅ Cache invalidated for event: student:add`

### Expected Results:
- [ ] Student appears in Students list
- [ ] Dashboard student count increases
- [ ] Group member count increases
- [ ] Group progress metrics update
- [ ] Dashboard alerts recalculate
- [ ] Recent activity shows new student enrollment

### Key Cache Keys Invalidated:
```
/api/students
/api/groups
/api/groups/progress
/api/dashboard/stats
/api/dashboard/alerts
/api/dashboard/recent-activity
```

---

## Test Case 3: Update Student Details

**Location**: Students page → Edit Student

### Steps:
1. ✅ Go to Students page
2. ✅ Click on a student → Edit button
3. ✅ Update a field (e.g., email, module)
4. ✅ Save changes
5. ✅ Check console for: `🔄 Invalidating cache for event: student:update`
6. ✅ Check console for: `✅ Cache invalidated for event: student:update`

### Expected Results:
- [ ] Student details updated in list
- [ ] Group progress metrics may update (if module changed)
- [ ] Dashboard stats may update
- [ ] Changes visible when navigating away and back

### Key Cache Keys Invalidated:
```
/api/students
/api/groups/progress
/api/dashboard/stats
```

---

## Test Case 4: Bulk Archive Students

**Location**: Students page → Select Multiple → Archive

### Steps:
1. ✅ Note Dashboard student count and stats
2. ✅ Go to Students page
3. ✅ Select 2-3 students
4. ✅ Click "Archive" button
5. ✅ Confirm action
6. ✅ Check console for: `🔄 Invalidating cache for event: student:bulk-archive`
7. ✅ Check console for: `✅ Cache invalidated for event: student:bulk-archive`

### Expected Results:
- [ ] Selected students disappear from list
- [ ] Dashboard student count decreases
- [ ] Group member counts decrease
- [ ] Group progress metrics update
- [ ] Dashboard stats show reduced counts
- [ ] Alerts recalculate based on new group size

### Key Cache Keys Invalidated:
```
/api/students
/api/groups
/api/groups/progress
/api/dashboard/stats
/api/dashboard/alerts
```

---

## Test Case 5: Record Attendance

**Location**: Attendance page → Mark Attendance

### Steps:
1. ✅ Note Dashboard attendance rates before change
2. ✅ Go to Attendance page
3. ✅ Mark attendance for today (select students, mark PRESENT/ABSENT)
4. ✅ Click "Save Attendance"
5. ✅ Check console for: `🔄 Invalidating cache for event: attendance:record`
6. ✅ Check console for: `✅ Cache invalidated for event: attendance:record`

### Expected Results:
- [ ] Attendance records save successfully
- [ ] Dashboard attendance rates update
- [ ] Group attendance percentages update
- [ ] Attendance alerts update (if any students drop below threshold)
- [ ] Recent activity shows attendance marking
- [ ] Group progress metrics reflect attendance changes

### Key Cache Keys Invalidated:
```
/api/attendance
/api/groups
/api/groups/progress
/api/dashboard/stats
/api/dashboard/alerts
/api/dashboard/recent-activity
```

---

## Test Case 6: Bulk Mark Attendance

**Location**: Attendance page → Bulk Actions

### Steps:
1. ✅ Go to Attendance page
2. ✅ Select multiple students using checkboxes
3. ✅ Click bulk action (e.g., "Mark All Present")
4. ✅ Confirm action
5. ✅ Check console for: `🔄 Invalidating cache for event: attendance:bulk`
6. ✅ Check console for: `✅ Cache invalidated for event: attendance:bulk`

### Expected Results:
- [ ] All selected students marked in one operation
- [ ] Dashboard attendance rates update
- [ ] Group attendance percentages update immediately
- [ ] Recent activity shows bulk attendance action
- [ ] Compliance alerts update
- [ ] All pages show consistent data

### Key Cache Keys Invalidated:
```
/api/attendance
/api/groups
/api/groups/progress
/api/dashboard/stats
/api/dashboard/alerts
/api/dashboard/recent-activity
```

---

## Advanced Testing: Cross-Page Verification

### Test that Dashboard updates when mutating from other pages:

**Procedure A: From Multiple Tabs**
1. Open Dashboard in Tab 1
2. Open Assessments in Tab 2
3. Switch to Tab 2, mark an assessment
4. Switch to Tab 1 → Dashboard should show updated stats within 5 seconds

**Procedure B: From Same Window (Split View)**
1. Open Dashboard on left side (50% width)
2. Open Assessments on right side (50% width)
3. In Assessments: mark an assessment
4. Watch Dashboard update in real-time

**Procedure C: Network Sensitivity**
1. Open DevTools → Network tab
2. Filter for `/api/` requests
3. Mark an assessment
4. Observe the cascade of API calls:
   - Initial assessment update: `/api/assessments`
   - Follow-up validations: `/api/students`, `/api/groups`, etc.
   - Dashboard refresh: `/api/dashboard/stats`

---

## Debugging Guide

### If Dashboard doesn't update:

**Check 1: Console for errors**
```javascript
// Open console and look for:
❌ Error invalidating cache for event...
```
If found, note the error message

**Check 2: Verify event type**
Look for message like:
```
🔄 Invalidating cache for event: assessment:mark
✅ Cache invalidated for event: assessment:mark (7 keys)
```
Count should match expected keys

**Check 3: Check SWR state**
```javascript
// In DevTools console:
// Check if mutations are being tracked
localStorage.debug = 'swr:*'
// Then repeat the test and watch network tab
```

**Check 4: Verify API response**
```javascript
// Mark something and watch Network tab
// Each API call should return 200 or 201
// If you see 4xx or 5xx, the mutation failed silently
```

**Check 5: React DevTools**
- Install React DevTools browser extension
- Open Profiler tab
- Trigger mutation
- Look for component re-renders from SWR

---

## Performance Testing

### Verify cache invalidation doesn't cause excessive API calls:

**Expected behavior:**
- Mark assessment → ~7 new API calls (cache invalidations) + local refetch
- Should complete in < 2 seconds
- No duplicate API calls (deduping should prevent this)

**Test with Network Throttling:**
1. Open DevTools → Network tab
2. Set throttling to "Slow 3G"
3. Mark an assessment
4. Observe that UI doesn't block waiting for all API calls
5. Verify list updates immediately, dashboard updates after (~2-3 seconds)

---

## Edge Cases to Test

### 1. Rapid Successive Mutations
- [ ] Mark 5 assessments rapidly in succession
- [ ] All should be saved
- [ ] Dashboard should eventually show correct totals
- [ ] No duplicate or missed cache invalidations

### 2. Offline → Online Transition
- [ ] Go offline (DevTools → Network)
- [ ] Try to mark assessment
- [ ] Should see error
- [ ] Go back online
- [ ] Mark assessment again
- [ ] Should work and dashboard updates

### 3. Concurrent Mutations from Different Sources
- [ ] Open two browser windows/tabs
- [ ] From window 1: Mark assessment
- [ ] From window 2 (while tab 1 is mutating): Add student
- [ ] Both should complete
- [ ] Dashboard in window 1 should show both changes

### 4. Component Leave & Return
- [ ] Open Assessments, mark something
- [ ] Dashboard should update
- [ ] Navigate away from Assessments
- [ ] Wait 5 seconds
- [ ] Return to Dashboard
- [ ] Data should be consistent

---

## Success Criteria Checklist

Mark all as ✅ when testing is complete:

### Basic Mutations
- [ ] Assessment marking invalidates cross-page cache
- [ ] Student addition invalidates cross-page cache
- [ ] Student update invalidates cross-page cache
- [ ] Student bulk archive invalidates cross-page cache
- [ ] Attendance recording invalidates cross-page cache
- [ ] Attendance bulk mark invalidates cross-page cache

### Dashboard Updates
- [ ] Stats update after assessment marking
- [ ] Student count updates after adding student
- [ ] Attendance rates update after marking attendance
- [ ] Progress metrics update after all mutations
- [ ] Alerts recalculate after mutations

### Performance
- [ ] Mutations complete in < 2 seconds
- [ ] No excessive duplicate API calls
- [ ] UI stays responsive during mutations
- [ ] No console errors

### Consistency
- [ ] Multiple tabs show same data
- [ ] Navigating between pages shows fresh data
- [ ] Cross-page references are accurate
- [ ] Historical data remains intact

---

## Regression Testing

Before deploying to production, verify these don't break:

- [ ] Old `invalidateStudents()` still works (backward compat)
- [ ] Old `invalidateAssessments()` still works (backward compat)
- [ ] Old `invalidateAttendance()` still works (backward compat)
- [ ] Local component `mutate()` calls still work
- [ ] SWR hook caching still works
- [ ] Offline mode still functions (degrades gracefully)

---

## Console Messages Guide

Watch for these success messages:

```typescript
// ✅ GOOD messages (expected):
🔄 Invalidating cache for event: assessment:mark
✅ Cache invalidated for event: assessment:mark (7 keys)

// ⚠️ WARNING messages (check but likely OK):
⚠️ Unknown event type: typo:event
(means event type wasn't recognized, but continues)

// ❌ ERROR messages (investigate):
❌ Error invalidating cache for event assessment:mark: 
(means something failed, check network/permissions)
```

---

## Sign-Off

When all tests pass, document:

- **Tested by**: ________________
- **Date**: ________________
- **Environment**: [ ] Local  [ ] Staging  [ ] Production
- **Notes**: ___________________________________________________________

---

**Last Updated**: February 21, 2026
**Test Suite Version**: 1.0
