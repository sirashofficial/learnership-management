"use client";

import { useState, useEffect } from "react";
import { X, User, BookOpen, CheckCircle, Calendar, Save, TrendingUp } from "lucide-react";
import { useCurriculum } from "@/hooks/useCurriculum";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface EditStudentModalProps {
  student: any;
  onClose: () => void;
  onSave: (updatedStudent: any) => void;
}

export default function EditStudentModal({ student, onClose, onSave }: EditStudentModalProps) {
  const { modules } = useCurriculum();
  const [formData, setFormData] = useState({
    firstName: student.firstName || "",
    lastName: student.lastName || "",
    studentId: student.studentId || "",
    email: student.email || "",
    phone: student.phone || "",
    idNumber: student.idNumber || "",
    progress: student.progress || 0,
    status: student.status || "ACTIVE",
    workingLocation: student.workingLocation || "onsite",
  });

  // Formatives data with edit functionality
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

  // Attendance data with edit functionality
  const [attendanceHistory, setAttendanceHistory] = useState([
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
      formatives,
      attendanceHistory
    });
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
      record.date === date ? { ...record, status: newStatus } : record
    ));
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Edit: {student.firstName} {student.lastName}
              </h2>
              <p className="text-slate-600">{student.studentId}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className="btn-primary-enhanced px-4 py-2 flex items-center gap-2"
                aria-label="Save all changes to student profile"
              >
                <Save className="w-4 h-4" />
                Save All Changes
              </button>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" aria-label="Close modal">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
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
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Student ID</label>
                <input
                  type="text"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ID Number</label>
                <input
                  type="text"
                  value={formData.idNumber}
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Group</label>
                <p className="text-slate-900 px-3 py-2">{student.group?.name || "No group"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
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
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Working Location</label>
                <select
                  value={formData.workingLocation}
                  onChange={(e) => setFormData({ ...formData, workingLocation: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="onsite">On-site</option>
                  <option value="home">Remote/Home</option>
                </select>
              </div>
            </div>
          </section>

          {/* Overall Progress */}
          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              Overall Progress
            </h3>
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Course Completion</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                  className="w-20 px-2 py-1 border border-slate-300 rounded text-sm"
                />
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                  style={{ width: `${formData.progress}%` }}
                />
              </div>
            </div>
          </section>

          {/* Formatives & Assessments - EDITABLE */}
          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-500" />
              Formatives & Assessments - Mark as Complete
            </h3>
            <div className="bg-slate-50 rounded-lg overflow-hidden">
              <div className="divide-y divide-slate-200">
                {formatives.map((formative) => (
                  <div key={formative.id} className="p-4 hover:bg-slate-100 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <div className="pt-1">
                        <button
                          onClick={() => toggleFormativeCompletion(formative.id)}
                          className={cn(
                            "w-6 h-6 rounded border-2 flex items-center justify-center transition-all",
                            formative.isCompleted 
                              ? "bg-green-500 border-green-500" 
                              : "border-slate-300 hover:border-green-400"
                          )}
                        >
                          {formative.isCompleted && (
                            <CheckCircle className="w-4 h-4 text-white" />
                          )}
                        </button>
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
                          <span className={`text-xs ${
                            formative.moderationStatus === 'Approved' ? 'text-green-600' :
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
            </div>
          </section>

          {/* Attendance History - EDITABLE */}
          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              Recent Attendance - Update Status
            </h3>
            <div className="bg-slate-50 rounded-lg overflow-hidden">
              <div className="divide-y divide-slate-200">
                {attendanceHistory.map((record, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      {format(new Date(record.date), "EEEE, MMM d, yyyy")}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateAttendanceStatus(record.date, 'PRESENT')}
                        className={cn(
                          "px-3 py-1 rounded-lg text-xs font-medium transition-all",
                          record.status === 'PRESENT'
                            ? "bg-green-500 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-green-50 hover:text-green-600"
                        )}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => updateAttendanceStatus(record.date, 'LATE')}
                        className={cn(
                          "px-3 py-1 rounded-lg text-xs font-medium transition-all",
                          record.status === 'LATE'
                            ? "bg-orange-500 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-600"
                        )}
                      >
                        Late
                      </button>
                      <button
                        onClick={() => updateAttendanceStatus(record.date, 'ABSENT')}
                        className={cn(
                          "px-3 py-1 rounded-lg text-xs font-medium transition-all",
                          record.status === 'ABSENT'
                            ? "bg-red-500 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600"
                        )}
                      >
                        Absent
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={handleSave}
              className="flex-1 btn-primary-enhanced px-4 py-2.5"
              aria-label="Save all changes to student profile"
            >
              Save All Changes
            </button>
            <button
              onClick={onClose}
              className="btn-secondary-outline px-4 py-2.5"
              aria-label="Cancel and close modal"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
