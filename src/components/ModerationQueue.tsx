"use client";

import { useState } from "react";
import { Check, X, RotateCw, MessageSquare, User, BookOpen, Calendar } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ModerationQueueProps {
  assessments: any[];
  onModerate: (assessmentId: string, data: any) => void;
}

export default function ModerationQueue({ assessments, onModerate }: ModerationQueueProps) {
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [moderationNotes, setModerationNotes] = useState("");

  const handleModerate = (status: string) => {
    if (!selectedAssessment) return;
    
    onModerate(selectedAssessment.id, {
      assessmentId: selectedAssessment.id,
      moderationStatus: status,
      moderatorId: "current-user-id", // TODO: Replace with actual user ID
      moderationNotes,
    });

    setSelectedAssessment(null);
    setModerationNotes("");
  };

  const pendingAssessments = assessments.filter(
    (a) => a.result !== "PENDING" && a.moderationStatus === "PENDING"
  );

  if (pendingAssessments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-background-border p-12 text-center">
        <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">All assessments are moderated</p>
        <p className="text-sm text-gray-400 mt-1">No pending assessments require moderation</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Assessment List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 mb-4">
          Pending Moderation ({pendingAssessments.length})
        </h3>
        {pendingAssessments.map((assessment) => (
          <div
            key={assessment.id}
            onClick={() => setSelectedAssessment(assessment)}
            className={cn(
              "p-4 border-2 rounded-lg cursor-pointer transition-colors",
              selectedAssessment?.id === assessment.id
                ? "border-primary bg-primary/5"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium text-gray-900">
                  {assessment.student.firstName} {assessment.student.lastName}
                </p>
                <p className="text-sm text-gray-500">
                  {assessment.unitStandard} - {assessment.module}
                </p>
              </div>
              <span
                className={cn(
                  "px-2 py-1 text-xs font-medium rounded-full",
                  assessment.result === "COMPETENT"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                )}
              >
                {assessment.result === "COMPETENT" ? "Competent" : "NYC"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>{assessment.type}</span>
              <span>•</span>
              <span>{assessment.method}</span>
              {assessment.assessedDate && (
                <>
                  <span>•</span>
                  <span>{format(new Date(assessment.assessedDate), "MMM d")}</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Moderation Panel */}
      <div className="bg-white rounded-xl border border-background-border p-6">
        {selectedAssessment ? (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Assessment Details</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Student</p>
                    <p className="font-medium text-gray-900">
                      {selectedAssessment.student.firstName} {selectedAssessment.student.lastName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <BookOpen className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Unit Standard & Module</p>
                    <p className="font-medium text-gray-900">
                      {selectedAssessment.unitStandard} - {selectedAssessment.module}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Assessment Date</p>
                    <p className="font-medium text-gray-900">
                      {selectedAssessment.assessedDate 
                        ? format(new Date(selectedAssessment.assessedDate), "MMMM d, yyyy")
                        : "Not recorded"}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Result</p>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium",
                      selectedAssessment.result === "COMPETENT"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    )}
                  >
                    {selectedAssessment.result === "COMPETENT" ? (
                      <><Check className="w-4 h-4" /> Competent</>
                    ) : (
                      <><X className="w-4 h-4" /> Not Yet Competent</>
                    )}
                  </span>
                  {selectedAssessment.score && (
                    <p className="text-sm text-gray-600 mt-2">
                      Score: {selectedAssessment.score}%
                    </p>
                  )}
                </div>

                {selectedAssessment.feedback && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-1">Assessor Feedback</p>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {selectedAssessment.feedback}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Moderation Notes
              </label>
              <textarea
                rows={4}
                value={moderationNotes}
                onChange={(e) => setModerationNotes(e.target.value)}
                placeholder="Add notes about your moderation decision..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleModerate("APPROVED")}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                <Check className="w-5 h-5" />
                Approve Assessment
              </button>

              <button
                onClick={() => handleModerate("REJECTED")}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                <X className="w-5 h-5" />
                Reject Assessment
              </button>

              <button
                onClick={() => handleModerate("RESUBMIT")}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
              >
                <RotateCw className="w-5 h-5" />
                Request Resubmission
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>Select an assessment to moderate</p>
          </div>
        )}
      </div>
    </div>
  );
}
