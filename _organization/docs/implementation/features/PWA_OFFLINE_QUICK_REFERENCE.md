# PWA Offline - Quick Reference Card

## 🚀 Quick Start (Copy-Paste Ready)

### Add to Your Component

```tsx
'use client';
import { useOfflineAttendance } from '@/lib/offline/useOfflineAttendance';
import { useIsOnline } from '@/lib/offline/useOfflineStatus';

export function MyComponent() {
  const { markAttendance, isOnline, pendingCount } = useOfflineAttendance();
  
  const handleClick = async () => {
    const result = await markAttendance(
      'studentId',
      'groupId', 
      '2024-02-25',
      'present' // or 'absent', 'late', 'excused'
    );
    console.log(result);
  };
  
  return (
    <div>
      {!isOnline && <p>🔴 Offline</p>}
      {pendingCount > 0 && <p>⏳ {pendingCount} pending</p>}
      <button onClick={handleClick}>Mark Attendance</button>
    </div>
  );
}
```

### Add UI Components to Layout

```tsx
import { OfflineBanner } from '@/components/OfflineBanner';
import { SyncStatusWidget } from '@/components/SyncStatusWidget';

export default function Layout() {
  return (
    <>
      <OfflineBanner />
      <header>
        <SyncStatusWidget />
      </header>
      {/* rest of layout */}
    </>
  );
}
```

## 📚 Core APIs

### Hooks

```tsx
// Online/Offline status
const isOnline = useIsOnline();

// Full status with callbacks
const { isOnline, wasOffline, justCameOnline } = useOfflineStatus(
  (status) => console.log(status)
);

// Attendance with offline fallback
const { 
  markAttendance,        // (studentId, groupId, sessionDate, status, reason?) => Promise
  cacheStudentRoster,    // (students) => Promise
  isOnline, 
  error, 
  pendingCount,
  updatePendingCount     // () => Promise
} = useOfflineAttendance();

// Assessment with offline fallback
const {
  recordAssessment,      // (studentId, groupId, assessmentId, score, feedback?) => Promise
  isOnline,
  error,
  pendingCount,
  updatePendingCount
} = useOfflineAssessment();
```

### Database Functions

```tsx
import {
  // Read
  getPendingAttendance,     // (synced?) => Promise<array>
  getPendingAssessments,    // (synced?) => Promise<array>
  getSyncStats,             // () => Promise<stats>
  getCachedStudentsByGroup, // (groupId) => Promise<array>
  cachedCurriculum,         // (groupId) => Promise<array>
  
  // Write
  addPendingAttendance,     // (record) => Promise<id>
  addPendingAssessment,     // (record) => Promise<id>
  cacheStudents,            // (students) => Promise
  cacheCurriculum,          // (items) => Promise
  
  // Sync
  markAttendanceSynced,     // (ids) => Promise
  markAssessmentSynced,     // (ids) => Promise
  markSyncError,            // (type, ids, error) => Promise
  updateSyncMetadata,       // (key, status, count, error?) => Promise
  
  // Cleanup
  clearOfflineData          // () => Promise
} from '@/lib/offline/db';
```

### Sync Manager

```tsx
import {
  syncPendingRecords,            // () => Promise<SyncResult>
  setupOnlineStatusListener,     // (callback) => cleanup function
  startSyncPolling,              // (intervalMs?) => cleanup function
  registerBackgroundSync         // () => Promise<boolean>
} from '@/lib/offline/syncManager';

// Result structure
{
  success: boolean,
  syncedCount: number,
  failedCount: number,
  errors: string[]
}
```

### Service Worker Registration

```tsx
import {
  registerServiceWorker,         // () => Promise<Registration | null>
  unregisterServiceWorker,       // () => Promise<boolean>
  isServiceWorkerActive,         // () => Promise<boolean>
  postMessageToServiceWorker,    // (message) => Promise<void>
  setupServiceWorkerMessageListener,  // (handler) => cleanup
  clearServiceWorkerCache,       // () => Promise<void>
  initializeOfflineDataCache     // () => Promise<void>
} from '@/lib/offline/swRegistration';
```

## 🎨 Components

```tsx
// Offline status banner
<OfflineBanner />

// Sync status widget with details
<SyncStatusWidget />

// Inline pending indicator
<PendingSyncIndicator pending={true} />

// Badge for tables
<PendingSyncBadge />

// Success toast
<SyncSuccessToast />

// Error toast
<SyncErrorToast error="msg" onRetry={fn} />
```

## 📋 Component Props

### OfflineAttendance result
```tsx
{
  success: boolean,        // Operation succeeded
  synced: boolean,         // Synced immediately (online)
  pendingSync: boolean,    // Queued for later sync (offline)
  error?: string           // Error message if failed
}
```

