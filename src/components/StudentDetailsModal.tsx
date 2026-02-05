"use client";

import { useState, useEffect } from "react";
import { X, User, BookOpen, CheckCircle, Calendar, Edit2, Save, TrendingUp } from "lucide-react";
import { useCurriculum } from "@/hooks/useCurriculum";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface StudentDetailsModalProps {
  student: any;
  onClose: () => void;
  onSave: (updatedStudent: any) => void;
}

export default function StudentDetailsModal({ student, onClose, onSave }: StudentDetailsModalProps) {
  const { modules } = useCurriculum();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: student.firstName || "",
    lastName: student.lastName || "",
    studentId: student.studentId || "",
    email: student.email || "",
    phone: student.phone || "",
    idNumber: student.idNumber || "",
    progress: student.progress || 0,
    status: student.status || "ACTIVE",
  });

  // Mock data for formatives - In production, this would come from API
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
      record.date === date ? { ...record, status: newStatus } : record
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT": return "text-green-600 bg-green-50";
      case "LATE": return "text-orange-600 bg-orange-50";
      case "ABSENT": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case "Competent": return "text-green-600 bg-green-50";
      case "NYC": return "text-orange-600 bg-orange-50";
      case "Not Yet Started": return "text-gray-600 bg-gray-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {student.firstName} {student.lastName}
              </h2>
              <p className="text-gray-600">{student.studentId}</p>
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
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Personal Information */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{formData.firstName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{formData.lastName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{formData.studentId}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.idNumber}
                    onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{formData.idNumber || "Not provided"}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{formData.email || "Not provided"}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{formData.phone || "Not provided"}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
                <p className="text-gray-900">{student.group?.name || "No group"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                {isEditing ? (
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="AT_RISK">At Risk</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="WITHDRAWN">Withdrawn</option>
                  </select>
                ) : (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    formData.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    formData.status === 'AT_RISK' ? 'bg-yellow-100 text-yellow-800' :
                    formData.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {formData.status}
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Module Progress */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              Overall Progress
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Course Completion</span>
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                ) : (
                  <span className="text-sm font-bold text-gray-900">{formData.progress}%</span>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                  style={{ width: `${formData.progress}%` }}
                />
              </div>
            </div>
          </section>

          {/* Module Breakdown */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-500" />
              Module Breakdown
            </h3>
            <div className="space-y-3">
              {modules.map((module, idx) => {
                // Calculate mock progress for each module
                const moduleProgress = Math.min(100, Math.max(0, formData.progress - (idx * 16)));
                return (
                  <div key={module.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{module.code}</h4>
                        <p className="text-sm text-gray-600">{module.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {module.unitStandards?.length || 0} unit standards • {module.credits} credits
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-gray-900">{moduleProgress}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${moduleProgress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Completed Formatives */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-500" />
              Formatives & Assessments
            </h3>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              {formatives.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {formatives.map((formative) => (
                    <div key={formative.id} className="p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start gap-4">
                        {/* Status Icon */}
                        <div className="pt-1">
                          <div
                            className={cn(
                              "w-6 h-6 rounded border-2 flex items-center justify-center",
                              formative.isCompleted 
                                ? "bg-green-500 border-green-500" 
                                : "border-gray-300"
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
                            <span className="text-xs text-gray-500">{formative.type}</span>
                          </div>
                          <h4 className={cn(
                            "font-medium mb-1",
                            formative.isCompleted ? "text-gray-900" : "text-gray-500"
                          )}>
                            {formative.unitStandard}
                          </h4>
                          <p className="text-sm text-gray-600">{formative.moduleName}</p>
                          {formative.completedDate && (
                            <p className="text-xs text-gray-500 mt-1">
                              Completed: {format(new Date(formative.completedDate), "MMM d, yyyy")}
                            </p>
                          )}
                        </div>

                        {/* Status */}
                        <div className="flex flex-col items-end gap-2">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium",
                            formative.isCompleted ? getResultColor(formative.result) : "bg-gray-100 text-gray-600"
                          )}>
                            {formative.result}
                          </span>
                          {formative.isCompleted && (
                            <span className={`text-xs ${
                              formative.moderationStatus === 'Approved' ? 'text-green-600' :
                              formative.moderationStatus === 'Pending' ? 'text-orange-600' :
                              'text-gray-600'
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
                <div className="p-8 text-center text-gray-500">
                  <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p>No assessments available</p>
                </div>
              )}
            </div>
          </section>

          {/* Attendance History */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              Recent Attendance (Last 5 Days)
            </h3>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <div className="divide-y divide-gray-200">
                {attendanceHistory.map((record, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {format(new Date(record.date), "EEEE, MMM d, yyyy")}
                    </span>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium",
                      record.status === 'PRESENT' ? "bg-green-100 text-green-700" :
                      record.status === 'LATE' ? "bg-orange-100 text-orange-700" :
                      record.status === 'ABSENT' ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-700"
                    )}>
                      {record.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
