"use client";

import { useState } from "react";
import { Check, X, AlertTriangle, MessageSquare, User, BookOpen, Calendar, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Assessment, ModerationData } from "@/types";
import useSWR from "swr";

interface ModerationQueueProps {
  assessments: Assessment[];
  onModerate: (assessmentId: string, data: ModerationData) => void;
}

export default function ModerationQueue({ assessments, onModerate }: ModerationQueueProps) {
  const { user } = useAuth();
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [moderationNotes, setModerationNotes] = useState("");
  const [showOverrideConfirm, setShowOverrideConfirm] = useState(false);
  const [newResult, setNewResult] = useState<'COMPETENT' | 'NOT_YET_COMPETENT'>('COMPETENT');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Fetch full assessment details when one is selected
  const { data: assessmentDetail, isLoading: isLoadingDetail } = useSWR(
    selectedAssessment ? `/api/assessments/${selectedAssessment.id}` : null,
    (url) => fetch(url).then((res) => res.json())
  );

  const handleModerate = (decision: 'confirmed' | 'referred' | 'overridden') => {
    if (!selectedAssessment || !user) return;

    // Validate that notes are provided for refer back
    if (decision === 'referred' && !moderationNotes.trim()) {
      alert('Please provide a reason for referring back this assessment');
      return;
    }

    // Validate that notes are provided for override
    if (decision === 'overridden' && !moderationNotes.trim()) {
      alert('Please provide a reason for overriding this assessment');
      return;
    }

    const moderationData: ModerationData = {
      assessmentId: selectedAssessment.id,
      moderationStatus: decision === 'confirmed' ? 'APPROVED' : decision === 'referred' ? 'RESUBMIT' : 'REJECTED',
      moderatorId: user.id,
      moderationNotes,
      ...(decision === 'overridden' && { newResult }),
    };

    onModerate(selectedAssessment.id, moderationData);

    // Show success toast
    const studentName = `${selectedAssessment.student?.firstName} ${selectedAssessment.student?.lastName}`;
    const messages = {
      confirmed: `Assessment confirmed for ${studentName}`,
      referred: `Assessment referred back for ${studentName}`,
      overridden: `Assessment overridden for ${studentName}`,
    };
    setToastMessage(messages[decision]);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    // Reset form
    setSelectedAssessment(null);
    setModerationNotes("");
    setShowOverrideConfirm(false);
  };

  const handleOverrideClick = () => {
    setShowOverrideConfirm(true);
  };

  const confirmOverride = () => {
    handleModerate('overridden');
  };

  const cancelOverride = () => {
    setShowOverrideConfirm(false);
  };

  // Sort pending assessments by oldest first
  const pendingAssessments = assessments
    .filter((a) => a.result !== "PENDING" && a.moderationStatus === "PENDING")
    .sort((a, b) => {
      const dateA = a.assessedDate ? new Date(a.assessedDate).getTime() : 0;
      const dateB = b.assessedDate ? new Date(b.assessedDate).getTime() : 0;
      return dateA - dateB; // Oldest first
    });

  if (pendingAssessments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-background-border p-12 text-center mt-6">
        <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">✓ All assessments moderated</p>
        <p className="text-sm text-slate-400 mt-1">No pending assessments require moderation</p>
      </div>
    );
  }

  return (
    <>
      {/* Success Toast */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top duration-300">
          <Check className="w-5 h-5" />
          {toastMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Assessment List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-slate-900 mb-4">
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
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium text-slate-900">
                  {assessment.student?.firstName} {assessment.student?.lastName}
                </p>
                <p className="text-sm text-slate-500">
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
            <div className="flex items-center gap-3 text-xs text-slate-500">
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
          isLoadingDetail ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Assessment Details</h3>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Student</p>
                      <p className="font-medium text-slate-900">
                        {selectedAssessment.student?.firstName} {selectedAssessment.student?.lastName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Unit Standard & Module</p>
                      <p className="font-medium text-slate-900">
                        {selectedAssessment.unitStandard} - {selectedAssessment.module}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm text-slate-500">Assessment Date</p>
                      <p className="font-medium text-slate-900">
                        {selectedAssessment.assessedDate
                          ? format(new Date(selectedAssessment.assessedDate), "MMMM d, yyyy")
                          : "Not recorded"}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200">
                    <p className="text-sm text-slate-500 mb-1">Original Marker's Decision</p>
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
                      <p className="text-sm text-slate-600 mt-2">
                        Score: {selectedAssessment.score}%
                      </p>
                    )}
                  </div>

                  {selectedAssessment.feedback && (
                    <div className="pt-3 border-t border-slate-200">
                      <p className="text-sm text-slate-500 mb-1">Assessor Feedback</p>
                      <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
                        {selectedAssessment.feedback}
                      </p>
                    </div>
                  )}

                  {/* Display submitted evidence if available */}
                  {assessmentDetail?.submittedEvidence && (
                    <div className="pt-3 border-t border-slate-200">
                      <p className="text-sm text-slate-500 mb-1 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Submitted Evidence
                      </p>
                      <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                        {assessmentDetail.submittedEvidence}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Moderation Notes {showOverrideConfirm && <span className="text-red-600">*</span>}
                </label>
                <textarea
                  rows={4}
                  value={moderationNotes}
                  onChange={(e) => setModerationNotes(e.target.value)}
                  placeholder={showOverrideConfirm ? "Required: Explain reason for override..." : "Add notes about your moderation decision..."}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {!showOverrideConfirm ? (
                <div className="space-y-2">
                  <button
                    onClick={() => handleModerate('confirmed')}
                    className="btn-primary-enhanced w-full flex items-center justify-center gap-2 px-4 py-3"
                    aria-label="Confirm assessment"
                  >
                    <Check className="w-5 h-5" />
                    Confirm Assessment
                  </button>

                  <button
                    onClick={() => handleModerate('referred')}
                    className="alert-warning w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors"
                    aria-label="Refer assessment back for review"
                  >
                    <AlertTriangle className="w-5 h-5" />
                    Refer Back
                  </button>

                  <button
                    onClick={handleOverrideClick}
                    className="btn-destructive w-full flex items-center justify-center gap-2 px-4 py-3"
                    aria-label="Override assessment decision with approval"
                  >
                    <X className="w-5 h-5" />
                    Override Decision
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-red-900 mb-2">Override Assessment Decision</p>
                    <p className="text-sm text-red-700 mb-3">
                      You are about to override the original marker's decision. This action requires a detailed explanation.
                    </p>
                    <label className="block text-sm font-medium text-red-900 mb-2">
                      New Result
                    </label>
                    <select
                      value={newResult}
                      onChange={(e) => setNewResult(e.target.value as 'COMPETENT' | 'NOT_YET_COMPETENT')}
                      className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    >
                      <option value="COMPETENT">Competent</option>
                      <option value="NOT_YET_COMPETENT">Not Yet Competent</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={cancelOverride}
                      className="btn-secondary-outline flex items-center justify-center gap-2 px-4 py-3"
                      aria-label="Cancel override operation"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmOverride}
                      className="btn-destructive flex items-center justify-center gap-2 px-4 py-3"
                      aria-label="Confirm assessment override"
                    >
                      <Check className="w-5 h-5" />
                      Confirm Override
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          <div className="text-center py-12 text-slate-500">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p>Select an assessment to moderate</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
