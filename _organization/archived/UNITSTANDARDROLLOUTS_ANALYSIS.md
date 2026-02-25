# unitStandardRollouts Data Flow Analysis

## Question 1: Complete include block in `/api/groups/route.ts`

```typescript
include: {
  students: {
    select: {
      id: true,
      studentId: true,
      firstName: true,
      lastName: true,
      progress: true,
      status: true,
    },
    orderBy: { lastName: 'asc' },
  },
  _count: {
    select: { students: true, sessions: true },
  },
  rolloutPlan: true,
},
```

**⚠️ CRITICAL FINDING:** `unitStandardRollouts` is **NOT** in this include block.

---

## Question 2: TypeScript type for group in GroupCardProps

The interface is defined in `src/contexts/GroupsContext.tsx`:

```typescript
export interface Group {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  summativeDate?: string;
  assessingDate?: string;
  fisaDate?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PLANNING' | 'COMPLETED' | 'ON_HOLD';
  students?: Array<any>;
  location?: string;
  address?: string;
  contactName?: string;
  contactPhone?: string;
  email?: string;
  phone?: string;
  industry?: string;
  coordinator?: string;
  notes?: string;
  createdAt?: string;
  _count?: {
    students: number;
    sessions: number;
  };
  actualProgress?: {
    avgCreditsPerStudent: number;
    avgProgressPercent: number;
    totalCreditsEarned: number;
    totalUniqueUnitsPassed: number;
    totalCreditsRequired: number;
  };
}
```

---

## Question 3: Is unitStandardRollouts listed in that type?

**❌ NO** - it's completely missing from the `Group` interface.

---

## Question 4: Where does the transformation happen?

Location: `src/contexts/GroupsContext.tsx` lines 60-80

```typescript
const groups = (unifiedResponse?.data?.groups || []).map((unifiedGroup: any) => ({
  id: unifiedGroup.id,
  name: unifiedGroup.name,
  startDate: unifiedGroup.startDate || '',
  endDate: unifiedGroup.endDate,
  location: unifiedGroup.location,
  createdAt: unifiedGroup.createdAt,
  status: unifiedGroup.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
  rolloutPlan: unifiedGroup.rolloutPlan,
  actualProgress: {
    avgCreditsPerStudent: unifiedGroup.metrics.avgCreditsPerStudent,
    avgProgressPercent: unifiedGroup.metrics.avgProgressPercent,
    totalCreditsEarned: unifiedGroup.metrics.totalCreditsEarned,
    totalUniqueUnitsPassed: unifiedGroup.metrics.totalUniqueUnitsPassed,
    totalCreditsRequired: unifiedGroup.totalCreditsRequired,
    currentAssessmentModule: unifiedGroup.currentAssessmentModule || 0,
  },
  _count: {
    students: unifiedGroup.metrics.studentCount,
    sessions: 0,
  },
}));
```

---

## Summary: Why unitStandardRollouts is undefined

| Stage | Status |
|-------|--------|
| **API Query** (`/api/data/groups`) | ❌ NOT included in Prisma select |
| **API Response** | ❌ Never fetched, so not in response |
| **GroupsContext Mapping** | ❌ NOT mapped even if it existed |
| **Component Props** | ❌ undefined - filtered out at two levels |

**Root Cause**: The `/api/data/groups` endpoint never queries for `unitStandardRollouts`, and the context transformation doesn't include it.

**Solution**: Add `unitStandardRollouts` to:
1. The Prisma query in `/api/data/groups/route.ts`
2. The Group interface in `GroupsContext.tsx`
3. The mapping transformation in `GroupsContext.tsx`
