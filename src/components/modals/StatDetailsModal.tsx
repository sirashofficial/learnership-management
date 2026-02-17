'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, Loader2 } from 'lucide-react';
import { formatGroupNameDisplay } from '@/lib/groupName';

interface StatDetailsModalProps {
  statType: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function StatDetailsModal({ statType, isOpen, onClose }: StatDetailsModalProps) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = '';
      
      switch (statType) {
        case 'students':
          endpoint = '/api/students';
          break;
        case 'groups':
          endpoint = '/api/groups';
          break;
        case 'attendance':
          endpoint = '/api/attendance';
          break;
        case 'courses':
          endpoint = '/api/curriculum/modules';
          break;
        case 'completion':
          endpoint = '/api/students?completed=true';
          break;
        case 'assessments':
          endpoint = '/api/assessments?status=PENDING';
          break;
        default:
          endpoint = '/api/students';
      }

      const response = await fetch(endpoint);
      const data = await response.json();
      setDetails(data.data);
    } catch (error) {
      console.error('Error fetching details:', error);
    } finally {
      setLoading(false);
    }
  }, [statType]);

  useEffect(() => {
    if (isOpen) {
      fetchDetails();
    }
  }, [isOpen, fetchDetails]);

  if (!isOpen) return null;

  const getTitleAndDescription = () => {
    switch (statType) {
      case 'students':
        return {
          title: 'Students Overview',
          description: 'All active students in the system',
        };
      case 'groups':
        return {
          title: 'Groups & Companies',
          description: 'Training groups and their associated companies',
        };
      case 'attendance':
        return {
          title: 'Attendance Details',
          description: 'Recent attendance records and statistics',
        };
      case 'courses':
        return {
          title: 'Active Courses',
          description: 'Currently running modules and courses',
        };
      case 'completion':
        return {
          title: 'Completion Statistics',
          description: 'Students who have completed their training',
        };
      case 'assessments':
        return {
          title: 'Pending Assessments',
          description: 'Assessments awaiting completion or review',
        };
      default:
        return { title: 'Details', description: '' };
    }
  };

  const { title, description } = getTitleAndDescription();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{description}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="space-y-4">
                {statType === 'students' && details && (
                  <StudentsList students={details} />
                )}
                {statType === 'groups' && details && (
                  <GroupsList groups={details} />
                )}
                {statType === 'attendance' && details && (
                  <AttendanceList attendance={details} />
                )}
                {statType === 'courses' && details && (
                  <CoursesList courses={details} />
                )}
                {statType === 'completion' && details && (
                  <CompletionList students={details} />
                )}
                {statType === 'assessments' && details && (
                  <AssessmentsList assessments={details} />
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                window.location.href = `/${statType}`;
              }}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
            >
              View All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper components for different stat types
function StudentsList({ students }: { students: any[] }) {
  return (
    <div className="space-y-2">
      {students.slice(0, 10).map((student: any) => (
        <div
          key={student.id}
          className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
        >
          <div>
            <p className="font-medium text-slate-900 dark:text-white">
              {student.firstName} {student.lastName}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">{student.studentId}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900 dark:text-white">{student.progress}%</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">{student.status}</p>
          </div>
        </div>
      ))}
      {students.length > 10 && (
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center pt-2">
          And {students.length - 10} more...
        </p>
      )}
    </div>
  );
}

function GroupsList({ groups }: { groups: any[] }) {
  return (
    <div className="space-y-2">
      {groups.slice(0, 10).map((group: any) => (
        <div
          key={group.id}
          className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
        >
          <div>
            <p className="font-medium text-slate-900 dark:text-white">{formatGroupNameDisplay(group.name)}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">{group.company?.name || 'No Company'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900 dark:text-white">{group._count?.students || 0} students</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">{group.status}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AttendanceList({ attendance }: { attendance: any[] }) {
  return (
    <div className="space-y-2">
      {attendance.slice(0, 10).map((record: any, index: number) => (
        <div
          key={record.id || index}
          className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
        >
          <div>
            <p className="font-medium text-slate-900 dark:text-white">
              {record.student?.firstName} {record.student?.lastName}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {new Date(record.date).toLocaleDateString()}
            </p>
          </div>
          <div>
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                record.status === 'PRESENT'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : record.status === 'ABSENT'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
              }`}
            >
              {record.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function CoursesList({ courses }: { courses: any[] }) {
  return (
    <div className="space-y-2">
      {courses.slice(0, 10).map((course: any) => (
        <div
          key={course.id}
          className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
        >
          <div>
            <p className="font-medium text-slate-900 dark:text-white">{course.name}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">{course.code}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900 dark:text-white">{course.credits} credits</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">{course.status}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function CompletionList({ students }: { students: any[] }) {
  return (
    <div className="space-y-2">
      {students.slice(0, 10).map((student: any) => (
        <div
          key={student.id}
          className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
        >
          <div>
            <p className="font-medium text-slate-900 dark:text-white">
              {student.firstName} {student.lastName}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">{student.group?.name || 'No Group'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-green-600 dark:text-green-400">{student.progress}%</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Completed</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AssessmentsList({ assessments }: { assessments: any[] }) {
  return (
    <div className="space-y-2">
      {assessments.slice(0, 10).map((assessment: any) => (
        <div
          key={assessment.id}
          className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
        >
          <div>
            <p className="font-medium text-slate-900 dark:text-white">{assessment.module}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {assessment.student?.firstName} {assessment.student?.lastName}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900 dark:text-white">{assessment.type}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Due: {new Date(assessment.dueDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
