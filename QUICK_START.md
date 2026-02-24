# Quick Start: Cross-Page Cache Invalidation

**For developers: Get up and running in 2 minutes**

---

## TL;DR

You now have a unified `invalidateRelatedCache()` function that handles all cross-page SWR cache invalidation.

```typescript
import { invalidateRelatedCache } from '@/lib/cache-invalidation';

// After any successful mutation:
await invalidateRelatedCache('event:type');
```

That's it! The function automatically invalidates all related cache keys.

---

## Supported Events

### Copy-Paste These

```typescript
// Assessments
await invalidateRelatedCache('assessment:mark');
await invalidateRelatedCache('assessment:create');
await invalidateRelatedCache('assessment:delete');
await invalidateRelatedCache('assessment:moderate');

// Students
await invalidateRelatedCache('student:add');
await invalidateRelatedCache('student:update');
await invalidateRelatedCache('student:delete');
await invalidateRelatedCache('student:bulk-archive');

// Attendance
await invalidateRelatedCache('attendance:record');
await invalidateRelatedCache('attendance:bulk');
await invalidateRelatedCache('attendance:update');

// Groups
await invalidateRelatedCache('group:create');
await invalidateRelatedCache('group:update');
await invalidateRelatedCache('group:delete');
await invalidateRelatedCache('group:merge');
```

---

## Usage Pattern

```typescript
// 1. Identify what you're doing (use event name from above)
// 2. Make your API call
// 3. On success, call invalidateRelatedCache

const handleMyMutation = async (data) => {
  const response = await fetch('/api/my-endpoint', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (response.ok) {
    // Step 1: Import it (add to top)
    // import { invalidateRelatedCache } from '@/lib/cache-invalidation';
    
    // Step 2: Call it with your event type
    await invalidateRelatedCache('student:add');
    
    // Step 3: Local refresh if needed
    localMutate();
  }
}
```

---

## What Gets Invalidated?

### When you call `invalidateRelatedCache('assessment:mark')`:
- ✅ `/api/assessments` — Assess list updates
- ✅ `/api/students` — Student progress refreshes
- ✅ `/api/groups` — Group stats update
- ✅ `/api/groups/progress` — Group metrics update
- ✅ `/api/dashboard/stats` — Dashboard panels update
- ✅ `/api/dashboard/alerts` — Alerts recalculate
- ✅ `/api/dashboard/recent-activity` — Activity feed updates

### When you call `invalidateRelatedCache('student:add')`:
- ✅ `/api/students` — Student list updates
- ✅ `/api/groups` — Group members update
- ✅ `/api/groups/progress` — Group metrics update
- ✅ `/api/dashboard/stats` — Dashboard count updates
- ✅ `/api/dashboard/alerts` — Alerts recalculate
- ✅ `/api/dashboard/recent-activity` — Activity feed updates

See [CROSS_PAGE_CACHE_INVALIDATION_FIX.md](./CROSS_PAGE_CACHE_INVALIDATION_FIX.md) for all events.

---

## Real Code Examples

### Example 1: Mark Assessment (Assessments Page)
```typescript
import { invalidateRelatedCache } from '@/lib/cache-invalidation';

const handleMarkAssessment = async (unitStandardId, studentId, type, result) => {
  const res = await fetch(`/api/assessments/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ result })
  });

  if (res.ok) {
    await invalidateRelatedCache('assessment:mark'); // ✅
    fetchAssessments();
  }
}
```

### Example 2: Add Student (Students Page)
```typescript
import { invalidateRelatedCache } from '@/lib/cache-invalidation';

if (response.ok) {
  alert('Student added!');
  await invalidateRelatedCache('student:add'); // ✅
  mutate();
}
```

### Example 3: Record Attendance (Attendance Page)
```typescript
import { invalidateRelatedCache } from '@/lib/cache-invalidation';

const saveAttendance = async () => {
  const response = await fetch('/api/attendance/save', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  if (response.ok) {
    await invalidateRelatedCache('attendance:record'); // ✅
  }
}
```

---

## Testing

### Quick Test (30 seconds):
1. Open Dashboard
2. Open Assessments (in another tab)
3. Mark an assessment
4. **Dashboard should update within 2-3 seconds** ✅

### Console Check:
Look for:
```
🔄 Invalidating cache for event: assessment:mark
✅ Cache invalidated for event: assessment:mark (7 keys)
```

See [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) for comprehensive tests.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Dashboard doesn't update | Check console for error, verify event name is correct |
| Typo in event name | You'll see: `⚠️ Unknown event type: ...` in console |
| Forgot to await | Add `await` before function call |
| API call didn't work | Function only runs if `response.ok` is true |

---

## Common Mistakes

❌ **DON'T**: Only update local state
```typescript
if (res.ok) {
  setLocalData(newData); // ❌ Other pages won't know about this
}
```

✅ **DO**: Always call invalidateRelatedCache
```typescript
if (res.ok) {
  setLocalData(newData);
  await invalidateRelatedCache('assessment:mark'); // ✅
}
```

---

❌ **DON'T**: Forget to await
```typescript
invalidateRelatedCache('student:add'); // ❌ Might not complete
```

✅ **DO**: Always await it
```typescript
await invalidateRelatedCache('student:add'); // ✅
```

---

❌ **DON'T**: Call without knowing the event type
```typescript
await invalidateRelatedCache('something'); // ❌ Unknown event
```

✅ **DO**: Use one from the supported list
```typescript
await invalidateRelatedCache('student:add'); // ✅
```

---

## Next Time You Mutate Data

1. Identify the event type from the list above
2. Find the right place in your code (after `response.ok`)
3. Add one line: `await invalidateRelatedCache('event:type');`
4. Done! Cross-page sync is automatic.

---

## For Reference Documents

- **Full explanation**: [CROSS_PAGE_CACHE_INVALIDATION_FIX.md](./CROSS_PAGE_CACHE_INVALIDATION_FIX.md)
- **Before/After code**: [MUTATION_CODE_REFERENCE.md](./MUTATION_CODE_REFERENCE.md)
- **Detailed testing**: [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)
- **Implementation summary**: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

---

**Ready to use!** Just import and call. 🚀
