# 🧪 Testing Guide - What to Look For

## Quick Manual Tests After Merge

---

## ✅ Test 1: Sitemap.xml

**URL:** `https://yourdomain.com/sitemap.xml`

**Expected Result:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yeha.training/</loc>
    <lastmod>2026-02-17T00:00:00.000Z</lastmod>
    <changefreq>daily</changefreq>
    <priority>1</priority>
  </url>
  <url>
    <loc>https://yeha.training/login</loc>
    <lastmod>2026-02-17T00:00:00.000Z</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <!-- ...15 more URLs -->
</urlset>
```

**What to check:**
- ✅ All 17 routes are listed
- ✅ URLs are absolute (not relative)
- ✅ Dates are current
- ✅ Priorities make sense (homepage = 1, login = 0.5)

---

## ✅ Test 2: Robots.txt

**URL:** `https://yourdomain.com/robots.txt`

**Expected Result:**
```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /_next/
Disallow: /audit-screenshots/

User-agent: Googlebot
Allow: /login
Allow: /register

Sitemap: https://yeha.training/sitemap.xml
```

**What to check:**
- ✅ API routes are blocked
- ✅ Admin pages are blocked
- ✅ Sitemap URL is correct
- ✅ Public pages are allowed

---

## ✅ Test 3: Skip-to-Content Link

**How to test:**
1. Go to any page (e.g., homepage)
2. Press **Tab** key once
3. Look at top-left corner

**Expected Result:**
```
┌─────────────────────────┐
│ Skip to main content    │ ← Green button appears!
└─────────────────────────┘
```

**What to check:**
- ✅ Green button appears on first Tab press
- ✅ Button has emerald-600 background
- ✅ White text is readable
- ✅ Clicking jumps to main content
- ✅ Button disappears when you Tab away

**Try it with keyboard:**
```
Tab → Green button appears
Enter → Jumps to content (skips sidebar)
```

---

## ✅ Test 4: Custom 404 Page

**How to test:**
1. Visit a fake URL: `https://yourdomain.com/this-does-not-exist`

**Expected Result:**
```
┌─────────────────────────────────────┐
│                                     │
│              404                    │  ← Big emerald number
│                                     │
│        Page Not Found               │
│                                     │
│   Sorry, we couldn't find the       │
│   page you're looking for. It may   │
│   have been moved or deleted.       │
│                                     │
│   ┌──────────────┐  ┌──────────┐   │
│   │ 🏠 Dashboard │  │ ← Go Back│   │  ← Two buttons
│   └──────────────┘  └──────────┘   │
│                                     │
│   Need help? Visit our Settings     │
│   page or contact support.          │
│                                     │
└─────────────────────────────────────┘
```

**What to check:**
- ✅ Shows branded 404 page (not generic Next.js)
- ✅ "404" text is emerald-600 color
- ✅ Two buttons work (Dashboard, Go Back)
- ✅ Settings link is present
- ✅ Design matches YEHA branding

---

## ✅ Test 5: Favicon in Browser Tab

**How to test:**
1. Open any page
2. Look at browser tab

**Expected Result:**
```
Browser Tab: [Y] Dashboard | YEHA Training
             ↑
    Emerald square with white "Y"
```

**What to check:**
- ✅ Favicon appears (not default Next.js)
- ✅ Shows white "Y" on emerald background
- ✅ Square with rounded corners
- ✅ Visible in all browsers

**Compare:**
- **Before:** Generic Next.js icon or no icon
- **After:** Branded "Y" in emerald square

---

## ✅ Test 6: Unique Page Titles

**How to test:**
1. Visit different pages
2. Check browser tab title

**Expected Results:**

| Page | Title |
|------|-------|
| `/` | Dashboard \| YEHA Training |
| `/students` | Student Management \| YEHA Training |
| `/groups` | Groups & Training Sites \| YEHA Training |
| `/attendance` | Attendance Tracking \| YEHA Training |
| `/assessments` | Assessment Management \| YEHA Training |
| `/reports` | Reports & Analytics \| YEHA Training |
| `/login` | YEHA - Youth Education & Skills Management |

**What to check:**
- ✅ Each page has unique title
- ✅ Format: "Page Name | YEHA Training"
- ✅ Dashboard shows "Dashboard | YEHA Training"
- ✅ Login shows full brand name

---

## ✅ Test 7: Hidden Demo Credentials

**How to test:**

### In Development:
1. `npm run dev`
2. Visit `/login`
3. Scroll to bottom

**Expected:** See demo credentials:
```
┌─────────────────────────────────────┐
│ Demo credentials:                   │
│ ash@yeha.training / password123     │
└─────────────────────────────────────┘
```

### In Production:
1. `npm run build && npm start`
2. Visit `/login`
3. Scroll to bottom

