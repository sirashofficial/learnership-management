# Groups Page Testing - Quick Start Guide

## 5-Minute Setup & Run

### 1. Ensure Your App is Running

```bash
npm run dev
```

The app should be accessible at `http://localhost:3000`

### 2. Run Tests

Choose one:

```bash
# Run all tests
npm test

# Run only groups tests
npm run test:groups

# Run with visible browser (easiest for debugging)
npm run test:headed

# Run with interactive UI
npm run test:ui
```

## What Gets Tested?

### Basic Tests (`groups.spec.ts`)
✅ Page loads correctly  
✅ Search functionality works  
✅ View toggle (grid/list)  
✅ Group display and information  
✅ Action buttons (add, edit)  
✅ Status badges and metrics  
✅ Responsive design (mobile/tablet)  
✅ Accessibility compliance  
✅ Performance metrics  
✅ Error handling  

**50+ test cases** covering everyday user flows

### Advanced Tests (`groups-advanced.spec.ts`)
✅ Create new groups  
✅ Edit existing groups  
✅ Delete groups  
✅ Manage students  
✅ Upload functionality  
✅ Advanced search & filtering  
✅ Status tracking  
✅ Progress calculations  
✅ Attendance information  
✅ Keyboard navigation  

**25+ test cases** for complex workflows

## Key Features

### ✨ Smart Test Design
- Handles missing elements gracefully (no false failures)
- Works with your actual UI structure
- Auto-detects buttons, modals, and forms
- Doesn't require test IDs (uses `data-testid` when available, falls back to text/icons)

### 📊 Comprehensive Reporting
- HTML report with screenshots
- Detailed failure information
- Total test execution time
- Browser-specific results

### 🔄 CI/CD Ready
- Automatic retries on failure
- Parallel execution across browsers
- Works in headless mode
- Perfect for GitHub Actions, GitLab CI, etc.

### 🐛 Debugging Tools
- Slow motion mode
- Inspector/debugger integration
- Trace recording on failures
- Visual trace playback

## Common Tasks

### I want to see tests run in a browser
```bash
npm run test:headed
```

### I want to debug a failing test
```bash
npm run test:debug
```

### I want to see test results in HTML
```bash
npm test
npx playwright show-report
```

### I want to test my changes
```bash
npm run dev           # In terminal 1
npm run test:headed   # In terminal 2
```

### I want to run tests only once (no retries)
```bash
npx playwright test --retries=0
```

### I want tests to run test slower to see what's happening
```bash
npx playwright test --headed --workers=1 --timeout=120000
```

### I want to test only on Chrome
```bash
npx playwright test --project=chromium
```

## Understanding Test Output

When you run `npm test`, you'll see:

```
> learnership-management-system@1.0.0 test
> playwright test

Running 75 tests using 3 workers

  ✓ groups.spec.ts (50 tests)
    ✓ should load groups page successfully
    ✓ should display groups header with icon
    ✓ should have search functionality
    ...

  ✓ groups-advanced.spec.ts (25 tests)
    ✓ should open group creation modal
    ✓ should open group in edit drawer
    ...

27 passed (1.5s)
```

### If a test fails:
```
✗ groups.spec.ts (1 failure)
  ✗ should load groups page successfully
  
HTML report available at file:///path/to/playwright-report/index.html
```

View the report:
```bash
npx playwright show-report
```

## Troubleshooting

### "net::ERR_CONNECTION_REFUSED"
→ Make sure `npm run dev` is running

### "Timeout waiting for locator"
→ The test couldn't find an element. Check:
- Is the app rendering correctly?
- Does the UI match what tests expect?
- Try `npm run test:headed` to see what's happening

### "Tests are flaky (sometimes pass, sometimes fail)"
→ This is usually timing-related. The tests have built-in retries. If it persists:
- Check your internet connection
- Ensure your API is responding
- Try: `npm run test:headed` to see delays

### "I want to skip a test"
Add `.skip` to the test:
```typescript
test.skip('flaky test', async ({ page }) => {
  // ...
});
```

## What If I Need to Add More Tests?

1. Create a new file: `e2e/groups-custom.spec.ts`
2. Copy the basic structure:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Your Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/groups');
  });

  test('your test name', async ({ page }) => {
    // Test code here
    expect(true).toBeTruthy();
  });
});
```

3. Run it: `npm test`

## Next Steps

- ✅ Run the tests once: `npm run test:headed`
- ✅ View the HTML report: `npx playwright show-report`
- ✅ Fix any issues in the UI that tests catch
- ✅ Add tests for new features
- ✅ Integrate into CI/CD pipeline

## Documentation

For more advanced usage, see: [e2e/README.md](./README.md)

---

**Happy Testing! 🎭**
