# Phase 0 Issue #4: Consolidate 3 Progress Calculators - IMPLEMENTATION PLAN

## Overview
There are currently 3 duplicate implementations of student progress calculation logic scattered across different files. These must be consolidated into a single, unified function to reduce code duplication and ensure consistency.

## Duplicate Locations Identified

### 1. assessments/route.ts - `updateStudentProgress()` (and now `updateStudentProgressInTx()`)
**Location**: Lines 305-390 (original) + Lines 215-330 (transaction version)
**Purpose**: Updates student progress after assessment marking via PUT endpoint
**Functionality**:
- Upserts UnitStandardProgress
- Queries all competent/approved assessments
- Calculates total credits earned
- Updates Student record
- Updates all affected ModuleProgress records

### 2. assessments/[id]/route.ts - `updateStudentProgress()` (and now `updateStudentProgressInTx()`)  
**Location**: Lines 120-204 (original) + Lines 120-204 (transaction version)
**Purpose**: Updates student progress after individual assessment marking
**Functionality**: Exact duplicate of #1 above

### 3. assessments/bulk/route.ts - `updateStudentProgressAfterBulk()`
**Location**: Lines 66-150
**Purpose**: Updates student progress after bulk assessment marking
**Functionality**: Slightly different approach but same core logic:
- Upserts UnitStandardProgress
- Queries competent assessments
- Calculates credits
- Updates Student
- Updates ModuleProgress

### 4. lib/progress-calculator.ts - `calculateStudentProgress()`, `calculateModuleCredits()`, etc.
**Location**: Lines 97-178 (calculateStudentProgress), Lines 61-95 (calculateModuleCredits), etc.
**Purpose**: Official centralized progress calculation functions
**Status**: Already exists but NOT used by the endpoint helpers above

## The Problem

**Code Duplication**: ~400 lines of nearly identical logic scattered across 3+ files

**Consistency Risks**:
- Updates to calculation logic must happen in 3 places
- Bug fixes in one place don't automatically fix others
- Different code paths can lead to different results for same student

**Maintenance Burden**:
- Adding new field to progress tracking requires editing all 3 implementations
- Testing must verify behavior in all 3 endpoints
- Future refactoring is complex due to scattered logic

## Solution: Unified Implementation

### New Structure

```
src/lib/progress-calculator.ts
├── calculateStudentProgress() ← Use this internally
├── updateStudentProgressInTransaction(tx, studentId)  ← NEW unified transaction version
└── updateStudentProgress(studentId) ← Non-transaction wrapper

Endpoint files will import and use these functions
├── assessments/route.ts → Call updateStudentProgressInTransaction(tx, ...)
├── assessments/[id]/route.ts → Call updateStudentProgressInTransaction(tx, ...)
└── assessments/bulk/route.ts → Call updateStudentProgress(...)
```

### Implementation Steps

#### Step 1: Create Transaction-Aware Unified Function in progress-calculator.ts
```typescript
/**
 * Update student progress after an assessment operation
 * This is the SINGLE SOURCE OF TRUTH for progress updates
 * 
 * @param tx Prisma transaction client (for atomicity) OR main prisma instance
 * @param studentId Student to update
 * @param unitStandardId Optional - specific unit standard to verify completion
 */
export async function updateStudentProgressUnified(
  tx: any,  // Can be prisma.$transaction() client OR prisma
  studentId: string,
  unitStandardId?: string | null
): Promise<void> {
  // All progress calculation logic consolidated here
  // 1. Mark unit standard if completed
  // 2. Calculate total credits from all competent assessments
  // 3. Update Student.totalCreditsEarned and Student.progress
  // 4. Update all affected ModuleProgress records
}
```

#### Step 2: Create Non-Transaction Wrapper
```typescript
export async function updateStudentProgress(
  studentId: string,
  unitStandardId?: string | null
): Promise<void> {
  return updateStudentProgressUnified(prisma, studentId, unitStandardId);
}
```

#### Step 3: Update Endpoint Files
**assessments/route.ts**:
```typescript
// Remove local updateStudentProgress() implementation
// Import from progress-calculator instead
import { updateStudentProgressUnified } from '@/lib/progress-calculator';

// In transaction, use:
await updateStudentProgressUnified(tx, studentId, unitStandardId);
```

