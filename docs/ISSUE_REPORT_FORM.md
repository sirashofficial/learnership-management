# ISSUE REPORT FORM
## Testing Session: [INSERT DATE]

---

## Issue #1

### Basic Info
- **Test Date**: _______________
- **Tester Name**: _______________
- **Browser**: â˜ Chrome â˜ Firefox â˜ Safari â˜ Edge â˜ Other: _______
- **Screen Size**: â˜ Desktop (1920x) â˜ Tablet (768x) â˜ Mobile (375x)

### Issue Location
- **Page**: â˜ Attendance â˜ Assessment â˜ Reports â˜ Timetable â˜ Other: _______
- **Feature/Tab**: _______________________________________________

### Issue Description
**Severity**: â˜ Critical â˜ High â˜ Medium â˜ Low

**Title**: _______________________________________________

**Description**:
```
[Describe what went wrong in detail]
```

### Steps to Reproduce
1. ___________________________________________________
2. ___________________________________________________
3. ___________________________________________________
4. ___________________________________________________
5. ___________________________________________________

### Expected Behavior
```
[What should have happened]
```

### Actual Behavior
```
[What actually happened]
```

### Error Message (if any)
```
[Paste exact error message from console (F12)]
```

### Screenshot/Console Error
- â˜ Console error present (Describe): ____________________________
- â˜ Visual issue (describe appearance): __________________________
- â˜ Behavior issue (describe what happened): ____________________

### Data Context
- **Group Used**: _____________________
- **Student(s) Affected**: _____________________
- **Module/Unit Standard**: _____________________
- **Date**: _____________________

### Additional Notes
```
[Any other relevant information]
```

