'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useGroups } from '@/contexts/GroupsContext';
import { notificationManager } from '@/lib/notifications';
import TimetableWeekView from '@/components/TimetableWeekView';
import TimetableDayView from '@/components/TimetableDayView';
import TimetableGroupView from '@/components/TimetableGroupView';
import TimetableSessionModal from '@/components/TimetableSessionModal';
import Toast, { useToast } from '@/components/Toast';
import { useSWRConfig } from 'swr';
import { format } from 'date-fns';
import { formatGroupNameDisplay } from '@/lib/groupName';

export default function TimetablePage() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');
  const initialDate = useMemo(() => {
    if (!dateParam) return new Date();
    const parsed = new Date(dateParam);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [dateParam]);

  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'group'>('week');
  const [showNewSession, setShowNewSession] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const { mutate } = useSWRConfig();

  const { groups } = useGroups();

  useEffect(() => {
    notificationManager.requestPermission();
  }, []);

  useEffect(() => {
    setSelectedDate(initialDate);
  }, [initialDate]);

  useEffect(() => {
    if (viewMode === 'group' && selectedGroup === 'all' && groups.length > 0) {
      setSelectedGroup(groups[0].id);
    }
  }, [viewMode, selectedGroup, groups]);

  const groupLabel = viewMode === 'group' ? 'Select Group' : 'Filter by Group';

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                    <CalendarIcon className="w-8 h-8 text-emerald-600" />
                    Timetable
                  </h1>
                  <p className="text-slate-600 mt-2">
                    Training sessions and weekly rotations at a glance.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNewSession(true)}
                    className="btn-primary"
                  >
                    + New Session
                  </button>
                  <label className="text-sm font-medium text-slate-700">
                    {groupLabel}:
                  </label>
                  <select
                    value={selectedGroup}
                    onChange={(event) => setSelectedGroup(event.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">All Groups</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {formatGroupNameDisplay(group.name)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-6 flex gap-2 bg-white p-2 rounded-xl border border-slate-200 w-fit">
                <button
                  type="button"
                  onClick={() => setViewMode('week')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    viewMode === 'week'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Week View
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('day')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    viewMode === 'day'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Day View
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('group')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    viewMode === 'group'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Group View
                </button>
              </div>

              <div className="flex-1 min-h-0">
                {viewMode === 'week' && (
                  <TimetableWeekView
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    selectedGroupId={selectedGroup}
                    onGroupChange={setSelectedGroup}
                  />
                )}
                {viewMode === 'day' && (
                  <TimetableDayView
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    selectedGroupId={selectedGroup}
                  />
                )}
                {viewMode === 'group' && (
                  <TimetableGroupView
                    selectedDate={selectedDate}
                    selectedGroupId={selectedGroup}
                  />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {showNewSession && (
        <TimetableSessionModal
          isOpen={showNewSession}
          onClose={() => setShowNewSession(false)}
          onCreated={({ groupName, date }) => {
            mutate((key) => typeof key === 'string' && key.startsWith('/api/timetable'));
            showToast(`Session created for ${groupName} on ${format(date, 'd MMM yyyy')}`, 'success');
            setShowNewSession(false);
          }}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}
