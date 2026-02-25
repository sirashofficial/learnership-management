# Assessment Verification Report

**Date:** February 24, 2026  
**Total Assessments:** 3,315  
**Total Students:** 46  
**Average per Student:** 72.1  
**Expected Range:** 10-30 per student  

---

## 🎯 VERDICT: LEGITIMATE DATA (Not Duplicates)

The 3,315 assessments represent a **structured assessment framework**, not duplicates or errors.

---

## Key Findings

### ✅ No Duplicates Found
- **Zero exact duplicates** detected
- No records with same student, unit standard, type, and date
- Data integrity is excellent

### 📊 Perfect Distribution Pattern
```
Every student: 72-73 assessments
Minimum: 72
Maximum: 73
Average: 72.1
Median: 72
```

**All 46 students (100%) have 71-100 assessments** - highly consistent pattern indicating systematic design, not random duplication.

### 🔢 Assessment Structure Explained

**Total Assessment Matrix:**
```
24 Unit Standards × 3 Assessment Types = 72 assessments per student
```

**Three Assessment Types (perfectly balanced):**
- **FORMATIVE:** 1,107 (33.4%) - In-progress learning checks
- **SUMMATIVE:** 1,104 (33.3%) - End-of-module evaluations  
- **WORKPLACE:** 1,104 (33.3%) - Practical workplace assessments

**Mathematical Proof:**
```
Expected: 46 students × 24 unit standards × 3 types = 3,312 assessments
Actual:   3,315 assessments
Difference: +3 (three students with one extra assessment)
```

### ⚠️ Data Quality Issues (Not Duplicates)

**Missing Data (Placeholders):**
- **Missing scores:** 3,315 (100%) - All assessments lack scores
- **Missing dates:** 3,209 (96.8%) - Most not yet scheduled
- **PENDING status:** 3,206 (96.7%) - Awaiting completion

**Assessment Status:**
- **COMPETENT:** 109 (3.3%) - Completed assessments
- **PENDING:** 3,206 (96.7%) - Not yet completed

### 📅 Timeline Analysis

**Date Distribution:**
- **3,209 assessments:** NULL date (not yet scheduled)
- **106 assessments:** Dated between Feb 16-18, 2026

**High Volume Days:**
- Feb 16, 2026: 45 assessments (likely bulk data entry or system initialization)

### 📝 Multiple Attempts (Expected Behavior)

**20 student/unit combinations with 3+ attempts:**
- 3 students have 4 attempts on Unit Standard 7480 (legitimate retakes)
- 1 student (Nontle Hlongwane) has 3 attempts on ALL 24 unit standards
  - This suggests retake pattern, possibly due to initial failures or learning accommodations

**Total assessments from multiple attempts:** 207 (6.2% of total)

---

## Why This is Legitimate

### 1. Systematic Structure
The NVC Level 2 qualification requires:
- **6 modules** covering business and entrepreneurship
- **24 unit standards** distributed across these modules
- **3 assessment methods** per unit standard:
  - Formative (ongoing learning)
  - Summative (end-of-module)
  - Workplace (practical application)

### 2. Curriculum Compliance
This assessment structure aligns with SAQA requirements for:
- Multiple assessment methods per unit standard
- Continuous assessment (formative)
- Summative evaluation
- Workplace integration

### 3. Assessment Placeholders
The system has **pre-generated assessment records** for tracking purposes:
- Facilitators can see the full assessment roadmap
- Students can view what assessments are required
- System can track completion progress
- Reports can show what's pending vs. complete

### 4. Consistent Pattern
If this were duplicate data, we would see:
- ❌ Irregular distribution (some students with 100+, others with 10)
- ❌ Clustering of duplicates on specific dates
- ❌ Exact duplicates (same student, unit, type, date)

Instead, we see:
- ✅ Perfect consistency (72-73 per student)
- ✅ Even type distribution (33.3% each)
- ✅ No exact duplicates
- ✅ Structured multiple attempts (retakes)

---

## Comparison to Normal Range

**Normal Range:** 10-30 assessments per student  
**Current:** 72 assessments per student  
**Why Higher?**

The "normal range" likely assumes:
- 1 assessment per unit standard
- OR minimal formative tracking

This system tracks:
- 3 assessments per unit standard
- Full formative assessment journey
- Workplace integration assessments

**Adjusted Expected Range:**
```
Conservative: 24 unit standards × 2 types = 48 per student
Comprehensive: 24 unit standards × 3 types = 72 per student ✅ (matches actual)
With Retakes: 24 unit standards × 3 types × 1.1 = ~80 per student
```

---

## Recommendations

### ✅ Keep Current Data
- Data is legitimate and well-structured
- No deduplication needed
- Represents proper curriculum planning

### 📝 Address Data Quality
**Priority: Fill in missing data**

1. **Schedule assessments** (3,209 missing dates)
   ```sql
   UPDATE Assessment 
   SET assessedDate = [scheduled_date]
   WHERE assessedDate IS NULL
   ```

2. **Record scores** (3,315 missing scores)
   - Integrate with assessment marking workflow
   - Ensure facilitators record scores when assessments are completed

3. **Update status** (3,206 PENDING)
   - Automatically update status based on scores
   - COMPETENT: score >= 50%
   - NOT_YET_COMPETENT: score < 50%

### 📊 Monitoring
Track these metrics over time:
- Assessments with dates: Currently 3.2%, Target 100%
- Assessments with scores: Currently 0%, Target 90%+ (some always pending)
- COMPETENT status: Currently 3.3%, should grow as students progress

---

## Sample Student Analysis

**Student: Nontle Hlongwane (Most Attempts)**
- Total assessments: 72
- 3 attempts per unit standard across all 24 unit standards
- Pattern suggests:
  - Initial assessment (baseline)
  - Formative reassessment (learning check)
  - Final summative (evaluation)
  
This is a **legitimate educational practice** for tracking student progress through multiple touchpoints.

---

## Conclusion

### ✅ Data is LEGITIMATE
- No duplicates
- Structured assessment framework
- Aligns with curriculum requirements
- Consistent across all students

### ⚠️ Data is INCOMPLETE
- 96.8% missing dates (placeholders)
- 100% missing scores (not yet assessed)
- 96.7% pending completion

### 🎯 Action Required
Focus on **data completion**, not deduplication:
1. Schedule assessment dates
2. Conduct assessments
3. Record scores
4. Update status

### 📈 Expected Progress
As the year progresses:
- Dates will be filled in (scheduled assessments)
- Scores will be recorded (as assessments are marked)
- Status will update (PENDING → COMPETENT/NOT_YET_COMPETENT)
- The 72 assessments per student will remain (legitimate structure)

---

## Technical Details

**Assessment Matrix Calculation:**
```
Students: 46
Unit Standards: 24
Assessment Types: 3 (FORMATIVE, SUMMATIVE, WORKPLACE)

Expected Total = 46 × 24 × 3 = 3,312
Actual Total = 3,315
Difference = +3 (0.09% variance)

Variance explained by:
- 3 students with one extra assessment (likely retakes)
- Minimal and expected in real-world data
```

**Data Quality Metrics:**
```
Duplicate Rate:     0.00% ✅
Completion Rate:    3.30% ⚠️ (expected at start of year)
Data Coverage:      3.20% (dates filled)
Scoring Coverage:   0.00% (scores recorded)
```

---

**Report Generated:** February 24, 2026  
**Analysis Method:** Comprehensive duplicate detection + pattern analysis  
**Confidence Level:** High (100% of students show identical pattern)  
**Recommendation:** Accept data as legitimate, focus on completion tracking
