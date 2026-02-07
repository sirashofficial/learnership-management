"use client";

import { useState, useEffect } from "react";
import { X, User, BookOpen, CheckCircle, Calendar, Edit2, Save, TrendingUp, FileText, ClipboardCheck, BarChart3, CalendarCheck, Plus } from "lucide-react";
import { useCurriculum } from "@/hooks/useCurriculum";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";
import AttendanceCalendar from "./AttendanceCalendar";
import ModuleProgressionPanel from "./ModuleProgressionPanel";
import CreateAssessmentModal from "./CreateAssessmentModal";

interface StudentDetailsModalProps {
  isOpen: boolean;
  student: any;
  onClose: () => void;
  onSave: (updatedStudent: any) => void;
}

export default function StudentDetailsModal({ student, onClose, onSave }: StudentDetailsModalProps) {
  const { modules } = useCurriculum();
  const [isEditing, setIsEditing] = useState(false);
  const [showAttendanceCalendar, setShowAttendanceCalendar] = useState(false);
  const [showModuleProgression, setShowModuleProgression] = useState(false);
  const [showCreateAssessment, setShowCreateAssessment] = useState(false);
  const [formData, setFormData] = useState({
    firstName: student.firstName || "",
    lastName: student.lastName || "",
    studentId: student.studentId || "",
    email: student.email || "",
    phone: student.phone || "",
    idNumber: student.idNumber || "",
    progress: student.progress || 0,
    totalCreditsEarned: student.totalCreditsEarned || 0,
    totalCreditsRequired: 138,
    status: student.status || "ACTIVE",
  });

  const [formatives, setFormatives] = useState([
    {
      id: "1",
      moduleCode: "NVC-M1",
      moduleName: "Communication and Facilitation Skills",
      unitStandard: "115753 - Accommodate audience and context",
      type: "Formative",
      completedDate: "2026-01-15",
      result: "Competent",
      moderationStatus: "Approved",
      isCompleted: true
    },
    {
      id: "2",
      moduleCode: "NVC-M1",
      moduleName: "Communication and Facilitation Skills",
      unitStandard: "115754 - Apply communication principles",
      type: "Formative",
      completedDate: "2026-01-22",
      result: "Competent",
      moderationStatus: "Pending",
      isCompleted: true
    },
    {
      id: "3",
      moduleCode: "NVC-M2",
      moduleName: "Organisational Skills",
      unitStandard: "7468 - Use mathematics to investigate and monitor financial aspects",
      type: "Formative",
      completedDate: null,
      result: "Not Yet Started",
      moderationStatus: "Not Submitted",
      isCompleted: false
    },
    {
      id: "4",
      moduleCode: "NVC-M2",
      moduleName: "Organisational Skills",
      unitStandard: "12433 - Manage resources and tools",
      type: "Formative",
      completedDate: null,
      result: "Not Yet Started",
      moderationStatus: "Not Submitted",
      isCompleted: false
    }
  ]);

  // Mock attendance data
  const [attendanceHistory, setAttendanceHistory] = useState<Array<{ date: string; status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED' }>>([
    { date: "2026-02-05", status: "PRESENT" },
    { date: "2026-02-04", status: "PRESENT" },
    { date: "2026-02-03", status: "LATE" },
    { date: "2026-01-31", status: "PRESENT" },
    { date: "2026-01-30", status: "ABSENT" },
  ]);

  const handleSave = () => {
    onSave({
      ...student,
      ...formData,
    });
    setIsEditing(false);
  };

  const toggleFormativeCompletion = (formativeId: string) => {
    setFormatives(formatives.map(f => {
      if (f.id === formativeId) {
        const isNowCompleted = !f.isCompleted;
        return {
          ...f,
          isCompleted: isNowCompleted,
          completedDate: isNowCompleted ? new Date().toISOString().split('T')[0] : null,
          result: isNowCompleted ? "Competent" : "Not Yet Started",
          moderationStatus: isNowCompleted ? "Pending" : "Not Submitted"
        };
      }
      return f;
    }));
  };

  const updateAttendanceStatus = (date: string, newStatus: string) => {
    setAttendanceHistory(attendanceHistory.map(record =>
      record.date === date ? { ...record, status: newStatus as 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED' } : record
    ));
  };

  const handleMarkAttendance = async (date: string, status: string, reason?: string) => {
    const typedStatus = status as 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';

    try {
      // Save to database via API
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: [{
            studentId: student.id,
            groupId: student.groupId,
            date,
            status: typedStatus,
            notes: reason || null,
          }]
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save attendance');
      }

      // Update local state on success
      const existingIndex = attendanceHistory.findIndex(r => r.date === date);
      if (existingIndex >= 0) {
        const updated = [...attendanceHistory];
        updated[existingIndex] = { date, status: typedStatus };
        setAttendanceHistory(updated);
      } else {
        setAttendanceHistory([...attendanceHistory, { date, status: typedStatus }]);
      }
    } catch (error) {
      alert('Failed to save attendance. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT": return "text-green-600 bg-green-50";
      case "LATE": return "text-orange-600 bg-orange-50";
      case "ABSENT": return "text-red-600 bg-red-50";
      default: return "text-slate-600 bg-slate-50";
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case "Competent": return "text-green-600 bg-green-50";
      case "NYC": return "text-orange-600 bg-orange-50";
      case "Not Yet Started": return "text-slate-600 bg-slate-50";
      default: return "text-slate-600 bg-slate-50";
    }
  };

  return (
    <>
      {showAttendanceCalendar && (
        <AttendanceCalendar
          studentId={student.id}
          studentName={`${student.firstName} ${student.lastName}`}
          attendance={attendanceHistory}
          onMarkAttendance={handleMarkAttendance}
          onClose={() => setShowAttendanceCalendar(false)}
        />
      )}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {student.firstName} {student.lastName}
                </h2>
                <p className="text-slate-600">{student.studentId}</p>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Info
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                )}
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Quick Action Links */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200 flex-wrap">
              <button
                onClick={() => setShowModuleProgression(!showModuleProgression)}
                className="flex items-center gap-2 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors text-sm font-medium"
              >
                <TrendingUp className="w-4 h-4" />
                {showModuleProgression ? 'Hide' : 'Show'} Module Progression
              </button>
              <button
                onClick={() => setShowCreateAssessment(true)}
                className="flex items-center gap-2 px-3 py-2 bg-cyan-50 text-cyan-700 rounded-lg hover:bg-cyan-100 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Create Assessment
              </button>
              <button
                onClick={() => setShowAttendanceCalendar(true)}
                className="flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium"
              >
                <CalendarCheck className="w-4 h-4" />
                Mark Attendance
              </button>
              <Link
                href="/assessments"
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                <CheckCircle className="w-4 h-4" />
                View Assessments
              </Link>
              <Link
                href="/poe"
                className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
              >
                <FileText className="w-4 h-4" />
                POE Checklist
              </Link>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Personal Information */}
            <section>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-slate-900">{formData.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-slate-900">{formData.lastName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Student ID</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.studentId}
                      onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-slate-900">{formData.studentId}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ID Number</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.idNumber}
                      onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-slate-900">{formData.idNumber || "Not provided"}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-slate-900">{formData.email || "Not provided"}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-slate-900">{formData.phone || "Not provided"}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Group</label>
                  <p className="text-slate-900">{student.group?.name || "No group"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  {isEditing ? (
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="AT_RISK">At Risk</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="WITHDRAWN">Withdrawn</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${formData.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      formData.status === 'AT_RISK' ? 'bg-yellow-100 text-yellow-800' :
                        formData.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                          'bg-slate-100 text-slate-800'
                      }`}>
                      {formData.status}
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* Module Progress */}
            <section>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                Overall Progress
              </h3>
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Course Completion</span>
                  <div className="text-right">
                    <span className="block text-sm font-bold text-slate-900">{formData.progress}%</span>
                    <span className="text-xs text-slate-500">{formData.totalCreditsEarned} / {formData.totalCreditsRequired} Credits</span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                    style={{ width: `${formData.progress}%` }}
                  />
                </div>
              </div>
            </section>

            {/* Module Breakdown Timeline */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-green-500" />
                  Module Breakdown
                </h3>
                <button
                  onClick={() => setShowModuleProgression(!showModuleProgression)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showModuleProgression ? 'Hide Details' : 'Show Detailed Tracker'}
                </button>
              </div>

              {showModuleProgression ? (
                <ModuleProgressionPanel
                  studentId={student.id}
                  onModuleChange={() => {
                    // Update header progress if needed
                    console.log('Module progression updated');
                  }}
                />
              ) : (
                <div className="bg-slate-50 p-6 rounded-lg text-center border-2 border-dashed border-slate-200">
                  <p className="text-slate-600 mb-4">Detailed module-by-module tracking and credit analysis.</p>
                  <button
                    onClick={() => setShowModuleProgression(true)}
                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium"
                  >
                    Open Progression Tracker
                  </button>
                </div>
              )}
            </section>


            {/* Completed Formatives */}
            <section>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-500" />
                Formatives & Assessments
              </h3>
              <div className="bg-slate-50 rounded-lg overflow-hidden">
                {formatives.length > 0 ? (
                  <div className="divide-y divide-slate-200">
                    {formatives.map((formative) => (
                      <div key={formative.id} className="p-4 hover:bg-slate-100 transition-colors">
                        <div className="flex items-start gap-4">
                          {/* Status Icon */}
                          <div className="pt-1">
                            <div
                              className={cn(
                                "w-6 h-6 rounded border-2 flex items-center justify-center",
                                formative.isCompleted
                                  ? "bg-green-500 border-green-500"
                                  : "border-slate-300"
                              )}
                            >
                              {formative.isCompleted && (
                                <CheckCircle className="w-4 h-4 text-white" />
                              )}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                {formative.moduleCode}
                              </span>
                              <span className="text-xs text-slate-500">{formative.type}</span>
                            </div>
                            <h4 className={cn(
                              "font-medium mb-1",
                              formative.isCompleted ? "text-slate-900" : "text-slate-500"
                            )}>
                              {formative.unitStandard}
                            </h4>
                            <p className="text-sm text-slate-600">{formative.moduleName}</p>
                            {formative.completedDate && (
                              <p className="text-xs text-slate-500 mt-1">
                                Completed: {format(new Date(formative.completedDate), "MMM d, yyyy")}
                              </p>
                            )}
                          </div>

                          {/* Status */}
                          <div className="flex flex-col items-end gap-2">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-xs font-medium",
                              formative.isCompleted ? getResultColor(formative.result) : "bg-slate-100 text-slate-600"
                            )}>
                              {formative.result}
                            </span>
                            {formative.isCompleted && (
                              <span className={`text-xs ${formative.moderationStatus === 'Approved' ? 'text-green-600' :
                                formative.moderationStatus === 'Pending' ? 'text-orange-600' :
                                  'text-slate-600'
                                }`}>
                                {formative.moderationStatus === 'Approved' ? '✓ Moderated' : '○ Pending moderation'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p>No assessments available</p>
                  </div>
                )}
              </div>
            </section>

            {/* Attendance History */}
            <section>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-500" />
                Recent Attendance (Last 5 Days)
              </h3>
              <div className="bg-slate-50 rounded-lg overflow-hidden">
                <div className="divide-y divide-slate-200">
                  {attendanceHistory.map((record, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">
                        {format(new Date(record.date), "EEEE, MMM d, yyyy")}
                      </span>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium",
                        record.status === 'PRESENT' ? "bg-green-100 text-green-700" :
                          record.status === 'LATE' ? "bg-orange-100 text-orange-700" :
                            record.status === 'ABSENT' ? "bg-red-100 text-red-700" :
                              "bg-slate-100 text-slate-700"
                      )}>
                        {record.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Assessment Modal */}
      {showCreateAssessment && (
        <CreateAssessmentModal
          isOpen={showCreateAssessment}
          onClose={() => setShowCreateAssessment(false)}
          studentId={student.id}
          onSuccess={() => {
            setShowCreateAssessment(false);
            // Optionally refresh data
            console.log('Assessment created successfully');
          }}
        />
      )}
    </>
  );
}
