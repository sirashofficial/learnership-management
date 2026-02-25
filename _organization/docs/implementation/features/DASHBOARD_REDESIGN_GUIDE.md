# YEHA Dashboard Redesign — Complete Implementation Guide

## Overview

This document outlines the complete visual redesign of the YEHA dashboard. All functionality has been preserved while the entire visual presentation has been modernized with a cohesive design system.

## Design System

### Color Palette

- **Primary (Navy)**: `#0f172a` — Sidebar background (dark mode)
- **Brand Green**: `#16a34a` — Primary accent color for actions, highlights, left borders
- **Light Background**: `#f8fafc` — Main content area background (off-white)
- **Light Grey**: `#f1f5f9` — Secondary background, hover states
- **White**: `#ffffff` — Card backgrounds

### Typography

- **Font Family**: Outfit (sans-serif) for UI, Lora for brand elements
- **Font Sizes**: Consistent scale with clear hierarchy
  - Headings: Bold, large (text-lg to text-3xl)
  - Labels: Small, muted (text-xs), uppercase tracking-wide
  - Body: Standard weight, slate-600/700 colors

### Spacing & Sizing

- **Border Radius**: 12px (rounded-xl) for cards and components
- **Shadows**: Subtle, used on hover and elevated states
- **Padding**: Consistent 5-6px per component, 4-6px between elements

---

## Component Changes

### 1. StatCard Component (`src/components/StatCard.tsx`)

