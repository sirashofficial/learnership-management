# PWA Offline Testing Guide

## Quick Start Testing

### Step 1: Start the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Step 2: Test Service Worker Registration

Open browser DevTools (F12) and check:

1. **Application tab** → **Service Workers**
   - Should show `/sw.js` with status "activated and running"

2. **Application tab** → **Manifest**
   - Should show YEHA manifest.json with app metadata

3. **Console tab**
   - Should show logs: `[SW] Service worker registered successfully`

### Step 3: Test Offline Mode

#### Method A: DevTools Offline Simulation

1. Open DevTools (F12)
2. Go to **Network** tab
3. Click the throttle dropdown (currently shows "No throttling")
4. Select **Offline**
5. Try to navigate the app - should show cached content
6. Try marking attendance - should store locally

#### Method B: Simulate Poor Connection

1. In DevTools **Network** tab
2. Set throttling to "Slow 3G" or custom
3. Verify app still responds (with Network tab open)

#### Method C: Browser DevTools Offline

1. DevTools → **Application** → **Service Workers**
2. Check the "Offline" checkbox
3. The service worker will simulate offline mode

### Step 4: Test Attendance Marking Offline

1. **Go offline** (using one of methods above)
2. Navigate to **Attendance** page
3. Select a group and session date
4. Click "Mark Attendance"
5. Mark several students as present/absent
6. You should see:
   - ⏳ "Pending Sync" indicator on records
   - ✋ Offline banner at top (if configured)
   - 💾 Records saved to IndexedDB

### Step 5: Verify IndexedDB Storage

In DevTools:

1. **Application** → **Storage** → **IndexedDB** → **YEHAOfflineDB**
2. Expand **pendingAttendance** table
3. Click to view your marked attendance records
4. You should see:
   - studentId, groupId, sessionDate, status
   - markedAt timestamp
   - synced: false (while offline)

### Step 6: Test Sync on Reconnect

1. **Go back online** (remove Offline mode from DevTools)
2. You should see:
   - OfflineBanner turns green: "✓ Connection restored. Syncing..."
   - SyncStatusWidget updates to show sync progress
   - Records disappear from pending when synced

3. **Check API calls**:
   - DevTools → **Network** tab
   - Look for POST request to `/api/attendance/sync`
   - Verify request body contains your attendance records

### Step 7: Test Sync Status Widget

1. Open **SyncStatusWidget** (usually in header)
2. When offline with pending records:
   - Shows ☁️ icon with "X pending" count
   - Click to expand details
   - Shows:
     - Connection status
     - Pending attendance count
     - Pending assessments count
     - Last sync time
     - "Sync Now" button

3. Click "Sync Now" to manually trigger sync

### Step 8: Test Error Scenarios

#### Network Error During Sync

1. Mark attendance offline
2. Go online
3. In DevTools **Network** tab, block the `/api/attendance/sync` endpoint:
   - Right-click request → **Block request URL**
4. SyncStatusWidget shows red error state
5. Try "Sync Now" again
6. Should show error message

#### Conflict Resolution

1. Mark attendance for student A at 10:00 AM
2. Manually modify same record on server (different timestamp)
3. Attempt sync
4. Should handle gracefully (server wins if newer)

### Step 9: Test Data Persistence

1. Mark attendance offline
2. **Refresh page** (Ctrl+R)
3. Data should persist (visible in SyncStatusWidget)
4. Open DevTools → IndexedDB to confirm

### Step 10: Test Multiple Groups

1. Mark attendance for Group A offline
2. Mark assessments for Group B offline
3. Verify both are queued:
   - IndexedDB shows records in both tables
   - SyncStatusWidget shows total pending count
   - Sync batches them correctly

## Automated Testing Checklist

```bash
# Create new test file: src/lib/offline/__tests__/offline.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { offlineDB, addPendingAttendance, getPendingAttendance } from '../db';

describe('Offline Functionality', () => {
  beforeEach(async () => {
    await offlineDB.pendingAttendance.clear();
  });

  it('should store attendance offline', async () => {
    const id = await addPendingAttendance({
      studentId: 'test-123',
      groupId: 'group-1',
      sessionDate: '2024-02-25',
      status: 'present',
      markedAt: Date.now(),
      synced: false,
    });

    expect(id).toBeGreaterThan(0);

    const records = await getPendingAttendance(false);
    expect(records).toHaveLength(1);
    expect(records[0].studentId).toBe('test-123');
  });

  it('should batch records by group', async () => {
    // Add records for two groups
    await addPendingAttendance({
      studentId: 'student-1',
      groupId: 'group-1',
      sessionDate: '2024-02-25',
      status: 'present',
      markedAt: Date.now(),
      synced: false,
    });

    await addPendingAttendance({
      studentId: 'student-2',
      groupId: 'group-2',
      sessionDate: '2024-02-25',
      status: 'absent',
      markedAt: Date.now(),
      synced: false,
    });

    const records = await getPendingAttendance(false);
    expect(records).toHaveLength(2);

    // Should be from different groups
    const groups = new Set(records.map(r => r.groupId));
    expect(groups.size).toBe(2);
  });
});
```

