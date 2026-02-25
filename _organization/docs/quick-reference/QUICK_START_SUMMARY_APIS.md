# Quick Start Guide: Using Summary APIs

## For Developers

### Using Summary Hooks in Your Components

#### 1. Dashboard Metrics (Ultra-lightweight)
```typescript
import { useDashboardLite } from '@/hooks/useSummaryAPIs';

function MyDashboard() {
  const { summary, isLoading } = useDashboardLite();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <p>Students: {summary?.totalStudents}</p>
      <p>Groups: {summary?.totalGroups}</p>
      <p>Assessments: {summary?.totalAssessments}</p>
      <p>Completed: {summary?.completedAssessments}</p>
      <p>Average Progress: {summary?.averageProgress}%</p>
    </div>
  );
}
```

#### 2. Groups List (Fast & Lightweight)
```typescript
import { useGroupsSummary } from '@/hooks/useSummaryAPIs';

function GroupsList() {
  const { groups, isLoading } = useGroupsSummary();
  
  return (
    <div>
      {groups.map(group => (
        <div key={group.id}>
          <h3>{group.name}</h3>
          <p>Students: {group.studentCount}</p>
          <p>Progress: {group.averageProgress}%</p>
          <p>Completed Assessments: {group.assessmentsCompleted}</p>
        </div>
      ))}
    </div>
  );
}
```

#### 3. Students List (Fast & Lightweight)
```typescript
import { useStudentsSummary } from '@/hooks/useSummaryAPIs';

function StudentsList() {
  const groupId = localStorage.getItem('selectedGroupId');
  const { students, count, isLoading } = useStudentsSummary(groupId);
  
  return (
    <div>
      <h2>Students ({count})</h2>
      {students.map(student => (
        <div key={student.id}>
          <p>{student.name}</p>
          <p>Progress: {student.progress}%</p>
          <p>Completed: {student.assessmentsCompleted}</p>
          <p>Pending: {student.assessmentsPending}</p>
        </div>
      ))}
    </div>
  );
}
```

#### 4. Assessment Details (On-Demand with Pagination)
```typescript
import { useAssessmentDetails } from '@/hooks/useSummaryAPIs';
import { useState } from 'react';

function AssessmentViewer({ studentId }) {
  const [page, setPage] = useState(1);
  const { assessments, pagination, isLoading } = useAssessmentDetails(studentId, undefined, page, 50);
  
  return (
    <div>
      <h2>Assessments (Page {page} of {pagination.totalPages})</h2>
      
      <table>
        <thead>
          <tr>
            <th>Unit Standard</th>
            <th>Type</th>
            <th>Result</th>
            <th>Due Date</th>
          </tr>
        </thead>
        <tbody>
          {assessments.map(a => (
            <tr key={a.id}>
              <td>{a.unitStandard.name}</td>
              <td>{a.type}</td>
              <td>{a.result || 'Pending'}</td>
              <td>{new Date(a.dueDate).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
          Previous
        </button>
        <span>Page {page} of {pagination.totalPages}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasMore}>
          Next
        </button>
      </div>
    </div>
  );
}
```

---

## Testing the APIs Manually

### Using Browser DevTools Console

```javascript
// Test Dashboard API
const result = await fetch('/api/dashboard/summary/lite');
const data = await result.json();
console.log(data);
// Output: { totalStudents, totalGroups, totalAssessments, ... }

// Test Groups API
const result2 = await fetch('/api/groups/summary');
const data2 = await result2.json();
console.log(data2.groups);
// Output: [{ id, name, studentCount, averageProgress, ... }]

// Test Students API
const result3 = await fetch('/api/students/summary');
const data3 = await result3.json();
console.log(data3.students);
// Output: [{ id, name, progress, assessmentsCompleted, ... }]

// Test Assessment Details with pagination
const result4 = await fetch('/api/assessments/detail?page=1&pageSize=50');
const data4 = await result4.json();
console.log(data4);
// Output: { assessments: [...], pagination: { page, total, hasMore, ... } }
```

---

## Cache Invalidation (Auto-Update)

The system automatically updates cached data when you:

### Mark an assessment COMPETENT
```typescript
// Backend updates assessment → invalidateAssessments() → caches cleared
// Frontend automatically refetches all summary APIs
// User sees updated numbers without manual refresh
```

### Add/Remove Students
```typescript
// Backend adds student → invalidateStudents() → summary caches cleared
// Frontend automatically refetches student/group/dashboard summaries
// All related components update automatically
```

### Modify Groups
```typescript
// Backend updates group → invalidateGroups() → summary caches cleared
// Frontend automatically refetches group/dashboard summaries
// Numbers stay in sync across all pages
```

---

## Performance Comparison

### Before (Old API)
```
Network: /api/groups
  - Status: 200
  - Time: 3,142ms
  - Size: 847 KB
  
Network: /api/assessments/detail
  - Status: 200
  - Time: 2,891ms
  - Size: 634 KB

Total page load: 3-4 seconds
```

