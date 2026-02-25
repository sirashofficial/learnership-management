# Soft Delete Pattern Implementation

## Overview

The soft delete pattern has been implemented across all critical entities in the Learnership Management System to prevent catastrophic data loss from accidental deletions. Records are marked as deleted rather than permanently removed, with a 30-day recovery window.

## Features

### 1. **Affected Models**
- User
- Group
- Student
- Assessment
- Attendance

Each model now includes:
- `deletedAt: DateTime?` - Timestamp when deleted
- `isDeleted: Boolean @default(false)` - Deletion flag
- Indexed on `isDeleted` for query performance

### 2. **Soft Delete Utility** (`src/lib/softDelete.ts`)

#### Core Functions:

- **`softDelete(model, id)`** - Marks a single record as deleted
- **`softDeleteMany(model, ids)`** - Marks multiple records as deleted
- **`restore(model, id)`** - Restores a single soft-deleted record
- **`restoreMany(model, ids)`** - Restores multiple soft-deleted records
- **`hardDelete(model, id, userRole)`** - Permanently deletes (ADMIN only)
- **`hardDeleteMany(model, ids, userRole)`** - Permanently deletes multiple records (ADMIN only)
- **`findWithDeleted(model, where)`** - Query including deleted records
- **`canRestore(model, id)`** - Check if record is within 30-day window
- **`getExpiredSoftDeletedRecords(model)`** - Get records past retention period

#### Cascade Functions:

- **`cascadeSoftDeleteGroup(groupId)`** - Soft deletes group and all students
- **`cascadeRestoreGroup(groupId)`** - Restores group and associated students

### 3. **Automatic Filtering**

Prisma middleware automatically filters out soft-deleted records from all queries:
- `findMany()` - Excludes deleted by default
- `findFirst()` - Excludes deleted by default
- `count()` - Excludes deleted by default

To include deleted records in queries:
```typescript
await prisma.student.findMany({
  where: {
    includeDeleted: true, // Special flag
    groupId: 'xyz'
  }
});
```

### 4. **API Changes**

All DELETE endpoints now return:
- Status: 200 (instead of permanently deleting)
- Message: "Record archived successfully. Can be restored within 30 days."

#### Updated Endpoints:
- `DELETE /api/students/[id]`
- `DELETE /api/groups/[id]` (cascades to students)
- `DELETE /api/users/[id]`
- `DELETE /api/assessments/[id]`
- `DELETE /api/attendance` (query param: id)

### 5. **Admin Restore Interface**

**Location:** `/admin/restore`

**Features:**
- View all soft-deleted records by entity type
- See days remaining before permanent deletion
- One-click restore functionality
- Visual warnings for records expiring soon (< 7 days)
- Batch restore capability

**Access:** ADMIN role only

### 6. **Admin Restore API**

#### `POST /api/admin/restore`
Restore deleted records

**Request Body:**
```json
{
  "entityType": "student",
  "id": "record-id"  // Single restore
}
```

Or for batch restore:
```json
{
  "entityType": "student",
  "ids": ["id1", "id2", "id3"]  // Batch restore
}
```

**Response:**
```json
{
  "success": true,
  "message": "Student restored successfully",
  "data": { /* restored record */ }
}
```

#### `GET /api/admin/restore?entityType=student`
Get list of restorable records

**Response:**
```json
{
  "success": true,
  "data": {
    "entityType": "student",
    "count": 5,
    "retentionDays": 30,
    "records": [ /* soft-deleted records */ ]
  }
}
```

### 7. **Automated Cleanup**

**Script:** `scripts/cleanup-soft-deleted.ts`

Permanently deletes records that exceed the 30-day retention window.

**Setup Options:**

#### Option 1: Cron Job (Linux/Mac)
```bash
# Add to crontab (run daily at 2 AM)
0 2 * * * cd /path/to/app && node scripts/cleanup-soft-deleted.ts
```

