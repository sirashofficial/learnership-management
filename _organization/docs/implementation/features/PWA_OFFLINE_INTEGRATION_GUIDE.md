# PWA Offline Integration Guide

## For Component Developers

This guide shows how to integrate offline support into existing attendance and assessment components.

## 1. Basic Integration Pattern

### Before (Online-only)

```tsx
export function MarkAttendance() {
  const [loading, setLoading] = useState(false);

  const handleMark = async (studentId: string, status: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, status }),
      });

      if (response.ok) {
        alert('Marked successfully');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={() => handleMark('123', 'present')}>
      Mark Present
    </button>
  );
}
```

### After (With Offline Support)

```tsx
'use client';

import { useOfflineAttendance } from '@/lib/offline/useOfflineAttendance';
import { PendingSyncBadge } from '@/components/PendingSyncIndicator';

export function MarkAttendance() {
  const [loading, setLoading] = useState(false);
  const { markAttendance, isOnline, error } = useOfflineAttendance();

  const handleMark = async (
    studentId: string,
    groupId: string,
    sessionDate: string,
    status: string
  ) => {
    setLoading(true);
    try {
      const result = await markAttendance(
        studentId,
        groupId,
        sessionDate,
        status as 'present' | 'absent' | 'late' | 'excused'
      );

      if (result.synced) {
        // Immediately synced (was online)
        alert('✓ Marked and synced');
      } else if (result.pendingSync) {
        // Stored locally, will sync later
        alert('💾 Saved locally - will sync when online');
      } else {
        // Error occurred
        alert(`Error: ${result.error}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!isOnline && <p>🔴 Offline Mode</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      <button
        onClick={() => handleMark('123', 'group-1', '2024-02-25', 'present')}
        disabled={loading}
      >
        {loading ? 'Marking...' : 'Mark Present'}
      </button>
    </div>
  );
}
```

## 2. Attendance Marking with Status Visual

```tsx
'use client';

import { useState } from 'react';
import { useOfflineAttendance } from '@/lib/offline/useOfflineAttendance';
import { PendingSyncIndicator, PendingSyncBadge } from '@/components/PendingSyncIndicator';

interface AttendanceRecord {
  id: string;
  name: string;
  status?: 'present' | 'absent' | 'late' | 'excused';
  pendingSync?: boolean;
}

