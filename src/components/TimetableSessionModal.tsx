'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import useSWR from 'swr';
import { fetcher } from '@/lib/swr-config';
import { formatGroupNameDisplay } from '@/lib/groupName';

interface TimetableSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (details: { groupName: string; date: Date }) => void;
}

const VENUE_OPTIONS = ['Lecture Room', 'Computer Lab', 'Online', 'Other'];

export default function TimetableSessionModal({
  isOpen,
  onClose,
  onCreated,
}: TimetableSessionModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { data: groupsData } = useSWR('/api/groups', fetcher);
  const groups = groupsData?.data || [];

  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  const [formData, setFormData] = useState({
    groupId: '',
    date: today,
    startTime: '09:00',
    endTime: '14:00',
    venue: 'Lecture Room',
    notes: '',
  });

  if (!isOpen) return null;

  const groupName = groups.find((group: any) => group.id === formData.groupId)?.name || '';
  const displayGroupName = formatGroupNameDisplay(groupName || '');

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: displayGroupName ? `${displayGroupName} Session` : 'Training Session',
          groupId: formData.groupId,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          venue: formData.venue,
          notes: formData.notes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create session');
      }

      onCreated({
        groupName: displayGroupName || 'Group',
        date: new Date(formData.date),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">New Session</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-slate-700">Group</label>
            <select
              name="groupId"
              value={formData.groupId}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select a group</option>
              {groups.map((group: any) => (
                <option key={group.id} value={group.id}>
                  {formatGroupNameDisplay(group.name)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">Start Time</label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">End Time</label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Venue</label>
            <select
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
            >
              {VENUE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Notes</label>
            <input
              type="text"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Optional notes"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
