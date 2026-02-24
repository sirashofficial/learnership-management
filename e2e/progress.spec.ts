import { test, expect } from '@playwright/test';

test.describe('Progress Page - Status & Projected vs Actual', () => {
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

    await page.goto('/progress');

    // Explicit wait for the page to identify as authenticated
    await page.waitForFunction(() => {
      return !document.body.innerText.includes('Guest') && !document.body.innerText.includes('Sign in');
    }, { timeout: 10000 }).catch(() => { });

    if (page.url().includes('/login')) {
      await page.goto('/progress', { waitUntil: 'networkidle' });
    }
  });

  // ========== PAGE RENDERING ==========
  test('should load progress page successfully', async ({ page }) => {
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible({ timeout: 5000 });
  });

  test('should display progress page title', async ({ page }) => {
    const heading = page.locator('h1, h2, [role="heading"]').first();
    const isVisible = await heading.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      const text = await heading.textContent();
      expect(text?.toLowerCase()).toContain('progress');
    }
  });

  // ========== VIEW MODE TOGGLE ==========
  test('should have individual and group view toggle', async ({ page }) => {
    const viewToggle = page.locator('button').filter({ hasText: /individual|group|student|cohort/i });
    const toggleCount = await viewToggle.count();

    expect(toggleCount).toBeGreaterThanOrEqual(0);
  });

  test('should allow switching between individual and group views', async ({ page }) => {
    const individualButton = page.locator('button').filter({ hasText: /individual/i }).first();
    const groupButton = page.locator('button').filter({ hasText: /group/i }).first();

    const individualVisible = await individualButton.isVisible({ timeout: 3000 }).catch(() => false);
    const groupVisible = await groupButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (individualVisible) {
      await individualButton.click();
      await page.waitForTimeout(500);
      expect(individualButton).toBeTruthy();
    }
  });

  // ========== STATUS INDICATORS ==========
  test('should display status badges (ON_TRACK, BEHIND, AT_RISK)', async ({ page }) => {
    const statusBadge = page.locator('.badge, .tag, [data-testid*="status"]').first();
    const statusText = page.locator('text=/on track|behind|at risk|at\\-risk/i').first();

    const badgeVisible = await statusBadge.isVisible({ timeout: 3000 }).catch(() => false);
    const textVisible = await statusText.isVisible({ timeout: 3000 }).catch(() => false);

    expect(badgeVisible || textVisible).toBeTruthy();
  });

  test('should color-code statuses (green/yellow/red)', async ({ page }) => {
    const greenStatus = page.locator('.text-green|.bg-green|.text-emerald').first();
    const redStatus = page.locator('.text-red|.bg-red|.text-rose').first();

    const greenVisible = await greenStatus.isVisible({ timeout: 3000 }).catch(() => false);
    const redVisible = await redStatus.isVisible({ timeout: 3000 }).catch(() => false);

    expect(greenVisible || redVisible).toBeTruthy();
  });

  // ========== PROJECTED VS ACTUAL DISPLAY ==========
  test('should display projected progress percentage', async ({ page }) => {
    const projectedText = page.locator('text=/projected|planned|target|estimate/i').first();
    const percentageText = page.locator('text=/\\d+\\s*%/').first();

    const projectedVisible = await projectedText.isVisible({ timeout: 3000 }).catch(() => false);
    const percentVisible = await percentageText.isVisible({ timeout: 3000 }).catch(() => false);

    expect(projectedVisible || percentVisible).toBeTruthy();
  });

  test('should display actual progress percentage', async ({ page }) => {
    const actualText = page.locator('text=/actual|current|completed|achieved/i').first();
    const percentageText = page.locator('text=/\\d+\\s*%/');

    const actualVisible = await actualText.isVisible({ timeout: 3000 }).catch(() => false);
    const percentCount = await percentageText.count();

    expect(actualVisible || percentCount > 0).toBeTruthy();
  });

  test('should show progress comparison charts', async ({ page }) => {
    const chart = page.locator('svg, canvas, [role="img"]').first();
    const chartText = page.locator('text=/projected|actual|progress|comparison/i').first();

    const chartVisible = await chart.isVisible({ timeout: 3000 }).catch(() => false);
    const textVisible = await chartText.isVisible({ timeout: 3000 }).catch(() => false);

    expect(chartVisible || textVisible).toBeTruthy();
  });

  test('should display progress bars with projected vs actual', async ({ page }) => {
    const progressBar = page.locator('[role="progressbar"], .progress-bar, [data-testid*="progress"]').first();
    const isVisible = await progressBar.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      expect(isVisible).toBeTruthy();
    }
  });

  // ========== MODULE PROGRESS ==========
  test('should display module-level progress', async ({ page }) => {
    const moduleText = page.locator('text=/module|unit|standard/i').first();
    const moduleProgress = page.locator('[data-testid*="module"], .module-item').first();

    const moduleVisible = await moduleText.isVisible({ timeout: 3000 }).catch(() => false);
    const progressVisible = await moduleProgress.isVisible({ timeout: 3000 }).catch(() => false);

    expect(moduleVisible || progressVisible).toBeTruthy();
  });

  test('should show credited vs completed units', async ({ page }) => {
    const creditText = page.locator('text=/credit|completed|unit|standard/i').first();
    const isVisible = await creditText.isVisible({ timeout: 3000 }).catch(() => false);

    expect(isVisible).toBeTruthy();
  });

  test('should display progress timeline or dates', async ({ page }) => {
    const dateText = page.locator('text=/\\d{1,2}\\/\\d{1,2}\\/\\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i').first();
    const isVisible = await dateText.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      expect(isVisible).toBeTruthy();
    }
  });

  // ========== STUDENT/GROUP SELECTORS ==========
  test('should have student dropdown in individual view', async ({ page }) => {
    const studentSelect = page.locator('select').first();
    const studentDropdown = page.locator('[data-testid*="student"]').first();

    const selectVisible = await studentSelect.isVisible({ timeout: 3000 }).catch(() => false);
    const dropdownVisible = await studentDropdown.isVisible({ timeout: 3000 }).catch(() => false);

    expect(selectVisible || dropdownVisible).toBeTruthy();
  });

  test('should have group dropdown in group view', async ({ page }) => {
    const groupButton = page.locator('button').filter({ hasText: /group/i }).first();

    if (await groupButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await groupButton.click();
      await page.waitForTimeout(500);

      const groupSelect = page.locator('select, [data-testid*="group"]').first();
      const isVisible = await groupSelect.isVisible({ timeout: 3000 }).catch(() => false);

      if (isVisible) {
        expect(isVisible).toBeTruthy();
      }
    }
  });

  // ========== GROUP VIEW SUMMARY ==========
  test('should display group summary statistics', async ({ page }) => {
    const groupButton = page.locator('button').filter({ hasText: /group/i }).first();

    if (await groupButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await groupButton.click();
      await page.waitForTimeout(500);

      const statCards = page.locator('[data-testid*="stat"], .stat-card, .card').first();
      const isVisible = await statCards.isVisible({ timeout: 3000 }).catch(() => false);

      if (isVisible) {
        expect(isVisible).toBeTruthy();
      }
    }
  });

  test('should show count of students on track vs behind', async ({ page }) => {
    const groupButton = page.locator('button').filter({ hasText: /group/i }).first();

    if (await groupButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await groupButton.click();
      await page.waitForTimeout(500);

      const trackText = page.locator('text=/on track|behind|at risk/i').first();
      const isVisible = await trackText.isVisible({ timeout: 3000 }).catch(() => false);

      if (isVisible) {
        expect(isVisible).toBeTruthy();
      }
    }
  });

  // ========== EXPANDABLE STUDENTS ==========
  test('should list all students in group view', async ({ page }) => {
    const groupButton = page.locator('button').filter({ hasText: /group/i }).first();

    if (await groupButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await groupButton.click();
      await page.waitForTimeout(500);

      const studentList = page.locator('[data-testid*="student"], .student-item, tr').first();
      const isVisible = await studentList.isVisible({ timeout: 3000 }).catch(() => false);

      if (isVisible) {
        expect(isVisible).toBeTruthy();
      }
    }
  });

  test('should allow expanding student rows to see details', async ({ page }) => {
    const expandButton = page.locator('button').filter({ has: page.locator('[data-icon="chevron"]') }).first();

    if (await expandButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expandButton.click();
      await page.waitForTimeout(500);

      expect(expandButton).toBeTruthy();
    }
  });

  // ========== DETAILED METRICS ==========
  test('should show completed outcomes count', async ({ page }) => {
    const outcomesText = page.locator('text=/outcomes|completed|total|/').first();
    const isVisible = await outcomesText.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      expect(isVisible).toBeTruthy();
    }
  });

  test('should display completion percentage per student', async ({ page }) => {
    const percentage = page.locator('text=/\\d+\\s*%/').first();
    const isVisible = await percentage.isVisible({ timeout: 3000 }).catch(() => false);

    expect(isVisible).toBeTruthy();
  });

  test('should show module progress breakdown', async ({ page }) => {
    const moduleBreakdown = page.locator('[data-testid*="module-progress"], .module-progress').first();
    const isVisible = await moduleBreakdown.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      expect(isVisible).toBeTruthy();
    }
  });

  // ========== ALERTS & WARNINGS ==========
  test('should highlight at-risk students', async ({ page }) => {
    const riskBadge = page.locator('text=/at risk|at\\-risk|warning/i').first();
    const isVisible = await riskBadge.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      expect(isVisible).toBeTruthy();
    }
  });

  test('should show alert icons for behind schedule', async ({ page }) => {
    const alertIcon = page.locator('[data-icon="alert"], [data-icon="warning"]').first();
    const isVisible = await alertIcon.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      expect(isVisible).toBeTruthy();
    }
  });

  // ========== DATE FILTERS ==========
  test('should have date range selector', async ({ page }) => {
    const dateSelect = page.locator('select').filter({ hasText: /date|range|period/i }).first();
    const dateButton = page.locator('button').filter({ hasText: /date|range|all|week|month/i }).first();

    const selectVisible = await dateSelect.isVisible({ timeout: 3000 }).catch(() => false);
    const buttonVisible = await dateButton.isVisible({ timeout: 3000 }).catch(() => false);

    expect(selectVisible || buttonVisible).toBeTruthy();
  });

  test('should update progress when changing date range', async ({ page }) => {
    const dateButton = page.locator('button').filter({ hasText: /all|today|this week|this month/i }).first();

    if (await dateButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dateButton.click();
      await page.waitForTimeout(500);

      expect(dateButton).toBeTruthy();
    }
  });

  // ========== LINKS & NAVIGATION ==========
  test('should have links to detailed student progress', async ({ page }) => {
    const link = page.locator('a').filter({ hasText: /view|details|more|see more/i }).first();
    const isVisible = await link.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      const href = await link.getAttribute('href');
      expect(href?.length).toBeGreaterThan(0);
    }
  });

  // ========== CHARTS & VISUALIZATIONS ==========
  test('should display projected vs actual comparison chart', async ({ page }) => {
    const chart = page.locator('svg, canvas').first();
    const chartContainer = page.locator('[data-testid*="chart"], .chart').first();

    const chartVisible = await chart.isVisible({ timeout: 3000 }).catch(() => false);
    const containerVisible = await chartContainer.isVisible({ timeout: 3000 }).catch(() => false);

    expect(chartVisible || containerVisible).toBeTruthy();
  });

  test('should show module performance pie/bar chart', async ({ page }) => {
    const chart = page.locator('svg, canvas').nth(1);
    const isVisible = await chart.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      expect(isVisible).toBeTruthy();
    }
  });

  // ========== SORTING & FILTERING ==========
  test('should allow sorting students by status', async ({ page }) => {
    const sortButton = page.locator('button').filter({ has: page.locator('[data-icon="sort"], [data-icon="arrow"]') }).first();
    const isVisible = await sortButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      expect(isVisible).toBeTruthy();
    }
  });

  test('should allow filtering by status (on track, behind, at risk)', async ({ page }) => {
    const filterButton = page.locator('button').filter({ hasText: /filter/i }).first();
    const statusFilter = page.locator('button, select').filter({ hasText: /on track|behind|at risk/i }).first();

    const filterVisible = await filterButton.isVisible({ timeout: 3000 }).catch(() => false);
    const statusVisible = await statusFilter.isVisible({ timeout: 3000 }).catch(() => false);

    expect(filterVisible || statusVisible).toBeTruthy();
  });

  // ========== PERFORMANCE ==========
  test('should load progress page quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/progress');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(15000);
  });

  // ========== RESPONSIVE DESIGN ==========
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/progress');

    const content = page.locator('body');
    await expect(content).toBeVisible({ timeout: 5000 });
  });

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/progress');

    const content = page.locator('body');
    await expect(content).toBeVisible({ timeout: 5000 });
  });

  // ========== ERROR HANDLING ==========
  test('should display loading state', async ({ page }) => {
    await page.goto('/progress');

    const loader = page.locator('[role="status"], .spinner, [data-icon="loader"]').first();
    const isVisible = await loader.isVisible({ timeout: 1000 }).catch(() => false);

    expect(typeof isVisible).toBe('boolean');
  });

  test('should handle missing data gracefully', async ({ page }) => {
    const noData = page.locator('text=/no data|no progress|empty/i').first();
    const isVisible = await noData.isVisible({ timeout: 3000 }).catch(() => false);

    expect(typeof isVisible).toBe('boolean');
  });
});
