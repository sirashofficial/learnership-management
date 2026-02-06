import { useState } from 'react';
import { X, AlertCircle, Bell, BellOff, Calendar, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';

interface RecurringSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: {
    date: Date;
    groupName: string;
    venue: string;
    timeSlot: { start: string; end: string };
    parentGroup?: string;
  };
  override?: {
    id: string;
    isCancelled: boolean;
    cancellationReason?: string | null;
    notes?: string | null;
    notificationEnabled: boolean;
    notificationTime: number;
  } | null;
  onSave: (data: {
    isCancelled: boolean;
    cancellationReason?: string;
    notes?: string;
    notificationEnabled: boolean;
    notificationTime: number;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export default function RecurringSessionModal({
  isOpen,
  onClose,
  session,
  override,
  onSave,
  onDelete,
}: RecurringSessionModalProps) {
  const [isCancelled, setIsCancelled] = useState(override?.isCancelled ?? false);
  const [cancellationReason, setCancellationReason] = useState(override?.cancellationReason ?? '');
  const [notes, setNotes] = useState(override?.notes ?? '');
  const [notificationEnabled, setNotificationEnabled] = useState(override?.notificationEnabled ?? true);
  const [notificationTime, setNotificationTime] = useState(override?.notificationTime ?? 30);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave({
        isCancelled,
        cancellationReason: isCancelled ? cancellationReason : undefined,
        notes,
        notificationEnabled,
        notificationTime,
      });
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save changes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    if (window.confirm('Remove all customizations for this session? It will revert to the regular schedule.')) {
      setIsLoading(true);
      try {
        await onDelete();
        onClose();
      } catch (error) {
        console.error('Error deleting:', error);
        alert('Failed to delete override');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {session.groupName}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Recurring Session Management
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Session Info */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">{format(session.date, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <MapPin className="w-4 h-4" />
              <span>{session.venue}</span>
              <span className="text-slate-500">•</span>
              <span>{session.timeSlot.start} - {session.timeSlot.end}</span>
            </div>
            {session.parentGroup && (
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Users className="w-4 h-4" />
                <span>Part of <strong>{session.parentGroup}</strong></span>
              </div>
            )}
          </div>

          {/* Cancel Session */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isCancelled}
                onChange={(e) => setIsCancelled(e.target.checked)}
                className="w-5 h-5 text-red-600 rounded focus:ring-2 focus:ring-red-500"
              />
              <div className="flex-1">
                <span className="font-medium text-slate-900 dark:text-white">Cancel this session</span>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  This will skip the session for this specific date only
                </p>
              </div>
            </label>

            {isCancelled && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Reason for Cancellation
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="e.g., Public holiday, Group unavailable, Venue maintenance..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white resize-none"
                  rows={3}
                />
              </div>
            )}
          </div>

          {/* Notification Settings */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notificationEnabled}
                onChange={(e) => setNotificationEnabled(e.target.checked)}
                disabled={isCancelled}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {notificationEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                  <span className="font-medium text-slate-900 dark:text-white">
                    Browser Notifications
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Get notified before the session starts
                </p>
              </div>
            </label>

            {notificationEnabled && !isCancelled && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Notify me before session starts
                </label>
                <select
                  value={notificationTime}
                  onChange={(e) => setNotificationTime(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                >
                  <option value={5}>5 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Notes for this Session
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special notes, reminders, or changes for this specific session..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white resize-none"
              rows={4}
            />
          </div>

          {/* Info Box */}
          <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-medium mb-1">About Recurring Sessions</p>
              <p>
                This session is part of your weekly schedule. Changes made here only affect this specific date 
                and won't impact other occurrences of this session.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
          <div>
            {override && onDelete && (
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
              >
                Reset to Default
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
