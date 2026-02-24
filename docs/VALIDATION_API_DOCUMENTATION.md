# Validation API Documentation

**Version**: 1.0  
**Base URL**: `/api/validation`  
**Authentication**: Required (Bearer token)

---

## Overview

The Validation API provides endpoints for monitoring and maintaining data integrity across the Learnership Management System. All endpoints require authentication and return standardized JSON responses.

---

## Endpoints

### 1. Data Integrity Check

**Endpoint**: `GET /api/validation/data-integrity`

**Description**: Runs comprehensive data validation checks across the system and returns a categorized list of issues.

**Authentication**: Required

**Request**: No body required

**Response**:
```json
{
  "success": true,
  "summary": {
    "totalIssues": 15,
    "critical": 2,
    "warnings": 10,
    "info": 3,
    "studentsChecked": 45,
    "timestamp": "2026-02-20T14:30:00Z"
  },
  "issues": [
    {
      "severity": "critical",
      "category": "Credit Totals",
      "issue": "Students have mismatched credit totals",
      "count": 5,
      "details": [...]
    }
  ]
}
```

**Validation Categories**:

1. **Missing Required Assessments** (Warning)
   - Students without formative or summative assessments

2. **Credit Total Mismatches** (Critical)
   - Stored totalCreditsEarned doesn't match actual competent assessments

3. **Orphaned Progress Records** (Warning)
   - UnitStandardProgress records without matching assessments

4. **Progress Percentage Inconsistencies** (Warning)
   - Progress percentages don't align with actual assessment results

5. **Assessments Without Due Dates** (Info)
   - Pending assessments missing due date assignments

6. **Groups Without Rollout Plans** (Warning)
   - Active groups without curriculum rollout plans

7. **Duplicate Assessments** (Warning)
   - Multiple assessments for same student/unit standard/type

 **Status Codes**:
- `200`: Success
- `401`: Unauthorized
- `500`: Server error

---

### 2. Fix Credit Totals

**Endpoint**: `POST /api/validation/fix-credits`

**Description**: Recalculates and fixes student totalCreditsEarned based on competent assessments.

**Authentication**: Required

**Request Body**:
```json
{
  "studentIds": ["uuid1", "uuid2"],  // Optional: specific students
  "dryRun": true                      // Preview without applying
}
```

**Parameters**:
- `studentIds` (optional): Array of student UUIDs. If omitted, checks all active students.
- `dryRun` (optional, default: false): If true, returns preview without modifying data.

**Response**:
```json
{
  "success": true,
  "dryRun": false,
  "studentsChecked": 45,
  "studentsFixed": 12,
  "fixes": [
    {
      "studentId": "uuid",
      "name": "John Doe",
      "oldCredits": 100,
      "newCredits": 120,
      "difference": 20
    }
  ]
}
```

**Logic**:
1. Fetch all COMPETENT assessments for each student
2. Extract unique unit standard IDs (deduplication)
3. Sum credits from unit standards
4. Compare with stored totalCreditsEarned
5. Update if different (atomic transaction)

**Status Codes**:
- `200`: Success
- `400`: Invalid request body
- `401`: Unauthorized
- `500`: Server error

---

### 3. Generate Missing Assessments

**Endpoint**: `POST /api/validation/generate-missing-assessments`

**Description**: Creates missing FORMATIVE assessments based on group rollout plans.

**Authentication**: Required

**Request Body**:
```json
{
  "studentIds": ["uuid1", "uuid2"],  // Optional: specific students
  "groupId": "uuid",                  // Optional: specific group
  "dryRun": true                      // Preview mode
}
```

**Parameters**:
- `studentIds` (optional): Array of student UUIDs. If omitted, processes all active students.
- `groupId` (optional): Process only students in this group.
- `dryRun` (optional, default: false): If true, returns preview without creating assessments.

**Response**:
```json
{
  "success": true,
  "dryRun": false,
  "studentsProcessed": 30,
  "assessmentsCreated": 150,
  "preview": [
    {
      "studentId": "uuid",
      "studentName": "John Doe",
      "unitStandardCode": "US12345",
      "unitStandardTitle": "Communication Skills",
      "type": "FORMATIVE"
    }
  ]
}
```

**Logic**:
1. Query students with active group assignments
2. Retrieve group rollout plans (unit standards + dates)
3. Check for existing assessments (by unitStandardId + type)
4. Identify missing FORMATIVE assessments
5. Create assessments with rollout plan due dates
6. Batch creation using transaction

**Status Codes**:
- `200`: Success
- `400`: Invalid request body
- `401`: Unauthorized
- `500`: Server error

---

### 4. Fix Duplicate Assessments

**Endpoint**: `POST /api/validation/fix-duplicates`

**Description**: Identifies and removes duplicate assessments, keeping the most recent one.

**Authentication**: Required

**Request Body**:
```json
{
  "dryRun": true  // Preview before deleting
}
```

**Parameters**:
- `dryRun` (optional, default: false): If true, returns preview without deleting.

**Response**:
```json
{
  "success": true,
  "dryRun": false,
  "duplicatesFound": 8,
  "duplicatesFixed": 8,
  "totalRemoved": 12,
  "fixes": [
    {
      "studentName": "John Doe",
      "unitStandardCode": "US12345",
      "type": "FORMATIVE",
      "duplicatesRemoved": 2
    }
  ]
}
```

**Detection Method**:
```sql
SELECT studentId, unitStandardId, type, COUNT(*) as count
FROM Assessment
GROUP BY studentId, unitStandardId, type
HAVING COUNT(*) > 1
```

**Logic**:
1. Find all duplicate combinations using SQL
2. For each duplicate set, fetch all records
3. Sort by createdAt (most recent first)
4. Keep first record, mark rest for deletion
5. Delete in transaction

