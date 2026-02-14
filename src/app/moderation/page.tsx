"use client";

// ...existing code...
import ModerationQueue from "@/components/ModerationQueue";
import { useAssessments } from "@/hooks/useAssessments";
import { CheckCircle, Clock } from "lucide-react";

export default function ModerationPage() {
  const { assessments, isLoading, mutate } = useAssessments({
    moderationStatus: "PENDING",
  });

  const handleModerate = async (assessmentId: string, data: any) => {
    try {
      const response = await fetch("/api/assessments/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId, // Include the assessmentId
          ...data,
        }),
      });
      if (response.ok) {
        mutate();
      } else {
        console.error("Moderation failed:", await response.text());
      }
    } catch (error) {
      console.error("Failed to moderate assessment:", error);
    }
  };

  const pendingCount = assessments?.filter(
    (a: any) => a.result !== "PENDING" && a.moderationStatus === "PENDING"
  ).length || 0;

  return (
    <>

      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-3">
            Assessment Moderation
            {pendingCount > 0 && (
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
                {pendingCount} pending
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500">Review and moderate completed assessments</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-2xl font-semibold text-slate-900">{pendingCount}</span>
            </div>
            <p className="text-sm text-slate-500">Pending Moderation</p>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
              <span className="text-2xl font-semibold text-slate-900">
                {(assessments?.length || 0) - pendingCount}
              </span>
            </div>
            <p className="text-sm text-slate-500">Moderated Today</p>
          </div>
        </div>

        {/* Moderation Queue */}
        {isLoading ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <p className="text-slate-500">Loading assessments...</p>
          </div>
        ) : (
          <ModerationQueue
            assessments={assessments || []}
            onModerate={handleModerate}
          />
        )}
      </div>
    </>
  );
}
