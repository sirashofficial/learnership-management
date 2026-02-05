'use client';

import { useDashboardStats } from '@/hooks/useDashboardStats';
import { TriangleAlert, Users } from 'lucide-react';
import Link from 'next/link';

export default function DashboardAlerts() {
  const { stats, isLoading } = useDashboardStats();

  const atRiskStudents = stats?.atRiskStudents || [];
  const pendingAssessments = stats?.pendingAssessments || 0;

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-background-border shadow-sm p-6">
        <h3 className="font-semibold text-text mb-4">Alerts & Notifications</h3>
        <div className="space-y-3">
          <div className="h-16 bg-gray-200 animate-pulse rounded-lg"></div>
          <div className="h-16 bg-gray-200 animate-pulse rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-background-border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <TriangleAlert className="w-5 h-5 text-amber-500" />
        <h3 className="font-semibold text-text">Alerts & Notifications</h3>
      </div>
      
      <div className="space-y-3">
        {atRiskStudents.length > 0 && (
          <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-red-900">At-Risk Students</p>
                <p className="text-xs text-red-700 mt-1">
                  {atRiskStudents.length} student{atRiskStudents.length !== 1 ? 's' : ''} need immediate attention
                </p>
                <div className="mt-2 space-y-1">
                  {atRiskStudents.slice(0, 3).map((student: any) => (
                    <p key={student.id} className="text-xs text-red-600">
                      • {student.firstName} {student.lastName} ({student.progress}%)
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {pendingAssessments > 0 && (
          <div className="p-3 bg-amber-50 rounded-lg border-l-4 border-amber-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-amber-900">Pending Assessments</p>
                <p className="text-xs text-amber-700 mt-1">
                  {pendingAssessments} assessment{pendingAssessments !== 1 ? 's' : ''} awaiting completion
                </p>
              </div>
              <Link 
                href="/assessments"
                className="text-xs text-amber-600 hover:text-amber-800 font-medium"
              >
                View
              </Link>
            </div>
          </div>
        )}

        {atRiskStudents.length === 0 && pendingAssessments === 0 && (
          <div className="p-4 text-center text-text-light">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No alerts at the moment</p>
          </div>
        )}
      </div>
    </div>
  );
}
