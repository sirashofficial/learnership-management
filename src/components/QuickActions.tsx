'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AddStudentModal from './AddStudentModal';
import GroupModal from './GroupModal';
import ScheduleLessonModal from './ScheduleLessonModal';
import MarkAttendanceModal from './MarkAttendanceModal';

export default function QuickActions() {
  const router = useRouter();
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showScheduleLesson, setShowScheduleLesson] = useState(false);
  const [showMarkAttendance, setShowMarkAttendance] = useState(false);

  const handleAddStudent = async (studentData: any) => {
    try {
      console.log('📝 QuickActions: Received student data:', studentData);
      
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
        alert('Student added successfully!');
        setShowAddStudent(false);
        router.refresh();
      } else {
        const error = await response.json();
        console.error('❌ API Error:', error);
        alert(error.error || error.message || 'Failed to add student');
      }
    } catch (error) {
      console.error('❌ Error adding student:', error);
      alert('Failed to add student');
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
        setShowCreateGroup(false);
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group');
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowAddStudent(true)}
            className="flex-1 min-w-[150px] px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Add Student
          </button>
          
          <button
            onClick={() => setShowCreateGroup(true)}
            className="flex-1 min-w-[150px] px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Create Group
          </button>
          
          <button
            onClick={() => setShowScheduleLesson(true)}
            className="flex-1 min-w-[150px] px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Schedule Lesson
          </button>
          
          <button
            onClick={() => setShowMarkAttendance(true)}
            className="flex-1 min-w-[150px] px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Mark Attendance
          </button>
        </div>
      </div>

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
