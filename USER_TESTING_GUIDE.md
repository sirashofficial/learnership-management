# USER TESTING GUIDE
## Learnership Management System - Assessment, Reports, Timetable Pages

**System Status**: ✅ Server Running on http://localhost:3001
**Last Updated**: 2025-02-09
**Test Date**: [INSERT DATE]
**Test Environment**: Development/Staging

---

## 🚀 Quick Start

### Login Credentials
```
Email: facilitator@example.com
Password: [Use default seeded password or ask administrator]
```

### Access the Pages
- **Assessment Page**: http://localhost:3001/assessments
- **Reports Page**: http://localhost:3001/reports
- **Timetable Page**: http://localhost:3001/timetable
- **Attendance Page**: http://localhost:3001/attendance

**Note**: If you see "Unauthorized" errors, close your browser and clear cookies, then log in again.

---

## 📋 TEST PLAN

### TEST PHASE 1: ATTENDANCE PAGE
**Purpose**: Verify attendance recording still works after UUID fix
**Time**: ~10 min
**Critical**: Yes (previous bug)

#### Test 1.1: Record Attendance
1. Go to **Attendance Page**
2. Select a group from dropdown (e.g., "Montzelity 26'")
3. Select today's date
4. Mark 3 students as "Present", 1 as "Absent", 1 as "Late"
5. Click "Save Attendance"
6. **Expected**: ✅ "Successfully saved attendance" message appears
7. **Document**: 
   - ☐ Saves without errors
   - ☐ Students appear in list
   - ☐ Status options work (Present/Absent/Late)
   - ☐ Save button is responsive

#### Test 1.2: Verify Saved Attendance
1. Select same group and date again
2. **Expected**: ✅ Previously saved attendance records appear
3. **Document**:
   - ☐ Records persist after save
   - ☐ Correct statuses displayed
   - ☐ Can edit and re-save

---

### TEST PHASE 2: ASSESSMENT PAGE - MANAGE VIEW
**Purpose**: Test unit standard CRUD and formative/summative marking
**Time**: ~15 min
**Critical**: Yes (newly built)

#### Test 2.1: View Unit Standards
1. Go to **Assessment Page**
2. Click **"Manage"** tab
3. Select a module from dropdown (e.g., "Module 1: Leadership in POPIA")
4. **Expected**: ✅ Unit standards appear in collapsible list
5. **Document**:
   - ☐ Module dropdown works
   - ☐ Unit standards load and display
   - ☐ Each standard shows: Code, Title, Credit Value
   - ☐ Formative/Summative tabs visible

#### Test 2.2: Mark Formative Assessment
1. Expand a unit standard in Manage view
2. Click on a student in the **"Formative"** tab
3. **Expected**: ✅ Formative marking modal opens
4. Fill in:
   - Evidence/Notes: "Student demonstrated competency"
   - Status: "Completed"
5. Click "Save"
6. **Document**:
   - ☐ Modal opens without errors
   - ☐ Can enter evidence/notes
   - ☐ Status options available
   - ☐ Saves successfully

#### Test 2.3: Mark Summative Assessment
1. Same unit standard, click **"Summative"** tab
2. Click on a student
3. Fill in:
   - Result: "Competent"
   - Evidence: "Met all criteria"
4. Click "Save"
5. **Expected**: ✅ Assessment saves and counter updates
6. **Document**:
   - ☐ Different modal/form from formative
   - ☐ Result options available (Competent/Not Yet Competent)
   - ☐ Saves to database

#### Test 2.4: Bulk Marking
1. In Manage view, select multiple students (3+) by checking boxes
2. Select 1 unit standard
3. Click "Mark All Selected as Completed"
4. **Expected**: ✅ All selected get marked
5. **Document**:
   - ☐ Multi-select works
   - ☐ Bulk action applies to all
   - ☐ Progress updates

---

### TEST PHASE 3: ASSESSMENT PAGE - MODERATION VIEW
**Purpose**: Test assessment review and approval workflow
**Time**: ~10 min
**Critical**: Yes (workflow requirement)

#### Test 3.1: View Pending Assessments
1. Go to **Assessment Page**
2. Click **"Moderation"** tab
3. **Expected**: ✅ Pending assessments appear in queue
4. **Document**:
   - ☐ Queue displays correctly
   - ☐ Shows: Student Name, Unit Standard, Type (Formative/Summative)
   - ☐ Status shows "Pending Review"

