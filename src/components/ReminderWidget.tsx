'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle } from 'lucide-react';
import useSWR from 'swr';
import { format, parseISO } from 'date-fns';

interface Reminder {
  id: string;
  userId: string;
  lessonId?: string;
  planId?: string;
  title: string;
  scheduledFor: string;
  readAt?: string;
  browserNotificationSent: boolean;
  emailSent: boolean;
  status: 'pending' | 'read' | 'dismissed';
  recurrence?: any;
}

export function ReminderWidget() {
  const [todayReminders, setTodayReminders] = useState<Reminder[]>([]);

  // Fetch today's pending reminders
  const today = new Date().toISOString().split('T')[0];
  const { data: remindersData, mutate } = useSWR(
    `/api/reminders?status=pending&date=${today}`,
    (url) => fetch(url).then((res) => res.json())
  );

  useEffect(() => {
    if (remindersData?.data) {
      setTodayReminders(remindersData.data);
    }
  }, [remindersData]);

  const handleMarkRead = async (reminderId: string) => {
    try {
      const response = await fetch(
        `/api/reminders/${reminderId}/mark-read`,
        {
          method: 'PATCH',
        }
      );

      if (response.ok) {
        setTodayReminders((prev) =>
          prev.filter((r) => r.id !== reminderId)
        );
        mutate();
      }
    } catch (error) {
      console.error('Error marking reminder as read:', error);
    }
  };

  const handleDelete = async (reminderId: string) => {
    try {
      const response = await fetch(`/api/reminders/${reminderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTodayReminders((prev) =>
          prev.filter((r) => r.id !== reminderId)
        );
        mutate();
      }
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
        <Bell className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold">Today's Reminders</h3>
        {todayReminders.length > 0 && (
          <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
            {todayReminders.length}
          </span>
        )}
      </div>

      {/* Reminders List */}
      <div className="flex-1 overflow-y-auto">
        {todayReminders.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
            No reminders for today
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {todayReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {reminder.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {format(
                        parseISO(reminder.scheduledFor),
                        'h:mm a'
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMarkRead(reminder.id)}
                      className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900 rounded transition"
                      title="Mark as read"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(reminder.id)}
                      className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded transition"
                      title="Delete"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Link */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <a
          href="/timetable"
          className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
        >
          Manage all reminders →
        </a>
      </div>
    </div>
  );
}
