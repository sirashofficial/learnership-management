const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const auditResults = {
    pages: [],
    brokenLinks: [],
    missingAssets: [],
    accessibilityIssues: [],
    metaTags: {}
  };

  // Track all console errors and warnings
  page.on('console', msg => {
    if (msg.type() === 'error') {
      auditResults.consoleErrors = auditResults.consoleErrors || [];
      auditResults.consoleErrors.push(msg.text());
    }
  });

  // Track failed requests
  page.on('requestfailed', request => {
    auditResults.missingAssets.push({
      url: request.url(),
      failure: request.failure().errorText
    });
  });

  try {
    // Navigate to login page first
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 60000 });
    await page.screenshot({ path: 'audit-screenshots/login.png', fullPage: true });
    
    // Capture meta tags
    const loginMetaTags = await page.evaluate(() => {
      return {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.content || null,
        viewport: document.querySelector('meta[name="viewport"]')?.content || null,
        lang: document.documentElement.lang || null
      };
    });
    auditResults.pages.push({ url: '/login', meta: loginMetaTags });

    // Check accessibility
    const accessibilityIssues = await page.evaluate(() => {
      const issues = [];
      // Check for images without alt text
      document.querySelectorAll('img').forEach((img, i) => {
        if (!img.alt) {
          issues.push(`Image ${i + 1} missing alt text: ${img.src}`);
        }
      });
      // Check for buttons without accessible names
      document.querySelectorAll('button').forEach((btn, i) => {
        if (!btn.textContent.trim() && !btn.getAttribute('aria-label')) {
          issues.push(`Button ${i + 1} missing accessible name`);
        }
      });
      // Check for form inputs without labels
      document.querySelectorAll('input').forEach((input, i) => {
        const id = input.id;
        if (id && !document.querySelector(`label[for="${id}"]`) && !input.getAttribute('aria-label')) {
          issues.push(`Input ${i + 1} (${input.type}) missing label`);
        }
      });
      return issues;
    });
    auditResults.accessibilityIssues.push({ page: '/login', issues: accessibilityIssues });

    // Try to check home page (though it might redirect to login)
    console.log('Navigating to home page...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 60000 });
    await page.screenshot({ path: 'audit-screenshots/home.png', fullPage: true });
    
    const homeMetaTags = await page.evaluate(() => {
      return {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.content || null,
        viewport: document.querySelector('meta[name="viewport"]')?.content || null,
        lang: document.documentElement.lang || null
      };
    });
    auditResults.pages.push({ url: '/', meta: homeMetaTags });

    // Check register page
    console.log('Navigating to register page...');
    await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle', timeout: 60000 });
    await page.screenshot({ path: 'audit-screenshots/register.png', fullPage: true });
    
    const registerMetaTags = await page.evaluate(() => {
      return {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.content || null,
        viewport: document.querySelector('meta[name="viewport"]')?.content || null,
        lang: document.documentElement.lang || null
      };
    });
    auditResults.pages.push({ url: '/register', meta: registerMetaTags });

    // Check mobile responsiveness
    console.log('Testing mobile view...');
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'audit-screenshots/login-mobile.png', fullPage: true });

    await page.setViewportSize({ width: 768, height: 1024 }); // Tablet
    await page.screenshot({ path: 'audit-screenshots/login-tablet.png', fullPage: true });

  } catch (error) {
    console.error('Error during audit:', error);
    auditResults.errors = auditResults.errors || [];
    auditResults.errors.push(error.message);
  }

  // Save results
  fs.mkdirSync('audit-screenshots', { recursive: true });
  fs.writeFileSync('audit-results.json', JSON.stringify(auditResults, null, 2));
  console.log('Audit complete! Results saved to audit-results.json');

  await browser.close();
})();
