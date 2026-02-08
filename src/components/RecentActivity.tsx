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
      <div className="card-premium p-8 noise-texture mb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-slate-900 font-display tracking-tight">Recent Activity</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time engagement telemetry</p>
          </div>
          <button
            onClick={() => router.push('/students')}
            className="px-4 py-2 rounded-xl bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all border border-transparent hover:border-emerald-100"
          >
            Infrastructure Registry
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin rounded-xl h-8 w-8 border-b-2 border-emerald-500"></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Parsing student logs...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Clear Activity Slate</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity: any) => (
              <div
                key={activity.id}
                onClick={() => setSelectedStudent(activity)}
                className="group flex items-center gap-6 p-5 rounded-2xl bg-white/50 hover:bg-white border border-slate-100/50 hover:border-emerald-100 hover:shadow-premium cursor-pointer transition-all duration-300"
              >
                {/* Immersive Avatar Container */}
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <User className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-lg" />
                </div>

                {/* Cognitive Content Layer */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-black text-slate-950 group-hover:text-emerald-700 transition-colors truncate font-display tracking-tight">
                        {activity.firstName} {activity.lastName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          New Enrollment Verified
                        </p>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-slate-50 flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(activity.createdAt)}
                    </div>
                  </div>

                  {/* Strategic Metadata Nodes */}
                  <div className="mt-4 flex flex-wrap gap-4">
                    {activity.group && (
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                        <Users className="w-3.5 h-3.5 text-emerald-500/50" />
                        <span>{activity.group.name}</span>
                      </div>
                    )}
                    {activity.company && (
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                        <Building2 className="w-3.5 h-3.5 text-teal-500/50" />
                        <span>{activity.company.name}</span>
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