**Expected:** NO demo credentials shown (empty space)

**What to check:**
- ✅ Credentials visible in dev mode
- ✅ Credentials hidden in production
- ✅ No layout shift (space is handled gracefully)

---

## ✅ Test 8: Open Graph Preview

**How to test:**
1. Share any page URL on Facebook/LinkedIn/Twitter
2. Check preview

**Tool:** Use Facebook Sharing Debugger
- URL: https://developers.facebook.com/tools/debug/

**Expected Result:**
```
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │
│ │  [OG Image: 1200x630px]             │ │  ← Rich image
│ │  (If /og-image.png exists)          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ YEHA - Youth Education & Skills Mgmt    │  ← Title
│                                         │
│ Comprehensive SSETA NVC Level 2         │  ← Description
│ Training Management Platform            │
│                                         │
│ YEHA.TRAINING                           │  ← Domain
└─────────────────────────────────────────┘
```

**What to check:**
- ✅ Title appears (not just URL)
- ✅ Description appears
- ✅ Domain shows correctly
- ⚠️ Image may not show (needs /og-image.png file)

---

## ✅ Test 9: Loading States

**How to test:**
1. Visit homepage (dashboard)
2. Slow down network: Browser DevTools → Network → Slow 3G
3. Refresh page

**Expected Result:**
```
While loading:
┌─────────────────────────────────┐
│ ▓▓▓▓▓▓░░░░░░░░░░░░░░░░          │ ← Gray skeleton
│ ▓▓▓▓▓▓▓▓░░░░░░░░░░░░            │   (animated pulse)
│ ▓▓▓▓░░░░░░░░░░░░░░░░░░          │
└─────────────────────────────────┘

After loading:
┌─────────────────────────────────┐
│ Dashboard Charts                 │ ← Actual content
│ [Chart data displayed]           │   (fades in smoothly)
└─────────────────────────────────┘
```

**What to check:**
- ✅ Shows skeleton/loading animation (not blank space)
- ✅ No layout shift when content loads
- ✅ Smooth fade-in transition
- ✅ Applies to: DashboardCharts, RecentActivity, DashboardAlerts, TodaysSchedule

---

## ✅ Test 10: Main Content ID

**How to test:**
1. Visit any page
2. Open browser DevTools
3. Inspect the `<main>` element

**Expected Result:**
```html
<main id="main-content" class="min-h-screen...">
  <header>...</header>
  <div class="px-6 lg:px-8 py-6 page-enter">
    {/* Page content here */}
  </div>
</main>
```

**What to check:**
- ✅ `<main>` has `id="main-content"`
- ✅ Skip link points to this ID
- ✅ Clicking skip link scrolls to this element

---

## ✅ Test 11: Error Page

**How to test:**
This is harder to test manually. Options:

### Option A: Modify code temporarily
```typescript
// In any page component, add:
throw new Error('Test error');
```

### Option B: Trigger React error
1. Edit a component to cause an error
2. See error boundary in action

**Expected Result:**
```
┌─────────────────────────────────────┐
│         ⚠️                          │  ← Red warning icon
│                                     │
│    Something went wrong             │
│                                     │
│  We encountered an unexpected error.│
│  This has been logged and we'll     │
│  look into it.                      │
│                                     │
│  [Dev only: Error message here]     │  ← Only in dev
│                                     │
│   ┌────────────┐  ┌──────────────┐ │
│   │ ↻ Try Again│  │ 🏠 Dashboard │ │
│   └────────────┘  └──────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

**What to check:**
- ✅ Shows branded error page
- ✅ "Try Again" button resets error boundary
- ✅ "Dashboard" button navigates home
- ✅ Error details only in development
- ✅ Production shows friendly message only

---

## 🎯 Lighthouse Audit

**How to run:**
1. Open Chrome DevTools
2. Go to "Lighthouse" tab
3. Select "Navigation" mode
4. Check: Performance, Accessibility, Best Practices, SEO
5. Click "Analyze page load"

**Expected Scores:**

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| **Performance** | 70 | 75 | 75+ ✅ |
| **Accessibility** | 75 | 95 | 90+ ✅ |
| **Best Practices** | 80 | 95 | 90+ ✅ |
| **SEO** | 40 | 85 | 85+ ✅ |

**Key improvements to verify:**
- ✅ "Document has a `<title>` element" - PASS
- ✅ "Document has a meta description" - PASS
- ✅ "`[id]` attributes on active, focusable elements are unique" - PASS
- ✅ "Links have a discernible name" - PASS
- ✅ "Page has valid `robots.txt`" - PASS (after deployment)

---

## 📊 Google Search Console

**After deployment (wait 24-48 hours):**

### 1. Submit Sitemap
1. Go to Google Search Console
2. Navigate to "Sitemaps"
3. Enter: `https://yourdomain.com/sitemap.xml`
4. Click "Submit"

