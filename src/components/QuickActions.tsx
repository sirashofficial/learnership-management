'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Users, Users2, Calendar, CheckSquare } from 'lucide-react';
import AddStudentModal from './AddStudentModal';
import GroupModal from './GroupModal';
import ScheduleLessonModal from './ScheduleLessonModal';
import MarkAttendanceModal from './MarkAttendanceModal';
import Toast, { useToast } from './Toast';
import { cn } from '@/lib/utils';

/**
 * REDESIGN: Quick Actions with icons and refined styling
 * Features:
 * - Icon + label for each action
 * - Refined green buttons with hover states
 * - Compact grid layout
 * - Clear visual hierarchy
 */
export default function QuickActions() {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showScheduleLesson, setShowScheduleLesson] = useState(false);
  const [showMarkAttendance, setShowMarkAttendance] = useState(false);

  const handleAddStudent = async (studentData: any) => {
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: studentData.studentId,
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          email: studentData.email || undefined,
          phone: studentData.phone || undefined,
          groupId: studentData.groupId || studentData.group,
          status: studentData.status || 'ACTIVE',
          progress: studentData.progress || 0,
        }),
      });

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Success:', result);
        showToast('Student added successfully!', 'success');
        setShowAddStudent(false);
        router.refresh();
      } else {
        const error = await response.json();
        console.error('❌ API Error:', error);
        showToast(error.error || error.message || 'Failed to add student', 'error');
      }
    } catch (error) {
      console.error('❌ Error adding student:', error);
      showToast('Failed to add student', 'error');
    }
  };

  const handleSaveGroup = async (groupData: any) => {
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData),
      });

      if (response.ok) {
        showToast('Group created successfully!', 'success');
        setShowCreateGroup(false);
        router.refresh();
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to create group', 'error');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      showToast('Failed to create group', 'error');
    }
  };

  const actions = [
    {
      id: 'add-student',
      label: 'Add Student',
      icon: Plus,
      onClick: () => setShowAddStudent(true),
    },
    {
      id: 'create-group',
      label: 'Create Group',
      icon: Users2,
      onClick: () => setShowCreateGroup(true),
    },
    {
      id: 'schedule-lesson',
      label: 'Schedule',
      icon: Calendar,
      onClick: () => setShowScheduleLesson(true),
    },
    {
      id: 'mark-attendance',
      label: 'Attendance',
      icon: CheckSquare,
      onClick: () => setShowMarkAttendance(true),
    },
  ];

  return (
    <>
      {/* Quick Actions Card */}
      <div className="dashboard-card p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h3>

        {/* Actions Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                className="quick-action-btn group"
                title={action.label}
              >
                <Icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                <span className="text-xs font-medium whitespace-nowrap">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Modals */}
      {showAddStudent && (
        <AddStudentModal
          isOpen={true}
          onClose={() => setShowAddStudent(false)}
          onAdd={handleAddStudent}
        />
      )}

      {showCreateGroup && (
        <GroupModal
          onClose={() => setShowCreateGroup(false)}
          onSave={handleSaveGroup}
        />
      )}

      {showScheduleLesson && (
        <ScheduleLessonModal
          isOpen={showScheduleLesson}
          onClose={() => setShowScheduleLesson(false)}
          onSuccess={() => {
            setShowScheduleLesson(false);
            router.refresh();
          }}
        />
      )}

      {showMarkAttendance && (
        <MarkAttendanceModal
          isOpen={showMarkAttendance}
          onClose={() => setShowMarkAttendance(false)}
          onSuccess={() => {
            setShowMarkAttendance(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
