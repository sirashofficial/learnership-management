# Lessons

- Always read CLAUDE.md at the start of each session and before any significant work, then confirm in the response.

## Be Careful with Git Staging (Feb 26)
**Rule:** Never use `git add .` blindly. Always verify what you're staging before committing.

**Context:** Used `git add .` in commit 734f6c8 which re-added the entire `_organization` folder (200+ files) that was previously removed. This broke the Vercel build again.

**Why it happened:** Trying to move fast, didn't check staged changes before committing.

**Correct Pattern:**
1. Use `git status` to see what changed
2. Use `git add <specific-files>` for targeted staging
3. Or use `git add .` but then `git status` to review before committing
4. Check for unwanted files (especially directories like _organization, node_modules, build outputs)

**Prevention:** Before ANY commit, run `git status` and review the staged changes.

**Files:** .gitignore needs _organization/ entry to prevent accidental re-adding.

---

## STOP and Re-plan When Fixes Fail (Feb 26)
**Rule:** Never push multiple "fixes" without verifying they work. STOP and re-plan when a fix doesn't solve the problem.

**CLAUDE.md Violation:** Kept pushing patches (3 failed commits) instead of:
1. STOPPING after first failure
2. Finding ROOT CAUSE (module-level imports execute at build time)
3. Implementing ELEGANT solution (conditional serverless checks)
4. VERIFYING locally before pushing

**Correct Pattern:**
1. Identify root cause completely
2. Test fix locally with clean build
3. Only push after verification proves it works
4. Document lesson learned

**Anti-Pattern:** Trial-and-error pushing hoping something sticks.

**Files:** Backup routes - needed serverless detection before require() calls, not dynamic imports.

---

## Serverless Environment Constraints (Feb 26)
**Rule:** Node.js module imports (fs, path, child_process) at module scope fail in serverless builds (Vercel).

**Solution:** 
1. Detect environment: `const IS_SERVERLESS = process.env.VERCEL || process.env.AWS_LAMBDA`
2. Return early from handlers if serverless
3. Only `require()` modules inside handler functions after serverless check
4. Never at module/top level

**Example:**
```typescript
export async function GET() {
  if (IS_SERVERLESS) {
    return NextResponse.json({ error: 'Not supported' }, { status: 501 });
  }
  const fs = require('fs'); // Safe - only executes at runtime
  // ... use fs
}
```

**Files:** `src/app/api/admin/backup/**/*.ts` - File operations disabled in Vercel.

---

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
