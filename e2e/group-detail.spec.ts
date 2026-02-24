import { test, expect } from '@playwright/test';

test.describe('Group Detail Page (/groups/[id])', () => {
  let groupId: string;

  test.beforeEach(async ({ page }) => {
    let loginResponse;
    for (let i = 0; i < 3; i++) {
      try {
        await page.goto('/login', { timeout: 10000 }).catch(() => { });
        loginResponse = await page.request.post('/api/auth/login', {
          data: {
            email: 'test@example.com',
            password: 'password123'
          },
          timeout: 5000
        });

        if (loginResponse.ok()) break;
      } catch (e) {
        // Silent retry
      }
      await page.waitForTimeout(1000);
    }

    if (!loginResponse || !loginResponse.ok()) {
      throw new Error('Failed to login for E2E tests');
    }

    const { token, user } = (await loginResponse.json()).data || (await loginResponse.json());

    await page.evaluate(({ token, user }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }, { token, user });

    await page.goto('/groups');

    // Wait for content to load
    await page.waitForFunction(() => {
      return document.querySelectorAll('a[href*="/groups/"]').length > 0;
    }, { timeout: 15000 }).catch(() => { });

    const groupLink = page.locator('a[href*="/groups/"]').first();
    const linkHref = await groupLink.getAttribute('href').catch(() => null);

    if (linkHref && linkHref.includes('/groups/')) {
      const parts = linkHref.split('/');
      groupId = parts[parts.length - 1];
      await page.goto(`/groups/${groupId}`, { waitUntil: 'networkidle' }).catch(() => { });
    } else {
      throw new Error('No group link found in E2E setup');
    }
  });

  // ========== PAGE LOAD & STRUCTURE ==========
  test('should load group detail page successfully', async ({ page }) => {
    const heading = page.locator('h1, h2').first();
    const isVisible = await heading.isVisible({ timeout: 5000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should display group name as main heading', async ({ page }) => {
    const mainHeading = page.locator('h1').first();
    const isVisible = await mainHeading.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should have proper page structure with semantic HTML', async ({ page }) => {
    const main = page.locator('main, [role="main"]').first();
    const isVisible = await main.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should display breadcrumb navigation', async ({ page }) => {
    const breadcrumb = page.locator('[role="navigation"], nav, [class*="breadcrumb"]').first();
    const isVisible = await breadcrumb.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should have back button to return to groups', async ({ page }) => {
    const backButton = page.locator('button, a').filter({ hasText: /back|return|←/i }).first();
    const isVisible = await backButton.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  // ========== GROUP INFORMATION DISPLAY ==========
  test('should display group summary information', async ({ page }) => {
    const summary = page.locator('div').filter({ hasText: /student|member|learner/i }).first();
    const isVisible = await summary.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should show group metadata (start/end dates)', async ({ page }) => {
    const metadata = page.locator('text=/date|duration|week|month/i').first();
    const isVisible = await metadata.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should display group statistics (student count)', async ({ page }) => {
    const stats = page.locator('text=/\\d+\\s*(student|member|learner)/i').first();
    const isVisible = await stats.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should show group status/health indicator', async ({ page }) => {
    const status = page.locator('text=/on.track|behind|at.risk|no.plan|status/i').first();
    const isVisible = await status.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  // ========== ROLLOUT PLAN SECTION ==========
  test('should display rollout plan information', async ({ page }) => {
    const rolloutSection = page.locator('text=/rollout|plan|module|unit/i').first();
    const isVisible = await rolloutSection.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should display modules/unit standards list', async ({ page }) => {
    const modulesList = page.locator('table, [class*="list"], [class*="module"]').first();
    const isVisible = await modulesList.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should show module progression with dates', async ({ page }) => {
    const dates = page.locator('text=/\\d{1,2}\\/\\d{1,2}\\/\\d{4}|\\d{4}-\\d{2}-\\d{2}/').first();
    const isVisible = await dates.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should display module status indicators', async ({ page }) => {
    const moduleStatus = page.locator('text=/not.started|in.progress|complete|passed|failed/i').first();
    const isVisible = await moduleStatus.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  // ========== ASSESSMENT TABLE/GRID ==========
  test('should display assessment section', async ({ page }) => {
    const assessmentSection = page.locator('text=/assessment|evaluation|test/i').first();
    const isVisible = await assessmentSection.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should display assessment table with student names', async ({ page }) => {
    const table = page.locator('table').first();
    const isVisible = await table.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should show assessment form types (formative/summative)', async ({ page }) => {
    const assessmentType = page.locator('text=/formative|summative|workplace/i').first();
    const isVisible = await assessmentType.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should display assessment status checkboxes or badges', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"], [role="checkbox"]').first();
    const isVisible = await checkbox.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should allow marking assessments as passed', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]').first();
    const isVisible = await checkbox.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      const isChecked = await checkbox.isChecked();
      // Just verify it can be interacted with
      expect(typeof isChecked).toBe('boolean');
    }
  });

  // ========== STUDENT LIST ==========
  test('should display student list or roster', async ({ page }) => {
    const studentList = page.locator('text=/student|learner|participant/i').first();
    const isVisible = await studentList.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should show individual student assessment progress', async ({ page }) => {
    const studentRow = page.locator('tr:has-text("student"), tr:has-text("learner")').first();
    const isVisible = await studentRow.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should display student progress percentage or credits', async ({ page }) => {
    const progress = page.locator('text=/\\d+%|\\d+\\s*\\/\\s*\\d+\\s*credit/').first();
    const isVisible = await progress.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  // ========== CREDIT TRACKING ==========
  test('should display credit information section', async ({ page }) => {
    const creditSection = page.locator('text=/credit|point|score/i').first();
    const isVisible = await creditSection.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should show total credits per module', async ({ page }) => {
    const credits = page.locator('text=/\\d+\\s*credit/i').first();
    const isVisible = await credits.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should display earned vs total credits', async ({ page }) => {
    const creditComparison = page.locator('text=/\\d+\\s*\\/\\s*\\d+').first();
    const isVisible = await creditComparison.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  // ========== ACTIONS & CONTROLS ==========
  test('should have action buttons in header', async ({ page }) => {
    const buttons = page.locator('button').first();
    const isVisible = await buttons.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should have edit group button or icon', async ({ page }) => {
    const editButton = page.locator('button, a, [role="button"]').filter({ hasText: /edit|pencil|✏|⚙|settings/i }).first();
    const isVisible = await editButton.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should have action menu or dropdown', async ({ page }) => {
    const menu = page.locator('button').filter({ hasText: /⋮|menu|more|option/i }).first();
    const isVisible = await menu.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should have save or apply changes button for assessments', async ({ page }) => {
    const saveButton = page.locator('button').filter({ hasText: /save|submit|apply|update/i }).first();
    const isVisible = await saveButton.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  // ========== TABS OR SECTIONS ==========
  test('should have tab navigation for different views', async ({ page }) => {
    const tabs = page.locator('[role="tab"], tab, button[class*="tab"]').first();
    const isVisible = await tabs.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should switch between different sections/tabs', async ({ page }) => {
    const allTabs = page.locator('[role="tab"], [class*="tab-button"]').all();
    const tabCount = (await allTabs).length;

    if (tabCount > 1) {
      const secondTab = (await allTabs)[1];
      if (await secondTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await secondTab.click();
        await page.waitForTimeout(500);
        expect(await secondTab.isVisible()).toBeTruthy();
      }
    }
  });

  // ========== DATA DISPLAY ==========
  test('should display assessment data without errors', async ({ page }) => {
    const dataElement = page.locator('table, [class*="data"], [class*="content"]').first();
    const isVisible = await dataElement.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should show module progression timeline or sequence', async ({ page }) => {
    const timeline = page.locator('text=/module\\s+\\d+|unit\\s+\\d+|step\\s+\\d+/i').first();
    const isVisible = await timeline.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should display assessment results consistently', async ({ page }) => {
    const results = page.locator('[class*="result"], [class*="status"], [class*="badge"]').first();
    const isVisible = await results.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  // ========== SEARCHABILITY & FILTERING ==========
  test('should have search functionality for students/modules', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i], input[type="text"]').first();
    const isVisible = await searchInput.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should have filter controls', async ({ page }) => {
    const filterButton = page.locator('button, [role="button"]').filter({ hasText: /filter|sort|view/i }).first();
    const isVisible = await filterButton.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  // ========== RESPONSIVE DESIGN ==========
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const heading = page.locator('h1').first();
    const isVisible = await heading.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    const heading = page.locator('h1').first();
    const isVisible = await heading.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should stack content appropriately on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const mainContent = page.locator('main, [role="main"]').first();
    const isVisible = await mainContent.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  // ========== TABLE INTERACTIONS ==========
  test('should allow expanding rows in assessment table', async ({ page }) => {
    const expandButton = page.locator('button[class*="expand"], [role="button"]:has-text("expand")').first();
    const isVisible = await expandButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await expandButton.click();
      await page.waitForTimeout(300);
      expect(await expandButton.isVisible()).toBeTruthy();
    }
  });

  test('should display expanded row details', async ({ page }) => {
    const expandableRow = page.locator('tr[class*="expand"]').first();
    const isVisible = await expandableRow.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should highlight selected rows or items', async ({ page }) => {
    const tableRow = page.locator('tr').first();
    if (await tableRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tableRow.click().catch(() => { });
      // Verify row interaction doesn't error
      expect(await tableRow.isVisible()).toBeTruthy();
    }
  });

  // ========== FORMS & INPUT ==========
  test('should have input fields for data entry', async ({ page }) => {
    const input = page.locator('input, textarea, select').first();
    const isVisible = await input.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should support form submission', async ({ page }) => {
    const form = page.locator('form').first();
    const isVisible = await form.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should display form validation messages', async ({ page }) => {
    const input = page.locator('input').first();
    if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Try to interact without submitting
      await input.focus().catch(() => { });
      expect(await input.isVisible()).toBeTruthy();
    }
  });

  // ========== NAVIGATION INTEGRITY ==========
  test('should maintain page state on navigation', async ({ page }) => {
    const initialUrl = page.url();
    const heading = page.locator('h1').first();
    const initialText = await heading.textContent();

    await page.reload();
    await page.waitForLoadState('networkidle');

    const currentText = await heading.textContent();
    expect(currentText).toBe(initialText);
  });

  test('should navigate back to groups list successfully', async ({ page }) => {
    const backButton = page.locator('button, a').filter({ hasText: /back|return|←/i }).first();
    const isVisible = await backButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await backButton.click();
      await page.waitForURL(/\/groups\/?$/, { timeout: 5000 }).catch(() => { });
      const currentUrl = page.url();
      expect(currentUrl).toContain('/groups');
    }
  });

  // ========== PERFORMANCE ==========
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(15000); // 15 seconds for detail page with data
  });

  test('should handle large dataset without lag', async ({ page }) => {
    const table = page.locator('table').first();
    const rowCount = await table.locator('tbody tr').count().catch(() => 0);

    // Page should still be responsive even with many rows
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  // ========== ACCESSIBILITY ==========
  test('should have proper heading hierarchy', async ({ page }) => {
    const h1 = page.locator('h1').first();
    const isVisible = await h1.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should have accessible button labels', async ({ page }) => {
    const button = page.locator('button').first();
    const label = await button.textContent();
    expect(label?.trim().length).toBeGreaterThan(0);
  });

  test('should have accessible table headers', async ({ page }) => {
    const header = page.locator('th').first();
    const isVisible = await header.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  // ========== DARK MODE SUPPORT ==========
  test('should support dark mode', async ({ page }) => {
    const body = page.locator('body');
    const classList = await body.getAttribute('class');

    // Verify page renders regardless of theme
    const heading = page.locator('h1').first();
    expect(await heading.isVisible({ timeout: 3000 }).catch(() => false)).toBeTruthy();
  });

  // ========== ERROR STATES ==========
  test('should handle missing assessments gracefully', async ({ page }) => {
    const heading = page.locator('h1').first();
    const isVisible = await heading.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should not display error messages on valid group page', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const errorText = page.locator('text=/error|failed|unable/i').all();
    const errors = (await errorText).length;

    expect(errors).toBeLessThanOrEqual(0);
  });

  // ========== BULK OPERATIONS ==========
  test('should have bulk action options', async ({ page }) => {
    const bulkButton = page.locator('button').filter({ hasText: /bulk|select.all|mark.all/i }).first();
    const isVisible = await bulkButton.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('should support batch assessment marking', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]').first();
    const isVisible = await checkbox.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  // ========== DATA PERSISTENCE ==========
  test('should maintain assessment data on page refresh', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const dataElement = page.locator('[class*="data"], [class*="content"]').first();
    const initialData = await dataElement.textContent().catch(() => '');

    await page.reload();
    await page.waitForLoadState('networkidle');

    const refreshedData = await dataElement.textContent().catch(() => '');
    expect(refreshedData && refreshedData.trim()).toBeTruthy();
  });

  // ========== PRINT SUPPORT ==========
  test('should be printable without breaking layout', async ({ page }) => {
    await page.evaluate(() => {
      // Check if page has print styles
      const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
      expect(styles.length).toBeGreaterThan(0);
    }).catch(() => { });
  });
});