#### Option 2: Windows Task Scheduler
1. Open Task Scheduler
2. Create Basic Task
3. Trigger: Daily at 2:00 AM
4. Action: Start Program
5. Program: `node`
6. Arguments: `scripts/cleanup-soft-deleted.ts`
7. Start in: `/path/to/app`

#### Option 3: Vercel Cron (recommended for Vercel deployments)
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/cleanup-soft-deleted",
    "schedule": "0 2 * * *"
  }]
}
```

Then create `src/app/api/cron/cleanup-soft-deleted/route.ts`:
```typescript
import { cleanupExpiredRecords } from '@/scripts/cleanup-soft-deleted';
import { NextResponse } from 'next/server';

export async function GET() {
  const results = await cleanupExpiredRecords();
  return NextResponse.json({ success: true, results });
}
```

#### Option 4: AWS EventBridge or similar
Configure your cloud provider's scheduled task service to call the cleanup endpoint daily.

### 8. **UI Changes**

#### Confirmation Dialogs
All delete actions now show:
- Clear warning that data is being archived
- Information about 30-day recovery window
- Notice that data becomes permanent after 30 days

#### Button Labels
- "Delete" buttons remain visually the same (Trash icon)
- Tooltips updated to: "Archive [entity] (recoverable for 30 days)"
- Success messages: "Archived successfully"

### 9. **Cascade Behavior**

**Groups → Students:**
- Deleting a group soft-deletes all associated students
- Restoring a group restores all students deleted at the same time
- Maintains referential integrity
- Historical reporting remains intact

## Migration

Run the following to apply schema changes:

```bash
npx prisma migrate dev --name add-soft-delete-fields
npx prisma generate
```

## Configuration

### Retention Period
Default: 30 days

To change, update `SOFT_DELETE_RETENTION_DAYS` in `src/lib/softDelete.ts`:
```typescript
export const SOFT_DELETE_RETENTION_DAYS = 30; // Change this value
```

## Security

- Only ADMIN users can permanently delete records (`hardDelete`)
- Only ADMIN users can access restore interface
- All soft deletes are logged in audit trail
- Cleanup operations are logged with metadata

## Testing

### Manual Testing:
1. Delete a record (student, group, etc.)
2. Verify it no longer appears in normal queries
3. Go to `/admin/restore`
4. Verify the record appears with remaining days
5. Click "Restore"
6. Verify record reappears in normal view

### Testing Cascade:
1. Delete a group with students
2. Verify group and students are both soft-deleted
3. Restore the group
4. Verify both group and students are restored

### Testing Cleanup:
```bash
node scripts/cleanup-soft-deleted.ts
```

Check console output for deletion counts.

## Monitoring

All soft delete operations trigger:
- Standard audit logs
- Materialized view updates (for groups/students)
- Cleanup script creates audit entry with results

Monitor audit logs for:
- `CLEANUP_SOFT_DELETED` - Automated cleanup runs
- Entity-specific delete/restore actions

## Rollback

If you need to disable soft delete:

1. Remove middleware from `src/lib/prisma.ts`
2. Revert API changes to use `prisma.*.delete()`
3. Keep schema fields for recovery purposes
4. Run: `UPDATE [table] SET isDeleted = false WHERE isDeleted = true` to restore all

## Best Practices

1. **Never bypass soft delete** - Always use the utility functions
2. **Set up automated cleanup** - Don't rely on manual cleanup
3. **Monitor retention window** - Records expiring soon should be reviewed
4. **Educate admins** - Make sure they know about restore functionality
5. **Regular audits** - Check deleted records periodically
6. **Backup strategy** - Soft delete is not a replacement for backups

## Performance Considerations

- Indexes on `isDeleted` ensure query performance is not impacted
- Soft-deleted records still count toward database size
- Consider archiving to separate table if volume is extremely high (> 1M records)
- Cleanup script runs efficiently with batched operations

## Future Enhancements

Potential improvements:
- Email notifications when records are about to expire
- Bulk restore interface
- Restore preview showing related records
- Export deleted records before permanent deletion
- Configurable retention periods per entity type
- Soft delete for additional models
