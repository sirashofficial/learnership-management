# Groups Page - Business Logic Issues Deep Dive

## 🔴 CRITICAL BUSINESS LOGIC PROBLEMS

---

### 1. **"On Track" Status is Meaningless** ⚠️

**Current Logic (Line 386):**
```typescript
const getPerformanceStatus = (projectedPercent: number, actualPercent: number, hasPlan: boolean): PlanStatus => {
  if (!hasPlan) return 'NO_PLAN';
  if (actualPercent >= projectedPercent) return 'ON_TRACK';  // ← PROBLEM HERE
  if (projectedPercent - actualPercent <= 10) return 'BEHIND';
  return 'AT_RISK';
};
```

**Issues:**
- ❌ Only compares two percentages (projected vs actual)
- ❌ Ignores the **timeline completely** - no consideration of dates
- ❌ A group with 80% progress on day 1 is "ON_TRACK" but should be "AHEAD"
- ❌ A group with 0% progress on the last day is "AT_RISK" when it should be "FAILED"
- ❌ No concept of "expected progress based on elapsed time"

**Why It's Wrong:**
- If a group has 6 months to complete modules and is showing 30% progress after 1 month, they're "ON_TRACK"
- But if showing 30% progress after 5.5 months, they're "AT_RISK"
- **Same percentage, different contexts = different meanings!**

**Example:**
```
Group Start: Jan 1, 2026
Group End: Dec 31, 2026 (12 months)
Today: March 1, 2026 (2 months elapsed = 16.7% of timeline)

Scenario A: 20% actual progress
- Current logic: 20% >= expected → "ON_TRACK" ✅
- Reality: 20% progress with 16.7% time = AHEAD of schedule ✅

Scenario B: Same group on June 1, 2026 (5 months elapsed = 41.7% of timeline)  
- Current logic: 20% >= expected → "ON_TRACK" ✅
- Reality: 20% progress with 41.7% time = DANGEROUSLY BEHIND ❌
```

**Fix Required:**
```typescript
const getPerformanceStatus = (
  plan: any, 
  actualPercent: number, 
  hasPlan: boolean
): PlanStatus => {
  if (!hasPlan) return 'NO_PLAN';
  
  // Calculate expected progress based on elapsed time
  const startDate = getPlanStartDate(plan);
  const endDate = getPlanEndDate(plan);
  
  if (!startDate || !endDate) return 'NO_PLAN';
  
  const now = new Date();
  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsedTime = now.getTime() - startDate.getTime();
  const expectedProgress = (elapsedTime / totalDuration) * 100;
  
  // Consider progress buffer (±15%)
  const progressDifference = actualPercent - expectedProgress;
  
  if (progressDifference >= 15) return 'ON_TRACK';      // Ahead of schedule
  if (progressDifference >= -5) return 'ON_TRACK';      // Slightly behind but okay
  if (progressDifference >= -20) return 'BEHIND';       // Concerning lag
  return 'AT_RISK';                                     // Critical delay
};
```

---

### 2. **Projected vs Actual Not Properly Used**

**Current Calculation (Lines 518-539):**
```typescript
const creditProgress = getCreditCompletion(storedPlan);  // Projected
const actualProgress = actualProgressByGroup[group.id];   // Actual progress

const actualPercent = actualProgress?.avgPercent || 0;   // ← Only using actual
const status = getPerformanceStatus(
  creditProgress.percentage,  // Projected 
  actualPercent,              // Actual
  Boolean(storedPlan)
);
```

**Issues:**
- ❌ `creditProgress` (projected based on timeline) is calculated but NOT displayed
- ❌ Only `actualPercent` is used for status, ignoring projection completely
- ❌ Users never see the **gap between projected vs actual progress**
- ❌ Card only shows one number, hiding critical information

**What's Missing:**
- No visual comparison of projected vs actual
- No indicator of "we're 25% behind schedule"
- No progress bar showing expected vs actual
- No alerts for significant gaps

