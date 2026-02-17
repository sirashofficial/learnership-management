# YEHA User Guide

**YEHA - Youth Education & Skills Management**  
Version 1.0 | February 2026

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Students Management](#students-management)
4. [Groups Management](#groups-management)
5. [Attendance Tracking](#attendance-tracking)
6. [Assessments](#assessments)
7. [Timetable & Sessions](#timetable--sessions)
8. [Progress Tracking](#progress-tracking)
9. [Reports](#reports)
10. [Settings](#settings)
11. [Troubleshooting](#troubleshooting)

---

## Getting Started

### What is YEHA?

YEHA is a comprehensive learning management system designed for SSETA NVC Level 2 training programs. It helps coordinators, facilitators, and administrators manage:

- **Student enrollment** and tracking
- **Group management** and rollout plans
- **Attendance** monitoring
- **Assessment** submissions and moderation
- **Timetable** scheduling
- **Compliance** reporting

### Logging In

1. Navigate to your YEHA instance URL
2. Enter your **email** and **password**
3. Click **Login**

**Default Credentials (First Time Setup):**
- Email: `admin@yeha.com`
- Password: `Admin123!`

⚠️ **Important:** Change your password immediately after first login in Settings → Profile.

### User Interface Overview

The system has three main areas:

1. **Sidebar (Left):** Main navigation menu
2. **Header (Top):** Search, notifications, and user profile
3. **Main Content:** Active page content

**Keyboard Shortcuts:**
- `Ctrl + K` (or `Cmd + K` on Mac): Open search
- `Tab`: Navigate between elements
- `Enter` / `Space`: Activate buttons
- `Esc`: Close modals

---

## Dashboard

The dashboard provides a quick overview of your learnership program.

### Key Metrics

**Top Statistics:**
- **Total Students:** Number of enrolled students
- **Total Groups:** Number of active groups
- **Attendance Rate:** Overall attendance percentage
- **Pending Assessments:** Assessments awaiting review

**Click any stat card** to view detailed information.

### Today's Schedule

Shows all scheduled sessions for today:
- **Session time** and duration
- **Group name** and facilitator
- **Module** being taught
- **Quick actions:** Mark attendance, view details

### Programme Health

Visual indicators showing each group's progress:
- 🚀 **Ahead:** Group is ahead of schedule
- ✅ **On Track:** Group is progressing as planned
- ⚠️ **Behind:** Group needs attention

### Recent Activity

Real-time feed of system events:
- Student enrollments
- Assessment submissions
- Attendance updates
- Group changes

---

## Students Management

### Viewing Students

**Access:** Sidebar → Students

**View Modes:**
- **Table View:** Detailed list with sorting and filtering
- **Grid View:** Card-based layout for visual overview

### Adding a New Student

1. Click **+ Add Student** button
2. Fill in required fields:
   - **Full Name** (required)
   - **Training Group** (required)
   - **Student ID** (optional - auto-generated if empty)
   - **Email** (optional)
   - **Phone** (optional)
   - **Status:** Active, At Risk, Completed, or Withdrawn
3. Click **Save**

**Student ID Format:** Auto-generated as `{GroupCode}-{Number}` (e.g., AZ-01, BE-03)

### Editing Student Information

1. Click the **pencil icon** on any student card
2. Update the information
3. Click **Save Changes**

### Viewing Student Progress

Click on any student card to open the detailed progress modal:

**Personal Information:**
- Name, ID, email, phone
- Current group and status
- Enrollment date

**Progress Summary:**
- Overall completion percentage
- Module-by-module breakdown
- Credit accumulation (earned / total)

**Attendance:**
- Attendance rate
- Present, absent, late, excused counts
- Compliance status

**Assessments:**
- Completed vs pending
- Results by module
- Submission dates

### Filtering Students

**By Group:** Select a group from the dropdown  
**By Status:** Active, At Risk, Completed, Withdrawn  
**By Progress:** 0-25%, 26-50%, 51-75%, 76-100%  
**By Module:** Filter by specific module enrollment  
**By Alert:** Show only students with progress alerts

**Search:** Type student name or ID in the search box

### Bulk Actions

1. Select multiple students (checkboxes)
2. Choose action:
   - **Bulk Assessment:** Create assessments for selected students
   - **Email Selected:** Send group email
   - **Archive:** Move to archive (if completed)

### Student Alerts

The system automatically flags students who need attention:

- 🔴 **Critical Risk:** No progress in 14+ days
- 🟡 **At Risk:** No progress in 7-13 days  
- 🔵 **Behind Schedule:** Progress below expected
- 🟢 **On Track:** Normal progress

---

## Groups Management

### Understanding Groups

Groups represent training cohorts. Each group has:
- **Name:** e.g., "Allandale Group A"
- **Code:** Short identifier (e.g., "AZ", "BE")
- **Start/End Dates:** Training period
- **Rollout Plan:** Module schedule
- **Students:** Enrolled learners
- **Facilitator:** Assigned trainer

### Creating a New Group

1. Click **+ Create Group**
2. Enter details:
   - **Group Name** (required)
   - **Code** (2-3 letters, required)
   - **Start Date** (required)
   - **End Date** (required)
   - **Facilitator** (optional)
3. Click **Create**

### Rollout Plans

Rollout plans define the module delivery schedule.

**Auto-Generate:** Click **Generate Rollout Plan** to create automatically  
**Manual Entry:** Click **Edit Rollout** to customize dates

**Rollout Plan Columns:**
- **Module:** Module number and name
- **Start Date:** When module begins
- **End Date:** When module ends
- **Credits:** Module credit value
- **Status:** Not Started, In Progress, Completed

### Assigning Students to Groups

**During Student Creation:** Select group from dropdown  
**Bulk Assignment:**
1. Go to Groups page
2. Select a group
3. Click **Add Student**
4. Choose from existing students or create new

### Group Progress Tracking

View group-level statistics:
- **Total Students:** Number enrolled
- **Average Progress:** Group completion percentage
- **Attendance Rate:** Group average
- **Module Status:** Current module being taught

---

## Attendance Tracking

### Marking Attendance

**Method 1: From Timetable**
1. Go to Timetable page
2. Click on a session
3. Click **Mark Attendance**
4. Select status for each student:
   - ✅ Present
   - ❌ Absent
   - 🕐 Late
   - 📝 Excused
5. Add notes (optional)
6. Click **Save**

**Method 2: From Dashboard**
1. Click **Mark Attendance** on today's session
2. Follow steps above

**Method 3: From Sessions**
1. Go to Attendance page
2. Click session date
3. Mark attendance

### Attendance Reports

**Individual Reports:**
- Go to Students page
- Click student card
- View "Attendance" tab

**Group Reports:**
- Go to Groups page
- Select group
- View attendance statistics

**Compliance Status:**
- 🟢 **Compliant:** ≥80% attendance
- 🟡 **Warning:** 70-79% attendance
- 🔴 **Critical:** <70% attendance

### Bulk Attendance

For recurring sessions:
1. Create recurrence pattern
2. System auto-generates sessions
3. Mark attendance per session

---

## Assessments

### Types of Assessments

1. **Formative:** Ongoing assessments for learning
2. **Summative:** Final module assessments
3. **POE (Portfolio of Evidence):** Document submissions

### Creating an Assessment

1. Go to Assessments page
2. Click **+ Create Assessment**
3. Fill in details:
   - **Title** (required)
   - **Description**
   - **Module** (required)
   - **Students** (select one or multiple)
   - **Due Date**
   - **Type:** Formative / Summative / POE
   - **Credits:** Credit value
4. Click **Create**

### Assessment Workflow

```
Draft → Submitted → Under Review → Moderated → Finalized
```

**Status Meanings:**
- **Draft:** Not yet submitted
- **Submitted:** Awaiting review
- **Under Review:** Being reviewed by facilitator
- **Moderated:** Passed moderation
- **Finalized:** Complete and recorded

### Marking Assessments

1. Go to Assessments page
2. Filter by **Pending** status
3. Click assessment card
4. Enter:
   - **Result:** Competent / Not Yet Competent / Absent
   - **Marks** (if applicable)
   - **Feedback**
5. Click **Save**

### Moderation

For assessments requiring moderation:
1. Go to Moderation page
2. View assessments needing moderation
3. Review and approve/reject
4. Add moderator comments
5. Submit moderation decision

### POE Management

**Upload Documents:**
1. Go to POE page
2. Select student and module
3. Click **Upload**
4. Drag files or click to browse
5. Add description
6. Click **Upload**

**Supported Formats:** PDF, DOC, DOCX, JPG, PNG (max 10MB)

---

## Timetable & Sessions

### Monthly Calendar View

Shows all scheduled sessions by date:
- Click a day to view sessions
- Color-coded by group
- Icons indicate session type

### Creating a Session

1. Click **+ Schedule Session**
2. Enter details:
   - **Group** (required)
   - **Module** (required)
   - **Date** (required)
   - **Start Time** (required)
   - **Duration** (required)
   - **Facilitator**
   - **Location**
   - **Notes**
3. Click **Save**

### Recurring Sessions

For regular weekly sessions:
1. Click **Create Recurring**
2. Select:
   - **Days of week** (Mon-Fri)
   - **Start date**
   - **End date** (or number of occurrences)
   - **Time and duration**
3. Click **Generate**

System creates all sessions automatically.

### Editing Sessions

**Single Session:**
1. Click session
2. Click **Edit**
3. Make changes
4. Click **Save**

**Recurring Series:**
1. Click any session in series
2. Choose:
   - **This session only**
   - **This and following**
   - **All in series**
3. Make changes
4. Click **Save**

### Canceling Sessions

1. Click session
2. Click **Cancel Session**
3. Choose notification:
   - Email students
   - Don't notify
4. Confirm cancellation

---

## Progress Tracking

### Module Progression

View detailed progress by module:
- **Not Started:** Module not yet begun
- **In Progress:** Currently being taught
- **Completed:** Module finished

### Credit Tracking

The system tracks:
- **Earned Credits:** From completed assessments
- **Total Credits:** Required for qualification (120)
- **Progress Percentage:** Earned / Total × 100

### Rollout Plan Alignment

Compare actual progress vs planned schedule:
- Green: On schedule
- Yellow: Minor delays
- Red: Significant delays

### Generating Progress Reports

1. Go to Reports page
2. Select **Progress Report**
3. Choose:
   - **Student or Group**
   - **Date Range**
   - **Report Type**
4. Click **Generate**
5. Download as PDF or Excel

---

## Reports

### Available Reports

1. **Group Progress Report**
   - Overall group statistics
   - Module completion rates
   - Attendance summaries

2. **Student Progress Report**
   - Individual student details
   - Assessment results
   - Credit accumulation

3. **Attendance Report**
   - Daily/weekly/monthly attendance
   - Compliance status
   - Absence patterns

4. **Assessment Report**
   - Submitted vs pending
   - Pass/fail rates
   - Moderation status

5. **Compliance Report**
   - SETA requirements
   - Attendance compliance
   - Assessment compliance

### Exporting Reports

**PDF Format:**
- Best for printing
- Fixed layout
- Includes charts

**Excel Format:**
- For data analysis
- Editable
- Pivot table compatible

**CSV Format:**
- Raw data
- Importable to other systems

### Scheduling Automated Reports

1. Go to Settings → Reports
2. Click **Schedule Report**
3. Configure:
   - Report type
   - Frequency (daily, weekly, monthly)
   - Recipients (email addresses)
   - Format (PDF/Excel)
4. Click **Save**

---

## Settings

### Profile Settings

**Access:** Header (top right) → Settings → Profile

**Update:**
- Name
- Email
- Phone
- Password
- Avatar

### System Settings

**Access:** Settings → System (Admin only)

**Configure:**
- **Organization Details:** Name, logo, contact info
- **Academic Year:** Start/end dates
- **Compliance Thresholds:** Attendance minimums
- **Email Settings:** SMTP configuration

### Notification Settings

**Access:** Settings → Notifications

**Configure:**
- Email notifications on/off
- Push notifications (if enabled)
- Notification types:
  - Student enrollments
  - Assessment submissions
  - Attendance alerts
  - Low attendance warnings

### Appearance Settings

**Access:** Settings → Appearance

**Configure:**
- **Theme:** Light / Dark / System
- **Color Scheme:** Default / Custom
- **Font Size:** Small / Medium / Large
- **Sidebar:** Expanded / Collapsed

### Security Settings

**Access:** Settings → Security (Admin only)

**Configure:**
- **Password Policy:** Length, complexity requirements
- **Session Timeout:** Auto-logout after inactivity
- **Two-Factor Authentication:** Enable/disable
- **API Access:** Generate API keys

---

## Troubleshooting

### Common Issues

#### Cannot Login

**Solutions:**
1. Check email and password are correct
2. Try password reset if forgotten
3. Clear browser cache and cookies
4. Try a different browser
5. Contact system administrator

#### Students Not Showing

**Solutions:**
1. Check filters are not too restrictive
2. Clear search query
3. Refresh the page
4. Check if students are archived

#### Attendance Not Saving

**Solutions:**
1. Check internet connection
2. Ensure required fields are filled
3. Try saving again
4. Contact support if persists

#### Reports Not Generating

**Solutions:**
1. Check date range is valid
2. Ensure data exists for selected period
3. Try different export format
4. Clear browser cache

### Browser Requirements

**Supported Browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Recommended:** Latest version of Chrome or Firefox

### Performance Tips

1. **Close unused tabs** to free memory
2. **Clear cache** monthly
3. **Use filters** instead of loading all data
4. **Limit date ranges** in reports
5. **Archive old data** regularly

### Getting Help

**In-App Help:**
- Click **?** icon in header
- View contextual help tooltips

**Documentation:**
- Check this user guide
- Review FAQ section
- Watch video tutorials (if available)

**Support:**
- Email: support@yeha.com
- Phone: [Your support number]
- Hours: Monday-Friday, 8:00-17:00

### Data Backup

**Automatic Backups:** System backs up daily at midnight  
**Manual Backup:** Settings → System → Backup Now  
**Restore:** Contact system administrator

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Open search |
| `Tab` | Navigate forward |
| `Shift + Tab` | Navigate backward |
| `Enter` | Activate button |
| `Space` | Select checkbox |
| `Esc` | Close modal/dialog |
| `/` | Focus search (from anywhere) |

---

## Glossary

- **Assessment:** Evaluation of student learning
- **Competent:** Passed assessment standard
- **Credit:** Unit of learning value (120 total for NVC Level 2)
- **Facilitator:** Trainer/instructor
- **Formative:** Ongoing assessment for learning
- **Moderation:** Quality assurance review
- **Not Yet Competent:** Did not meet assessment standard
- **POE:** Portfolio of Evidence
- **Rollout Plan:** Module delivery schedule
- **SSETA:** Services Sector Education and Training Authority
- **Summative:** Final assessment
- **Unit Standard:** Specific learning outcome

---

## Quick Reference Card

### Daily Tasks Checklist

☐ Check today's schedule (Dashboard)  
☐ Mark attendance for completed sessions  
☐ Review pending assessments  
☐ Respond to student alerts  
☐ Check notifications

### Weekly Tasks Checklist

☐ Generate attendance report  
☐ Review group progress  
☐ Update rollout plans if needed  
☐ Complete pending assessments  
☐ Archive completed students

### Monthly Tasks Checklist

☐ Generate compliance report  
☐ Review system settings  
☐ Plan next month's timetable  
☐ Backup important data  
☐ Review user access permissions

---

**Need more help?** Contact your system administrator or email support@yeha.com

**Documentation Version:** 1.0 (February 2026)  
**Last Updated:** February 17, 2026
