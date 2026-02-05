"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useGroups } from "@/contexts/GroupsContext";

interface AddStudentModalProps {
  onClose: () => void;
  onAdd: (student: {
    name: string;
    studentId: string;
    site: string;
    group?: string;
    phone?: string;
    email?: string;
    currentModule: number;
    moduleName: string;
    progress: number;
    status: "ACTIVE" | "AT_RISK" | "COMPLETED" | "WITHDRAWN";
    lastAttendance: string;
    attendanceStreak: number;
    absenceCount: number;
    enrollmentDate?: string;
    dailyAttendanceRate?: number;
  }) => void;
}

export default function AddStudentModal({ onClose, onAdd }: AddStudentModalProps) {
  const { groups } = useGroups();
  const [formData, setFormData] = useState({
    name: "",
    studentId: "",
    group: "",
    phone: "",
    email: "",
    status: "ACTIVE" as const,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.studentId || !formData.group) {
      alert("Please fill in required fields: Name, Student ID, and Group");
      return;
    }

    // Find the selected group to get its ID
    const selectedGroup = groups.find(g => g.id === formData.group);
    if (!selectedGroup) {
      alert("Please select a valid group");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    onAdd({
      ...formData,
      site: selectedGroup.name, // Keep for backward compatibility
      group: selectedGroup.name,
      currentModule: 1,
      moduleName: "Orientation & Induction",
      progress: 0,
      lastAttendance: today,
      attendanceStreak: 0,
      absenceCount: 0,
      enrollmentDate: today,
      dailyAttendanceRate: 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Add New Student</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g., Thabo Mokwena"
                required
              />
            </div>

            {/* Student ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g., STU001"
                required
              />
            </div>

            {/* Group */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Training Group <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.group}
                onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="">Select group...</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} - {group.location}
                  </option>
                ))}
              </select>
              {groups.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  No groups available. Create a group first in Groups & Companies.
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="ACTIVE">Active</option>
                <option value="AT_RISK">At Risk</option>
                <option value="COMPLETED">Completed</option>
                <option value="WITHDRAWN">Withdrawn</option>
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number (Optional)</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="+27 11 123 4567"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email (Optional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="student@example.com"
              />
            </div>
          </div>

          {/* Info Note */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> New students will start at Module 1 with 0% progress. You can update their module and
              progress later from the Students tab.
            </p>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={groups.length === 0}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Student
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
