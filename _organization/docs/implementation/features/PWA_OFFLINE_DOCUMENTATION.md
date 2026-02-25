# Progressive Web App (PWA) Offline-First Support

## Overview

The YEHA application now includes comprehensive offline-first support, allowing facilitators to mark attendance, record assessments, and access student rosters even in areas with poor or no internet connectivity. All changes are automatically synced when the connection is restored.

## Features

### ✅ What Works Offline

- **View Student Rosters**: Previously downloaded student lists are available without internet
- **Mark Attendance**: Queue attendance marks locally, sync when connected
- **Record Assessments**: Store assessment scores and feedback locally
- **View Pending Changes**: See queued records and sync status
- **Offline Mode Indicator**: Visual feedback showing current connectivity status

### ❌ Features Requiring Connection

- AI-powered suggestions and analysis
- Report generation and downloading
- Real-time collaboration features
- Document uploads and processing

## Architecture

### 1. Service Worker (`public/sw.js`)

Handles offline functionality through caching strategies:

- **Static Assets**: Cache-first strategy (loads from cache, then network)
- **API Responses**: Network-first strategy (tries network, falls back to cache)
- **Navigation**: Network-first with offline page fallback

### 2. IndexedDB Database (`src/lib/offline/db.ts`)

Stores offline data in browser's local database:

**Tables:**
- `pendingAttendance`: Queued attendance marks
- `pendingAssessments`: Queued assessment records
- `cachedStudents`: Student roster cache
- `cachedCurriculum`: Curriculum data cache
- `syncMetadata`: Sync status and timestamps

### 3. Sync Manager (`src/lib/offline/syncManager.ts`)

Handles uploading pending records when connection restored:

- Batches records by group for efficiency
- Implements conflict resolution (server timestamp wins if newer)
- Retries on failure with error logging
- Background sync with polling fallback

### 4. UI Components

**OfflineBanner** (`src/components/OfflineBanner.tsx`)
- Fixed banner showing connection status
- Appears at top of page when offline
- Auto-hides when connection restored

**SyncStatusWidget** (`src/components/SyncStatusWidget.tsx`)
- Compact indicator showing pending sync count
- Expandable panel with detailed sync information
- Manual sync button
- Auto-sync when coming online

**PendingSyncIndicator** (`src/components/PendingSyncIndicator.tsx`)
- Badge showing records pending sync
- Toast notifications for sync events
- Visual feedback for sync status

### 5. Hooks

**useOfflineStatus** (`src/lib/offline/useOfflineStatus.ts`)
- Monitor online/offline status
- Callback on status change
- Returns `isOnline` and change context

**useOfflineAttendance** (`src/lib/offline/useOfflineAttendance.ts`)
- Mark attendance with automatic offline fallback
- Cache student rosters
- Track pending records

**useOfflineAssessment** (`src/lib/offline/useOfflineAttendance.ts`)
- Record assessments offline
- Same interface as attendance

## Usage

### Basic Integration

```tsx
import { useOfflineAttendance } from '@/lib/offline/useOfflineAttendance';

export function AttendanceMarker() {
  const { markAttendance, isOnline, pendingCount } = useOfflineAttendance();

  const handleMark = async (studentId, status) => {
    const result = await markAttendance(
      studentId,
      groupId,
      sessionDate,
      status, // 'present' | 'absent' | 'late' | 'excused'
      reason  // optional
    );

    if (result.synced) {
      console.log('Recorded and synced immediately (online)');
    } else if (result.pendingSync) {
      console.log('Recorded locally - will sync when online');
    } else {
      console.log('Error:', result.error);
    }
  };

  return (
    <div>
      {!isOnline && <p>🔴 Offline Mode</p>}
      {pendingCount > 0 && <p>⏳ {pendingCount} pending sync</p>}
      {/* Attendance UI */}
    </div>
  );
}
```

### Using UI Components

```tsx
import { OfflineBanner } from '@/components/OfflineBanner';
import { SyncStatusWidget } from '@/components/SyncStatusWidget';

export function Layout() {
  return (
    <>
      <OfflineBanner />
      <header>
        <SyncStatusWidget />
      </header>
    </>
  );
}
```

### Manual Sync

```tsx
import { syncPendingRecords } from '@/lib/offline/syncManager';

async function handleManualSync() {
  const result = await syncPendingRecords();
  
  if (result.success) {
    console.log(`Synced ${result.syncedCount} records`);
  } else {
    console.error(`Failed to sync: ${result.errors.join(', ')}`);
  }
}
```

## API Endpoints Required

The backend must implement these endpoints for sync:

### POST `/api/attendance/sync`

**Request:**
```json
{
  "groupId": "string",
  "records": [
    {
      "studentId": "string",
      "sessionDate": "YYYY-MM-DD",
      "status": "present|absent|late|excused",
      "reason": "string (optional)",
      "markedAt": 1234567890
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "synced": 10,
  "failed": 0,
  "conflicts": [
    {
      "studentId": "string",
      "serverTimestamp": 1234567890,
      "message": "Already recorded"
    }
  ]
}
```

