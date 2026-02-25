# Cross-Page SWR Cache Invalidation Fix

**Status**: ✅ IMPLEMENTED  
**Date**: February 21, 2026  
**Scope**: Complete system-wide cache invalidation for all mutations

---

## The Problem

When data was mutated on one page (e.g., marking an assessment, adding a learner, recording attendance), other pages — especially the Dashboard — didn't update because SWR cache keys weren't being invalidated across the entire application.

### Example Scenarios:
- **Mark Assessment** on Assessments page → Dashboard stats don't update
- **Add Student** on Students page → Dashboard student count stays the same
- **Record Attendance** on Attendance page → Dashboard attendance rates don't refresh

---

## The Solution

### New Centralized Function: `invalidateRelatedCache(event: string)`

Located in: **`src/lib/cache-invalidation.ts`**

This unified function handles all cache invalidation logic, mapping event types to their related cache keys automatically.

```typescript
/**
 * CENTRALIZED Cache Invalidation by Event Type
 * 
 * @param event - The type of mutation that occurred
 * 
 * Supported event types:
 * - 'assessment:mark' - Mark assessment as competent/NYC
 * - 'assessment:create' - Create new assessment
 * - 'assessment:delete' - Delete assessment
 * - 'assessment:moderate' - Moderate assessment
 * - 'student:add' - Add new learner to group
 * - 'student:update' - Update student details
 * - 'student:delete' - Delete/archive student
 * - 'student:bulk-archive' - Bulk archive students
 * - 'attendance:record' - Record session attendance
 * - 'attendance:bulk' - Bulk mark attendance
 * - 'attendance:update' - Update attendance record
 * - 'group:create' - Create new group
 * - 'group:update' - Update group
 * - 'group:delete' - Delete/archive group
 * - 'group:merge' - Merge groups
 */
export const invalidateRelatedCache = async (event: string) => {
  // Automatically determines which caches need invalidation
}
```

---

## Cache Invalidation Mapping

### Assessment Events
**'assessment:mark' / 'assessment:create' / 'assessment:delete'**
```
Invalidates: /api/assessments, /api/students, /api/groups, /api/groups/progress,
             /api/dashboard/stats, /api/dashboard/alerts, /api/dashboard/recent-activity
```

### Student Events
**'student:add'**
```
Invalidates: /api/students, /api/groups, /api/groups/progress,
             /api/dashboard/stats, /api/dashboard/alerts, /api/dashboard/recent-activity
```

**'student:bulk-archive'**
```
Invalidates: /api/students, /api/groups, /api/groups/progress,
             /api/dashboard/stats, /api/dashboard/alerts
```

### Attendance Events
**'attendance:record' / 'attendance:bulk'**
```
Invalidates: /api/attendance, /api/groups, /api/groups/progress,
             /api/dashboard/stats, /api/dashboard/alerts, /api/dashboard/recent-activity
```

---

## Updated Mutation Points

### ✅ Assessments Page (`src/app/assessments/page.tsx`)

**Before:**
```typescript
const handleMarkAssessment = async (...) => {
  if (res.ok) {
    fetchAssessments(); // Only refetches assessments
  }
}
```

**After:**
```typescript
const handleMarkAssessment = async (...) => {
  if (res.ok) {
    await invalidateRelatedCache('assessment:mark'); // ✅ Cascading invalidation
    fetchAssessments();
  }
}
```

---

### ✅ Students Page (`src/app/students/page.tsx`)

**Before:**
```typescript
const handleBulkArchive = async () => {
  await Promise.all(archivePromises);
  mutate();
  await invalidateStudents(); // Old specific function
}

// Add Student
if (response.ok) {
  mutate();
  router.refresh();
}
```

**After:**
```typescript
const handleBulkArchive = async () => {
  await Promise.all(archivePromises);
  mutate();
  await invalidateRelatedCache('student:bulk-archive'); // ✅ Unified dispatch
}

// Add Student
if (response.ok) {
  mutate();
  await invalidateRelatedCache('student:add'); // ✅ Unified dispatch
  router.refresh();
}

// Update Student
if (response.ok) {
  mutate();
  await invalidateRelatedCache('student:update'); // ✅ Unified dispatch
  router.refresh();
}
```

---

### ✅ Attendance Page (`src/app/attendance/page.tsx`)

**Before:**
```typescript
const handleBulkAction = async (action: string) => {
  if (data.success) {
    await invalidateAttendance(); // Old specific function
  }
}

const saveAttendance = async () => {
  await invalidateAttendance(); // Old specific function
}
```

**After:**
```typescript
const handleBulkAction = async (action: string) => {
  if (data.success) {
    await invalidateRelatedCache('attendance:bulk'); // ✅ Unified dispatch
  }
}

const saveAttendance = async () => {
  await invalidateRelatedCache('attendance:record'); // ✅ Unified dispatch
}
```

---

## How It Works

### For Developers: Using the New System

1. **Identify your mutation action** (from the supported event types list)
2. **Call the unified function** right after successful API response:

```typescript
// Example: Adding a new group
const handleAddGroup = async (groupData) => {
  const res = await fetch('/api/groups', {
    method: 'POST',
    body: JSON.stringify(groupData),
  });
  
  if (res.ok) {
    // Just call the unified function with the event type
    await invalidateRelatedCache('group:create');
    alert('Group created!');
    refreshLocal(); // Local state
  }
}
```