export function AttendanceTable({
  students,
  groupId,
  sessionDate,
}: {
  students: AttendanceRecord[];
  groupId: string;
  sessionDate: string;
}) {
  const [records, setRecords] = useState<Record<string, {
    status?: string;
    pending?: boolean;
  }>>({});

  const { markAttendance, isOnline } = useOfflineAttendance();

  const handleStatusChange = async (
    studentId: string,
    status: 'present' | 'absent' | 'late' | 'excused'
  ) => {
    // Optimistic update
    setRecords(prev => ({
      ...prev,
      [studentId]: { status, pending: !isOnline },
    }));

    const result = await markAttendance(
      studentId,
      groupId,
      sessionDate,
      status
    );

    if (!result.success) {
      // Revert on error
      setRecords(prev => {
        const updated = { ...prev };
        delete updated[studentId];
        return updated;
      });
    }
  };

  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>Student</th>
          <th>Status</th>
          <th>Sync</th>
        </tr>
      </thead>
      <tbody>
        {students.map(student => (
          <tr key={student.id}>
            <td>{student.name}</td>
            <td>
              <select
                value={records[student.id]?.status || ''}
                onChange={e =>
                  handleStatusChange(
                    student.id,
                    e.target.value as any
                  )
                }
              >
                <option value="">Select...</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="excused">Excused</option>
              </select>
            </td>
            <td>
              {records[student.id]?.pending && <PendingSyncBadge />}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## 3. Bulk Import with Offline Support

```tsx
'use client';

import { useOfflineAttendance } from '@/lib/offline/useOfflineAttendance';

export function BulkImportAttendance() {
  const { markAttendance, isOnline, pendingCount } = useOfflineAttendance();
  const [importing, setImporting] = useState(false);

  const handleImportCSV = async (csvData: string) => {
    setImporting(true);
    let successCount = 0;
    let errorCount = 0;

    const lines = csvData.trim().split('\n').slice(1); // Skip header

    for (const line of lines) {
      const [studentId, status] = line.split(',');

      const result = await markAttendance(
        studentId.trim(),
        'group-1',
        '2024-02-25',
        status.trim() as any
      );

      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    setImporting(false);
    alert(`Imported: ${successCount} success, ${errorCount} errors`);
  };

  return (
    <div>
      {pendingCount > 0 && (
        <p>⏳ {pendingCount} records pending sync</p>
      )}

      <textarea
        placeholder="studentId,status
123,present
124,absent"
        onPaste={e =>
          handleImportCSV(e.clipboardData.getData('text/plain')))
        }
      />

      <button onClick={() => handleImportCSV('')} disabled={importing}>
        {importing ? 'Importing...' : 'Import'}
      </button>
    </div>
  );
}
```

## 4. Assessment Recording with Offline

```tsx
'use client';

import { useOfflineAssessment } from '@/lib/offline/useOfflineAttendance';

export function RecordAssessment({
  studentId,
  groupId,
  assessmentId,
}: {
  studentId: string;
  groupId: string;
  assessmentId: string;
}) {
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');

  const { recordAssessment, isOnline, pendingCount } = useOfflineAssessment();

  const handleSubmit = async () => {
    const result = await recordAssessment(
      studentId,
      groupId,
      assessmentId,
      score,
      feedback
    );

    if (result.synced) {
      alert('✓ Assessment recorded and synced');
    } else if (result.pendingSync) {
      alert('💾 Assessment saved locally');
    }
  };

  return (
    <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
      <input
        type="number"
        min="0"
        max="100"
        value={score}
        onChange={e => setScore(Number(e.target.value))}
        placeholder="Score"
      />

      <textarea
        value={feedback}
        onChange={e => setFeedback(e.target.value)}
        placeholder="Feedback"
      />

      {!isOnline && <p>📡 Offline - will sync when connected</p>}
      {pendingCount > 0 && <p>⏳ {pendingCount} pending</p>}

      <button type="submit">Record Assessment</button>
    </form>
  );
}
```

## 5. Sync Monitoring in Components

```tsx
'use client';

import { useEffect, useState } from 'react';
import { getSyncStats } from '@/lib/offline/db';

export function SyncMonitor() {
  const [stats, setStats] = useState({
    pending: 0,
    lastSync: null as Date | null,
  });

  useEffect(() => {
    const updateStats = async () => {
      const s = await getSyncStats();
      setStats({
        pending: s.totalPendingCount,
        lastSync: s.lastSyncTime ? new Date(s.lastSyncTime) : null,
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, []);

  if (stats.pending === 0 && !stats.lastSync) {
    return null;
  }

  return (
    <div className="sync-monitor">
      {stats.pending > 0 && (
        <p>⏳ {stats.pending} pending sync</p>
      )}
      {stats.lastSync && (
        <p>Last sync: {stats.lastSync.toLocaleTimeString()}</p>
      )}
    </div>
  );
}
```

## 6. Gracefully Degrade Features

```tsx
'use client';

import { useIsOnline } from '@/lib/offline/useOfflineStatus';

export function ReportGenerator() {
  const isOnline = useIsOnline();

  if (!isOnline) {
    return (
      <div className="disabled-feature">
        <p>📡 Report generation requires internet connection</p>
        <p>Available offline: Mark attendance, record assessments</p>
      </div>
    );
  }

  return (
    <button onClick={generateReport}>
      Generate Report
    </button>
  );
}
```

## 7. Student Roster Caching

```tsx
'use client';

import { useEffect } from 'react';
import { useOfflineAttendance } from '@/lib/offline/useOfflineAttendance';

export function StudentList({ groupId }: { groupId: string }) {
  const [students, setStudents] = useState<any[]>([]);
  const { cacheStudentRoster } = useOfflineAttendance();

  useEffect(() => {
    fetchStudents();
  }, [groupId]);

  const fetchStudents = async () => {
    try {
      const response = await fetch(`/api/students?groupId=${groupId}`);
      const data = await response.json();

      setStudents(data.data || []);

      // Cache for offline access
      await cacheStudentRoster(data.data || []);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    }
  };

  return (
    <ul>
      {students.map(student => (
        <li key={student.id}>{student.name}</li>
      ))}
    </ul>
  );
}
```

## 8. Testing Offline Components

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MarkAttendance } from './MarkAttendance';
import { offlineDB } from '@/lib/offline/db';

describe('MarkAttendance Offline', () => {
  beforeEach(async () => {
    await offlineDB.pendingAttendance.clear();
  });

  it('should save attendance offline', async () => {
    // Mock navigator.onLine to simulate offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    render(<MarkAttendance />);

    const button = screen.getByText('Mark Present');
    await userEvent.click(button);

    // Wait for local storage
    await waitFor(async () => {
      const pending = await offlineDB.pendingAttendance.toArray();
      expect(pending).toHaveLength(1);
    });
  });

  it('should sync when coming online', async () => {
    // Add offline record first
    await offlineDB.pendingAttendance.add({
      studentId: 'test-123',
      groupId: 'group-1',
      sessionDate: '2024-02-25',
      status: 'present',
      markedAt: Date.now(),
      synced: false,
    });

    // Simulate coming online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    // Trigger sync
    const { syncPendingRecords } = await import('@/lib/offline/syncManager');
    const result = await syncPendingRecords();

    expect(result.success).toBe(true);
  });
});
```

## API Endpoint Implementation

The backend must implement sync endpoints. Here's a template:

### POST `/api/attendance/sync`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const { groupId, records } = await request.json();

  const results = {
    synced: 0,
    failed: 0,
    conflicts: [],
  };

  for (const record of records) {
    try {
      // Check for conflicts
      const existing = await prisma.attendance.findUnique({
        where: {
          studentId_groupId_sessionDate: {
            studentId: record.studentId,
            groupId: record.groupId,
            sessionDate: new Date(record.sessionDate),
          },
        },
      });

      if (existing && existing.markedAt > new Date(record.markedAt)) {
        // Server version is newer
        results.conflicts.push({
          studentId: record.studentId,
          serverTimestamp: existing.markedAt.getTime(),
          message: 'Server version is newer',
        });
        continue;
      }

      // Upsert the record
      await prisma.attendance.upsert({
        where: {
          studentId_groupId_sessionDate: {
            studentId: record.studentId,
            groupId: record.groupId,
            sessionDate: new Date(record.sessionDate),
          },
        },
        update: {
          status: record.status,
          reason: record.reason,
          markedAt: new Date(record.markedAt),
          updatedAt: new Date(),
        },
        create: {
          studentId: record.studentId,
          groupId: record.groupId,
          sessionDate: new Date(record.sessionDate),
          status: record.status,
          reason: record.reason,
          markedAt: new Date(record.markedAt),
        },
      });

      results.synced++;
    } catch (err) {
      console.error('Sync error:', err);
      results.failed++;
    }
  }

  return NextResponse.json({
    success: true,
    ...results,
  });
}
```

## Deployment Checklist

- [ ] Service worker `/sw.js` is publicly accessible
- [ ] Manifest.json is linked in HTML head
- [ ] HTTPS is enabled (required for PWA)
- [ ] All API sync endpoints are implemented
- [ ] IndexedDB quota is sufficient (50MB+ recommended)
- [ ] Cache headers are appropriate (immutable for SW, no-cache for manifest)
- [ ] Offline page loads without dependencies
- [ ] Monitoring for sync failures is in place
- [ ] User documentation mentions offline capability

## Next Steps

1. **Integrate** offline hooks into existing attendance/assessment components
2. **Test** offline functionality per the testing guide
3. **Add** sync endpoints to your backend API
4. **Deploy** with HTTPS enabled
5. **Monitor** sync success rates and errors
6. **Gather** user feedback on offline UX
