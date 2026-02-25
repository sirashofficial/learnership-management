'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface Student {
  id: string;
  name: string;
  currentModule: {
    name: string;
    number: number;
  } | null;
  progress: number;
  creditsEarned: number;
  status: string;
  attendanceRate: number;
  upcomingAssessments: Date[];
  recentGrades: Array<{
    score: number | null;
    date: Date | null;
    unitStandard: string | undefined;
  }>;
}

export default function GuardianDashboard() {
  const router = useRouter();
  const { user, token, logout, isLoading } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);

  // Redirect to login if not authenticated or not a guardian
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'GUARDIAN')) {
      router.push('/guardian/login');
    }
  }, [user, isLoading, router]);

  // Fetch linked students
  useEffect(() => {
    if (user && user.role === 'GUARDIAN') {
      fetchStudents();
    }
  }, [user]);

  const fetchStudents = async () => {
    try {
      setDataLoading(true);
      setError('');

      const response = await fetch('/api/guardian/students', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch students');
      }

      const data = await response.json();
      setStudents(data.data.students || []);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err instanceof Error ? err.message : 'Failed to load students');
    } finally {
      setDataLoading(false);
    }
  };

  const getGradeColor = (score: number | null) => {
    if (score === null) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Parent/Guardian Dashboard
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Welcome, {user?.name}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/guardian/settings"
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              Settings
            </Link>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
            <button
              onClick={fetchStudents}
              className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Try again
            </button>
          </div>
        )}

        {/* Action Bar */}
        <div className="mb-8">
          <button
            onClick={() => setShowLinkModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            + Link Student
          </button>
        </div>

        {/* Students Section */}
        {dataLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : students.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Students Linked Yet
            </h2>
            <p className="text-gray-600 mb-6">
              Start by linking your student using their ID and verification code
            </p>
            <button
              onClick={() => setShowLinkModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              Link Your First Student
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => (
              <Link key={student.id} href={`/guardian/students/${student.id}`}>
                <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6 h-full">
                  {/* Student Header */}
                  <div className="mb-4 pb-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {student.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Status: <span className="text-indigo-600 font-medium">{student.status}</span>
                    </p>
                  </div>

                  {/* Module Info */}
                  {student.currentModule && (
                    <div className="mb-4 pb-4 border-b">
                      <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">
                        Current Module
                      </p>
                      <p className="text-sm text-gray-900 font-medium mt-1">
                        Module {student.currentModule.number}: {student.currentModule.name}
                      </p>
                    </div>
                  )}

                  {/* Progress Stats */}
                  <div className="space-y-3 mb-4">
                    {/* Overall Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Overall Progress</span>
                        <span className="font-semibold text-gray-900">{student.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all"
                          style={{ width: `${student.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Attendance Rate */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Attendance Rate</span>
                      <span
                        className={`text-sm font-semibold ${
                          student.attendanceRate >= 80
                            ? 'text-green-600'
                            : student.attendanceRate >= 60
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {student.attendanceRate}%
                      </span>
                    </div>

                    {/* Credits Earned */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Credits Earned</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {student.creditsEarned}
                      </span>
                    </div>
                  </div>

                  {/* Recent Grades */}
                  {student.recentGrades.length > 0 && (
                    <div className="mb-4 pb-4 border-t pt-4">
                      <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-2">
                        Recent Grades
                      </p>
                      <div className="space-y-1">
                        {student.recentGrades.slice(0, 3).map((grade, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-600 truncate">
                              {grade.unitStandard || 'Assessment'}
                            </span>
                            <span className={`font-semibold ${getGradeColor(grade.score)}`}>
                              {grade.score !== null ? `${grade.score}%` : 'Pending'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upcoming Assessments */}
                  {student.upcomingAssessments.length > 0 && (
                    <div className="p-3 bg-blue-50 rounded text-sm">
                      <p className="text-blue-600 font-semibold">
                        {student.upcomingAssessments.length} upcoming assessment
                        {student.upcomingAssessments.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}

                  {/* View Details Link */}
                  <div className="mt-4 pt-4 border-t">
                    <span className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                      View Details →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Link Student Modal */}
      {showLinkModal && (
        <LinkStudentModal
          onClose={() => setShowLinkModal(false)}
          onSuccess={() => {
            setShowLinkModal(false);
            fetchStudents();
          }}
          token={token}
        />
      )}
    </div>
  );
}

// Link Student Modal Component
interface LinkStudentModalProps {
  onClose: () => void;
  onSuccess: () => void;
  token: string | null;
}

function LinkStudentModal({ onClose, onSuccess, token }: LinkStudentModalProps) {
  const [formData, setFormData] = useState({
    studentId: '',
    verificationCode: '',
    relationshipType: 'PARENT',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/guardian/link-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to link student');
      }

      setSuccess(
        `Student ${data.data.guardianStudent.student.name} linked successfully!`
      );
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Link a Student</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student ID
              </label>
              <input
                type="text"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                placeholder="Enter student ID"
                required
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verification Code
              </label>
              <input
                type="text"
                name="verificationCode"
                value={formData.verificationCode}
                onChange={handleChange}
                placeholder="Enter verification code"
                required
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ask your student's facilitator for this code
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship Type
              </label>
              <select
                name="relationshipType"
                value={formData.relationshipType}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="PARENT">Parent</option>
                <option value="GUARDIAN">Guardian</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-md font-medium transition"
              >
                {loading ? 'Linking...' : 'Link Student'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
