# Current Mutation Code: Before & After Reference

**Quick lookup for all mutations that were fixed**

---

## 1. ASSESSMENTS: Mark Assessment

### Before
```typescript
// src/app/assessments/page.tsx - handleMarkAssessment()
const handleMarkAssessment = async (unitStandardId: string, studentId: string, type: 'FORMATIVE' | 'SUMMATIVE' | 'WORKPLACE', result: string) => {
  try {
    const existing = scopedAssessments.find(a =>
      a.student.id === studentId &&
      a.unitStandard?.id === unitStandardId &&
      a.type === type
    );

    if (existing) {
      const res = await fetch(`/api/assessments/${existing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          result: result,
          assessedDate: result !== 'PENDING' ? new Date().toISOString() : null
        })
      });

      if (res.ok) {
        fetchAssessments();  // ❌ Only invalidates assessments list
      }
    } else {
      if (result === 'PENDING') return;

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          studentId,
          unitStandardId,
          type,
          method: 'PRACTICAL',
          result,
          dueDate,
          assessedDate: new Date().toISOString()
        })
      });

      if (res.ok) {
        fetchAssessments();  // ❌ Only invalidates assessments list
      }
    }
  } catch (error) {
    console.error('Error marking assessment:', error);
  }
};
```

**Problems:**
- Dashboard stats not updated
- Student progress not refreshed
- Group progress not reflected
- Alerts not triggered

### After
```typescript
// src/app/assessments/page.tsx - handleMarkAssessment()
import { invalidateRelatedCache } from '@/lib/cache-invalidation';

const handleMarkAssessment = async (unitStandardId: string, studentId: string, type: 'FORMATIVE' | 'SUMMATIVE' | 'WORKPLACE', result: string) => {
  try {
    const existing = scopedAssessments.find(a =>
      a.student.id === studentId &&
      a.unitStandard?.id === unitStandardId &&
      a.type === type
    );

    if (existing) {
      const res = await fetch(`/api/assessments/${existing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          result: result,
          assessedDate: result !== 'PENDING' ? new Date().toISOString() : null
        })
      });

      if (res.ok) {
        await invalidateRelatedCache('assessment:mark');  // ✅ Cascading invalidation
        fetchAssessments();
      }
    } else {
      if (result === 'PENDING') return;

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          studentId,
          unitStandardId,
          type,
          method: 'PRACTICAL',
          result,
          dueDate,
          assessedDate: new Date().toISOString()
        })
      });

      if (res.ok) {
        await invalidateRelatedCache('assessment:mark');  // ✅ Cascading invalidation
        fetchAssessments();
      }
    }
  } catch (error) {
    console.error('Error marking assessment:', error);
  }
};
```

**Fixed by invalidating:**
- `/api/assessments` ← Assessments list
- `/api/students` ← Student progress
- `/api/groups` ← Group stats
- `/api/groups/progress` ← Group progress
- `/api/dashboard/stats` ← Dashboard panels
- `/api/dashboard/alerts` ← Alert status
- `/api/dashboard/recent-activity` ← Activity feed

---

## 2. STUDENTS: Add Learner

### Before
```typescript
// src/app/students/page.tsx - AddStudentModal onAdd handler
{showAddModal && (
  <AddStudentModal
    isOpen={showAddModal}
    onClose={() => setShowAddModal(false)}
    onAdd={async (student) => {
      try {
        const response = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(student),
        });

        console.log('📡 Response status:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Success:', result);
          alert('Student added successfully!');
          setShowAddModal(false);
          mutate();  // ❌ Only refreshes student list
          router.refresh();
        } else {
          const error = await response.json();
          console.error('❌ API Error:', error);
          alert(`Failed to add student: ${error.error || error.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('❌ Error adding student:', error);
        alert('Failed to add student. Please try again.');
      }
    }}
  />
)}
```

**Problems:**
- Dashboard student count not updated
- Group metrics not refreshed
- Group progress not reflected
- Dashboard alerts not recalculated

### After
```typescript
// src/app/students/page.tsx - AddStudentModal onAdd handler
import { invalidateRelatedCache } from '@/lib/cache-invalidation';