### POST `/api/assessments/sync`

Same structure as attendance sync.

## Conflict Resolution

When the server and local records conflict (same student, same date):

1. **Server wins if newer**: If server timestamp is more recent, it's kept
2. **Local kept if within 1 minute**: If timestamps are within 1 minute, user is notified
3. **Automatic retry**: Failed records are marked for retry

## Testing Offline Mode

### Browser DevTools (Chrome/Edge)

1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers**
4. Check "Offline" checkbox
5. App continues to work with cached data

### Using DevTools Network Tab

1. Open DevTools (F12)
2. Go to **Network** tab
3. Set throttling to "Offline"
4. Mark attendance/assessments
5. Switch back online and verify sync

### Testing Specific Features

```javascript
// Test service worker registration
navigator.serviceWorker.ready.then(reg => {
  console.log('SW registered:', reg);
});

// Check pending records
const { offlineDB } = await import('@/lib/offline/db');
const pending = await offlineDB.pendingAttendance.toArray();
console.log('Pending attendance:', pending);

// Manually trigger sync
const { syncPendingRecords } = await import('@/lib/offline/syncManager');
const result = await syncPendingRecords();
console.log('Sync result:', result);
```

## Performance Considerations

- **Initial Load**: Service worker caches ~2-5MB of assets
- **IndexedDB**: Can store 1000+ pending records safely
- **Sync Batching**: Records grouped by group ID for efficient API calls
- **Memory**: Offline database auto-cleanup after 30 days

## Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome/Edge | ✅ Full | Recommended |
| Firefox | ✅ Full | Full support |
| Safari | ⚠️ Partial | Limited service worker support |
| Mobile Chrome | ✅ Full | Best for field use |
| Mobile Safari | ⚠️ Partial | Limited offline DB |

## Troubleshooting

### Service Worker Not Registering

```javascript
// Check console for errors
navigator.serviceWorker.register('/sw.js')
  .catch(err => console.error('SW failed:', err));
```

**Solutions:**
- Clear browser cache and cookies
- Ensure site is served over HTTPS (required for PWA)
- Check if third-party cookies are blocked

### Data Not Syncing

```javascript
// Manually check sync status
const { getSyncStats } = await import('@/lib/offline/db');
const stats = await getSyncStats();
console.log('Pending:', stats.totalPendingCount);
```

**Solutions:**
- Verify network connection
- Check API endpoints are responding
- Review browser console for API errors
- Use `SyncStatusWidget` to view error details

### Missing Cached Data

```javascript
// Verify offline DB contents
const students = await offlineDB.cachedStudents.toArray();
console.log('Cached students:', students.length);
```

**Solutions:**
- Student roster must be downloaded while online
- Use "Sync Now" button to refresh cache
- Check browser's storage quota

## Database Cleanup

Old sync records are automatically cleaned after 30 days. Manual cleanup:

```javascript
import { clearOfflineData } from '@/lib/offline/db';

// Clear everything (logout scenario)
await clearOfflineData();
```

## Security Considerations

- All data is encrypted in transit (HTTPS only)
- IndexedDB is same-origin (per-domain isolation)
- Authentication tokens stored securely
- Pending records cleared on logout

## Future Enhancements

- [ ] Selective sync per group
- [ ] Data compression for large datasets
- [ ] P2P sync between devices
- [ ] Encrypted local backup
- [ ] Offline analytics
- [ ] Conflict resolution UI

## API Reference

### Database Functions

```typescript
// Attendance
addPendingAttendance(record)
getPendingAttendance(synced?: boolean)
markAttendanceSynced(ids: number[])

// Assessments  
addPendingAssessment(record)
getPendingAssessments(synced?: boolean)
markAssessmentSynced(ids: number[])

// Cache
cacheStudents(students)
getCachedStudentsByGroup(groupId)
cacheCurriculum(items)

// Sync
getSyncStats()
updateSyncMetadata(key, status, pendingCount)
```

### Service Worker

```typescript
// Registration
registerServiceWorker()
isServiceWorkerActive()
unregisterServiceWorker()

// Caching
clearServiceWorkerCache()
initializeOfflineDataCache()

// Messaging
postMessageToServiceWorker(message)
setupServiceWorkerMessageListener(handler)
```

### Sync Manager

```typescript
// Main sync
syncPendingRecords(): Promise<SyncResult>

// Utilities
setupOnlineStatusListener(callback)
startSyncPolling(intervalMs)
registerBackgroundSync()
```

## Support

For issues or questions:
1. Check browser console for errors
2. Verify service worker registration
3. Check IndexedDB contents
4. Review sync status widget for details
5. Contact system administrator with logs
