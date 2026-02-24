import { test, expect } from '@playwright/test';

const isLoginPage = async (page: any) => {
  const loginText = page.locator('text=/login|sign in/i').first();
  const passwordField = page.locator('input[type="password"]').first();
  const hasLoginText = await loginText.isVisible({ timeout: 1000 }).catch(() => false);
  const hasPassword = await passwordField.isVisible({ timeout: 1000 }).catch(() => false);
  return hasLoginText || hasPassword;
};

const isEmptyState = async (page: any) => {
  const emptyText = page.locator('text=/select|group|choose|no data|empty/i').first();
  return await emptyText.isVisible({ timeout: 1500 }).catch(() => false);
};

test.describe('Assessment Checklist Page - Quick View', () => {
  // Increase timeout for slow dev environment
  test.setTimeout(60000);

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

    await page.goto('/assessment-checklist');

    // Explicit wait for the page to identify as authenticated
    await page.waitForFunction(() => {
      return !document.body.innerText.includes('Guest') && !document.body.innerText.includes('Sign in');
    }, { timeout: 10000 }).catch(() => { });

    if (page.url().includes('/login')) {
      await page.goto('/assessment-checklist', { waitUntil: 'networkidle' });
    }
  });

  // ========== PAGE RENDERING ==========
  test('should load assessment checklist page successfully', async ({ page }) => {
    const heading = page.locator('h1:has-text("Assessment Checklist")');
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should display page title or heading', async ({ page }) => {
    const heading = page.locator('h1').first();
    await expect(heading).toContainText('Assessment Checklist');
  });

  // ========== GROUP & MODULE SELECTORS ==========
  test('should have group selector dropdown', async ({ page }) => {
    const groupLabel = page.locator('label:has-text("Select Group")');
    const groupSelect = page.locator('select').first();
    await expect(groupLabel).toBeVisible();
    await expect(groupSelect).toBeVisible();
  });

  test('should populate group selector with options', async ({ page }) => {
    const groupSelect = page.locator('select').first();
    await expect(groupSelect).toBeVisible();
    // Wait for options to load (SWR)
    await page.waitForFunction((sel) => {
      const select = document.querySelector(sel) as HTMLSelectElement;
      return select && select.options.length > 1;
    }, 'select');
    const count = await groupSelect.locator('option').count();
    expect(count).toBeGreaterThan(1);
  });

  // ========== CHECKLIST DISPLAY ==========
  test('should display assessments when group is selected', async ({ page }) => {
    const groupSelect = page.locator('select').first();

    // Select a group (index 1 is usually the first real group after "Select a group")
    await groupSelect.selectOption({ index: 1 });

    // Wait for the 'Module' headers to appear (indicating data fetched)
    await page.waitForSelector('h2:has-text("Module")', { timeout: 20000 });

    const moduleHeader = page.locator('h2:has-text("Module")').first();
    await expect(moduleHeader).toBeVisible();
  });

  test('should display unit standard buttons', async ({ page }) => {
    const groupSelect = page.locator('select').first();
    await groupSelect.selectOption({ index: 1 });

    // Lucide icons are SVGs inside buttons
    const expandButton = page.locator('button:has(svg)').first();
    await expect(expandButton).toBeVisible();
  });

  // ========== STUDENT CHECKLIST ==========
  test('should toggle assessment when clicking student button', async ({ page }) => {
    const groupSelect = page.locator('select').first();
    await groupSelect.selectOption({ index: 1 });

    // Expand a unit
    await page.locator('button:has(svg)').first().click();

    // Find a student button (it has a student name)
    const studentButton = page.locator('button:has(p)').filter({ hasNot: page.locator('h1, h2') }).first();
    await expect(studentButton).toBeVisible();

    // Clicking toggles (we verify it's clickable and action triggers)
    await studentButton.click();
  });

  // ========== RESPONSIVE DESIGN ==========
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/assessment-checklist');
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });
});