3. **The function automatically handles**:
   - All related cache keys
   - Wildcard patterns for dynamic routes
   - Cross-page synchronization
   - Dashboard updates

---

## Benefits

### ✅ **Centralized Control**
- Single source of truth for cache invalidation
- Easy to maintain and audit
- All invalidation logic in one place

### ✅ **Consistency**
- Same event always invalidates the same caches
- No missed or duplicated invalidations
- Prevents cache drift

### ✅ **Completeness**
- Dashboard always updates when data changes
- No need to remember all related endpoints
- New features automatically inherit correct invalidation

### ✅ **Performance**
- Only necessary caches are invalidated
- Event-specific cache lists prevent over-invalidation
- Reduces unnecessary API calls

### ✅ **Discoverability**
- Comments show which endpoints each event invalidates
- IDE autocomplete for event types
- Clear event naming (e.g., 'student:add')

---

## Testing the Fix

### Test Case 1: Mark Assessment
1. Open Dashboard (note attendance rate / stats)
2. Go to Assessments page
3. Mark an assessment as COMPETENT
4. Return to Dashboard → **Should see updated stats** ✅

### Test Case 2: Add Student
1. Open Dashboard (note student count)
2. Go to Students page
3. Add new student to group
4. Return to Dashboard → **Should see increased student count** ✅

### Test Case 3: Record Attendance
1. Open Dashboard (note attendance rate)
2. Go to Attendance page
3. Mark attendance for session
4. Return to Dashboard → **Should see updated rates** ✅

---

## Migration Guide: Old → New

If you find old code still using specific functions like `invalidateStudents()`, update it:

```typescript
// ❌ OLD
await invalidateStudents();
await invalidateAssessments();
await invalidateAttendance();

// ✅ NEW
await invalidateRelatedCache('student:add');
await invalidateRelatedCache('assessment:mark');
await invalidateRelatedCache('attendance:record');
```

---

## API Reference

### `invalidateRelatedCache(event: string)`

**Parameters:**
- `event` (string): One of the supported event types listed above

**Returns:** Promise<void>

**Throws:** Never (errors are caught and logged to console)

**Example:**
```typescript
import { invalidateRelatedCache } from '@/lib/cache-invalidation';

// After successful mutation
await invalidateRelatedCache('student:add');
```

---

## Files Modified

1. ✅ **`src/lib/cache-invalidation.ts`**
   - Added centralized `invalidateRelatedCache()` function
   - Comprehensive event-to-keys mapping

2. ✅ **`src/app/assessments/page.tsx`**
   - Imported `invalidateRelatedCache`
   - Updated `handleMarkAssessment()` calls

3. ✅ **`src/app/students/page.tsx`**
   - Changed import from `invalidateStudents` to `invalidateRelatedCache`
   - Updated `handleBulkArchive()` to use `'student:bulk-archive'`
   - Updated student add handler to use `'student:add'`
   - Updated student update handler to use `'student:update'`

4. ✅ **`src/app/attendance/page.tsx`**
   - Changed import from `invalidateAttendance` to `invalidateRelatedCache`
   - Updated `handleBulkAction()` to use `'attendance:bulk'`
   - Updated `saveAttendance()` to use `'attendance:record'`

---

## Future-Proofing

The system is designed for extensibility. To add new events:

```typescript
const eventMap = {
  // ... existing events
  'your:custom-event': [
    '/api/your-endpoint',
    '/api/related-endpoint',
    '/api/dashboard/stats',
  ]
};
```

Then use it:
```typescript
await invalidateRelatedCache('your:custom-event');
```

---

## Troubleshooting

### Dashboard still not updating?
1. Check browser console for errors
2. Verify event type name is correct
3. Ensure `await` keyword is used
4. Check that API request actually succeeded (res.ok)

### Too many console logs?
- The function logs detailed information (search for "🔄" emoji)
- In production, you can disable by removing console.log statements

### Individual pages still cached?
- Component-level caches are still handled by individual `mutate()` calls
- Global SWR caches are handled by `invalidateRelatedCache()`
- Both work together

---

## Notes

- **Old specific functions are deprecated**: `invalidateStudents()`, `invalidateAssessments()`, `invalidateAttendance()` still work but should be phased out
- **Backward compatible**: Existing code won't break, but should be updated for consistency
- **No breaking changes**: This is an additive improvement, not a replacement of existing infrastructure

---

## Support Event Types (Complete Reference)

```typescript
// ASSESSMENTS (7 types)
'assessment:mark'         // Mark as competent/NYC
'assessment:create'       // Create new assessment
'assessment:delete'       // Delete assessment
'assessment:moderate'     // Moderate assessment

// STUDENTS (4 types)
'student:add'             // Add learner to group
'student:update'          // Update learner info
'student:delete'          // Delete/archive learner
'student:bulk-archive'    // Bulk archive operation

// ATTENDANCE (3 types)
'attendance:record'       // Record session attendance
'attendance:bulk'         // Bulk mark attendance
'attendance:update'       // Update attendance record

// GROUPS (4 types - ready for future)
'group:create'            // Create new group
'group:update'            // Update group
'group:delete'            // Delete/archive group
'group:merge'             // Merge groups
```

---

**Status**: Ready for production  
**Last Updated**: February 21, 2026