#### Test 3.2: Approve Assessment
1. Click on first pending assessment in queue
2. Panel opens on right showing details
3. Review student evidence/notes
4. Click **"Approve"** button
5. Add moderator note: "Well done, clear evidence"
6. Click "Confirm Approval"
7. **Expected**: ✅ Assessment status changes to "Approved"
8. **Document**:
   - ☐ Details panel readable and complete
   - ☐ Evidence/notes clearly displayed
   - ☐ Approve button works
   - ☐ Status updates in real-time

#### Test 3.3: Reject Assessment
1. Click on pending assessment with weak evidence
2. Click **"Request Revision"** 
3. Add note: "Please provide more detailed evidence"
4. Click "Send"
5. **Expected**: ✅ Status changes to "Revision Requested"
6. **Document**:
   - ☐ Revision request captures note
   - ☐ Student notified of request
   - ☐ Assessment stays in queue until resubmitted

---

### TEST PHASE 4: ASSESSMENT PAGE - PROGRESS VIEW
**Purpose**: Test student progress tracking and analytics
**Time**: ~8 min
**Critical**: No (supportive feature)

#### Test 4.1: View Student Progress
1. Go to **Assessment Page**, click **"Progress"** tab
2. Select a group
3. **Expected**: ✅ Student list with progress bars appears
4. **Document**:
   - ☐ Student list loads
   - ☐ Progress bars display correctly (0-100%)
   - ☐ Shows total credits earned

#### Test 4.2: View Module Completion
1. Scroll down to "Module Progress"
2. **Expected**: ✅ Each module shows completion percentage
3. **Document**:
   - ☐ Module names visible
   - ☐ Progress percentages accurate
   - ☐ Color coding (green=complete, yellow=in progress, red=not started)

#### Test 4.3: Click on Student for Details
1. Click on a student row
2. **Expected**: ✅ Detailed progress panel opens
3. **Document**:
   - ☐ Shows unit standards with individual statuses
   - ☐ Formative/Summative completion shown
   - ☐ Easy to see where student is struggling

---

### TEST PHASE 5: ASSESSMENT PAGE - COMPLIANCE VIEW
**Purpose**: Test missing assessment detection
**Time**: ~5 min
**Critical**: No (but important)

#### Test 5.1: View Compliance Issues
1. Go to **Assessment Page**, click **"Compliance"** tab
2. Select a group
3. **Expected**: ✅ Compliance issues listed
4. **Document**:
   - ☐ Shows students who are non-compliant
   - ☐ Lists missing assessments
   - ☐ Severity/priority indicated

#### Test 5.2: Take Compliance Action
1. Click "Mark All Missing" button for a student
2. **Expected**: ✅ Modal opens to quickly mark multiple assessments
3. **Document**:
   - ☐ Modal shows missing assessments
   - ☐ Can select multiple to mark
   - ☐ Marks them as "Not Yet Competent" or completes them

---

### TEST PHASE 6: ASSESSMENT PAGE - EXPORT VIEW
**Purpose**: Test data export functionality
**Time**: ~5 min
**Critical**: No (nice-to-have)

#### Test 6.1: Export to PDF
1. Go to **Assessment Page**, click **"Export"** tab
2. Select Group
3. Click "Export as PDF"
4. **Expected**: ✅ PDF downloads with assessment data
5. **Document**:
   - ☐ File downloads successfully
   - ☐ Can open in PDF reader
   - ☐ Includes student names, unit standards, results

#### Test 6.2: Export to CSV
1. Same page, click "Export as CSV"
2. **Expected**: ✅ CSV file downloads
3. **Document**:
   - ☐ File downloads
   - ☐ Can open in Excel
   - ☐ All data present in columns

---

### TEST PHASE 7: ASSESSMENT PAGE - ANALYTICS VIEW
**Purpose**: Test charts and statistics
**Time**: ~5 min
**Critical**: No (visualization)

#### Test 7.1: View Summary Statistics
1. Go to **Assessment Page**, click **"Analytics"** tab
2. **Expected**: ✅ Summary cards appear showing:
   - Total assessments
   - Completion rate
   - Pass rate
   - Average credits
3. **Document**:
   - ☐ Cards load and display numbers
   - ☐ Numbers seem reasonable
   - ☐ Color coding (green=good, red=needs attention)

