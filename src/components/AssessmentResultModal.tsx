"use client";

import { useState } from "react";
import { X, Check, XCircle, AlertTriangle, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  assessment: any;
}

export default function AssessmentResultModal({
  isOpen,
  onClose,
  onSubmit,
  assessment,
}: ResultModalProps) {
  const [formData, setFormData] = useState({
    result: assessment?.result || "",
    score: assessment?.score || "",
    feedback: assessment?.feedback || "",
    assessedDate: assessment?.assessedDate?.split("T")[0] || new Date().toISOString().split("T")[0],
  });

  if (!isOpen || !assessment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: assessment.id,
      ...formData,
      score: formData.score ? parseInt(formData.score) : null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Record Assessment Result</h2>
            <p className="text-sm text-gray-500 mt-1">
              {assessment.student.firstName} {assessment.student.lastName} - {assessment.unitStandard}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Result */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assessment Result *
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, result: "COMPETENT" })}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors",
                  formData.result === "COMPETENT"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <Check className="w-5 h-5" />
                <span className="font-medium">Competent</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, result: "NOT_YET_COMPETENT" })}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors",
                  formData.result === "NOT_YET_COMPETENT"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <XCircle className="w-5 h-5" />
                <span className="font-medium">NYC</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, result: "PENDING" })}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors",
                  formData.result === "PENDING"
                    ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Pending</span>
              </button>
            </div>
          </div>

          {/* Score & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Score (Optional)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                placeholder="0-100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assessment Date *
              </label>
              <input
                required
                type="date"
                value={formData.assessedDate}
                onChange={(e) => setFormData({ ...formData, assessedDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Feedback */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Feedback & Comments
            </label>
            <textarea
              rows={4}
              value={formData.feedback}
              onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
              placeholder="Provide detailed feedback on the learner's performance..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Info Box */}
          {formData.result === "NOT_YET_COMPETENT" && (
            <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Not Yet Competent Result</p>
                <p className="mt-1">The learner will need to resubmit or retake this assessment. Ensure feedback clearly indicates areas for improvement.</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.result}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Result
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