**Expected:**
- Status: "Success"
- Discovered URLs: 17

### 2. Check Index Coverage
1. Navigate to "Index" → "Coverage"
2. Wait 1-2 weeks

**Expected:**
- Valid pages: 17+
- Errors: 0
- Warnings: 0

---

## 🔍 Browser Testing Matrix

Test in multiple browsers:

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ✅ Primary |
| Firefox | Latest | ✅ Important |
| Safari | Latest | ✅ iOS users |
| Edge | Latest | ✅ Windows |

**What to test:**
- [ ] Skip link appears on Tab
- [ ] Favicon shows correctly
- [ ] Page titles unique
- [ ] 404 page renders
- [ ] No console errors

---

## 📱 Mobile Testing

**Devices to test:**
- iPhone (Safari)
- Android (Chrome)
- Tablet (iPad/Android)

**What to check:**
- [ ] Skip link works with touch
- [ ] Text readable without zoom
- [ ] Buttons tap-friendly (44x44px minimum)
- [ ] No horizontal scrolling
- [ ] Favicon shows on home screen

**Mobile-specific Lighthouse:**
- Run Lighthouse in mobile mode
- Target: Accessibility 90+, SEO 85+

---

## ⌨️ Keyboard Navigation Test

**Test sequence:**
1. **Tab** → Skip link appears
2. **Enter** → Jumps to main content
3. **Tab** → Focus first interactive element
4. **Tab** through page → All elements reachable
5. **Enter/Space** on buttons → They activate
6. **Shift+Tab** → Navigate backward

**Expected:**
- ✅ Every interactive element reachable
- ✅ Focus visible (emerald ring)
- ✅ Logical tab order
- ✅ No keyboard traps
- ✅ Skip link saves 10+ tabs

---

## 🎨 Visual Regression

**Compare before/after:**

### Sidebar Navigation
- **Before:** Same
- **After:** Same (no visual changes)

### Page Titles (Browser Tab)
- **Before:** "YEHA - Youth..." on all pages
- **After:** Unique per page

### Login Page
- **Before:** Always shows demo credentials
- **After:** Hidden in production

### 404 Page
- **Before:** Generic Next.js page
- **After:** Branded YEHA page

### Favicon
- **Before:** Default/None
- **After:** Green "Y" square

---

## 🐛 Common Issues & Solutions

### Issue: Sitemap shows localhost URLs
**Solution:** Set `NEXT_PUBLIC_BASE_URL` environment variable

### Issue: Skip link doesn't appear
**Solution:** Clear browser cache, hard refresh (Ctrl+Shift+R)

### Issue: Favicon still shows old icon
**Solution:** Clear cache, close/reopen browser

### Issue: Demo credentials still visible in production
**Solution:** Verify `NODE_ENV=production` is set

### Issue: Images still slow
**Solution:** Must use `<Image>` component (not `<img>` tags)

---

## ✅ Final Checklist

Before considering deployment successful:

### Immediate (Day 1):
- [ ] `/sitemap.xml` renders correctly
- [ ] `/robots.txt` renders correctly
- [ ] Skip link appears on Tab key
- [ ] Favicon shows in browser tab
- [ ] 404 page works (test with fake URL)
- [ ] Page titles are unique
- [ ] Demo credentials hidden in production
- [ ] No console errors in browser
- [ ] Lighthouse SEO score 85+
- [ ] Lighthouse Accessibility score 90+

### Week 1:
- [ ] Submit sitemap to Google Search Console
- [ ] Verify sitemap status is "Success"
- [ ] No crawl errors in Search Console
- [ ] Mobile Lighthouse scores 85+/90+
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Screen reader test (NVDA/JAWS)
- [ ] Keyboard navigation complete test

### Month 1:
- [ ] Search Console shows 17+ indexed pages
- [ ] Organic traffic trending up
- [ ] No accessibility complaints
- [ ] Core Web Vitals in "Good" range
- [ ] Social shares show rich previews
- [ ] Monitor error logs (should be clean)

---

## 📞 Support

### If tests fail:
1. Check environment variables are set
2. Clear `.next` cache: `rm -rf .next`
3. Rebuild: `npm run build`
4. Hard refresh browser: Ctrl+Shift+R
5. Check browser console for errors

### Still having issues?
- Review `COMPREHENSIVE_WEBSITE_AUDIT_REPORT.md`
- Check `AUDIT_FIXES_IMPLEMENTED.md`
- Verify `NEXT_PUBLIC_BASE_URL` is set correctly

---

**Happy Testing! 🎉**

All these tests should pass. If any fail, check the environment variables and rebuild.