#### Test 7.2: View Charts
1. Scroll down to charts section
2. **Expected**: ✅ Pie chart and bar charts render
3. **Document**:
   - ☐ Unit standard pass rate pie chart appears
   - ☐ Assessment type distribution bar chart visible
   - ☐ Charts interactive (hover for details)

---

### TEST PHASE 8: REPORTS PAGE
**Purpose**: Test report generation (standard and AI)
**Time**: ~15 min
**Critical**: Yes (core feature)

#### Test 8.1: Generate Standard Report
1. Go to **Reports Page**
2. Fill in form:
   - **Date**: Today (2025-02-09)
   - **Group**: "Montzelity 26'"
   - **Facilitator**: (auto-filled)
   - **Modules**: Select 1-2 modules
   - **Topics**: "Database Design, Advanced SQL"
   - **Activities**: "Lab exercise, Group discussion"
   - **Observations**: "Class showed good engagement"
3. Click "Generate Report"
4. **Expected**: ✅ Modal opens with PDF preview
5. **Document**:
   - ☐ Form validates correctly
   - ☐ Modal opens with report
   - ☐ Report shows:
     - Date and group name
     - Attendance summary (present/absent/late)
     - Assessments completed
     - Topics covered

#### Test 8.2: Download Standard Report
1. In the report modal, click "Download PDF"
2. **Expected**: ✅ PDF downloads to computer
3. **Document**:
   - ☐ File downloads successfully
   - ☐ Filename includes date and group name
   - ☐ Opens in PDF reader

#### Test 8.3: Generate AI-Enhanced Report
1. Go back to Reports page
2. Fill same form again
3. Click "Generate AI Report"
4. Wait 2-3 seconds for AI processing
5. **Expected**: ✅ Modal opens with AI-generated markdown report
6. **Document**:
   - ☐ AI processes without errors
   - ☐ Report includes:
     - Professional summary
     - Key insights from attendance/assessments
     - Recommendations
     - Exemplar comparison
   - ☐ Format is readable markdown

#### Test 8.4: Copy AI Report
1. In AI report modal, click "Copy to Clipboard"
2. Open a text editor, paste (Ctrl+V)
3. **Expected**: ✅ Full markdown report appears
4. **Document**:
   - ☐ Copy function works
   - ☐ Markdown formatting preserved
   - ☐ Can be pasted into documents

---

### TEST PHASE 9: TIMETABLE PAGE - WEEK VIEW
**Purpose**: Test lesson scheduling
**Time**: ~20 min
**Critical**: Yes (core feature)

#### Test 9.1: View Week Schedule
1. Go to **Timetable Page**
2. Verify week view shows:
   - Current week dates
   - Two venues: "Lecture Room" and "Computer Lab"
   - Time slot: 09:00 - 14:00
3. **Expected**: ✅ Schedule visible with all details
4. **Document**:
   - ☐ Week view displays correctly
   - ☐ Navigation (Previous/Next/Today) works
   - ☐ Groups appear with color coding

#### Test 9.2: Create Lesson
1. Click on "Lecture Room" column, Monday
2. **Expected**: ✅ "Add Lesson" modal opens
3. Fill in:
   - **Group**: "Azelis 25'"
   - **Facilitator**: Select from dropdown
   - **Module**: "Module 1: Leadership"
   - **Topic**: "Team dynamics workshop"
4. Click "Create Lesson"
5. **Expected**: ✅ Lesson appears in calendar
6. **Document**:
   - ☐ Modal form clear and usable
   - ☐ All fields validate
   - ☐ Lesson appears immediately in week view

#### Test 9.3: Edit Lesson
1. Click on created lesson
2. **Expected**: ✅ Lesson detail modal opens
3. Change topic to: "Advanced team management"
4. Click "Save Changes"
5. **Expected**: ✅ Lesson updates in calendar
6. **Document**:
   - ☐ Detail modal shows all info
   - ☐ Edit functionality works
   - ☐ Changes persist

#### Test 9.4: Delete Lesson
1. Open a lesson detail modal
2. Click "Delete Lesson"
3. **Expected**: ✅ Confirmation dialog appears
4. Click "Confirm Delete"
5. **Expected**: ✅ Lesson disappears from calendar
6. **Document**:
   - ☐ Delete confirmation appears
   - ☐ Lesson removed after confirmation

