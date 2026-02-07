"use client";

import { useState, useEffect } from "react";
import { X, BookOpen, CheckCircle, Clock, Award, Calendar, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface StudentProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
}

export default function StudentProgressModal({
  isOpen,
  onClose,
  student,
}: StudentProgressModalProps) {
  const [moduleProgress, setModuleProgress] = useState<any[]>([]);
  const [unitStandardProgress, setUnitStandardProgress] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && student) {
      fetchProgressData();
    }
  }, [isOpen, student]);

  const fetchProgressData = async () => {
    setLoading(true);
    try {
      // Fetch progress data
      const progressRes = await fetch(`/api/progress?studentId=${student.id}`);
      const progressData = await progressRes.json();
      setModuleProgress(progressData.data?.moduleProgress || []);
      setUnitStandardProgress(progressData.data?.unitStandardProgress || []);

      // Fetch assessments
      const assessmentsRes = await fetch(`/api/assessments?studentId=${student.id}`);
      const assessmentsData = await assessmentsRes.json();
      setAssessments(assessmentsData.data || []);
    } catch (error) {
      console.error("Failed to fetch progress data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700 border-green-200";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const completedModules = moduleProgress.filter((m) => m.status === "COMPLETED").length;
  const competentAssessments = assessments.filter((a) => a.result === "COMPETENT").length;
  const totalAssessments = assessments.length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {student.name || `${student.firstName} ${student.lastName}`}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {student.studentId} • {student.group || student.site || "No Group"}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading progress data...</div>
          ) : (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-700">
                        {student.progress || 0}%
                      </div>
                      <p className="text-xs text-blue-600">Overall Progress</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 text-white rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-700">
                        {completedModules}/{moduleProgress.length}
                      </div>
                      <p className="text-xs text-green-600">Modules Complete</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 text-white rounded-lg flex items-center justify-center">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-700">
                        {competentAssessments}/{totalAssessments}
                      </div>
                      <p className="text-xs text-purple-600">Assessments Passed</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Module Progress */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Module Progress
                </h3>
                {moduleProgress.length > 0 ? (
                  <div className="space-y-3">
                    {moduleProgress.map((progress) => (
                      <div
                        key={progress.id}
                        className="border border-slate-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-slate-900">
                              {progress.module.code} - {progress.module.name}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">
                              {progress.module.credits} Credits
                            </p>
                          </div>
                          <span
                            className={cn(
                              "px-2 py-1 text-xs font-medium rounded-full border",
                              getStatusColor(progress.status)
                            )}
                          >
                            {progress.status.replace("_", " ")}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-slate-600">Progress</span>
                            <span className="font-medium text-primary">{progress.progress}%</span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${progress.progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Timeline */}
                        <div className="flex items-center gap-4 text-xs text-slate-600">
                          {progress.startDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Started: {format(new Date(progress.startDate), "MMM d, yyyy")}
                            </div>
                          )}
                          {progress.completionDate && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              Completed: {format(new Date(progress.completionDate), "MMM d, yyyy")}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 border border-slate-200 rounded-lg">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm">No module progress data yet</p>
                  </div>
                )}
              </div>

              {/* Unit Standards Progress */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Unit Standards
                </h3>
                {unitStandardProgress.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {unitStandardProgress.map((progress) => (
                      <div
                        key={progress.id}
                        className="border border-slate-200 rounded-lg p-3"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-sm text-slate-900">
                              {progress.unitStandard.code}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {progress.unitStandard.title}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "px-2 py-0.5 text-xs font-medium rounded-full border",
                              getStatusColor(progress.status)
                            )}
                          >
                            {progress.status === "COMPLETED" ? "✓" : progress.status.replace("_", " ")}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">Formatives:</span>
                            <span className="font-medium text-blue-600">
                              {progress.formativesPassed} passed
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">Summative:</span>
                            <span
                              className={cn(
                                "font-medium",
                                progress.summativePassed ? "text-green-600" : "text-slate-400"
                              )}
                            >
                              {progress.summativePassed ? "✓ Passed" : "Pending"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 border border-slate-200 rounded-lg">
                    <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm">No unit standard progress data yet</p>
                  </div>
                )}
              </div>

              {/* Recent Assessments */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  Recent Assessments
                </h3>
                {assessments.length > 0 ? (
                  <div className="space-y-2">
                    {assessments.slice(0, 5).map((assessment) => (
                      <div
                        key={assessment.id}
                        className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {assessment.unitStandard} - {assessment.module}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {assessment.type} • {assessment.method}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "px-2 py-1 text-xs font-medium rounded-full",
                            assessment.result === "COMPETENT"
                              ? "bg-green-100 text-green-700"
                              : assessment.result === "NOT_YET_COMPETENT"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          )}
                        >
                          {assessment.result === "COMPETENT" ? "Competent" : assessment.result === "NOT_YET_COMPETENT" ? "NYC" : "Pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 border border-slate-200 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm">No assessments recorded yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
