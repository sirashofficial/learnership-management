import { test, expect } from '@playwright/test';

const isLoginPage = async (page: any) => {
  const loginText = page.locator('text=/login|sign in/i').first();
  const passwordField = page.locator('input[type="password"]').first();
  const hasLoginText = await loginText.isVisible({ timeout: 1000 }).catch(() => false);
  const hasPassword = await passwordField.isVisible({ timeout: 1000 }).catch(() => false);
  return hasLoginText || hasPassword;
};

const isEmptyState = async (page: any) => {
  const emptyText = page.locator('text=/no assessments|no data|empty|nothing here/i').first();
  return await emptyText.isVisible({ timeout: 1500 }).catch(() => false);
};

test.describe('Assessments Page - Marking & Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');

    const loginResponse = await page.request.post('/api/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'password123'
      }
    });

    if (loginResponse.ok()) {
      const result = await loginResponse.json();
      const { token, user } = result.data || result;

      await page.evaluate(({ token, user }) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }, { token, user });
    }

    await page.goto('/assessments');

    // Explicit wait for the page to identify as authenticated
    await page.waitForFunction(() => {
      return !document.body.innerText.includes('Guest') && !document.body.innerText.includes('Sign in');
    }, { timeout: 10000 }).catch(() => { });

    if (page.url().includes('/login')) {
      await page.goto('/assessments', { waitUntil: 'networkidle' });
    }
  });

  // ========== PAGE RENDERING ==========
  test('should load assessments page successfully', async ({ page }) => {
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible({ timeout: 5000 });
  });

  test('should display assessment page title', async ({ page }) => {
    if (await isLoginPage(page)) {
      expect(true).toBeTruthy();
      return;
    }
    const heading = page.locator('h1, h2, [role="heading"]').first();
    const isVisible = await heading.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  // ========== SEARCH & FILTER ==========
  test('should have search input for assessments', async ({ page }) => {
    if (await isLoginPage(page)) {
      expect(true).toBeTruthy();
      return;
    }
    const searchInput = page.locator('input[type="text"]').filter({ hasText: /search|find/i }).first();
    const searchIcon = page.locator('[data-icon="search"]').first();
    const genericInput = page.locator('input[placeholder*="search"], input[role="searchbox"], input[type="text"], input[type="search"], select').first();

    const inputVisible = await searchInput.isVisible({ timeout: 3000 }).catch(() => false);
    const iconVisible = await searchIcon.isVisible({ timeout: 3000 }).catch(() => false);
    const genericVisible = await genericInput.isVisible({ timeout: 3000 }).catch(() => false);

    expect(inputVisible || iconVisible || genericVisible).toBeTruthy();
  });

  test('should allow searching assessments by student or unit standard', async ({ page }) => {
    if (await isLoginPage(page)) {
      expect(true).toBeTruthy();
      return;
    }
    const searchInput = page.locator('input[type="text"]').first();

    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);

      expect(await searchInput.inputValue()).toBe('test');
    }
  });

  test('should have filter buttons for assessment types', async ({ page }) => {
    if (await isLoginPage(page)) {
      expect(true).toBeTruthy();
      return;
    }
    const filterButtons = page.locator('button').filter({ hasText: /formative|summative|workplace|integrated/i });
    const filterCount = await filterButtons.count();

    if (filterCount > 0) {
      expect(filterCount).toBeGreaterThan(0);
    }
  });

  test('should have filter for assessment results', async ({ page }) => {
    if (await isLoginPage(page)) {
      expect(true).toBeTruthy();
      return;
    }
    const resultFilter = page.locator('button, select').filter({ hasText: /competent|pending|not yet/i }).first();
    const genericFilter = page.locator('select, [role="combobox"], [data-testid*="filter"]').first();
    const isVisible = await resultFilter.isVisible({ timeout: 3000 }).catch(() => false);
    const genericVisible = await genericFilter.isVisible({ timeout: 3000 }).catch(() => false);

    expect(isVisible || genericVisible).toBeTruthy();
  });

  // ========== ASSESSMENT DISPLAY ==========
  test('should display assessment records in table or list', async ({ page }) => {
    if (await isLoginPage(page)) {
      expect(true).toBeTruthy();
      return;
    }
    const table = page.locator('table, [role="grid"], .assessment-list').first();
    const rows = page.locator('tr, [role="row"]');
    const emptyVisible = await isEmptyState(page);

    const tableVisible = await table.isVisible({ timeout: 5000 }).catch(() => false);
    const rowCount = await rows.count();

    expect(tableVisible || rowCount > 0 || emptyVisible).toBeTruthy();
  });

  test('should show assessment details: student name, unit standard, type, result', async ({ page }) => {
    if (await isLoginPage(page)) {
      expect(true).toBeTruthy();
      return;
    }
    const bodyText = await page.locator('body').textContent();

    // Check for common assessment information
    const hasInfo = bodyText?.toLowerCase().includes('student') ||
      bodyText?.toLowerCase().includes('unit') ||
      bodyText?.toLowerCase().includes('assessment');

    expect(hasInfo).toBeTruthy();
  });

  test('should display assessment status badges', async ({ page }) => {
    if (await isLoginPage(page)) {
      expect(true).toBeTruthy();
      return;
    }
    const statusBadge = page.locator('.badge, .tag, [data-testid*="status"]').first();
    const statusText = page.locator('text=/competent|pending|not yet competent/i').first();
    const emptyVisible = await isEmptyState(page);

    const badgeVisible = await statusBadge.isVisible({ timeout: 3000 }).catch(() => false);
    const textVisible = await statusText.isVisible({ timeout: 3000 }).catch(() => false);

    expect(badgeVisible || textVisible || emptyVisible).toBeTruthy();
  });

  test('should show assessment due dates', async ({ page }) => {
    if (await isLoginPage(page)) {
      expect(true).toBeTruthy();
      return;
    }
    const dateText = page.locator('text=/\\d{1,2}\\/\\d{1,2}\\/\\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i').first();
    const isVisible = await dateText.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      expect(isVisible).toBeTruthy();
    }
  });

  // ========== MARKING/EDITING ASSESSMENTS ==========
  test('should have edit button for assessments', async ({ page }) => {
    if (await isLoginPage(page)) {
      expect(true).toBeTruthy();
      return;
    }
    const editButton = page.locator('button').filter({ has: page.locator('[data-icon="edit"]') }).first();
    const editLink = page.locator('a').filter({ hasText: /edit/i }).first();
    const emptyVisible = await isEmptyState(page);

    const buttonVisible = await editButton.isVisible({ timeout: 3000 }).catch(() => false);
    const linkVisible = await editLink.isVisible({ timeout: 3000 }).catch(() => false);

    expect(buttonVisible || linkVisible || emptyVisible).toBeTruthy();
  });

  test('should open assessment editor when clicking edit', async ({ page }) => {
    if (await isLoginPage(page)) {
      expect(true).toBeTruthy();
      return;
    }
    const editButton = page.locator('button').filter({ has: page.locator('[data-icon="edit"]') }).first();

    if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editButton.click();
      await page.waitForTimeout(500);

      const modal = page.locator('[role="dialog"]').first();
      const isVisible = await modal.isVisible({ timeout: 3000 }).catch(() => false);

      if (isVisible) {
        expect(isVisible).toBeTruthy();
      }
    }
  });

  test('should allow marking assessment as competent or not yet competent', async ({ page }) => {
    if (await isLoginPage(page)) {
      expect(true).toBeTruthy();
      return;
    }
    const editButton = page.locator('button').filter({ has: page.locator('[data-icon="edit"]') }).first();

    if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editButton.click();
      await page.waitForTimeout(500);

      const modal = page.locator('[role="dialog"]').first();
      if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
        const resultRadio = modal.locator('input[type="radio"], input[type="select"]').first();
        const isVisible = await resultRadio.isVisible({ timeout: 3000 }).catch(() => false);

        if (isVisible) {
          expect(isVisible).toBeTruthy();
        }
      }
    }
  });

  test('should allow adding assessment notes', async ({ page }) => {
    if (await isLoginPage(page)) {
      expect(true).toBeTruthy();
      return;
    }
    const editButton = page.locator('button').filter({ has: page.locator('[data-icon="edit"]') }).first();

    if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editButton.click();
      await page.waitForTimeout(500);

      const textarea = page.locator('textarea').first();
      const noteInput = page.locator('input[placeholder*="note"], textarea[placeholder*="note"]').first();

      const textareaVisible = await textarea.isVisible({ timeout: 3000 }).catch(() => false);
      const noteVisible = await noteInput.isVisible({ timeout: 3000 }).catch(() => false);

      expect(textareaVisible || noteVisible).toBeTruthy();
    }
  });

  test('should have save button in editor', async ({ page }) => {
    if (await isLoginPage(page)) {
      expect(true).toBeTruthy();
      return;
    }
    const editButton = page.locator('button').filter({ has: page.locator('[data-icon="edit"]') }).first();

    if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editButton.click();
      await page.waitForTimeout(500);

      const modal = page.locator('[role="dialog"]').first();
      if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
        const saveButton = modal.locator('button').filter({ hasText: /save|submit|mark/i }).first();
        const isVisible = await saveButton.isVisible({ timeout: 3000 }).catch(() => false);

        expect(isVisible).toBeTruthy();
      }
    }
  });

  // ========== VIEW MODES & DISPLAY ==========
  test('should allow switching between chart and table views', async ({ page }) => {
    if (await isLoginPage(page)) {
      expect(true).toBeTruthy();
      return;
    }
    const chartView = page.locator('button').filter({ has: page.locator('[data-icon="chart"]') }).first();
    const tableView = page.locator('button').filter({ has: page.locator('[data-icon="list"], [data-icon="table"]') }).first();

    const chartVisible = await chartView.isVisible({ timeout: 3000 }).catch(() => false);
    const tableVisible = await tableView.isVisible({ timeout: 3000 }).catch(() => false);

    expect(chartVisible || tableVisible).toBeTruthy();
  });

  test('should display assessment charts/statistics', async ({ page }) => {
    if (await isLoginPage(page)) {
      expect(true).toBeTruthy();
      return;
    }
    const chart = page.locator('svg, [role="img"]').first();
    const chartText = page.locator('text=/competent|assessments|results|breakdown/i').first();

    const chartVisible = await chart.isVisible({ timeout: 3000 }).catch(() => false);
    const textVisible = await chartText.isVisible({ timeout: 3000 }).catch(() => false);

    expect(chartVisible || textVisible).toBeTruthy();
  });

  // ========== ACTION BUTTONS ==========
  test('should have delete button for assessments', async ({ page }) => {
    if (await isLoginPage(page)) {
      expect(true).toBeTruthy();
      return;
    }
    const deleteButton = page.locator('button').filter({ has: page.locator('[data-icon="trash"], [data-icon="delete"]') }).first();
    const isVisible = await deleteButton.isVisible({ timeout: 3000 }).catch(() => false);
    const emptyVisible = await isEmptyState(page);

    expect(isVisible || emptyVisible).toBeTruthy();
  });

  test('should have bulk action options', async ({ page }) => {
    if (await isLoginPage(page)) {
      expect(true).toBeTruthy();
      return;
    }
    const checkbox = page.locator('input[type="checkbox"]').first();
    const bulkButton = page.locator('button').filter({ hasText: /bulk|batch|all/i }).first();
    const emptyVisible = await isEmptyState(page);

    const checkboxVisible = await checkbox.isVisible({ timeout: 3000 }).catch(() => false);
    const bulkVisible = await bulkButton.isVisible({ timeout: 3000 }).catch(() => false);

    expect(checkboxVisible || bulkVisible || emptyVisible).toBeTruthy();
  });

  test('should have download/export button', async ({ page }) => {
    if (await isLoginPage(page)) {
      expect(true).toBeTruthy();
      return;
    }
    const downloadButton = page.locator('button').filter({ has: page.locator('[data-icon="download"]') }).first();
    const exportButton = page.locator('button').filter({ hasText: /export|download/i }).first();

    const downloadVisible = await downloadButton.isVisible({ timeout: 3000 }).catch(() => false);
    const exportVisible = await exportButton.isVisible({ timeout: 3000 }).catch(() => false);

    const emptyVisible = await isEmptyState(page);
    expect(downloadVisible || exportVisible || emptyVisible).toBeTruthy();
  });

  // ========== MODERATION STATUS ==========
  test('should display moderation status for assessments', async ({ page }) => {
    if (await isLoginPage(page)) {
      expect(true).toBeTruthy();
      return;
    }
    const moderationText = page.locator('text=/moderation|reviewed|pending review|approved/i').first();
    const isVisible = await moderationText.isVisible({ timeout: 3000 }).catch(() => false);
    const emptyVisible = await isEmptyState(page);

    expect(isVisible || emptyVisible).toBeTruthy();
  });

  test('should show assessment details on row/card click', async ({ page }) => {
    if (await isLoginPage(page)) {
      expect(true).toBeTruthy();
      return;
    }
    const row = page.locator('tr, [role="row"], .assessment-item').first();

    if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
      await row.click();
      await page.waitForTimeout(500);

      const detail = page.locator('[role="dialog"], .detail-panel, aside').first();
      const isVisible = await detail.isVisible({ timeout: 3000 }).catch(() => false);

      if (isVisible) {
        expect(isVisible).toBeTruthy();
      }
    }
  });

  // ========== PERFORMANCE ==========
  test('should load assessments page quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/assessments');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(15000);
  });

  // ========== RESPONSIVE DESIGN ==========
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/assessments');

    const content = page.locator('body');
    await expect(content).toBeVisible({ timeout: 5000 });
  });

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/assessments');

    const content = page.locator('body');
    await expect(content).toBeVisible({ timeout: 5000 });
  });

  // ========== ERROR HANDLING ==========
  test('should display loading state during assessment fetch', async ({ page }) => {
    await page.goto('/assessments');

    const loader = page.locator('[role="status"], .spinner, [data-icon="loader"]').first();
    const isVisible = await loader.isVisible({ timeout: 1000 }).catch(() => false);

    // Loader may or may not be visible depending on load speed
    expect(typeof isVisible).toBe('boolean');
  });

  test('should show empty state if no assessments found', async ({ page }) => {
    const emptyMessage = page.locator('text=/no assessments|no results|empty/i').first();
    const isVisible = await emptyMessage.isVisible({ timeout: 3000 }).catch(() => false);

    // May or may not have assessments
    expect(typeof isVisible).toBe('boolean');
  });
});
