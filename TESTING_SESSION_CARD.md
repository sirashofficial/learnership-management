# 🧪 USER TESTING SESSION - QUICK START

**Status**: ✅ Application Running
**URL**: http://localhost:3001
**Database**: Seeded (46 students, 9 groups, 6 modules, 26 unit standards)
**Current Date**: 2025-02-09

---

## 🚀 START HERE

### 1. **Login**
   - If not logged in, you'll see login page
   - Default credentials (or use your own):
     - Email: `facilitator@example.com`
     - Password: (check with admin or use seeding default)

### 2. **Choose Your Testing Path**

#### 🟢 **FAST PATH** (30 minutes)
Best for quick validation:
- ✅ **Attendance** (5 min): Record attendance, verify save
- ✅ **Assessment - Manage** (10 min): Mark formative and summative
- ✅ **Reports** (8 min): Generate standard report
- ✅ **Timetable** (7 min): Create 2-3 lessons
- **Outcome**: Verify core functionality works

#### 🟡 **STANDARD PATH** (60 minutes)
Comprehensive testing:
- ✅ Attendance (5 min)
- ✅ Assessment (all 7 views) (25 min)
- ✅ Reports (standard + AI) (15 min)
- ✅ Timetable (15 min)
- **Outcome**: Full feature validation

#### 🟠 **COMPLETE PATH** (90-120 minutes)
Thorough testing including edge cases:
- ✅ All above (60 min)
- ✅ Multi-user flows (10 min)
- ✅ Performance testing (10 min)
- ✅ Browser compatibility (10-20 min)
- **Outcome**: Production readiness approval

---

## 📋 TEST CHECKLIST (Quick Reference)

### Phase 1: Attendance ✓
- [ ] Record attendance for group
- [ ] Save works without errors
- [ ] Attendance persists after refresh

### Phase 2: Assessment Manage ✓
- [ ] Can see unit standards
- [ ] Can mark formative assessment
- [ ] Can mark summative assessment
- [ ] Bulk marking works

### Phase 3: Assessment Moderation ✓
- [ ] Pending assessments visible
- [ ] Can approve assessment
- [ ] Can request revision

### Phase 4: Assessment Progress ✓
- [ ] Student progress bars visible
- [ ] Module completion shown
- [ ] Numbers are accurate

### Phase 5: Assessment Export ✓
- [ ] PDF export works
- [ ] CSV export works

### Phase 6: Reports ✓
- [ ] Standard report generates
- [ ] PDF downloads
- [ ] AI report generates (if available)

### Phase 7: Timetable ✓
- [ ] Can create lesson
- [ ] Can edit lesson
- [ ] Can delete lesson
- [ ] Multiple groups work

### Phase 8: General ✓
- [ ] No console errors (F12)
- [ ] Pages load quickly
- [ ] Responsive design works

---

## 🎯 CURRENT TEST FOCUS

### Today's Test Objectives
1. ✅ Verify Attendance bug is fixed
2. ✅ Confirm Assessment page fully functional
3. ✅ Validate Report generation working
4. ✅ Test Timetable scheduling
5. ✅ Identify any new issues

### Expected Outcome
**System Ready for Production** (assuming no critical bugs)

---

## 🔗 Navigation Shortcuts

### Main Pages
```
http://localhost:3001/attendance         → Record attendance
http://localhost:3001/assessments        → Mark assessments
http://localhost:3001/reports            → Generate reports
http://localhost:3001/timetable          → Schedule lessons
http://localhost:3001/students           → Student management
http://localhost:3001/groups             → Group management
http://localhost:3001/curriculum         → Curriculum/modules
```

### Test Data Available
- **Groups**: Montzelity 26', Azelis 25', Beyond Insights 26', etc. (9 total)
- **Students**: 46 students distributed across groups
- **Modules**: Module 1-6 (SSETA NVC Level 2)
- **Unit Standards**: 26 standards across all modules

---

## 🐛 DEBUG MODE

### Open Developer Tools
Press `F12` and look at:
- **Console**: Red errors indicate issues
- **Network**: Check API response times
- **Application**: View local storage/cookies

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Unauthorized" error | Clear cookies, log back in |
| Pages won't load | Refresh browser (Ctrl+R) |
| Buttons not responding | Check console for errors |
| Data not saving | Check network tab for API errors |
| Slow loading | Check network tab for slow requests |