### After (New Summary API)
```
Network: /api/groups/summary
  - Status: 200
  - Time: 487ms
  - Size: 2.3 KB

Network: /api/assessments/detail?page=1
  - Status: 200
  - Time: 198ms
  - Size: 8.4 KB

Total page load: <1 second
```

---

## API Response Formats

### GET /api/dashboard/summary/lite
```json
{
  "totalStudents": 46,
  "totalGroups": 9,
  "totalAssessments": 3315,
  "completedAssessments": 109,
  "pendingAssessments": 3206,
  "averageProgress": 4,
  "atRiskStudents": 0,
  "attendanceRate": 0,
  "timestamp": "2026-02-24T07:21:12.087Z"
}
```

### GET /api/groups/summary
```json
{
  "groups": [
    {
      "id": "group1",
      "name": "Group Name",
      "studentCount": 10,
      "averageProgress": 50,
      "assessmentsCompleted": 100,
      "attendanceRate": 80
    }
  ],
  "timestamp": "2026-02-24T07:21:12.087Z"
}
```

### GET /api/students/summary?groupId=g1
```json
{
  "students": [
    {
      "id": "student1",
      "name": "John Doe",
      "progress": 60,
      "assessmentsCompleted": 40,
      "assessmentsPending": 30,
      "attendanceRate": 85,
      "status": "ACTIVE",
      "email": "john@example.com"
    }
  ],
  "count": 46,
  "groupId": "g1",
  "timestamp": "2026-02-24T07:21:12.087Z"
}
```

### GET /api/assessments/detail?studentId=s1&page=1&pageSize=50
```json
{
  "assessments": [
    {
      "id": "a1",
      "type": "FORMATIVE",
      "method": "KNOWLEDGE",
      "result": "COMPETENT",
      "dueDate": "2026-02-20T00:00:00.000Z",
      "student": {
        "id": "s1",
        "firstName": "John",
        "lastName": "Doe",
        "groupId": "g1"
      },
      "unitStandard": {
        "id": "us1",
        "name": "Numeracy 1",
        "credits": 16
      }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "total": 72,
    "totalPages": 2,
    "hasMore": true
  },
  "timestamp": "2026-02-24T07:21:12.087Z"
}
```

---

## Hook Configuration

All hooks use optimized configuration:

```typescript
// Lightweight API refresh rates:
useDashboardLite()       // Refresh every 30 seconds
useGroupsSummary()       // Refresh every 60 seconds
useStudentsSummary()     // Refresh every 60 seconds
useAssessmentDetails()   // No auto-refresh (user-triggered)

// Cache invalidation:
invalidateGroups()       // Called when groups change
invalidateStudents()     // Called when students change
invalidateAssessments()  // Called when assessments change
```

---

## Common Patterns

### Filtering Students by Group
```typescript
const groupId = 'group123';
const { students } = useStudentsSummary(groupId);
// Returns only students in that group
```

### Paginating Assessments
```typescript
const [page, setPage] = useState(1);
const { assessments, pagination } = useAssessmentDetails(
  studentId,
  undefined,
  page,
  50
);
// Returns 50 assessments per page, 72 total
```

### Real-time Updates
```typescript
// Mark assessment complete in your component
await fetch('/api/assessments/1', { method: 'PATCH', ... });
// System automatically invalidates caches
// All hooks refetch data
// Component re-renders with new data
// No manual refresh needed!
```

---

## Troubleshooting

### Hook returns empty data
**Problem:** API not responding  
**Solution:** Check browser Network tab, verify API is running

### Data not updating after changes
**Problem:** Cache not invalidating  
**Solution:** Verify invalidation called in your mutation handler

### Slow API response
**Problem:** Summary API takes > 500ms  
**Solution:** Check database indexes, consider Redis caching

---

## Best Practices

1. **Use summary hooks for lists** - Fast, lightweight, perfect for tables
2. **Load details on demand** - Only fetch full assessment details when needed
3. **Rely on auto-invalidation** - Don't manually refresh, system handles it
4. **Monitor performance** - Use DevTools to track API times
5. **Plan pagination** - Use 50-100 items per page for large datasets

---

## What's Next?

- [ ] Integrate hooks into your components
- [ ] Test performance improvements in DevTools
- [ ] Monitor API response times
- [ ] Consider adding database indexes if needed
- [ ] Plan Phase 2 optimizations (Redis, GraphQL, etc.)

---

## Support

For questions or issues with the summary APIs:
1. Check the comprehensive testing guide: `PERFORMANCE_OPTIMIZATION_SUMMARY.md`
2. Review API implementations: `src/app/api/*/summary/route.ts`
3. Check hook code: `src/hooks/useSummaryAPIs.ts`
4. Run test script: `node scripts/test-summary-apis.js`
