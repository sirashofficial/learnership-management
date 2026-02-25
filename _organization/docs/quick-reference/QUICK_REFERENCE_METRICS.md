# Unified Metrics Quick Reference Guide

## 🎯 Quick Start

### Using the Unified Metrics Engine

```typescript
import {
  calculateGroupMetrics,
  calculateStudentProgress,
  calculateAttendanceRate,
  calculateMultipleGroupMetrics
} from '@/lib/calculations/unifiedMetrics';

// Group metrics
const metrics = await calculateGroupMetrics('group-id');
console.log(metrics.avgProgressPercent);  // 50 (for example)

// Student progress
const progress = await calculateStudentProgress('student-id');
console.log(progress.status);  // 'ACTIVE', 'AT_RISK', or 'COMPLETED'

// Attendance
const attendance = await calculateAttendanceRate('group-id', 'GROUP');
console.log(attendance.attendanceRate);  // 85 (percentage)

// Multiple groups (efficient)
const metricsMap = await calculateMultipleGroupMetrics(['group1', 'group2']);
```

---

## 📊 What Gets Calculated

### Group Metrics
```typescript
interface UnifiedGroupMetrics {
  avgCreditsPerStudent: number;      // Average per student
  avgProgressPercent: number;        // 0-100%
  totalCreditsEarned: number;        // Sum of all students
  totalUniqueUnitsPassed: number;    // Total unique units
  totalCreditsRequired: number;      // Usually 140
  studentCount: number;              // Active students
  atRiskCount: number;               // Below group max module
}
```

### Student Progress
```typescript
interface StudentProgressMetrics {
  studentId: string;
  totalCreditsEarned: number;
  progress: number;                  // 0-100%
  status: 'ACTIVE' | 'AT_RISK' | 'COMPLETED';
  currentModuleNumber: number;
  competentUnits: number;
}
```

### Attendance Metrics
```typescript
interface AttendanceMetrics {
  entityId: string;
  entityType: 'GROUP' | 'STUDENT';
  attendanceRate: number;            // 0-100%
  presentCount: number;
  lateCount: number;
  absentCount: number;
  totalRecords: number;
}
```

---

## 🔍 Key Points

### Calculation Rules
1. **Only COMPETENT assessments count** toward credits
2. **Each unit counted once per student** (no duplicates)
3. **140 credits required** (SSETA standard, configurable)
4. **All three assessment types needed** (SUMMATIVE, FORMATIVE, WORKPLACE)
5. **Current month only** for attendance

### What Excludes from Calculations
- ❌ WITHDRAWN students
- ❌ NON_COMPETENT assessments
- ❌ Duplicate units per student
- ❌ Attendance from past months
- ❌ Incomplete modules (missing assessment types)

### What Happens with Missing Data
- Empty group (0 students) → All metrics = 0
- No assessments → Credits = 0, Progress = 0%
- No attendance records → Attendance = 0%

---

## 📍 Where It's Used

### API Endpoints
- ✅ `/api/dashboard/summary` - Uses calculateGroupMetrics
- ✅ `/api/data/groups` - Uses calculateGroupMetrics + calculateAttendanceRate
- ✅ `/api/data/groups/{id}` - Uses calculateGroupMetrics

### Frontend Pages
- ✅ Dashboard - Calls `/api/dashboard/summary`
- ✅ Groups page - Calls `/api/data/groups`
- ✅ Student detail - Calls calculateStudentProgress

### Utilities
- ✅ `src/lib/group-metrics.ts` - Delegates to unified engine
- ✅ Tests - `src/lib/calculations/__tests__/unifiedMetrics.test.ts`

---

## ✔️ Validation

Check if metrics are valid:
```typescript
import { validateGroupMetrics } from '@/lib/calculations/unifiedMetrics';

const metrics = await calculateGroupMetrics(groupId);
const validation = validateGroupMetrics(metrics);

if (!validation.valid) {
  console.error('Data issues:', validation.errors);
}
```

---

## 🔄 Common Patterns

### Get metrics for all groups
```typescript
const groups = await prisma.group.findMany();
const groupIds = groups.map(g => g.id);
const metricsMap = await calculateMultipleGroupMetrics(groupIds);

for (const [groupId, metrics] of metricsMap) {
  console.log(`${groupId}: ${metrics.avgProgressPercent}%`);
}
```

