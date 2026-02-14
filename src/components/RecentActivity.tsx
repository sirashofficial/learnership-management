'use client';

import { useState } from 'react';
import { Clock, Users, Building2, User } from 'lucide-react';
import { useRecentActivity } from '@/hooks/useDashboard';
import StudentDetailsModal from './StudentDetailsModal';
import { useRouter } from 'next/navigation';

export default function RecentActivity() {
  const { activities, isLoading } = useRecentActivity();
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const router = useRouter();

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
          <button
            onClick={() => router.push('/students')}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
          >
            View all
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-1">
            {activities.map((activity: any) => (
              <div
                key={activity.id}
                onClick={() => setSelectedStudent(activity)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors duration-150"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {activity.firstName} {activity.lastName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {activity.group?.name || 'New enrollment'}
                  </p>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">
                  {formatTimestamp(activity.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student Details Modal */}
      {selectedStudent && (
        <StudentDetailsModal
          isOpen={true}
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onSave={(updated) => {
            setSelectedStudent(null);
          }}
        />
      )}
    </>
  );
}