{showAddModal && (
  <AddStudentModal
    isOpen={showAddModal}
    onClose={() => setShowAddModal(false)}
    onAdd={async (student) => {
      try {
        const response = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(student),
        });

        console.log('📡 Response status:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Success:', result);
          alert('Student added successfully!');
          setShowAddModal(false);
          mutate();
          await invalidateRelatedCache('student:add');  // ✅ Cascading invalidation
          router.refresh();
        } else {
          const error = await response.json();
          console.error('❌ API Error:', error);
          alert(`Failed to add student: ${error.error || error.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('❌ Error adding student:', error);
        alert('Failed to add student. Please try again.');
      }
    }}
  />
)}
```

**Fixed by invalidating:**
- `/api/students` ← Students list
- `/api/groups` ← Group members
- `/api/groups/progress` ← Group metrics
- `/api/dashboard/stats` ← Dashboard stats
- `/api/dashboard/alerts` ← Dashboard alerts
- `/api/dashboard/recent-activity` ← Activity feed

---

## 3. STUDENTS: Update Learner

### Before
```typescript
// src/app/students/page.tsx - StudentDetailsModal onSave handler
{showDetailsModal && selectedStudent && (
  <StudentDetailsModal
    isOpen={showDetailsModal}
    onClose={() => {
      setShowDetailsModal(false);
      setSelectedStudent(null);
    }}
    student={selectedStudent}
    onSave={async (updated) => {
      try {
        const response = await fetch(`/api/students/${selectedStudent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        });

        if (response.ok) {
          alert('Student updated successfully!');
          setShowDetailsModal(false);
          mutate();  // ❌ Only refreshes student list
          router.refresh();
        } else {
          const error = await response.json();
          alert(`Failed to update student: ${error.error}`);
        }
      } catch (error) {
        console.error('Error updating student:', error);
        alert('Failed to update student. Please try again.');
      }
    }}
  />
)}
```

### After
```typescript
// src/app/students/page.tsx - StudentDetailsModal onSave handler
import { invalidateRelatedCache } from '@/lib/cache-invalidation';

