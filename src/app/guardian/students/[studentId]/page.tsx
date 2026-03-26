'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface StudentDetail {
  student: {
    id: string;
    name: string;
    status: string;
    enrolledDate: Date;
    overallProgress: number;
    creditsEarned: number;
  };
  progressTimeline: Array<{
    module: {
      number: number;
      name: string;
      totalCredits: number;
    };
    status: string;
    progress: number;
    creditsEarned: number;
    startDate: Date | null;
    completionDate: Date | null;
  }>;
  attendanceCalendar: {
    currentMonth: string;
    totalDays: number;
    presentDays: number;
    absentDays: number;
    attendanceRate: number;
    dailyRecords: Array<{
      date: Date;
      status: string;
    }>;
  };
  assessmentHistory: {
    upcoming: Array<{
      dueDate: Date;
      type: string;
      unitStandard: {
        code: string | undefined;
        title: string | undefined;
      };
    }>;
    completed: Array<{
      date: Date;
      type: string;
      score: number | null;
      result: string | null;
      feedback: string | null;
      unitStandard: {
        code: string | undefined;
        title: string | undefined;
        credits: number | undefined;
      };
    }>;
  };
  unitStandardProgress: Array<{
    code: string | undefined;
    title: string | undefined;
    credits: number | undefined;
    status: string;
    formativesCompleted: number;
    summativeCompleted: boolean;
    startDate: Date | null;
    completionDate: Date | null;
  }>;
}

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, token, isLoading } = useAuth();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'assessments'>('overview');

  const studentId = params?.studentId as string;

  // Redirect if not authenticated or not a guardian
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'GUARDIAN')) {
      router.push('/guardian/login');
    }
  }, [user, isLoading, router]);

  // Fetch student details
  useEffect(() => {
    if (user && user.role === 'GUARDIAN' && studentId) {
      fetchStudentDetail();
    }
  }, [user, studentId]);

  const fetchStudentDetail = async () => {
    try {
      setDataLoading(true);
      setError('');

      const response = await fetch(`/api/guardian/students/${studentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch student details');
      }

      const data = await response.json();
      setStudent(data.data);
    } catch (err) {
      console.error('Error fetching student details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load student details');
    } finally {
      setDataLoading(false);
    }
  };

  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <Link href="/guardian/dashboard" className="text-indigo-600 hover:text-indigo-700">
              ← Back to Dashboard
            </Link>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-red-50 border border-red-200 p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Error</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={fetchStudentDetail}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Try again
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <Link href="/guardian/dashboard" className="text-indigo-600 hover:text-indigo-700">
              ← Back to Dashboard
            </Link>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <p className="text-gray-600">Student not found</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Link href="/guardian/dashboard" className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{student.student.name}</h1>
          <p className="text-gray-600 mt-1">
            Status: <span className="font-semibold text-indigo-600">{student.student.status}</span>
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Overall Progress</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">
                {student.student.overallProgress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{ width: `${student.student.overallProgress}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Credits Earned</p>
            <p className="text-3xl font-bold text-gray-900">
              {student.student.creditsEarned}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Attendance Rate</p>
            <p className={`text-3xl font-bold ${
              student.attendanceCalendar.attendanceRate >= 80
                ? 'text-green-600'
                : student.attendanceCalendar.attendanceRate >= 60
                ? 'text-yellow-600'
                : 'text-red-600'
            }`}>
              {student.attendanceCalendar.attendanceRate}%
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Enrolled</p>
            <p className="text-sm font-semibold text-gray-900">
              {new Date(student.student.enrolledDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <div className="flex">
              {(['overview', 'attendance', 'assessments'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 font-medium text-sm ${
                    activeTab === tab
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Progress Timeline</h2>
                <div className="space-y-4">
                  {student.progressTimeline.map((module, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Module {module.module.number}: {module.module.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Total Credits: {module.module.totalCredits}
                          </p>
                        </div>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            module.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : module.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {module.status}
                        </span>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-semibold">{module.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full transition-all"
                            style={{ width: `${module.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Credits Earned: {module.creditsEarned}</span>
                        {module.startDate && (
                          <span>
                            Started: {new Date(module.startDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {module.completionDate && (
                        <p className="text-sm text-green-600 mt-2">
                          Completed: {new Date(module.completionDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attendance Tab */}
            {activeTab === 'attendance' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Attendance for {student.attendanceCalendar.currentMonth}
                </h2>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-gray-600 text-sm">Total Days</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {student.attendanceCalendar.totalDays}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-gray-600 text-sm">Present</p>
                    <p className="text-2xl font-bold text-green-600">
                      {student.attendanceCalendar.presentDays}
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-gray-600 text-sm">Absent</p>
                    <p className="text-2xl font-bold text-red-600">
                      {student.attendanceCalendar.absentDays}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Daily Records</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {student.attendanceCalendar.dailyRecords.map((record, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded"
                      >
                        <span className="text-gray-900">
                          {new Date(record.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            record.status === 'PRESENT'
                              ? 'bg-green-100 text-green-800'
                              : record.status === 'ABSENT'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {record.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Assessments Tab */}
            {activeTab === 'assessments' && (
              <div>
                {/* Upcoming Assessments */}
                {student.assessmentHistory.upcoming.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Upcoming Assessments
                    </h2>
                    <div className="space-y-3">
                      {student.assessmentHistory.upcoming.map((assessment, idx) => (
                        <div
                          key={idx}
                          className="border border-blue-200 bg-blue-50 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {assessment.unitStandard.title}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                Code: {assessment.unitStandard.code}
                              </p>
                            </div>
                            <span className="text-blue-600 font-semibold text-sm">
                              Due: {new Date(assessment.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">
                            Type: {assessment.type}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Assessments */}
                {student.assessmentHistory.completed.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Completed Assessments
                    </h2>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {student.assessmentHistory.completed.map((assessment, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {assessment.unitStandard.title}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Code: {assessment.unitStandard.code} •
                                Credits: {assessment.unitStandard.credits}
                              </p>
                            </div>
                            {assessment.score !== null && (
                              <span
                                className={`text-lg font-bold ${
                                  assessment.score >= 80
                                    ? 'text-green-600'
                                    : assessment.score >= 60
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                                }`}
                              >
                                {assessment.score}%
                              </span>
                            )}
                          </div>

                          <div className="text-sm text-gray-600 mb-2">
                            Date: {new Date(assessment.date).toLocaleDateString()}
                          </div>

                          {assessment.result && (
                            <div
                              className={`inline-block px-3 py-1 rounded text-xs font-semibold mb-2 ${
                                assessment.result === 'PASS'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {assessment.result}
                            </div>
                          )}

                          {assessment.feedback && (
                            <p className="text-sm text-gray-700 mt-2 italic">
                              "{assessment.feedback}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {student.assessmentHistory.upcoming.length === 0 &&
                  student.assessmentHistory.completed.length === 0 && (
                    <p className="text-gray-600">No assessments found</p>
                  )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
