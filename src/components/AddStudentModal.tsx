"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useGroups } from "@/contexts/GroupsContext";
import { formatGroupNameDisplay } from "@/lib/groupName";
import { useFocusTrap, AriaLiveRegion } from "@/components/ui/FormAccessibility";

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (student: {
    studentId: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    idNumber?: string;
    group?: string;
    groupId?: string;
    status: "ACTIVE" | "AT_RISK" | "COMPLETED" | "WITHDRAWN";
    progress: number;
  }) => void;
  groupId?: string;
  groupName?: string;
}

export default function AddStudentModal({ isOpen, onClose, onAdd, groupId, groupName }: AddStudentModalProps) {
  if (!isOpen) return null;
  
  const { groups } = useGroups();
  const modalRef = useFocusTrap(isOpen);
  
  const [formData, setFormData] = useState({
    name: "",
    studentId: "",
    group: groupId || "",
    phone: "",
    email: "",
    status: "ACTIVE" as const,
    hasDisability: false,
    disabilityNotes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!formData.group) {
      newErrors.group = "Group is required";
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) {
      setSubmitError("Please fix the errors above");
      return;
    }

    // Find the selected group to get its ID
    const selectedGroup = groups.find(g => g.id === formData.group);
    if (!selectedGroup) {
      setSubmitError("Please select a valid group");
      return;
    }

    setIsSubmitting(true);

    try {
      // Split name into firstName and lastName
      const nameParts = formData.name.trim().split(/\s+/);
      const firstName = nameParts[0] || formData.name;
      const lastName = nameParts.slice(1).join(' ') || '';

      const studentData = {
        studentId: formData.studentId || undefined,
        firstName,
        lastName,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        group: formData.group,
        groupId: formData.group,
        status: formData.status,
        progress: 0,
      };

      await onAdd(studentData as any);
      onClose();
    } catch (error: any) {
      console.error('❌ Error adding student:', error);
      setSubmitError(error.message || 'Failed to add student. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-labelledby="add-student-title"
        aria-modal="true"
      >
        {/* Error announcement for screen readers */}
        {submitError && <AriaLiveRegion message={submitError} priority="assertive" />}
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <h2 id="add-student-title" className="text-2xl font-bold text-slate-900">Add New Student</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" aria-label="Close modal">
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {submitError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onBlur={() => validateForm()}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                  errors.name
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-slate-300 focus:ring-primary'
                }`}
                placeholder="e.g., Thabo Mokwena"
                required
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
              {errors.name && (
                <p id="name-error" className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Student ID */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Student ID (Optional)
              </label>
              <input
                type="text"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-slate-50"
                placeholder="Leave empty for auto-generation (e.g., AZ-01)"
              />
              <p className="text-xs text-slate-500 mt-1">If left empty, will be auto-generated based on group (e.g., AZ-01, AZ-02, BE-01)</p>
            </div>

            {/* Group */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Training Group <span className="text-red-500">*</span>
              </label>
              {groupId && groupName ? (
                <div className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 font-medium">
                  {formatGroupNameDisplay(groupName)}
                </div>
              ) : (
                <>
                  <select
                    value={formData.group}
                    onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                    onBlur={() => validateForm()}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                      errors.group
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-slate-300 focus:ring-primary'
                    }`}
                    required
                    aria-invalid={!!errors.group}
                    aria-describedby={errors.group ? "group-error" : undefined}
                  >
                    <option value="">Select group...</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {formatGroupNameDisplay(group.name)} - {group.location}
                      </option>
                    ))}
                  </select>
                  {errors.group && (
                    <p id="group-error" className="mt-1 text-sm text-red-600">{errors.group}</p>
                  )}
                </>
              )}
              {groups.length === 0 && (
                <p className="text-sm text-slate-500 mt-1">
                  No groups available. Create a group first in Groups & Companies.
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="ACTIVE">Active</option>
                <option value="AT_RISK">At Risk</option>
                <option value="COMPLETED">Completed</option>
                <option value="WITHDRAWN">Withdrawn</option>
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number (Optional)</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="+27 11 123 4567"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email (Optional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onBlur={() => validateForm()}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                  errors.email
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-slate-300 focus:ring-primary'
                }`}
                placeholder="student@example.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            </div>

            {/* Disability Support */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Disability Support Required?</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="disability"
                    checked={!formData.hasDisability}
                    onChange={() => setFormData({ ...formData, hasDisability: false, disabilityNotes: "" })}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-sm text-slate-700">No</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="disability"
                    checked={formData.hasDisability}
                    onChange={() => setFormData({ ...formData, hasDisability: true })}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-sm text-slate-700">Yes</span>
                </label>
              </div>
              {formData.hasDisability && (
                <textarea
                  value={formData.disabilityNotes}
                  onChange={(e) => setFormData({ ...formData, disabilityNotes: e.target.value })}
                  placeholder="Describe support requirements..."
                  className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={3}
                />
              )}
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
              disabled={groups.length === 0 || isSubmitting}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Student'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
