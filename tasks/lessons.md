# Lessons

- Always read CLAUDE.md at the start of each session and before any significant work, then confirm in the response.

## Critical Data Integrity Rule (Feb 24)
**Rule:** A prompt must not mess with the data or make any changes that will mess up the data.

**Context:** Data synchronization and integrity is fundamental. Empty arrays as placeholders break UI detection logic. All data must be serialized completely when returned from APIs.

**Example:** Returning `unitStandardRollouts: []` broke the groups page display because the UI checks if rollout data exists before showing warnings.

**Action:** Every fix proposal includes a "data impact assessment" step.

---

## Next.js API Route Constraints (Feb 24)
**Rule:** API routes using `request.url` must declare `export const dynamic = 'force-dynamic'` or build will fail with static generation error.

**Solution:** Add at top of route file:
```typescript
export const dynamic = 'force-dynamic';
```

**File:** `src/app/api/data/groups/route.ts` - must opt out of static generation because it reads request URL.

---

## Documentation-First Data Protection (Feb 24)
**Rule:** When fixing data-related bugs, document data flows FIRST before implementation.

**Map:** 
1. What data flows where
2. How calculations work (server vs client)  
3. What the data source is for each feature

**Benefit:** Prevents repeat breakage when future fixes touch related code.

**Implemented:** UNIFIED_DATA_FLOW_ARCHITECTURE.md, DATA_DEPENDENCIES_SITE_MAP.md