**Changes:**
- Added left accent border (4px solid green #16a34a) using `::before` pseudo-element
- Redesigned layout with icon in top-right corner
- Large, bold value display (text-3xl font-bold)
- Small, muted label above value
- Trend indicator with arrow icon (TrendingUp/TrendingDown from lucide-react)
- Better visual hierarchy and spacing

**How to Customize:**
- Edit left border color: Look for `.stat-card::before` in globals.css, change `background: #16a34a;`
- Adjust value size: Change `text-3xl` and `font-bold` classes
- Modify trend display: Look for TrendingUp/TrendingDown icon in component

**Related Files:**
- `src/components/StatCard.tsx` — Component definition
- `src/app/globals.css` — `.stat-card` and `.stat-card::before` CSS classes

---

### 2. QuickActions Component (`src/components/QuickActions.tsx`)

**Changes:**
- Added icons from lucide-react for each action (Plus, Users2, Calendar, CheckSquare)
- Refined button styling with flex column layout (icon above label)
- Better hover states with scale animation
- Smaller, more refined appearance than previous large green blocks
- Organized actions in a data structure for easier management

**How to Customize:**
- Add new actions: Add entries to the `actions` array in the component
- Change icons: Import new icons from lucide-react and update the icon properties
- Modify button styling: Edit `.quick-action-btn` class in globals.css

**Related Files:**
- `src/components/QuickActions.tsx` — Component definition
- `src/app/globals.css` — `.quick-action-btn` CSS class

---

### 3. DashboardAlerts Component (`src/components/DashboardAlerts.tsx`)

**MAJOR REDESIGN:**
- **Summary Badge Row**: Displays counts of Critical, Warning, and Info alerts
  - Only shown if alerts exist in that priority level
  - Uses colored badge styles for visual distinction
- **Clean Alert List**: 
  - No raw UUIDs visible to users
  - Shows student name or group name prominently
  - Truncated assessment titles (max 40 chars)
  - Priority-colored left borders
  - Timestamp in compact format (e.g., "5m", "2h", "Jan 15")
- **Better Empty State**: Uses centered layout with icon and message
- **"View All" Link**: Only appears if alerts exceed 8 items
- **Professional Styling**: Priority-colored backgrounds, proper spacing, better readability

**How to Customize:**
- Change alert limit: Edit `slice(0, 8)` to different number
- Adjust text truncation length: Edit `maxLength: number = 40` in `truncateText` function
- Modify badge counts display: Edit the badges section after `{/* Summary Badge Row */}` comment
- Change priority colors: Edit `getPriorityStyles` function

**Related Files:**
- `src/components/DashboardAlerts.tsx` — Component definition
- `src/app/globals.css` — `.alert-badge-*` CSS classes

---

### 4. DashboardLayout Component (`src/components/DashboardLayout.tsx`)

**Changes:**
- Enhanced header with better typography and spacing
- Title now reads "Programme Hub" with descriptive subtitle
- Quick stats pills now display in a more refined layout
- Tab navigation improved with better active state styling
- Responsive design refined for all screen sizes
- Better visual separation between header and content

**How to Customize:**
- Change header title: Edit "Programme Hub" text
- Modify quick stats: Edit the stats display pills section
- Adjust tab styling: Edit the tab button className in the views.map() section
- Change sidebar width: Edit `lg:w-96` class on alert sidebar

**Related Files:**
- `src/components/DashboardLayout.tsx` — Component definition

---

### 5. DashboardCharts Component (`src/components/DashboardCharts.tsx`)

**Changes:**
- Better visual hierarchy with proper section headings
- Charts now in dashboard-card containers with consistent padding
- Loading states shows spinner centered in card (not broken-looking)
- Empty states use new EmptyState component
- Export button always visible and styled consistently
- Chart titles with descriptions (e.g., "Attendance rate over time")
- Better spacing and grid layout

**How to Customize:**
- Change chart titles: Edit the `<h3>` text in each chart section
- Adjust loading spinner: Change `border-3` and `w-8 h-8` sizes
- Modify chart height: Edit `h-64` class in chart containers
- Add new charts: Follow the same pattern as existing charts

**Related Files:**
- `src/components/DashboardCharts.tsx` — Component definition
- `src/components/EmptyState.tsx` — Used for empty states

---

### 6. EmptyState Component (`src/components/EmptyState.tsx`) — NEW

**Purpose:**
- Centralized empty state component used across dashboard
- Provides consistent messaging when no data available
- Supports icon, title, description, and optional action button

**How to Use:**
```tsx
<EmptyState
  icon={Users}  // Optional lucide-react icon
  title="No Data Available"
  description="Data will appear here"
  action={{
    label: "Go to Page",
    onClick: () => router.push('/path')
  }}
/>
```

**How to Customize:**
- Icon: Pass any lucide-react icon component
- Text: Edit title and description
- Action button: Add `action` prop with label and onClick handler

**Related Files:**
- `src/components/EmptyState.tsx` — Component definition

---

## Global CSS Changes (`src/app/globals.css`)

### New CSS Classes

#### Dashboard Component Classes

```css
/* Dashboard card with consistent styling */
.dashboard-card
/* Stat card with left accent border */
.stat-card
/* Left accent border (4px, green) */
.stat-card::before

/* Alert badge colors */
.alert-badge
.alert-badge-critical
.alert-badge-warning
.alert-badge-info

/* Status badges */
.status-pill
.status-on-track
.status-at-risk
.status-behind

/* Quick action buttons */
.quick-action-btn

/* Empty state styling */
.empty-state
.empty-state-icon
.empty-state-title
.empty-state-description

/* Progress bar */
.progress-bar
.progress-bar-fill

/* Table zebra striping */
.table-zebra tbody tr:nth-child(odd)
.table-zebra tbody tr:nth-child(even)
```

### Where to Edit Colors

1. **Card background**: Look for `dashboard-card` — add dark mode variants as needed
2. **Alert colors**: Edit `getPriorityStyles` in DashboardAlerts.tsx to change red/amber/green
3. **Status colors**: Edit status-pill classes in globals.css
4. **Brand green**: Change `#16a34a` in `.stat-card::before` and button classes

---

## Main Dashboard Page Changes (`src/app/page.tsx`)

### Key Updates

1. **Stats Section**
   - Now uses new dashboard-card skeleton loaders
   - All 6 stat cards use redesigned StatCard component
   - Improved loading state presentation

2. **Quick Actions**
   - Updated component with icons
   - Better visual presentation

3. **Programme Health Table**
   - New dashboard-card container
   - Zebra striping (alternating row colors)
   - New EmptyState when no data
   - Better table header styling (bold, uppercase, muted)
   - Improved status badge appearance
   - Cleaner progress bars

4. **getStatusBadge Function**
   - Updated to use new CSS classes
   - Better visual hierarchy with emojis and proper styling

5. **Charts Section**
   - Improved visibility and spacing
   - Better loading states

---

## Dark Mode Support

All components include full dark mode support:
- Use `dark:` prefix in Tailwind for dark mode styles
- Background colors: `bg-white dark:bg-slate-800`
- Text colors: `text-slate-900 dark:text-white`
- Border colors: `border-slate-200 dark:border-slate-700`

Example dark mode badge:
```tsx
class="alert-badge-critical 
  bg-red-100 dark:bg-red-900/30 
  text-red-700 dark:text-red-300"
```

---

## Responsive Design

### Breakpoints Used

- **Mobile** (default): Full width, single column
- **md** (768px): 2 columns for grids
- **lg** (1024px): 3 columns for stats, 2 columns for charts
- **xl** (1280px): 6 columns for stats

### Key Responsive Features

- Stat cards scale from 1 → 2 → 3 → 6 columns
- Dashboard cards are full width on mobile, narrow on large screens
- Tab labels hidden on small screens, shown on md+
- Quick stats hidden on small screens

---

## How to Find and Edit Elements

### Finding Elements in VS Code

1. **Dashboard Cards**: Search for `"dashboard-card"` in globals.css
2. **Stat Cards**: Search for `"stat-card"` in StatCard.tsx and globals.css
3. **Alerts**: Search for `"alert-badge"` in DashboardAlerts.tsx and globals.css
4. **Status Badges**: Search for `"status-"` classes in page.tsx and globals.css
5. **Quick Actions**: Search for `"quick-action-btn"` in QuickActions.tsx and globals.css

### Common Customizations

**Change Primary Button Color:**
- File: `src/app/globals.css`
- Search: `.btn-primary`
- Look for: `bg-emerald-600` — change to any Tailwind color

**Change Card Border Radius:**
- File: `src/app/globals.css`
- Search: `rounded-xl` — change to `rounded-lg` or `rounded-2xl`

**Change Alert Styling:**
- File: `src/components/DashboardAlerts.tsx`
- Function: `getPriorityStyles(priority)`
- Edit the return object to change colors and styling

**Modify Table Zebra Striping:**
- File: `src/app/globals.css`
- Search: `.table-zebra tbody tr`
- Change background colors or remove striping if desired

---

## Files Modified

1. `src/app/globals.css` — Added new CSS classes and design tokens
2. `src/components/StatCard.tsx` — Completely redesigned
3. `src/components/QuickActions.tsx` — Added icons and refined styling
4. `src/components/DashboardAlerts.tsx` — Completely redesigned with new layout
5. `src/components/DashboardLayout.tsx` — Enhanced header and styling
6. `src/components/DashboardCharts.tsx` — Improved visual hierarchy and empty states
7. `src/components/EmptyState.tsx` — NEW component for consistent empty states
8. `src/app/page.tsx` — Updated layout, styling, and imports

---

## Files NOT Modified

All functionality, data flows, and business logic remain unchanged. The following files still work exactly as before:

- API endpoints and server functions
- Data fetching hooks
- Database queries
- Modal components
- Context providers
- All other page components

---

## Testing Checklist

- [ ] Dashboard stats cards display correctly with new styling
- [ ] Quick action buttons have icons and work properly
- [ ] Alerts panel shows summary badges and clean alert list
- [ ] No raw UUIDs visible in alerts
- [ ] Programme Health table has zebra striping
- [ ] Status badges are color-coded (green/amber/red)
- [ ] Empty states appear correctly when no data
- [ ] Charts display with proper titles and loading states
- [ ] Light mode looks clean and professional
- [ ] Dark mode is fully supported
- [ ] Mobile responsive design works
- [ ] All links and buttons are functional
- [ ] Performance is not impacted

---

## Next Steps for Enhancement

1. **Add animations**: Use Framer Motion for smoother transitions
2. **Add icons to table rows**: Make Programme Health more visual
3. **Interactive charts**: Add tooltips and click handlers
4. **Customizable dashboard**: Let users rearrange cards
5. **More detailed alerts**: Show more context in alert items
6. **Filter tabs**: Add filtering to alerts and recent activity
7. **Export functionality**: Add dashboard export options
8. **Keyboard shortcuts**: Add keyboard navigation improvements

---

## Notes

- All changes maintain backward compatibility
- No data structures were modified
- All existing functionality works unchanged
- CSS classes are descriptive and easy to find
- Dark mode is fully supported throughout
- Mobile responsive design is maintained
- Performance impact is minimal

---

## Contact & Support

For questions about the redesign:
- Review this document for customization options
- Search for component names in the files listed above
- Look for `/* REDESIGN: ... */` comments for major changes
- Check globals.css for all new CSS classes defined