**Status Codes**:
- `200`: Success
- `401`: Unauthorized
- `500`: Server error

---

### 5. Cleanup Orphaned Progress

**Endpoint**: `POST /api/validation/cleanup-orphaned-progress`

**Description**: Removes UnitStandardProgress records without matching assessments.

**Authentication**: Required

**Request Body**:
```json
{
  "dryRun": true  // Preview before deleting
}
```

**Parameters**:
- `dryRun` (optional, default: false): If true, returns preview without deleting.

**Response**:
```json
{
  "success": true,
  "dryRun": false,
  "totalProgressRecords": 200,
  "orphanedFound": 15,
  "orphanedRemoved": 15,
  "orphanedRecords": [
    {
      "progressId": "uuid",
      "studentName": "John Doe",
      "unitStandardCode": "US12345",
      "unitStandardTitle": "Communication Skills",
      "status": "NOT_STARTED"
    }
  ]
}
```

**Logic**:
1. Fetch all UnitStandardProgress records
2. For each record, check if any Assessment exists for that student + unit standard
3. If assessment count = 0, mark as orphaned
4. Delete orphaned records in transaction

**Status Codes**:
- `200`: Success
- `401`: Unauthorized
- `500`: Server error

---

## Common Response Structure

All endpoints follow a consistent response pattern:

### Success Response
```json
{
  "success": true,
  ...endpoint-specific data
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Optional detailed error information"
}
```

---

## Authentication

All endpoints require a valid authentication token in the Authorization header:

```
Authorization: Bearer <your-token-here>
```

If authentication fails, you'll receive a 401 response:
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

---

## Usage Examples

### Example 1: Check Data Integrity

```javascript
const response = await fetch('/api/validation/data-integrity', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

const { summary, issues } = await response.json();

console.log(`Found ${summary.totalIssues} issues`);
issues.forEach(issue => {
  console.log(`[${issue.severity}] ${issue.category}: ${issue.issue}`);
});
```

### Example 2: Fix Credits with Preview

```javascript
// First, preview what will change
const previewResponse = await fetch('/api/validation/fix-credits', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ dryRun: true }),
});

const preview = await previewResponse.json();
console.log(`Would fix ${preview.studentsFixed} students`);

// If looks good, actually apply the changes
const applyResponse = await fetch('/api/validation/fix-credits', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ dryRun: false }),
});

const result = await applyResponse.json();
console.log(`Fixed ${result.studentsFixed} students`);
```

### Example 3: Generate Assessments for Specific Group

```javascript
const response = await fetch('/api/validation/generate-missing-assessments', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    groupId: 'group-uuid-here',
    dryRun: false,
  }),
});

const { studentsProcessed, assessmentsCreated } = await response.json();
console.log(`Created ${assessmentsCreated} assessments for ${studentsProcessed} students`);
```

---

## Error Handling

All endpoints use try-catch blocks and return user-friendly error messages:

### Common Errors

**400 Bad Request**
- Invalid request body format
- Missing required parameters
- Invalid UUIDs

**401 Unauthorized**
- Missing authentication token
- Invalid or expired token
- Insufficient permissions

**404 Not Found**
- Student ID not found
- Group ID not found

**500 Internal Server Error**
- Database connection issues
- Unexpected server errors
- Transaction failures

### Error Response Example
```json
{
  "success": false,
  "error": "Invalid student ID",
  "details": "Student with ID 'invalid-uuid' does not exist"
}
```

---

## Performance Considerations

### Optimization Strategies

1. **Batch Operations**
   - Assessment generation uses `createMany()` for performance
   - Credit fixes process multiple students in single transaction

2. **Selective Querying**
   - Use `studentIds` parameter to limit scope
   - Use `groupId` parameter for targeted operations

3. **Dry-Run Mode**
   - Always test with `dryRun: true` first
   - Validates logic without database writes
   - Faster than actual operations

4. **Response Pagination**
   - Large result sets limited to first 50 items in UI
   - Full data available via API

### Expected Performance

| Endpoint | 100 Students | 1000 Students | Notes |
|----------|-------------|---------------|-------|
| Data Integrity | ~2 seconds | ~15 seconds | Depends on database size |
| Fix Credits | ~1 second | ~8 seconds | Includes recalculation |
| Generate Assessments | ~3 seconds | ~25 seconds | Batch creation optimized |
| Fix Duplicates | ~1 second | ~5 seconds | SQL-based detection |
| Cleanup Orphaned | ~2 seconds | ~12 seconds | Full table scan required |

---

## Best Practices

1. **Always Use Dry-Run First**
   - Preview changes before applying
   - Verify expected results
   - Avoid accidental data loss

2. **Schedule During Low Activity**
   - Run bulk operations during off-peak hours
   - Avoid conflicts with user modifications
   - Consider maintenance windows

3. **Monitor Results**
   - Check validation dashboard after fixes
   - Verify issue counts decreased
   - Investigate unexpected results

4. **Backup Before Bulk Operations**
   - Create database backup before major fixes
   - Enables rollback if needed
   - Test in staging first

5. **Incremental Fixes**
   - Fix small batches of students first
   - Verify each batch before continuing
   - Easier to debug if issues arise

---

## Changelog

### Version 1.0 (February 20, 2026)
- Initial release
- 5 validation endpoints implemented
- Dry-run mode support for all mutation endpoints
- Comprehensive error handling
- Transaction safety for all data modifications

---

## Support

For issues or questions about the Validation API:
- Check validation dashboard at `/admin/validation`
- Review Phase 1 completion report
- Contact system administrator

---

**Last Updated**: February 20, 2026  
**API Version**: 1.0  
**Documentation Version**: 1.0
