'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';

interface PlanFormProps {
  selectedDate: Date;
  onClose: () => void;
  onPlanCreated: () => void;
}

export function PlanForm({ selectedDate, onClose, onPlanCreated }: PlanFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'event' as 'note' | 'event',
    startTime: '09:00',
    endTime: '10:00',
    color: '#3b82f6',
    isPrivate: false,
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target as any;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          startDate: selectedDate.toISOString(),
          endDate:
            formData.type === 'event'
              ? selectedDate.toISOString()
              : undefined,
          startTime: formData.type === 'event' ? formData.startTime : undefined,
          endTime: formData.type === 'event' ? formData.endTime : undefined,
          color: formData.color,
          type: formData.type,
          isPrivate: formData.isPrivate,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create plan');
      }

      onPlanCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const colorOptions = [
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#10b981', // Green
    '#f59e0b', // Amber
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316', // Orange
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold">New Plan</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-200 rounded text-sm">
              {error}
            </div>
          )}

          {/* Date Display */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Date
            </label>
            <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded text-sm">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Title *
            </label>
            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Study for exam, Team meeting"
              required
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Add notes or details..."
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Type
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="note">Note (all-day)</option>
              <option value="event">Event (timed)</option>
            </select>
          </div>

          {/* Time Slots (if event) */}
          {formData.type === 'event' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startTime" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Start Time
                </label>
                <input
                  id="startTime"
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="endTime" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  End Time
                </label>
                <input
                  id="endTime"
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Color */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, color }))
                  }
                  className={`w-8 h-8 rounded-full border-2 transition ${
                    formData.color === color
                      ? 'border-gray-900 dark:border-white'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Private */}
          <div className="flex items-center">
            <input
              id="isPrivate"
              type="checkbox"
              name="isPrivate"
              checked={formData.isPrivate}
              onChange={handleChange}
              className="w-4 h-4 rounded border-gray-300"
            />
            <label htmlFor="isPrivate" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Keep this plan private (only visible to me)
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
