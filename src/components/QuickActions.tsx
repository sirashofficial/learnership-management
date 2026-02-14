'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AddStudentModal from './AddStudentModal';
import GroupModal from './GroupModal';
import ScheduleLessonModal from './ScheduleLessonModal';
import MarkAttendanceModal from './MarkAttendanceModal';
import Toast, { useToast } from './Toast';
import { cn } from '@/lib/utils';

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

  return (
    <>
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Quick actions</h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setShowAddStudent(true)}
            className="btn-primary text-sm py-2.5"
          >
            Add Student
          </button>

          <button
            onClick={() => setShowCreateGroup(true)}
            className="btn-secondary text-sm py-2.5"
          >
            Create Group
          </button>

          <button
            onClick={() => setShowScheduleLesson(true)}
            className="btn-secondary text-sm py-2.5"
          >
            Schedule Lesson
          </button>

          <button
            onClick={() => setShowMarkAttendance(true)}
            className="btn-secondary text-sm py-2.5"
          >
            Mark Attendance
          </button>
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
