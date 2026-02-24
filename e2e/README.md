# Groups Page Test Suite

## Overview

This test suite provides comprehensive end-to-end testing for the Groups page using Playwright. It covers:

- **Page Rendering**: Verifies the page loads correctly with all UI elements
- **Navigation**: Tests view mode toggles (grid/list) and navigation flows
- **Search & Filtering**: Validates search functionality and data filtering
- **User Interactions**: Tests button clicks, modal operations, and expandable sections
- **Data Display**: Verifies group information, status, attendance, and progress display
- **Accessibility**: Ensures proper heading hierarchy and button labels
- **Responsive Design**: Tests mobile and tablet viewports
- **Performance**: Validates page load times
- **Error Handling**: Tests graceful degradation when APIs fail

## Setup

### Prerequisites

- Node.js ≥ 18.0.0
- The application running locally on `http://localhost:3000`

### Installation

Playwright has already been installed via npm. If you need to install it manually:

```bash
npm install --save-dev @playwright/test
```

### Install Browsers

Before running tests, install the browsers:

```bash
npx playwright install
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Groups Page Tests Only

```bash
npm run test:groups
```

### Run Tests in Headed Mode (See Browser)

```bash
npm run test:headed
```

### Run Tests in Debug Mode

```bash
npm run test:debug
```

### Run Tests in UI Mode (Interactive)

```bash
npm run test:ui
```

### Run Specific Test

```bash
npx playwright test e2e/groups.spec.ts -g "should load groups page successfully"
```

### Run Tests in Specific Browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Categories

### 1. Page Rendering & Structure
- `should load groups page successfully`
- `should display groups header with icon`
- `should have search functionality`

### 2. View Mode Toggle
- `should have grid/list view toggle buttons`
- `should toggle between grid and list view`

### 3. Group Display & Content
- `should display group cards or rows`
- `should display group information on cards`

### 4. Search Functionality
- `should filter groups by search query`

### 5. Action Buttons
- `should have add group button`
- `should open modal when add group button is clicked`

### 6. Group Interaction
- `should have edit buttons on group cards`
- `should open group details when clicking on a group`

### 7. Group Status & Information
- `should display group status badges`
- `should show student count for groups`
- `should display attendance rate information`
- `should show progress information`

### 8. Sorting & Filtering
- `should have sorting options`

### 9. Expandable Sections
- `should have expandable company/section headers`

### 10. Modal & Drawer Operations
- `should close modal when clicking outside or close button`

### 11. Data Consistency
- `should maintain data consistency after filters`

### 12. Accessibility
- `should have proper heading hierarchy`
- `should have buttons with accessible labels`

### 13. Responsive Design
- `should be responsive on mobile viewport`
- `should be responsive on tablet viewport`

### 14. Error Handling
- `should handle network errors gracefully`

### 15. Performance
- `should load group data within reasonable time`

## Configuration

The `playwright.config.ts` file contains:

- **testDir**: `./e2e` - Location of test files
- **baseURL**: `http://localhost:3000` - Application base URL
- **retries**: 2 on CI, 0 locally - Failed test retry policy
- **timeout**: 30s per test - Individual test timeout
- **trace**: `on-first-retry` - Record traces on first retry
- **screenshot**: `only-on-failure` - Capture screenshots on failures
- **reporter**: `html` - HTML report generation

### Browsers Tested

- Chromium
- Firefox
- WebKit (Safari)

## Output & Reports

### HTML Report

After tests complete, view the HTML report:

```bash
npx playwright show-report
```

### Screenshots

Failed tests automatically capture screenshots saved in:

```
test-results/
```

### Trace Files

Traces are recorded on first retry and can be viewed with:

```bash
npx playwright show-trace test-results/<trace-file>.zip
```

## Debugging

### View Inspector

Run tests with the Playwright Inspector:

```bash
npx playwright test --debug
```

### Slow Motion

Slow down tests to see what's happening:

```bash
npx playwright test --headed --workers=1 --timeout=60000
```

### Page Screenshots

Manually capture screenshots during tests or in the browser for visual inspection.

## Best Practices

1. **Wait for Elements**: Use proper waits with `.catch(() => false)` for non-critical elements
2. **Timeouts**: Set reasonable timeouts for your network speed
3. **Parallelization**: Tests run in parallel by default; keep them independent
4. **Selectors**: Use data-testid, accessible names, and visible text when possible
5. **Error Handling**: Most tests handle missing elements gracefully to avoid flakiness

## Extending Tests

### Add New Test

```typescript
test('should do something specific', async ({ page }) => {
  await page.goto('/groups');
  // Add your test steps
  expect(true).toBeTruthy();
});
```

### Test Group-Specific Actions

Create a new file `e2e/groups-advanced.spec.ts` for:

- Group creation flow
- Student enrollment
- Group deletion
- Permission testing
- Data validation

### Data Setup

For tests requiring specific data:

1. Use the existing seed data
2. Create test fixtures with `test.beforeEach` or `test.beforeAll`
3. Mock API responses using `page.route()`

## Troubleshooting

### Tests Fail with "page.goto: net::ERR_CONNECTION_REFUSED"

**Solution**: Ensure the application is running:

```bash
npm run dev
```

### Tests Timeout

**Solution**: Increase timeout in `playwright.config.ts`:

```typescript
timeout: 60000, // 60 seconds
```

Or per test:

```typescript
test('slow test', async ({ page }) => {
  // test code
}, { timeout: 60000 });
```

### Element Not Found

**Solution**: Check the selector with Playwright Inspector:

```bash
npx playwright test --debug
```

### Flaky Tests

**Solution**: Use more robust selectors and wait conditions:

```typescript
// Avoid
await page.click('div');

// Better
await page.click('[data-testid="group-card"]');
await expect(element).toBeVisible();
```

## CI/CD Integration

To run tests in CI, add to your workflow:

```yaml
- name: Run Playwright tests
  run: npm test
```

The config automatically:
- Disables parallel workers in CI
- Enables auto-retries
- Sets CI environment variable

## Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