**assessments/[id]/route.ts**:
```typescript
// Same changes as above
import { updateStudentProgressUnified } from '@/lib/progress-calculator';
await updateStudentProgressUnified(tx, studentId, unitStandardId);
```

**assessments/bulk/route.ts**:
```typescript
// Remove locally duplicated logic
// Import from progress-calculator
import { updateStudentProgress } from '@/lib/progress-calculator';

// In non-transaction context, use:
await updateStudentProgress(studentId, unitStandardId);
```

#### Step 4: Remove Duplicate Implementations
- Delete updateStudentProgress() from assessments/route.ts
- Delete updateStudentProgress() from assessments/[id]/route.ts
- Delete updateStudentProgressAfterBulk() from assessments/bulk/route.ts
- Delete updateProgressFromAssessment() from progress-calculator.ts (consolidate into unified function)

## Code Consolidation Checklist

- [ ] Create `updateStudentProgressUnified(tx, studentId, unitStandardId)` in progress-calculator.ts
- [ ] Create wrapper `updateStudentProgress(studentId)` in progress-calculator.ts
- [ ] Update assessments/route.ts to import and use consolidated function
- [ ] Update assessments/[id]/route.ts to import and use consolidated function
- [ ] Update assessments/bulk/route.ts to import and use consolidated function
- [ ] Remove duplicate function definitions from endpoints
- [ ] Verify all 3 endpoints still work correctly
- [ ] Update bulk-pass/route.ts if it has duplicates
- [ ] Run TypeScript compiler - should be 0 errors
- [ ] Create test to verify all 3 endpoints update progress identically

## Benefits After Consolidation

✅ **Single Source of Truth**: One place to fix calculation bugs
✅ **Easier Maintenance**: Changes only need to happen once
✅ **Consistent Behavior**: All endpoints use same logic
✅ **Reduced Code**: ~400 duplicate lines removed
✅ **Type Safety**: TypeScript ensures all callsites pass correct params
✅ **Transaction Support**: Unified function handles both atomic + non-atomic contexts
✅ **Future-Proof**: Adding new progress fields requires only 1 edit

## Implementation Complexity

- **Estimated Time**: 45-60 minutes
- **Files Modified**: 4 (progress-calculator.ts, assessments/route.ts, [id]/route.ts, bulk/route.ts)
- **Lines Modified**: ~500 total (300 removed duplicates, 200 added unified function)
- **Complexity**: Medium
- **Risk**: Low (consolidation only, no functionality changes)

## Testing Strategy

1. **Unit Test**: Verify calculateStudentProgress() returns same result as updateStudentProgressUnified()
2. **Integration Test**: Mark assessment via each endpoint, verify Student record identical
3. **Atomic Test**: Run transaction version, verify rollback on error
4. **Bulk Test**: Bulk mark 10 assessments, verify progress updated once per student

## Phase 0 Progress (After This Issue)

| Issue | Status | Impact |
|-------|--------|--------|
| #1: Cascade Deletes | ✅ COMPLETE | Prevents orphaned records |
| #2: Read-Only Credits | ✅ COMPLETE | Prevents manual corruption |
| #3: Atomic Transactions | ✅ COMPLETE | Prevents desynchronization |
| #4: Progress Consolidation | 🔄 IN PROGRESS | Reduces code duplication |
| #5: Auto-Calc Status | ⏳ PENDING | Auto-compute status values |

## Success Metrics

- ✅ Zero duplicate implementations of progress calculation
- ✅ All 3 endpoints use identical calculation logic
- ✅ TypeScript compiler reports 0 errors
- ✅ All existing tests pass with new consolidated function
- ✅ Code coverage for progress functions remains ≥80%

## Implementation Notes

**Important**: The current state after Issue #3 has:
- 2 versions of `updateStudentProgress()` in each file (original + InTx)
- Need to consolidate ALL of this into progress-calculator.ts
- The InTx versions should stay in progress-calculator, not duplicated in endpoints

**Recommendation**: Create
1. `updateStudentProgressUnified(tx, studentId, unitStandardId?)` - unified for all scenarios
2. `updateStudentProgress(studentId, unitStandardId?)` - wrapper for non-transaction calls
3. Remove ALL endpoint-specific versions

This ensures transaction-aware code can be called from both atomic and non-atomic contexts.