#### Test 9.5: Assign Multiple Groups to Same Slot
1. Click on "Computer Lab" Monday slot
2. Add lesson for "Azelis 25'"
3. Click same slot again
4. Add lesson for "Wahl 25'"
5. **Expected**: ✅ Both groups appear in same slot
6. **Document**:
   - ☐ Can add multiple lessons to same time
   - ☐ Both groups visible with separate colors
   - ☐ No conflicts or overwrites

---

### TEST PHASE 10: TIMETABLE PAGE - MONTH VIEW
**Purpose**: Test month-level scheduling
**Time**: ~5 min
**Critical**: No (alternative view)

#### Test 10.1: Switch to Month View
1. Go to Timetable page
2. Click "Month" button at top
3. **Expected**: ✅ Calendar month view appears
4. **Document**:
   - ☐ Current month displayed
   - ☐ Days with lessons marked
   - ☐ Navigation (Previous/Next month) works

#### Test 10.2: View Lessons in Month View
1. Click on any day with lessons
2. **Expected**: ✅ Lessons for that day appear
3. **Document**:
   - ☐ Quick view of day's schedule
   - ☐ Can edit/delete from here
   - ☐ Easy month-level planning

---

### TEST PHASE 11: TIMETABLE PAGE - RECURRING SESSIONS
**Purpose**: Test recurring lesson templates
**Time**: ~10 min
**Critical**: No (advanced feature)

#### Test 11.1: View Recurring Sessions
1. Go to Timetable page
2. Look for "Montzelity 26'" in week view
3. **Expected**: ✅ Shows as recurring (indicator or note)
4. **Document**:
   - ☐ Recurring sessions visible
   - ☐ Clear which are one-time vs recurring

#### Test 11.2: Override Recurring Session
1. Click on a Monday "Montzelity 26'" lesson
2. Look for "Create Override" option
3. Click it
4. Set:
   - **Status**: "Cancelled"
   - **Reason**: "Public holiday"
5. Click "Save"
6. **Expected**: ✅ That specific Monday shows as cancelled
7. **Document**:
   - ☐ Override option available
   - ☐ Cancellation recorded
   - ☐ Other weeks still show recurring lesson

---

## 🧪 CRITICAL TEST FLOWS

### Flow 1: Complete Assessment Marking Cycle
**Objective**: Mark a student's complete assessment journey
**Time**: ~15 min

1. **Setup**: Student: John Doe, Unit Standard: SSETA-101
2. **Step 1**: Go to Assessment → Manage
3. **Step 2**: Mark Formative (evidence: "Completed lab exercises")
4. **Step 3**: Mark Summative (result: "Competent")
5. **Step 4**: Go to Moderation, approve both
6. **Step 5**: Check Compliance view - should show complete
7. **Step 6**: View Progress view - should show 100% for this unit
8. **Expected**: ✅ All statuses consistent across views
9. **Document**:
   - ☐ Formative and summative both saved
   - ☐ Moderation approves both
   - ☐ Compliance shows as complete
   - ☐ Progress bars updated

### Flow 2: Daily Report Generation with Attendance & Assessments
**Objective**: Generate report after marking attendance and assessments
**Time**: ~20 min

1. **Setup**: Group: "Montzelity 26'", Date: 2025-02-09
2. **Step 1**: Go to Attendance, mark 15 present, 2 absent, 1 late
3. **Step 2**: Go to Assessment → Manage, mark 5 students' formative assessments
4. **Step 3**: Go to Reports page
5. **Step 4**: Fill form (date, group, modules, observations)
6. **Step 5**: Generate Standard Report
7. **Expected**: ✅ Report shows:
   - 15 present, 2 absent, 1 late
   - 5 formative assessments recorded
   - Today's date and group name
8. **Document**:
   - ☐ Attendance data in report
   - ☐ Assessment data in report
   - ☐ Numbers match what was entered

### Flow 3: Weekly Lesson Schedule with Multiple Groups
**Objective**: Create complete week schedule
**Time**: ~15 min

1. **Setup**: Create lessons for 3 groups across week
2. **Monday**: "Montzelity 26'" in Lecture Room
3. **Tuesday**: "Azelis 25'" in Computer Lab
4. **Wednesday**: "Wahl 25'" in Lecture Room + "Packaging World 25'" in same room
5. **Thursday**: "Flint Group 25'" in Computer Lab
6. **Friday**: No lessons
7. **Expected**: ✅ All lessons visible in week view
8. **Document**:
   - ☐ All 5 lessons created
   - ☐ Multiple groups on Wednesday display correctly
   - ☐ Week view shows full picture
   - ☐ Switch to month view - see all lessons

