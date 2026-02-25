# Test Failure Analysis & Next Steps

**Date:** February 18, 2026  
**Test Run:** Phase 1 Re-execution (Fresh Build)  
**Status:** 🔴 Same failures persisted

---

## Test Results

### Overall Statistics
- **Total Tests:** 78 tests (3 browsers × 26 test cases)
- **Passed:** 66 tests ✅  
- **Failed:** 12 tests ❌
- **Pass Rate:** 84.6%

### Failing Tests (12 total)
1. ❌ Grid/list view toggle buttons (Chrome, Firefox, WebKit) = 3 failures
2. ❌ Add group button (Chrome, Firefox, WebKit) = 3 failures  
3. ❌ Proper heading hierarchy (Chrome, Firefox, WebKit) = 3 failures
4. ❌ Buttons with accessible labels (Chrome, Firefox) = 2 failures  
5. ❌ Buttons with accessible labels (WebKit) = 1 failure

**Total = 12 failures (same as before freshbuild)**

---

## Root Cause Analysis

### Problem Discovered

The tests are failing because they're using **different selector strategies** than what I implemented:

**What Tests ARE Looking For:**
- `data-icon="grid"` attribute on Grid3x3 component
- `data-icon="list"` attribute on List component  
- `data-icon="plus"` attribute on Plus component
- Lucide icon data attributes

**What I Added:**
- `data-testid="grid-view-toggle"` on parent `<button>`
- `data-testid="list-view-toggle"` on parent `<button>`
- `aria-label` on buttons

**Example - Grid Toggle Test:**
```typescript
// Test is looking for THIS:
const gridButton = page.locator('button').filter({ 
  has: page.locator('[data-icon="grid"]')  // ← Looking for data-icon on icon
}).first();

// But my implementation has:
<button data-testid="grid-view-toggle">  // ← data-testid on button
  <Grid3x3 className="w-5 h-5" />  // ← Icon has NO data-icon attribute
</button>
```

### Why Test Is Failing

1. Test queries: `button:has([data-icon="grid"])`
2. `Grid3x3` component doesn't have `data-icon` attribute
3. Buttons don't get found
4. Test fails with "Received: false"

### Secondary Issue

**Heading Test Failure:**
The heading test also fails even though I added `<h1>`:
```typescript
// From line 260 in groups.spec.ts
const headings = page.locator('h1, h2, h3');
const headingCount = await headings.count();
expect(headingCount).toBeGreaterThan(0);  // ← Fails: count = 0
```

This suggests the `<h1>` is either:
1. Not being rendered
2. Inside a modal or hidden container
3. Server not actually serving my changes

---

## Solution Approach

### Option 1: Add data-icon Attributes to Icon Components (BETTER)

**Modify the icon component rendering to include data-icon:**

```tsx
// Before:
<Grid3x3 className="w-5 h-5" />

// After:
<Grid3x3 className="w-5 h-5" data-icon="grid" />
```

**Changes Needed:**
- Line 988: Add `data-icon="grid"` to Grid3x3  
- Line 994: Add `data-icon="list"` to List
- Line 910: Add `data-icon="plus"` to Plus (create button)

**Affected Tests Fixed:**
- ✅ Grid/list toggle buttons test (3 failures)
- ✅ Add group button test (3 failures)

### Option 2: Update Tests to Use data-testid (NOT RECOMMENDED)

Modify test selectors to match my data-testid strategy:
```typescript
const gridButton = page.locator('[data-testid="grid-view-toggle"]');
```

**Problem:** Requires changing 12+ test cases and doesn't follow existing test patterns

### Option 3: Fix Heading Position

Ensure `<h1>` is at correct DOM level (not nested in container that hides it):

**Current:**
```tsx
return (
  <main className="space-y-6">
    <div className="mb-4">  // ← Is this element visible?
      <h1>...
```

**Check:** Is parent div hidden or has display:none?

---

## Implementation Plan

### Step 1: Add data-icon Attributes ⏳
Add 3 lines to `src/app/groups/page.tsx`:

**Location 1: Grid Toggle Button (Line 988)**
```tsx
<Grid3x3 className="w-5 h-5" data-icon="grid" />
```

**Location 2: List Toggle Button (Line 994)**
```tsx
<List className="w-5 h-5" data-icon="list" />
```

**Location 3: Create Group Button (Line 910)**
Find the Plus icon and add:
```tsx
<Plus className="..." data-icon="plus" />
```

### Step 2: Verify Heading Hierarchy

Check if `<h1>` is properly rendered and not hidden:
```bash
curl http://localhost:3000/groups | grep -i "<h1"
```

### Step 3: Re-run Tests

```bash
npm run test:groups
```

**Expected Result:** 80+ tests passing (95%+)

---

## Code Changes Required

### File: [src/app/groups/page.tsx](src/app/groups/page.tsx)

**Change 1: Grid Icon - Line 988**
```diff
- <Grid3x3 className="w-5 h-5" />
+ <Grid3x3 className="w-5 h-5" data-icon="grid" />
```

**Change 2: List Icon - Line 994**
```diff
- <List className="w-5 h-5" />
+ <List className="w-5 h-5" data-icon="list" />
```

**Change 3: Plus Icon - Need to find line**
```diff
- <Plus className="..." />
+ <Plus className="..." data-icon="plus" />
```

---

## Why This Wasn't Working Before

### The Test Strategy

Tests are coded to find icon-based buttons using Lucide library attributes:
- Grid icon has `data-icon="grid"` (expected)
- List icon has `data-icon="list"` (expected)
- Plus icon has `data-icon="plus"` (expected)

### The Gap

The Lucide icons don't automatically add `data-icon` attributes. The attributes must be:
1. **Passed as props** to the icon components
2. **Hard-coded by developer** in the source JSX
3. **NOT auto-generated** by the icon library

### Why I Missed This

My initial approach focused on:
- Adding `data-testid` (useful for test selectors)
- Adding `aria-label` (good for accessibility)
- But NOT adding `data-icon` (which tests specifically expect)

The test code reveals what was originally intended:
```typescript
// Test code shows expected selectors:
const gridButton = page.locator('button').filter({ 
  has: page.locator('[data-icon="grid"]')  // ← This is the contract
});
```

---

## Quick Reference: Lucide Icons in Code

```tsx
import { Grid3x3, List, Plus, X, Pencil } from 'lucide-react';

// Usage without data-icon (FAILS tests):
<Grid3x3 className="w-5 h-5" />

// Usage with data-icon (PASSES tests):
<Grid3x3 className="w-5 h-5" data-icon="grid" />
```

## Files to Modify

- [src/app/groups/page.tsx](src/app/groups/page.tsx) - 3 icon changes
- **No test file changes needed**
- **No TypeScript errors expected**

---

## Next Actions

1. **Locate all icon components** in groups.spec.ts to find which ones need data-icon
2. **Add data-icon props** to Grid3x3, List, Plus components
3. **Verify heading** is rendering properly with `<h1>`
4. **Rebuild dev server** (should happen automatically)
5. **Re-run tests** to verify 95%+ pass rate

---

## Impact Assessment

**Fixes 6 Test Failures Immediately:**
- Grid/list toggle buttons (3 failures)
- Add group button (3 failures)

**Remaining Issues (6 failures):**
- Heading hierarchy (3 failures)
- Buttons with accessible labels (3 failures)

These may need additional investigation after data-icon fixes.

