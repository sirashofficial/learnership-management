"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, User, BookOpen, Calendar, CheckCircle, FileText,
  TrendingUp, AlertCircle, Download
} from "lucide-react";
import useSWR from "swr";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json()).then((data) => data.data || data);

export default function StudentProfilePage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params?.id as string;
  
  const [activeTab, setActiveTab] = useState<'progress' | 'attendance' | 'assessments' | 'poe'>('progress');
  
  const { data: student } = useSWR(studentId ? `/api/students/${studentId}` : null, fetcher);
  const { data: progress } = useSWR(studentId ? `/api/students/${studentId}/progress` : null, fetcher);
  const { data: attendance } = useSWR(studentId ? `/api/attendance?studentId=${studentId}` : null, fetcher);
  const { data: assessments } = useSWR(studentId ? `/api/assessments?studentId=${studentId}` : null, fetcher);
  const { data: poe } = useSWR(studentId ? `/api/poe?studentId=${studentId}` : null, fetcher);

  if (!student) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading student profile...</div>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalAttendance = attendance?.length || 0;
  const presentCount = attendance?.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE').length || 0;
  const attendanceRate = totalAttendance > 0 ? ((presentCount / totalAttendance) * 100).toFixed(1) : '0';
  
  const totalAssessments = assessments?.length || 0;
  const completedAssessments = assessments?.filter((a: any) => a.result === 'COMPETENT').length || 0;
  const assessmentCompletionRate = totalAssessments > 0 ? ((completedAssessments / totalAssessments) * 100).toFixed(1) : '0';
  
  const overallProgress = progress?.overallCompletion || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* Student Header Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl">
              {student.firstName?.[0]}{student.lastName?.[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">
                {student.firstName} {student.lastName}
              </h1>
              <p className="text-slate-600 mb-2">
                ID: {student.studentId} | Group: {student.group?.name || 'No Group'}
              </p>
              <div className="flex items-center gap-3">
                <span className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  student.status === 'ACTIVE' && "bg-green-100 text-green-700",
                  student.status === 'INACTIVE' && "bg-gray-100 text-gray-700",
                  student.status === 'COMPLETED' && "bg-blue-100 text-blue-700"
                )}>
                  {student.status || 'Active'}
                </span>
                <span className="text-sm text-slate-500">
                  Enrolled: {student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">{attendanceRate}%</div>
            <div className="text-sm text-slate-600">Attendance Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">{assessmentCompletionRate}%</div>
            <div className="text-sm text-slate-600">Assessment Completion</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">{overallProgress}%</div>
            <div className="text-sm text-slate-600">Overall Progress</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('progress')}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                activeTab === 'progress'
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Progress
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                activeTab === 'attendance'
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Attendance
            </button>
            <button
              onClick={() => setActiveTab('assessments')}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                activeTab === 'assessments'
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
            >
              <CheckCircle className="w-4 h-4 inline mr-2" />
              Assessments
            </button>
            <button
              onClick={() => setActiveTab('poe')}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                activeTab === 'poe'
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              POE
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Progress Tab */}
          {activeTab === 'progress' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Unit Standard Progress</h3>
              {progress?.unitStandards && progress.unitStandards.length > 0 ? (
                <div className="space-y-3">
                  {progress.unitStandards.map((us: any) => (
                    <div key={us.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-slate-900">{us.code} - {us.title}</h4>
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          us.status === 'COMPLETED' && "bg-green-100 text-green-700",
                          us.status === 'IN_PROGRESS' && "bg-yellow-100 text-yellow-700",
                          us.status === 'NOT_STARTED' && "bg-gray-100 text-gray-700"
                        )}>
                          {us.status?.replace('_', ' ') || 'Not Started'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${us.completion || 0}%` }}
                        />
                      </div>
                      <div className="text-sm text-slate-600 mt-1">{us.completion || 0}% Complete</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p>No progress data available</p>
                </div>
              )}
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Attendance History</h3>
                <div className="text-sm text-slate-600">
                  {presentCount} of {totalAttendance} days present
                </div>
              </div>
              {attendance && attendance.length > 0 ? (
                <div className="space-y-2">
                  {attendance.map((record: any) => (
                    <div key={record.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                      <div>
                        <div className="font-medium text-slate-900">
                          {new Date(record.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </div>
                        {record.notes && (
                          <div className="text-sm text-slate-600 mt-1">{record.notes}</div>
                        )}
                      </div>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-sm font-medium",
                        record.status === 'PRESENT' && "bg-green-100 text-green-700",
                        record.status === 'LATE' && "bg-yellow-100 text-yellow-700",
                        record.status === 'ABSENT' && "bg-red-100 text-red-700"
                      )}>
                        {record.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p>No attendance records</p>
                </div>
              )}
            </div>
          )}

          {/* Assessments Tab */}
          {activeTab === 'assessments' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Assessment Results</h3>
              {assessments && assessments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Assessment</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Result</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessments.map((assessment: any) => (
                        <tr key={assessment.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 text-sm text-slate-900">{assessment.title || assessment.unitStandard?.title}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {assessment.completedAt ? new Date(assessment.completedAt).toLocaleDateString() : 'Pending'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={cn(
                              "px-2 py-1 rounded text-xs font-medium",
                              assessment.result === 'COMPETENT' && "bg-green-100 text-green-700",
                              assessment.result === 'NOT_YET_COMPETENT' && "bg-red-100 text-red-700",
                              !assessment.result && "bg-gray-100 text-gray-700"
                            )}>
                              {assessment.result || 'Pending'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={cn(
                              "px-2 py-1 rounded text-xs font-medium",
                              assessment.status === 'COMPLETED' && "bg-blue-100 text-blue-700",
                              assessment.status === 'IN_PROGRESS' && "bg-yellow-100 text-yellow-700",
                              assessment.status === 'PENDING_MODERATION' && "bg-orange-100 text-orange-700"
                            )}>
                              {assessment.status?.replace('_', ' ') || 'Not Started'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p>No assessments yet</p>
                </div>
              )}
            </div>
          )}

          {/* POE Tab */}
          {activeTab === 'poe' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Portfolio of Evidence</h3>
              {poe && poe.length > 0 ? (
                <div className="space-y-3">
                  {poe.map((item: any) => (
                    <div key={item.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-slate-900">{item.title || item.unitStandard?.title}</h4>
                          <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                        </div>
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium whitespace-nowrap",
                          item.status === 'APPROVED' && "bg-green-100 text-green-700",
                          item.status === 'SUBMITTED' && "bg-yellow-100 text-yellow-700",
                          item.status === 'IN_PROGRESS' && "bg-blue-100 text-blue-700",
                          item.status === 'NOT_STARTED' && "bg-gray-100 text-gray-700"
                        )}>
                          {item.status?.replace('_', ' ') || 'Not Started'}
                        </span>
                      </div>
                      {item.submittedAt && (
                        <div className="text-xs text-slate-500 mt-2">
                          Submitted: {new Date(item.submittedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p>No POE items yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Actions</h3>
        <div className="flex gap-3">
          <button
            onClick={() => alert('Progress report generation coming soon')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Generate Progress Report
          </button>
          <button
            onClick={() => router.push(`/groups/${student.group?.id}`)}
            className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
          >
            View in Group
          </button>
        </div>
      </div>
    </div>
  );
}
