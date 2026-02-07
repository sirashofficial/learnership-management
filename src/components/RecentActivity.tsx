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
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Activity</h3>
          <button
            onClick={() => router.push('/students')}
            className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            View All Students
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No recent student enrollments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity: any) => (
              <div
                key={activity.id}
                onClick={() => setSelectedStudent(activity)}
                className="flex items-start gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
              >
                {/* Avatar */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {activity.firstName} {activity.lastName}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Enrolled as new student
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(activity.createdAt)}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400">
                    {activity.group && (
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{activity.group.name}</span>
                      </div>
                    )}
                    {activity.company && (
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        <span>{activity.company.name}</span>
                      </div>
                    )}
                    {activity.facilitator && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>Facilitator: {activity.facilitator.name}</span>
                      </div>
                    )}
                  </div>
                </div>
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
