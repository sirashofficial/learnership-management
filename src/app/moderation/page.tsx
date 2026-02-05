"use client";

import Header from "@/components/Header";
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
        body: JSON.stringify(data),
      });
      if (response.ok) {
        mutate();
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
      <Header
        title="Assessment Moderation"
        subtitle="Review and moderate completed assessments"
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-background-border p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-text">{pendingCount}</span>
            </div>
            <p className="text-sm text-text-light">Pending Moderation</p>
          </div>

          <div className="bg-white rounded-xl border border-background-border p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-text">
                {(assessments?.length || 0) - pendingCount}
              </span>
            </div>
            <p className="text-sm text-text-light">Moderated Today</p>
          </div>
        </div>

        {/* Moderation Queue */}
        {isLoading ? (
          <div className="bg-white rounded-xl border border-background-border p-12 text-center">
            <p className="text-gray-500">Loading assessments...</p>
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