## Browser Compatibility Testing

| Browser | Test Steps | Expected Result |
|---------|-----------|-----------------|
| Chrome | Use DevTools offline mode | ✅ Full support |
| Firefox | Use DevTools offline mode | ✅ Full support |
| Safari | Limited support | ⚠️ Check console |
| Mobile Chrome | Set Network to Offline | ✅ Full support |
| Mobile Safari | Airplane mode | ⚠️ Partial support |

## Network Simulation

### Slow 3G
```javascript
// Simulates real-world poor connectivity
// In DevTools → Network → Throttling
// Test sync with simulated latency
```

### Offline
```javascript
// Simulates no connection
// Visit offline.html page
// Verify graceful degradation
```

### Packet Loss
```javascript
// DevTools → Network Conditions
// Check unstable connection handling
```

## Console Debugging

Enable detailed logging:

```javascript
// In browser console
localStorage.setItem('DEBUG_OFFLINE', 'true');

// You'll see logs like:
// [SW] Service worker registered successfully
// [Sync] Polling - connection online, syncing...
// [App] Offline - sync paused
```

## Performance Testing

### Measure Sync Time
```javascript
const { syncPendingRecords } = await import('@/lib/offline/syncManager');

console.time('sync');
const result = await syncPendingRecords();
console.timeEnd('sync');

console.log(`Synced ${result.syncedCount} records in X ms`);
```

### Check Storage Size
```javascript
navigator.storage.estimate().then(estimate => {
  const used = estimate.usage;
  const quota = estimate.quota;
  const percent = (used / quota) * 100;
  console.log(`Storage: ${percent.toFixed(2)}% used`);
});
```

### Measure IndexedDB Operations
```javascript
const { offlineDB } = await import('@/lib/offline/db');

console.time('fetch-pending');
const pending = await offlineDB.pendingAttendance.toArray();
console.timeEnd('fetch-pending');

console.time('add-record');
await offlineDB.pendingAttendance.add({ /* data */ });
console.timeEnd('add-record');
```

## Stress Testing

### Large Batch Offline

```javascript
// Add 100 attendance records offline
for (let i = 0; i < 100; i++) {
  await addPendingAttendance({
    studentId: `student-${i}`,
    groupId: 'group-1',
    sessionDate: '2024-02-25',
    status: 'present',
    markedAt: Date.now(),
    synced: false,
  });
}

// Monitor memory and sync time
```

### Long Duration Offline

1. Go offline
2. Use app for several hours
3. Mark 50+ records
4. Go online
5. Verify all sync correctly

## Common Issues & Solutions

### Service Worker Not Activating
```javascript
// Clear site data and reinstall
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});

// Unregister and re-register
navigator.serviceWorker.getRegistrations()
  .then(registrations => {
    registrations.forEach(r => r.unregister());
  });
```

### IndexedDB Not Persisting
```javascript
// Check storage permission
navigator.storage.persist().then(persistent => {
  console.log('Persistent storage:', persistent);
});

// Check quota
navigator.storage.estimate().then(est => {
  console.log(`Available: ${est.quota / 1024 / 1024}MB`);
});
```

### Sync API Errors
```javascript
// Monitor sync events
navigator.serviceWorker.ready.then(reg => {
  reg.sync.getTags().then(tags => {
    console.log('Sync tags:', tags);
  });
});
```

## Reporting Issues

When reporting offline issues, include:

1. **Browser & Version**: `navigator.userAgent`
2. **Service Worker Status**: Is it registered?
3. **IndexedDB Status**: Do records exist?
4. **Network Status**: `navigator.onLine`
5. **Console Logs**: Full error messages
6. **Steps to Reproduce**: Exact sequence

## Success Criteria Checklist

- [ ] ✅ Service worker registers and activates
- [ ] ✅ Manifest.json loads with app metadata
- [ ] ✅ App works in offline mode
- [ ] ✅ Attendance marks store locally
- [ ] ✅ Data persists across page refresh
- [ ] ✅ Data syncs when online
- [ ] ✅ Offline banner shows when disconnected
- [ ] ✅ Sync widget displays pending count
- [ ] ✅ Manual sync button works
- [ ] ✅ Conflicts resolve correctly
- [ ] ✅ Error messages are helpful
- [ ] ✅ Performance is acceptable (<2s sync)

## Next Steps

After testing locally:

1. **Deploy to staging** with HTTPS
2. **Test on mobile devices** with Network Throttling
3. **Performance monitoring** in production
4. **User feedback** on offline experience
5. **Analytics** on sync success rates
