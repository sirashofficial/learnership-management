'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, MapPin, Bell, Edit2, Trash2, ChevronDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import useSWR from 'swr';

interface CalendarEvent {
  id: string;
  type: 'lesson' | 'plan';
  title: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  color: string;
  data: any;
}

interface LessonAuditEntry {
  id: string;
  fromDate: string;
  fromTime: string;
  toDate: string;
  toTime: string;
  userId: string;
  createdAt: string;
  reason?: string;
}

interface EventDetailModalProps {
  event: CalendarEvent;
  onClose: () => void;
  onEventUpdated: () => void;
  onEdit?: (event: CalendarEvent) => void;
}

export function EventDetailModal({
  event,
  onClose,
  onEventUpdated,
  onEdit,
}: EventDetailModalProps) {
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminderData, setReminderData] = useState({
    title: `Reminder: ${event.title}`,
    minutesBefore: 30,
    frequency: 'once',
    enableEmail: false,
  });

  // Fetch audit trail for lessons
  const { data: auditData } = useSWR(
    event.type === 'lesson'
      ? `/api/timetable/${event.id}/audit`
      : null,
    event.type === 'lesson'
      ? (url) => fetch(url).then((res) => res.json().catch(() => ({})))
      : null
  );

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();

    const scheduledFor = new Date(event.date);
    if (event.startTime) {
      const [hours, minutes] = event.startTime.split(':');
      scheduledFor.setHours(parseInt(hours), parseInt(minutes));
    }

    // Subtract minutes before
    scheduledFor.setMinutes(
      scheduledFor.getMinutes() - reminderData.minutesBefore
    );

    try {
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [event.type === 'lesson' ? 'lessonId' : 'planId']: event.id,
          title: reminderData.title,
          scheduledFor: scheduledFor.toISOString(),
          frequency: reminderData.frequency,
          enableEmail: reminderData.enableEmail,
        }),
      });

      if (response.ok) {
        setShowReminderForm(false);
        alert('Reminder created successfully!');
        onEventUpdated();
      } else {
        alert('Failed to create reminder');
      }
    } catch (error) {
      console.error('Error creating reminder:', error);
      alert('Error creating reminder');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this?')) return;

    try {
      const response = await fetch(
        `/api/${event.type === 'lesson' ? 'timetable' : 'plans'}/${event.id}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        onClose();
        onEventUpdated();
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const lesson = event.type === 'lesson' ? event.data : null;
  const plan = event.type === 'plan' ? event.data : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        {/* Header */}
        <div
          className="p-6 text-white flex items-center justify-between"
          style={{ backgroundColor: event.color }}
        >
          <h2 className="text-2xl font-bold">{event.title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Date & Time */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">
              Date & Time
            </h3>
            <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>
                  {format(event.date, 'EEEE, MMMM d, yyyy')}
                  {event.startTime && plan?.type !== 'note'
                    ? ` • ${event.startTime}-${event.endTime}`
                    : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Lesson-Specific Info */}
          {lesson && (
            <>
              {lesson.venue && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                    Venue
                  </h3>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="w-5 h-5" />
                    <span>{lesson.venue}</span>
                  </div>
                </div>
              )}

              {lesson.description && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                    Description
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {lesson.description}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Plan-Specific Info */}
          {plan && plan.description && (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                Notes
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {plan.description}
              </p>
            </div>
          )}

          {/* Audit Trail for Lessons */}
          {event.type === 'lesson' && (
            <div className="space-y-2">
              <button
                onClick={() => setShowAuditTrail(!showAuditTrail)}
                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                <ChevronDown
                  className={`w-4 h-4 transition ${
                    showAuditTrail ? 'rotate-180' : ''
                  }`}
                />
                Schedule History
              </button>

              {showAuditTrail && (
                <div className="mt-3 space-y-2 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                  {auditData?.auditLog && auditData.auditLog.length > 0 ? (
                    auditData.auditLog.map((entry: LessonAuditEntry) => (
                      <div
                        key={entry.id}
                        className="text-sm text-gray-600 dark:text-gray-400"
                      >
                        <p className="font-semibold">
                          {format(
                            parseISO(entry.createdAt),
                            'MMM d, h:mm a'
                          )}
                        </p>
                        <p>
                          Moved from{' '}
                          <span className="font-mono">
                            {format(parseISO(entry.fromDate), 'MMM d')}
                            {entry.fromTime && ` ${entry.fromTime}`}
                          </span>{' '}
                          to{' '}
                          <span className="font-mono">
                            {format(parseISO(entry.toDate), 'MMM d')}
                            {entry.toTime && ` ${entry.toTime}`}
                          </span>
                        </p>
                        {entry.reason && (
                          <p className="text-gray-500 dark:text-gray-500">
                            Reason: {entry.reason}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No changes to schedule
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Reminder Form */}
          {!showReminderForm ? (
            <div className="flex gap-2">
              <button
                onClick={() => setShowReminderForm(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Bell className="w-5 h-5" />
                Set Reminder
              </button>

              {/* Edit and Delete buttons for both lessons and plans */}
              <button
                onClick={() => {
                  if (onEdit) {
                    onEdit(event);
                    onClose();
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Edit2 className="w-5 h-5" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900"
              >
                <Trash2 className="w-5 h-5" />
                Delete
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateReminder} className="space-y-4 bg-gray-50 dark:bg-gray-700 p-4 rounded">
              <h3 className="font-semibold">Create Reminder</h3>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Reminder Title
                </label>
                <input
                  type="text"
                  value={reminderData.title}
                  onChange={(e) =>
                    setReminderData((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Minutes Before
                </label>
                <input
                  type="number"
                  value={reminderData.minutesBefore}
                  onChange={(e) =>
                    setReminderData((prev) => ({
                      ...prev,
                      minutesBefore: parseInt(e.target.value),
                    }))
                  }
                  min="5"
                  step="5"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Frequency
                </label>
                <select
                  value={reminderData.frequency}
                  onChange={(e) =>
                    setReminderData((prev) => ({
                      ...prev,
                      frequency: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                >
                  <option value="once">Once</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={reminderData.enableEmail}
                  onChange={(e) =>
                    setReminderData((prev) => ({
                      ...prev,
                      enableEmail: e.target.checked,
                    }))
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm">Send email reminder</span>
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowReminderForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
