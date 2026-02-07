"use client";

import { useState } from "react";
import { X, Plus, Check, AlertCircle, Clock, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  students: Array<{ id: string; firstName: string; lastName: string; studentId: string }>;
  modules: Array<{ id: string; code: string; name: string }>;
  assessment?: any;
}

export default function AssessmentModal({
  isOpen,
  onClose,
  onSubmit,
  students,
  modules,
  assessment,
}: AssessmentModalProps) {
  const [formData, setFormData] = useState({
    studentId: assessment?.studentId || "",
    module: assessment?.module || "",
    unitStandard: assessment?.unitStandard || "",
    type: assessment?.type || "FORMATIVE",
    method: assessment?.method || "KNOWLEDGE",
    dueDate: assessment?.dueDate?.split("T")[0] || "",
    notes: assessment?.notes || "",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">
            {assessment ? "Edit Assessment" : "Create New Assessment"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Student Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Student *
            </label>
            <select
              required
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select student...</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.firstName} {student.lastName} ({student.studentId})
                </option>
              ))}
            </select>
          </div>

          {/* Module & Unit Standard */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Module *
              </label>
              <select
                required
                value={formData.module}
                onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select module...</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.name}>
                    {module.code} - {module.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Unit Standard *
              </label>
              <input
                required
                type="text"
                placeholder="e.g., US119472"
                value={formData.unitStandard}
                onChange={(e) => setFormData({ ...formData, unitStandard: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Assessment Type & Method */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Assessment Type *
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="FORMATIVE">Formative</option>
                <option value="SUMMATIVE">Summative</option>
                <option value="INTEGRATED">Integrated Summative</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Assessment Method *
              </label>
              <select
                required
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="KNOWLEDGE">Knowledge Assessment</option>
                <option value="PRACTICAL">Practical Assessment</option>
                <option value="OBSERVATION">Workplace Observation</option>
                <option value="PORTFOLIO">Portfolio of Evidence</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Due Date *
            </label>
            <input
              required
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional notes or instructions..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              {assessment ? "Update Assessment" : "Create Assessment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
