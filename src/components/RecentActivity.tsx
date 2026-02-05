'use client';

import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Clock, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function RecentActivity() {
  const { stats, isLoading } = useDashboardStats();

  const recentAttendance = stats?.recentAttendance || [];

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-background-border shadow-sm p-6">
        <h3 className="font-semibold text-text mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-background-border shadow-sm p-6">
      <h3 className="font-semibold text-text mb-4">Recent Activity</h3>
      
      <div className="space-y-3">
        {recentAttendance.length === 0 ? (
          <div className="p-4 text-center text-text-light">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          recentAttendance.slice(0, 5).map((record: any) => {
            const statusColor = record.status === 'PRESENT' ? 'text-green-600' :
                               record.status === 'LATE' ? 'text-amber-600' :
                               record.status === 'EXCUSED' ? 'text-blue-600' :
                               'text-red-600';
            
            const statusBg = record.status === 'PRESENT' ? 'bg-green-50' :
                            record.status === 'LATE' ? 'bg-amber-50' :
                            record.status === 'EXCUSED' ? 'bg-blue-50' :
                            'bg-red-50';

            return (
              <div key={record.id} className="flex items-start gap-3 p-3 hover:bg-background rounded-lg transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 ${statusColor.replace('text', 'bg')}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-text">
                    {record.student.firstName} {record.student.lastName}
                  </p>
                  <p className="text-xs text-text-light mt-0.5">
                    {record.session.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusBg} ${statusColor} font-medium`}>
                      {record.status}
                    </span>
                    <span className="text-xs text-text-light flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {record.session.site.name}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-text-light">
                  {format(new Date(record.date), 'MMM d')}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