**Fix:**
Display both metrics clearly:
```
Group: YEHA 2026
─────────────────────────
Projected Progress: 45% (based on timeline)
Actual Progress:    28% (based on completed units)
Status:             BEHIND (gap: -17%)
```

---

### 3. **Timeline Dates Are Ignored** ⚠️

**Current Issues:**
- ✅ Groups have `startDate` and `endDate`
- ✅ Rollout plans have module start/end dates
- ✅ Unit standards have specific assessment dates
- ❌ None of this affects the status calculation!
- ❌ No warning when approaching deadlines
- ❌ No way to see what should be completed "this week"
- ❌ No tracking of "overdue" units

**Missing Timeline Logic:**
```typescript
// Current: Only calculates percentage
const getPlanStatus = (plan: any): PlanStatus => {
  // ... doesn't use dates at all
}

// Should be: Date-aware
const getPlanStatus = (plan: any): PlanStatus => {
  const now = new Date();
  const units = getUnitStandards(plan);
  
  // Check what SHOULD be completed by now
  for (const unit of units) {
    if (unit.assessing < now && !isUnitCompleted(unit)) {
      return 'AT_RISK';  // Assessment date passed, unit not done!
    }
  }
  
  // Check upcoming deadlines
  const nextUnit = units.find(u => u.start > now);
  if (nextUnit && isWithinWeek(nextUnit.start)) {
    return 'BEHIND';  // Next module starts soon
  }
  
  return 'ON_TRACK';
};
```

---

### 4. **Attendance Percentage Calculation is Flawed**

**Current Logic (Line 101 of attendance/stats/route.ts):**
```typescript
const attendanceRate = total > 0 ? ((present + late) / total) * 100 : 0;
```

**Issues:**
- ❌ Divides by **total number of attendance records**, not number of students
- ❌ If a group has 46 students and 10 sessions, that's 460 attendance records
- ❌ Missing 1 student from 1 session = only 0.2% impact
- ❌ Doesn't account for legitimate absences (excused)
- ❌ "LATE" is counted as full "PRESENT" - same weight

**Example Problem:**
```
Scenario: Group of 46 students, 10 sessions (460 total possible records)

Good case: 440 present, 20 late (no absences)
- Attendance = (440 + 20) / 460 = 99.1%

Almost same case: 440 present, 10 late, 10 absent
- Attendance = (440 + 10) / 460 = 97.8%
- Only 2.2% drop but half the group was missing!
```

**What It Should Calculate:**
```typescript
// Per-student attendance rate
const studentAttendanceRates = new Map();
for (const studentId of studentIds) {
  const studentRecords = records.filter(r => r.studentId === studentId);
  const rate = studentRecords.length > 0 
    ? ((present + late) / studentRecords.length) * 100
    : 0;
  studentAttendanceRates.set(studentId, rate);
}

// Group-wide average
const avgAttendance = Array.from(studentAttendanceRates.values())
  .reduce((a, b) => a + b, 0) / studentIds.length;

// Or minimum attendance to catch at-risk students
const minAttendance = Math.min(...studentAttendanceRates.values());
```

---

### 5. **No Detail Tracking of Progress**

**What We're NOT tracking:**
- ❌ Which specific units are overdue?
- ❌ Which student assessments haven't been attempted?
- ❌ How many students are below 50% progress?
- ❌ What's the completion rate PER MODULE?
- ❌ Are some students way ahead/behind others?
- ❌ Which units are taking longer than expected?

**Current Flow:**
```
API returns:
{
  avgCreditsPerStudent: 25
  avgProgressPercent: 45
  totalCreditsEarned: 1150
  totalUniqueUnitsPassed: 15
}

Problem: Only shows AVERAGES
- Group could be bimodal: 23 students at 70%, 23 students at 20%
- Average = 45% but half are failing!
```