### Calculate student status
```typescript
const progress = await calculateStudentProgress(studentId);
if (progress.status === 'AT_RISK') {
  // Alert facilitator
}
```

### Check group attendance
```typescript
const attendance = await calculateAttendanceRate(groupId, 'GROUP');
if (attendance.attendanceRate < 80) {
  // Alert about low attendance
}
```

### Compare and validate
```typescript
const metrics = await calculateGroupMetrics(groupId);
const validation = validateGroupMetrics(metrics);

if (!validation.valid) {
  for (const error of validation.errors) {
    console.error(error);
  }
}
```

---

## 📈 Understanding the Numbers

### Progress Percentage
```
Progress = (Credits Earned / 140) * 100

Examples:
• 0 credits   → 0% (not started)
• 35 credits  → 25% (at-risk threshold)
• 70 credits  → 50% (halfway)
• 105 credits → 75% (almost done)
• 140 credits → 100% (completed)
```

### Student Status
```
COMPLETED:  progress >= 100%
ACTIVE:     25% <= progress < 100%
AT_RISK:    progress < 25%
```

### Attendance Rate
```
For Groups: Average of each student's rate
For Students: (PRESENT + LATE) / total records

Examples:
• 0/10       → 0%
• 5/10       → 50%
• 8/10       → 80%
• 10/10      → 100%
```

### At-Risk Count
Students below the group's highest achieved module.

Example:
```
Student A: Completed Module 3 (group max)
Student B: Completed Module 2
→ Student B is at-risk (below group max)
```

---

## 🧪 Testing

Run tests:
```bash
npm test -- unifiedMetrics
```

Test coverage includes:
- ✅ Empty groups
- ✅ Missing assessments
- ✅ Duplicate units
- ✅ Partial attendance
- ✅ Gating logic
- ✅ SSETA compliance
- ✅ Status determination
- ✅ Data validation

---

## 🚀 Migration from Old Code

### Old way:
```typescript
// Using Student.progress fields (potentially out-of-sync)
const avg = await prisma.student.aggregate({
  _avg: { totalCreditsEarned: true }
});
```

### New way:
```typescript
// Using unified engine (always in sync with actual assessments)
const metrics = await calculateGroupMetrics(groupId);
console.log(metrics.avgCreditsPerStudent);
```

---

## 🔗 Related Links

- **Full Documentation**: [UNIFIED_METRICS_DOCUMENTATION.md](UNIFIED_METRICS_DOCUMENTATION.md)
- **Implementation Summary**: [UNIFIED_METRICS_SUMMARY.md](UNIFIED_METRICS_SUMMARY.md)
- **Source Code**: [src/lib/calculations/unifiedMetrics.ts](src/lib/calculations/unifiedMetrics.ts)
- **Tests**: [src/lib/calculations/__tests__/unifiedMetrics.test.ts](src/lib/calculations/__tests__/unifiedMetrics.test.ts)
- **Verification**: [scripts/verify-unified-metrics.ts](scripts/verify-unified-metrics.ts)

---

## ❓ FAQ

### Q: Which should I use - calculateGroupMetrics or Student.progress?
**A**: Always use `calculateGroupMetrics()`. It's safe, tested, and keeps data consistent.

### Q: What if a student has multiple assessments for same unit?
**A**: Only one copy of the credits count. Duplicates are automatically deduplicated.

### Q: Why is my group showing 0 credits?
**A**: Possible reasons:
1. No students (count = 0)
2. No COMPETENT assessments
3. No unit standards rolled out
4. All students WITHDRAWN

### Q: How often is this calculated?
**A**: On-demand, every time you call the function. No caching (by design).

### Q: Can I use custom credit requirements?
**A**: Yes! Pass second parameter:
```typescript
const metrics = await calculateGroupMetrics(groupId, 200);
```

### Q: Is attendance always current month?
**A**: Yes, by design. Historical months not included.

---

## 💾 Important Notes

- 🔒 **Thread-safe**: All calculations use Prisma transactions
- 🚀 **Performant**: Batch operations reduce N+1 queries
- 📝 **Well-documented**: Every function has comments explaining logic
- ✅ **Well-tested**: 450+ lines of comprehensive tests
- 🔄 **Consistent**: Identical logic across all endpoints

---

## Version History

**v1.0** - February 24, 2026
- Initial unified metrics engine
- 3 core functions + batch operations
- Comprehensive testing and documentation
- Resolves Dashboard vs Groups inconsistency