### SyncStats
```tsx
{
  pendingAttendanceCount: number,
  pendingAssessmentCount: number,
  totalPendingCount: number,
  lastSyncTime?: number,
  lastSyncStatus?: 'success' | 'error' | 'pending'
}
```

### AttendanceRecord (in IndexedDB)
```tsx
{
  id?: number,
  studentId: string,
  groupId: string,
  sessionDate: string,
  status: 'present' | 'absent' | 'late' | 'excused',
  reason?: string,
  markedAt: number,              // timestamp
  synced: boolean,
  syncedAt?: number,
  syncError?: string
}
```

## 🔌 Integration Pattern

### Step 1: Add Hooks to Component
```tsx
const { markAttendance, isOnline } = useOfflineAttendance();
```

### Step 2: Handle Mark Event
```tsx
const result = await markAttendance(
  studentId, groupId, date, 'present'
);

if (result.synced) {
  // Showed to user immediately
} else if (result.pendingSync) {
  // Tell user it's queued
} else {
  // Show error
}
```

### Step 3: Add Visual Indicators
```tsx
{!isOnline && <p>📡 Offline</p>}
{result.pendingSync && <PendingSyncIndicator />}
```

### Step 4: Add Components to Layout
```tsx
<OfflineBanner />           {/* Top banner */}
<SyncStatusWidget />        {/* Status widget */}
```

## 🧪 Testing Checklist

- [ ] DevTools → Network → Offline mode
- [ ] Mark attendance → Should be queued
- [ ] Data visible in DevTools → IndexedDB
- [ ] Come online → Should sync automatically
- [ ] Check Network tab → POST /api/attendance/sync
- [ ] SyncStatusWidget → Shows success
- [ ] Refresh page → Data still persists
- [ ] Pending count → Updates correctly

## 🐛 Debugging Commands (Console)

```javascript
// Check service worker
navigator.serviceWorker.ready.then(r => console.log('SW ready', r))

// Check offline data
const { offlineDB } = await import('@/lib/offline/db');
const pending = await offlineDB.pendingAttendance.toArray();
console.log('Pending:', pending);

// Manually sync
const { syncPendingRecords } = await import('@/lib/offline/syncManager');
const result = await syncPendingRecords();
console.log('Sync result:', result);

// Check sync stats
const { getSyncStats } = await import('@/lib/offline/db');
const stats = await getSyncStats();
console.log('Stats:', stats);

// Storage info
navigator.storage.estimate().then(e => {
  console.log(`${(e.usage/e.quota*100).toFixed(1)}% used`);
});
```

## 🚨 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| SW not registering | Check HTTPS, clear cache, check `/sw.js` exists |
| Data not saving | Check IndexedDB in DevTools, verify database created |
| Not syncing | Check network online, verify API endpoint exists |
| Conflicts not resolved | Check server timestamps, review conflict logic |

## 📊 File Reference

| File | Purpose |
|------|---------|
| `src/lib/offline/db.ts` | IndexedDB operations |
| `src/lib/offline/syncManager.ts` | Upload & sync logic |
| `src/lib/offline/useOfflineStatus.ts` | Online/offline detection |
| `src/lib/offline/useOfflineAttendance.ts` | Attendance/assessment hooks |
| `src/lib/offline/swRegistration.ts` | Service worker control |
| `src/components/OfflineInitializer.tsx` | App initialization |
| `src/components/OfflineBanner.tsx` | Status banner |
| `src/components/SyncStatusWidget.tsx` | Sync widget |
| `src/components/PendingSyncIndicator.tsx` | Visual indicators |
| `public/sw.js` | Service worker |
| `public/manifest.json` | PWA metadata |
| `public/offline.html` | Offline fallback |

## 🔑 Key Concepts

**Offline-First Design**: App works without internet, syncs when available

**IndexedDB**: Browser's local database for persistent offline storage

**Service Worker**: Browser process that caches assets and enables offline

**Background Sync**: Automatic sync when connection restored (with polling fallback)

**Conflict Resolution**: Server timestamp wins if newer (>1 second)

**Graceful Degradation**: AI features/reports show "Requires Connection"

## 💡 Pro Tips

1. **Always cache student roster** when viewing groups
2. **Batch operations** for better performance
3. **Clear pending on logout** to avoid stale data
4. **Check `isOnline`** before heavy operations
5. **Monitor pending count** to inform users

## 📞 Support

- See **PWA_OFFLINE_DOCUMENTATION.md** for detailed reference
- See **PWA_OFFLINE_TESTING.md** for testing procedures
- See **PWA_OFFLINE_INTEGRATION_GUIDE.md** for code examples