**What Should Be Returned:**
```typescript
{
  // Overall metrics
  avgProgress: 45,
  
  // Distribution metrics
  minProgress: 12,           // Worst student
  maxProgress: 85,           // Best student
  medianProgress: 42,        // Middle student
  stdDeviation: 18,          // Variation
  
  // Compliance metrics
  studentsAbove80: 5,        // On track
  studentsBetween50_80: 20,  // Behind but passing
  studentsBelow50: 21,       // At risk
  
  // Module breakdown
  modules: [
    { name: 'Numeracy', completed: 38, inProgress: 8 },
    { name: 'Communications', completed: 25, inProgress: 21 },
    // ...
  ],
  
  // Unit breakdown
  units: [
    { code: 'NQF123', dueDate: '2026-05-01', completed: 30, overdue: 16 },
    // ...
  ]
}
```

---

### 6. **Delete Group Functionality** ⚠️

**Current Implementation (Lines 636-659):**
```typescript
const handleArchiveGroup = async (group: any) => {
  const confirmMessage = `Are you sure you want to delete "${displayName}"?...`;
  if (!confirm(confirmMessage)) { return; }
  await deleteGroup(group.id);
};
```

**Issues:**
- ❌ Uses browser `confirm()` dialog (can't style, limited UX)
- ❌ Hard deletes group - no recovery option
- ❌ Students lose group association immediately
- ❌ No audit trail of deletion
- ❌ No backup/archive functionality
- ❌ No option to "deactivate" instead of delete
- ❌ Confirmation doesn't show completion status

**What Should Happen:**
```
1. Warn user with proper modal showing:
   - Group name and dates
   - Number of students (46)
   - Completion status (42%)
   - Any overdue units
   - Impact on students

2. Offer options:
   ☐ Delete group (hard delete, no recovery)
   ☐ Archive group (soft delete, searchable, can restore)
   ☐ Close/Complete group (mark as finished)
   ☐ Pause group (temporary deactivation)

3. If deleting with active students:
   - Ask where to reassign students
   - Or unassign them explicitly
   - Show which students will be affected

4. After deletion:
   - Show undo button (5 minute window)
   - Log deletion with timestamp and user
```

---

### 7. **No Deadline Warnings**

**Missing Alerts:**
- ❌ "Module 3 assessment due in 2 days, 8 students haven't started"
- ❌ "Group is 3 weeks behind schedule"
- ❌ "5 students have 0% progress and are at risk"
- ❌ "Attendance dropped below 75% threshold"

**Should Show:**
```
⚠️ ALERTS
├─ 4 days until Module 2 assessment
├─ 16 students (35%) not yet passing
├─ Attendance: 68% (below 75% threshold)
└─ 8 units overdue
```

---

## 📊 SUMMARY OF MISSING FEATURES

| Feature | Current | Should Be |
|---------|---------|-----------|
| Status calculation | Percentage comparison | Timeline + percentage aware |
| Attendance rate | Records / total | Per-student average |
| Progress display | Average only | Min/Max/Median/Distribution |
| Deadline tracking | None | Alert on every overdue unit |
| Unit completion | No detail | Per-module breakdown |
| Risk identification | Simple thresholds | Detailed risk scoring |
| Delete UX | Browser confirm | Proper modal with options |
| Data granularity | Group level | Student + Unit level |
| Timeline usage | Ignored | Central to all calculations |

---

## ✅ RECOMMENDED FIXES (Priority Order)

### P0 (Critical - Affects Decisions)
1. Fix performance status calculation (timeline-aware)
2. Display both projected vs actual progress
3. Add per-student progress distribution
4. Fix attendance percentage formula

### P1 (Important - Better Visibility)
5. Add module-level completion breakdown
6. Add unit status tracking (overdue/upcoming)
7. Improve delete group UX with proper modal
8. Add deadline warnings

### P2 (Nice to Have)
9. Add student-level alerts
10. Add progress trend analysis
11. Add custom thresholds/risk scoring
12. Add audit trail for deletions