---

## 📊 TEST DATA REFERENCE

### Seeded Sample Data
```
Groups (9):
  - Montzelity 26' (5 students)
  - Azelis 25' (5 students)
  - Beyond Insights 26' (4 students)
  - City Logistics 26' (4 students)
  - Monteagle 25' (5 students)
  - Kelpack 25' (5 students)
  - Flint Group 25' (5 students)
  - Wahl 25' (4 students)
  - Packaging World 25' (4 students)

Modules (6):
  1. Leadership in POPIA
  2. SQL Database Skills
  3. Data Analytics Fundamentals
  4. Project Management Basics
  5. Communication & Collaboration
  6. Problem Solving & Critical Thinking

Unit Standards per Module:
  - 3-5 standards per module
  - Total: 26 standards
  - Each with assessmentMethod and creditValue

Students:
  - 46 students total
  - Distributed across 9 groups
  - Each with email, phone, ID number
  - Status: Active
```

---

## ✅ SUCCESS CRITERIA

For **System to be Production Ready**, ALL of these must pass:

### Critical (Must Have)
- ✅ Attendance records without error
- ✅ Assessment marking (formative + summative) works
- ✅ Assessments persist to database
- ✅ Moderation workflow completes
- ✅ Reports generate without errors
- ✅ Timetable creates/edits/deletes lessons
- ✅ No console JavaScript errors

### Important (Should Have)
- ✅ Multi-user concurrent testing works
- ✅ Page load times < 1 second
- ✅ Export functions work (PDF/CSV)
- ✅ Responsive design (desktop, tablet)
- ✅ Browser compatibility (Chrome, Firefox)

### Nice-to-Have
- ✅ AI reports generate (optional)
- ✅ Performance meets benchmarks
- ✅ Mobile responsive design
- ✅ Accessibility features work

---

## 🎓 TEST SCENARIOS

### Scenario 1: New Assessment (5 min)
1. Go to Assessment → Manage
2. Choose a unit standard
3. Pick a student
4. Mark formative (add evidence)
5. Mark summative (result: competent)
6. Go to Moderation, approve
7. Check Compliance view - shows complete

**Success**: All statuses match across views ✓

### Scenario 2: Daily Report (10 min)
1. Go to Attendance
2. Mark 20 students present
3. Go to Assessment
4. Mark 5 formative assessments
5. Go to Reports
6. Generate standard report
7. Report shows correct attendance & assessment counts

**Success**: Report data accurate ✓

### Scenario 3: Weekly Schedule (10 min)
1. Go to Timetable
2. Create Monday lesson: Montzelity 26'
3. Create Tuesday lesson: Azelis 25'
4. Create Wednesday: Wahl 25' + Packaging World 25' (same slot)
5. View week - all 4 lessons visible

**Success**: Multiple groups in same slot work ✓

---

## 📞 NEED HELP?

### If pages show "Unauthorized"
```bash
1. Close browser tab
2. Clear cookies (Settings → Privacy → Clear Browsing Data)
3. Go back to localhost:3001
4. Log in again
```

### If data doesn't save
```bash
1. Open F12 Developer Tools
2. Go to Network tab
3. Try saving again
4. Check what response API returns
5. Look for error messages
```

### If pages are slow
```bash
1. Open F12 Network tab
2. Reload page
3. Check which requests are slow
4. Report slow endpoints
```

---

## 🎯 NEXT STEPS

**After Testing:**
1. Document any issues found
2. Note severity (Critical/High/Medium/Low)
3. Report to development team
4. If no critical issues → Approve for production
5. If issues found → Fix and re-test

---

## ✨ TEST SESSION INFO

- **Date**: 2025-02-09
- **Tester**: [Your Name]
- **Environment**: Staging (localhost:3001)
- **Duration Target**: 30-120 min (depending on path)
- **Browser**: Chrome recommended (test others too)

---

**Ready to start? → Click on navigation buttons above or use shortcuts**

**Questions? → Check USER_TESTING_GUIDE.md for detailed steps**

**Found a bug? → Note the page, steps, and expected vs actual behavior**

---

*System is ready for comprehensive testing. Proceed with selected test path.*
