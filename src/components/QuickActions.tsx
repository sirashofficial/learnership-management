'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AddStudentModal from './AddStudentModal';
import GroupModal from './GroupModal';
import ScheduleLessonModal from './ScheduleLessonModal';
import MarkAttendanceModal from './MarkAttendanceModal';
import { cn } from '@/lib/utils';

export default function QuickActions() {
  const router = useRouter();
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
      <div className="bg-white/50 backdrop-blur-xl rounded-[2rem] shadow-premium border border-white/20 p-8 mb-8 noise-texture">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-black font-display tracking-tight">Strategic Actions</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accelerate your workflow with contextual directives</p>
          </div>
          <div className="h-px flex-1 bg-slate-100 hidden sm:block mx-8"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setShowAddStudent(true)}
            className="btn-emerald group"
          >
            <span className="flex items-center justify-center gap-2">
              Add Student
              <div className="w-1.5 h-1.5 rounded-full bg-white opacity-20 group-hover:opacity-100 transition-opacity" />
            </span>
          </button>

          <button
            onClick={() => setShowCreateGroup(true)}
            className="btn-teal group"
          >
            <span className="flex items-center justify-center gap-2">
              Create Group
              <div className="w-1.5 h-1.5 rounded-full bg-white opacity-20 group-hover:opacity-100 transition-opacity" />
            </span>
          </button>

          <button
            onClick={() => setShowScheduleLesson(true)}
            className="btn-cyan group"
          >
            <span className="flex items-center justify-center gap-2">
              Schedule Lesson
              <div className="w-1.5 h-1.5 rounded-full bg-white opacity-20 group-hover:opacity-100 transition-opacity" />
            </span>
          </button>

          <button
            onClick={() => setShowMarkAttendance(true)}
            className="btn-slate group"
          >
            <span className="flex items-center justify-center gap-2">
              Mark Attendance
              <div className="w-1.5 h-1.5 rounded-full bg-white opacity-20 group-hover:opacity-100 transition-opacity" />
            </span>
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
