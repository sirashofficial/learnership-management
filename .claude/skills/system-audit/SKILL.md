---
name: system-audit
description: Deep system audit for components/pages. Analyzes code quality, business logic, data flow consistency, cross-page dependencies, and integration issues. Use when you need comprehensive audits beyond surface-level reviews.
---

# System Audit Skill

Perform comprehensive audits of components, pages, and systems across multiple dimensions.

## When to Use

Activate this skill when:
- Auditing a page or component for all issues
- Investigating why data is inconsistent across pages
- Finding hidden dependencies between systems
- Analyzing business logic correctness
- Checking integration points
- Finding race conditions or sync issues

## How to Use

```
"System audit: [component/page name]"
"System audit: groups page including all connected pages"
"System audit: attendance page and how it connects to groups, students, and dashboard"
"System audit: [filename] investigating data flow"
```

## Audit Dimensions

### 1. Code Quality Issues (25+ patterns)
Analyze for:
- **Structure**: Too many state variables, large components, mixed concerns
- **Dependencies**: Unstable useEffect dependencies, circular imports, dead code
- **Type Safety**: Excessive `any` types, missed null checks
- **Error Handling**: Unhandled promises, missing try-catch blocks
- **Performance**: Unnecessary re-renders, missing memoization, N+1 patterns
- **Naming**: Unclear variables, inconsistent conventions
- **Testing**: Hard to test, tight coupling, hidden side effects

Output: 15-25 issues with severity levels (Critical, Major, Medium)

### 2. Business Logic Issues (7+ patterns)
Analyze for:
- **Correctness**: Does the logic match requirements?
- **Timeline Awareness**: Are dates/deadlines considered?
- **Calculations**: Are formulas correct and consistent?
- **State Management**: Is data stored correctly?
- **Edge Cases**: What happens at boundaries?
- **Assumptions**: Are assumptions documented and valid?

Output: 5-10 issues with impact assessment

### 3. Data Flow & Integration (7+ patterns)
Map:
- **Data Sources**: Where does data come from? Single source of truth?
- **API Usage**: Are endpoints used correctly? Consistent responses?
- **Synchronization**: Do multiple pages see the same data?
- **Race Conditions**: Can simultaneous operations cause conflicts?
- **Consistency**: If data updates, do all pages reflect it?
- **Calculations**: If metric calculated multiple ways, do results match?

Output: 7-10 cross-page issues with data flow diagrams

## Audit Structure

For each component/page:

```markdown
# System Audit: [Component Name]

## 🔴 Critical Issues (Must Fix)
[List issues that break functionality or cause data corruption]

## 🟠 Major Issues (Should Fix)
[List issues that cause wrong behavior or poor UX]

## 🟡 Medium Issues (Consider)
[List issues that could cause problems]

## 🟢 Minor Issues (Nice to Have)
[List code quality improvements]

## 📊 Data Flow Analysis
- Where data comes from
- How data flows through the system
- What other pages depend on this data
- Inconsistencies found

## 🔗 Cross-Page Dependencies
[Document how this component connects to other pages]

## Summary
- Total Issues: X
- Critical: X
- Major: X
- Medium: X
- Components Affected: X
- Estimated Fix Time: X hours
```

## Audit Checklist

### Code Quality
- [ ] Component responsibility (does one thing?)
- [ ] State organization (minimal, coherent state?)
- [ ] Effect dependencies (stable, correct?)
- [ ] Error handling (all paths covered?)
- [ ] Type safety (no unnecessary `any` types?)
- [ ] Performance (memoization needed? N+1 issues?)
- [ ] Testing feasibility (can this be tested?)

### Business Logic
- [ ] Correctness (matches requirements?)
- [ ] Edge cases (handled correctly?)
- [ ] Date/time handling (timezone aware? deadline checks?)
- [ ] Calculations (formulas correct? overflow risk?)
- [ ] Validations (all inputs checked?)

### Integration
- [ ] Data sources (single source of truth?)
- [ ] API consistency (responses uniform?)
- [ ] Sync issues (multiple pages, same data?)
- [ ] Race conditions (simultaneous operations safe?)
- [ ] Real-time updates (cache invalidation working?)

### Documentation
- [ ] Calculations explained (why this formula?)
- [ ] Dependencies documented (what does this depend on?)
- [ ] Assumptions listed (what's assumed to be true?)
- [ ] Edge cases noted (what happens at boundaries?)

## Common Red Flags

**🚩 Code Quality:**
- 10+ `useState` calls in one component
- useEffect with dependency: `[items.map(i => i.id).join(',')]`
- No error handling in async operations
- Multiple ways to calculate same metric

**🚩 Business Logic:**
- Status determined by one metric only (ignoring timeline)
- Formula doesn't account for edge cases
- Same calculation done differently in different places
- Hardcoded values when they should come from config/DB

**🚩 Integration:**
- Page 1 shows "46 students", Page 2 shows "20 students"
- Same data fetched from 3 different endpoints
- No synchronization between pages
- Hardcoded group list instead of using API

## Severity Guidelines

**Critical (🔴):** 
- Data corruption risk
- Security vulnerability
- Breaks core functionality
- Hard delete without recovery

**Major (🟠):**
- Wrong business logic
- Inconsistent data across pages
- Race conditions
- Poor error handling

**Medium (🟡):**
- Performance issues
- Type safety issues
- Difficult to maintain
- Missing edge cases

**Minor (🟢):**
- Code formatting
- Naming improvements
- Optimization opportunities
- Documentation

## Example Output

```markdown
# System Audit: Attendance Page

## 🔴 Critical Issues (4)
1. **Reconstructs groups from student data instead of using useGroups()**
   - Impact: Different group list than other pages (46 vs 20 students)
   - Fix: Import useGroups() and use directly

2. **Hardcoded group list in attendance page**
   - Impact: Hidden groups not shown to users
   - Fix: Remove hardcoded list, use DB

3. **Attendance % calculated differently than other pages**
   - Impact: Same group shows different % on different pages (73% vs 82%)
   - Fix: Standardize formula

4. **No sync when user navigates between pages**
   - Impact: Changes not reflected until refresh
   - Fix: Add data synchronization layer

## 🟠 Major Issues (3)
[...]

## 📊 Data Flow Analysis

Attendance Page should receive data from:
- useGroups() → get group list and metadata
- useStudents({groupId}) → get students in selected group
- /api/attendance/stats → get attendance statistics

Currently receives:
- useStudents() → all students
- Reconstructs groups → WRONG, no group metadata
- Multiple API calls to /api/attendance → inconsistent data

## 🔗 Cross-Page Dependencies

This page connects to:
- Groups Page (uses same groups)
- Students Page (same students)
- Dashboard (uses attendance stats)

Data Inconsistencies:
1. Group list different (reconstructed vs DB)
2. Attendance % different (multiple formulas)
3. No real-time sync between pages
```

## Guidelines

1. **Be Specific**: Point to exact file:line, not vague problems
2. **Show Impact**: Why does this matter? What breaks?
3. **Suggest Fix**: Don't just find problems
4. **Prioritize**: Put critical issues first
5. **Document**: Help future readers understand
6. **Verify**: Check if data is actually inconsistent across pages
7. **Cross-Reference**: Link related issues

## Output Format

Always structure audit as:
1. Critical Issues (with fix suggestions)
2. Major Issues (with impact)
3. Data Flow Diagram (if integration audit)
4. Cross-Page Analysis (if relevant)
5. Summary Statistics
6. Estimated Fix Time