{showDetailsModal && selectedStudent && (
  <StudentDetailsModal
    isOpen={showDetailsModal}
    onClose={() => {
      setShowDetailsModal(false);
      setSelectedStudent(null);
    }}
    student={selectedStudent}
    onSave={async (updated) => {
      try {
        const response = await fetch(`/api/students/${selectedStudent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        });

        if (response.ok) {
          alert('Student updated successfully!');
          setShowDetailsModal(false);
          mutate();
          await invalidateRelatedCache('student:update');  // ✅ Cascading invalidation
          router.refresh();
        } else {
          const error = await response.json();
          alert(`Failed to update student: ${error.error}`);
        }
      } catch (error) {
        console.error('Error updating student:', error);
        alert('Failed to update student. Please try again.');
      }
    }}
  />
)}
```

**Fixed by invalidating:**
- `/api/students` ← Students list
- `/api/groups/progress` ← Group metrics
- `/api/dashboard/stats` ← Dashboard stats

---

## 4. STUDENTS: Bulk Archive

### Before
```typescript
// src/app/students/page.tsx - handleBulkArchive()
const handleBulkArchive = async () => {
  if (selectedStudents.length === 0) return;

  if (!confirm(`Are you sure you want to archive ${selectedStudents.length} student(s)?`)) {
    return;
  }

  setIsArchiving(true);
  try {
    const archivePromises = selectedStudents.map(studentId =>
      fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ARCHIVED' }),
      })
    );

    await Promise.all(archivePromises);

    mutate();
    await invalidateStudents();  // ❌ Old specific function
    setSelectedStudents([]);
  } catch (error) {
    console.error('Failed to archive students:', error);
    alert('Failed to archive some students. Please try again.');
  } finally {
    setIsArchiving(false);
  }
};
```

### After
```typescript
// src/app/students/page.tsx - handleBulkArchive()
import { invalidateRelatedCache } from '@/lib/cache-invalidation';

const handleBulkArchive = async () => {
  if (selectedStudents.length === 0) return;

  if (!confirm(`Are you sure you want to archive ${selectedStudents.length} student(s)?`)) {
    return;
  }

  setIsArchiving(true);
  try {
    const archivePromises = selectedStudents.map(studentId =>
      fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ARCHIVED' }),
      })
    );

    await Promise.all(archivePromises);

    mutate();
    await invalidateRelatedCache('student:bulk-archive');  // ✅ Unified dispatch
    setSelectedStudents([]);
  } catch (error) {
    console.error('Failed to archive students:', error);
    alert('Failed to archive some students. Please try again.');
  } finally {
    setIsArchiving(false);
  }
};
```

**Fixed by invalidating:**
- `/api/students` ← Students list
- `/api/groups` ← Group members
- `/api/groups/progress` ← Group metrics
- `/api/dashboard/stats` ← Dashboard stats
- `/api/dashboard/alerts` ← Dashboard alerts

---

## 5. ATTENDANCE: Record Attendance

### Before
```typescript
// src/app/attendance/page.tsx - saveAttendance()
const saveAttendance = async () => {
  try {
    setSavingAttendance(true);
    
    // ... build payload ...
    
    const response = await fetch('/api/attendance/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();
    
    // ... handle response ...
    
    setLastSaved(new Date());

    // Invalidate attendance caches to sync data across views
    await invalidateAttendance();  // ❌ Old specific function
    
    // ... show messages ...
  } catch (error: unknown) {
    console.error('❌ Error saving attendance:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    alert(`Failed to save attendance: ${errorMessage}`);
  } finally {
    setSavingAttendance(false);
  }
};
```

### After
```typescript
// src/app/attendance/page.tsx - saveAttendance()
import { invalidateRelatedCache } from '@/lib/cache-invalidation';

const saveAttendance = async () => {
  try {
    setSavingAttendance(true);
    
    // ... build payload ...
    
    const response = await fetch('/api/attendance/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();
    
    // ... handle response ...
    
    setLastSaved(new Date());

    // Invalidate attendance caches to sync data across views
    await invalidateRelatedCache('attendance:record');  // ✅ Unified dispatch
    
    // ... show messages ...
  } catch (error: unknown) {
    console.error('❌ Error saving attendance:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    alert(`Failed to save attendance: ${errorMessage}`);
  } finally {
    setSavingAttendance(false);
  }
};
```

**Fixed by invalidating:**
- `/api/attendance` ← Attendance records
- `/api/groups` ← Group attendance rates
- `/api/groups/progress` ← Group metrics
- `/api/dashboard/stats` ← Dashboard attendance rates
- `/api/dashboard/alerts` ← Attendance alerts
- `/api/dashboard/recent-activity` ← Activity feed

---

## 6. ATTENDANCE: Bulk Mark Attendance

### Before
```typescript
// src/app/attendance/page.tsx - handleBulkAction()
const handleBulkAction = async (action: string) => {
  if (selectedForBulk.size === 0) return;

  const studentIds = Array.from(selectedForBulk);

  try {
    setSavingAttendance(true);
    const response = await fetch('/api/attendance/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentIds,
        status: action,
        date: selectedDate,
        sessionId: 'MANUAL',
        markedBy: 'System',
      }),
    });

    const data = await response.json();
    if (data.success) {
      const updates: { [key: string]: string } = {};
      studentIds.forEach(studentId => {
        updates[getAttendanceKey(studentId)] = action;
      });
      setAttendanceData(prev => ({ ...prev, ...updates }));
      setSelectedForBulk(new Set());
      setBulkAction(null);
      
      // Invalidate attendance caches to sync data across views
      await invalidateAttendance();  // ❌ Old specific function
    }
  } catch (error) {
    console.error('Error bulk marking attendance:', error);
  } finally {
    setSavingAttendance(false);
  }
};
```

### After
```typescript
// src/app/attendance/page.tsx - handleBulkAction()
import { invalidateRelatedCache } from '@/lib/cache-invalidation';

const handleBulkAction = async (action: string) => {
  if (selectedForBulk.size === 0) return;

  const studentIds = Array.from(selectedForBulk);

  try {
    setSavingAttendance(true);
    const response = await fetch('/api/attendance/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentIds,
        status: action,
        date: selectedDate,
        sessionId: 'MANUAL',
        markedBy: 'System',
      }),
    });

    const data = await response.json();
    if (data.success) {
      const updates: { [key: string]: string } = {};
      studentIds.forEach(studentId => {
        updates[getAttendanceKey(studentId)] = action;
      });
      setAttendanceData(prev => ({ ...prev, ...updates }));
      setSelectedForBulk(new Set());
      setBulkAction(null);
      
      // Invalidate attendance caches to sync data across views
      await invalidateRelatedCache('attendance:bulk');  // ✅ Unified dispatch
    }
  } catch (error) {
    console.error('Error bulk marking attendance:', error);
  } finally {
    setSavingAttendance(false);
  }
};
```

**Fixed by invalidating:**
- `/api/attendance` ← Attendance records
- `/api/groups` ← Group attendance rates
- `/api/groups/progress` ← Group metrics
- `/api/dashboard/stats` ← Dashboard attendance rates
- `/api/dashboard/alerts` ← Attendance alerts
- `/api/dashboard/recent-activity` ← Activity feed

---

## Summary of Changes

| Component | Event Type | Files | Changes |
|-----------|-----------|-------|---------|
| Assessments | `assessment:mark` | assessments/page.tsx | 2 locations in `handleMarkAssessment()` |
| Students | `student:add` | students/page.tsx | 1 location in AddStudentModal |
| Students | `student:update` | students/page.tsx | 1 location in StudentDetailsModal |
| Students | `student:bulk-archive` | students/page.tsx | 1 location in `handleBulkArchive()` |
| Attendance | `attendance:record` | attendance/page.tsx | 1 location in `saveAttendance()` |
| Attendance | `attendance:bulk` | attendance/page.tsx | 1 location in `handleBulkAction()` |

**Total**: 6 mutation handlers updated across 3 pages

---

## How to Apply This Pattern to New Features

When building new features with mutations:

1. **Identify the entity** (assessment, student, attendance, group, etc.)
2. **Identify the action** (create, update, delete, mark, etc.)
3. **Call appropriately**:

```typescript
// Your new mutation
const handleMyMutation = async (data) => {
  const response = await fetch('/api/my-endpoint', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  if (response.ok) {
    // ✅ Call the unified function
    await invalidateRelatedCache('entity:action');
    // Local refresh if needed
    myLocalMutate();
  }
}
```

That's it! The system handles the rest.

---

**Last Updated**: February 21, 2026