---

## 📊 SUCCESS CRITERIA

### Assessment Page
- ✅ All 7 views load without errors
- ✅ Manage: Can CRUD unit standards and mark assessments
- ✅ Moderation: Can approve/reject assessments
- ✅ Progress: Shows accurate student progress
- ✅ Compliance: Detects missing assessments
- ✅ Export: PDF/CSV downloads work
- ✅ Analytics: Charts render and are accurate

### Reports Page
- ✅ Standard report generates successfully
- ✅ PDF downloads to computer
- ✅ AI report generates (if services available)
- ✅ Report includes attendance and assessment data
- ✅ Copy-to-clipboard works for markdown

### Timetable Page
- ✅ Week view displays all lessons
- ✅ Can create, edit, delete lessons
- ✅ Multiple groups can share same time slot
- ✅ Month view shows calendar
- ✅ Recurring sessions work with overrides
- ✅ Navigation (Prev/Next/Today) works

### General
- ✅ No console errors (F12 Developer Tools)
- ✅ No TypeScript warnings
- ✅ Data persists after page refresh
- ✅ Responsive design on different screen sizes
- ✅ Fast load times (<1 second per page)

---

## 🐛 ISSUE REPORTING

If you find any issues during testing:

### For Each Issue, Document:
1. **Page**: Which page (Assessment/Reports/Timetable)
2. **View/Feature**: Specific section (e.g., "Moderation tab")
3. **Steps to Reproduce**: Clear step-by-step
4. **Expected Behavior**: What should happen
5. **Actual Behavior**: What actually happened
6. **Screenshot**: If visual issue
7. **Console Error**: Open F12, look for red errors
8. **Browser**: Chrome/Firefox/Edge version
9. **Severity**: Critical/High/Medium/Low

### Example Issue Report
```
Page: Assessment
View: Moderation Tab
Steps:
  1. Go to Assessment page
  2. Click Moderation tab
  3. Click on first pending assessment
  
Expected: Details panel opens on right
Actual: Panel doesn't appear, console shows error
Error: "Cannot read property 'id' of undefined"
Severity: Critical
```

---

## 🎯 TEST CHECKLIST

### Pre-Testing
- [ ] Server running on localhost:3001
- [ ] Developer tools open (F12) to check console
- [ ] Test user logged in successfully
- [ ] Database has test data (46 students, 9 groups, etc.)

### During Testing
- [ ] Using Chrome/Firefox/Safari (test browser compatibility)
- [ ] Testing on desktop (1920x1080) and tablet (768px)
- [ ] Recording any errors or unexpected behavior
- [ ] Testing with actual data, not just empty states

### Post-Testing
- [ ] All critical features working
- [ ] No blocker issues found
- [ ] Performance acceptable (<1 sec loads)
- [ ] Sign-off on system readiness

---

## 📱 BROWSER COMPATIBILITY

Test using:
- [ ] Chrome (Latest) - Primary
- [ ] Firefox (Latest) - Secondary
- [ ] Safari (Latest) - if Mac available
- [ ] Edge (Latest) - if Windows

**Min Requirements**: ES6 JavaScript, CSS Grid, CSS Flexbox

---

## 🎓 TRAINING NOTES

### Key Workflows for Users
1. **Mark Attendance**: Daily task, simple interface
2. **Mark Assessments**: Mark formative, wait for student revisions, mark summative
3. **Moderate Assessments**: Review submitted assessments, approve/reject
4. **Generate Reports**: Daily routine, includes attendance + assessments
5. **Schedule Lessons**: Plan lessons for groups, recurring templates

### Tips for Success
- Use formative assessments while teaching (ongoing)
- Formative evidence helps students improve before summative
- Moderation ensures consistency and quality
- Reports capture daily progress for accountability
- Schedule stays visible to all stakeholders

---

**Test Session Started**: ________________
**Tester Name**: ________________
**Issues Found**: ☐ None  ☐ 1-2  ☐ 3-5  ☐ 5+
**System Ready for Production**: ☐ Yes  ☐ No (fix issues first)
**Sign-Off**: ________________  Date: ________________