### Can You Reproduce It?
- â˜ Yes, consistently (every time)
- â˜ Yes, sometimes (intermittently)
- â˜ Yes, once (couldn't repeat)
- â˜ No, it's fixed now

---

## Issue #2

### Basic Info
- **Test Date**: _______________
- **Tester Name**: _______________
- **Browser**: â˜ Chrome â˜ Firefox â˜ Safari â˜ Edge â˜ Other: _______
- **Screen Size**: â˜ Desktop (1920x) â˜ Tablet (768x) â˜ Mobile (375x)

### Issue Location
- **Page**: â˜ Attendance â˜ Assessment â˜ Reports â˜ Timetable â˜ Other: _______
- **Feature/Tab**: _______________________________________________

### Issue Description
**Severity**: â˜ Critical â˜ High â˜ Medium â˜ Low

**Title**: _______________________________________________

**Description**:
```
[Describe what went wrong in detail]
```

### Steps to Reproduce
1. ___________________________________________________
2. ___________________________________________________
3. ___________________________________________________
4. ___________________________________________________
5. ___________________________________________________

### Expected Behavior
```
[What should have happened]
```

### Actual Behavior
```
[What actually happened]
```

### Error Message (if any)
```
[Paste exact error message from console (F12)]
```

### Screenshot/Console Error
- â˜ Console error present (Describe): ____________________________
- â˜ Visual issue (describe appearance): __________________________
- â˜ Behavior issue (describe what happened): ____________________

### Data Context
- **Group Used**: _____________________
- **Student(s) Affected**: _____________________
- **Module/Unit Standard**: _____________________
- **Date**: _____________________

### Additional Notes
```
[Any other relevant information]
```

### Can You Reproduce It?
- â˜ Yes, consistently (every time)
- â˜ Yes, sometimes (intermittently)
- â˜ Yes, once (couldn't repeat)
- â˜ No, it's fixed now

---

## Issue #3

### Basic Info
- **Test Date**: _______________
- **Tester Name**: _______________
- **Browser**: â˜ Chrome â˜ Firefox â˜ Safari â˜ Edge â˜ Other: _______
- **Screen Size**: â˜ Desktop (1920x) â˜ Tablet (768x) â˜ Mobile (375x)

### Issue Location
- **Page**: â˜ Attendance â˜ Assessment â˜ Reports â˜ Timetable â˜ Other: _______
- **Feature/Tab**: _______________________________________________

### Issue Description
**Severity**: â˜ Critical â˜ High â˜ Medium â˜ Low

**Title**: _______________________________________________

**Description**:
```
[Describe what went wrong in detail]
```

### Steps to Reproduce
1. ___________________________________________________
2. ___________________________________________________
3. ___________________________________________________
4. ___________________________________________________
5. ___________________________________________________

### Expected Behavior
```
[What should have happened]
```

### Actual Behavior
```
[What actually happened]
```

### Error Message (if any)
```
[Paste exact error message from console (F12)]
```

### Screenshot/Console Error
- â˜ Console error present (Describe): ____________________________
- â˜ Visual issue (describe appearance): __________________________
- â˜ Behavior issue (describe what happened): ____________________

### Data Context
- **Group Used**: _____________________
- **Student(s) Affected**: _____________________
- **Module/Unit Standard**: _____________________
- **Date**: _____________________

### Additional Notes
```
[Any other relevant information]
```

### Can You Reproduce It?
- â˜ Yes, consistently (every time)
- â˜ Yes, sometimes (intermittently)
- â˜ Yes, once (couldn't repeat)
- â˜ No, it's fixed now

---

## SUMMARY

### Testing Stats
- **Total Test Time**: ______________ minutes
- **Total Issues Found**: ____ Critical, ____ High, ____ Medium, ____ Low
- **Pages Tested**: â˜ Attendance â˜ Assessment â˜ Reports â˜ Timetable â˜ All
- **Test Path Completed**: â˜ Fast (30 min) â˜ Standard (60 min) â˜ Complete (90+ min)

### System Assessment
- **Ready for Production**: â˜ YES â˜ NO (fix critical issues first)
- **Main Blocking Issues**: 
  ```
  [List any critical blockers preventing production release]
  ```

### Positive Feedback
```
[What worked well, what impressed you]
```

### Improvement Suggestions
```
[Nice-to-have improvements for future]
```

### Sign-Off
- **Tester Name**: _____________________
- **Date Tested**: _____________________
- **Time Spent**: _____________________
- **Approved by**: _____________________

---

## ISSUE PRIORITY GUIDE

### Critical (Blocker)
- System crash / total failure
- Data loss
- Security vulnerability
- Cannot complete core workflow
- **Action**: Fix immediately before production

### High (Important)
- Major feature partially broken
- Core workflow affected
- Significant user inconvenience
- **Action**: Fix before production release

### Medium (Should Fix)
- Minor feature broken
- Workaround exists
- Affects some users
- **Action**: Fix in first maintenance release

### Low (Nice-to-Have)
- UI polish issues
- Minor typos
- Enhancement requests
- **Action**: Consider for future updates

---

## HOW TO CAPTURE CONSOLE ERRORS

1. **Open Developer Tools**: Press `F12`
2. **Go to Console Tab**: Click "Console" at the top
3. **Look for Red Errors**: These indicate problems
4. **Right-click Error**: Select "Copy" or take screenshot
5. **Paste in Error Message section above**

### Example Console Error
```
Uncaught TypeError: Cannot read property 'id' of undefined
    at handleAssessmentSave (assessments/page.tsx:245:12)
    at async onClick (assessments/page.tsx:89:5)
```

---

## HOW TO CAPTURE NETWORK ERRORS

1. **Open Developer Tools**: Press `F12`
2. **Go to Network Tab**: Click "Network"
3. **Try action that fails**: (e.g., click Save button)
4. **Look for Red Requests**: Failed requests show in red
5. **Click on failed request**: See response details
6. **Check Response tab**: See what error server returned

### Example Network Error
```
POST /api/assessments â†’ Status: 401 Unauthorized
Response: {"error": "Missing authentication token"}
```

---

*For detailed testing instructions, see USER_TESTING_GUIDE.md*
*For quick reference, see TESTING_SESSION_CARD.md*

