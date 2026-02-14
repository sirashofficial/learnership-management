"use client";

import { useState } from "react";
import { X, Save, AlertCircle } from "lucide-react";

interface MarkAssessmentModalProps {
  isOpen: boolean;
  assessment: any;
  onClose: () => void;
  onSubmit: (score: number | undefined, result: string, feedback: string) => Promise<void>;
  isLoading?: boolean;
}

export default function MarkAssessmentModal({
  isOpen,
  assessment,
  onClose,
  onSubmit,
  isLoading
}: MarkAssessmentModalProps) {
  const [score, setScore] = useState<number | undefined>(assessment?.score);
  const [result, setResult] = useState(assessment?.result || "PENDING");
  const [feedback, setFeedback] = useState(assessment?.feedback || "");
  const [error, setError] = useState("");

  if (!isOpen || !assessment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate
    if (!score && result !== "PENDING" && result !== "IN_PROGRESS") {
      setError("Score is required for marked assessments");
      return;
    }

    try {
      await onSubmit(score, result, feedback);
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Mark Assessment</h2>
            <p className="text-sm text-slate-600 mt-1">
              {assessment.student?.firstName} {assessment.student?.lastName}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Status/Result */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Assessment Status
            </label>
            <select
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPETENT">Competent</option>
              <option value="NOT_YET_COMPETENT">Not Yet Competent</option>
            </select>
          </div>

          {/* Score (for Summative/Integrated) */}
          {(assessment.type === "SUMMATIVE" || assessment.type === "INTEGRATED") && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Marks (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={score ?? ""}
                onChange={(e) => setScore(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Enter score"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {score !== undefined && (
                <p className="text-xs text-slate-500 mt-1">
                  {score >= 50 ? "✓ Pass" : score <= 30 ? "✗ Below average" : "~ Borderline"}
                </p>
              )}
            </div>
          )}

          {/* Feedback */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Feedback
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide constructive feedback to the learner..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
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
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isLoading ? "Saving..." : "Save Mark"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
