"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { useProgress } from "@/hooks/useProgress";
import { useStudents } from "@/hooks/useStudents";
import { BookOpen, CheckCircle, Clock, Calendar, TrendingUp, Award, ChevronRight, X, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import Link from "next/link";

export default function ProgressPage() {
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const { students } = useStudents();
  const { moduleProgress, unitStandardProgress, isLoading } = useProgress({
    studentId: selectedStudentId || undefined,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700 border-green-200";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "NOT_STARTED":
        return "bg-gray-100 text-gray-600 border-gray-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4" />;
      case "IN_PROGRESS":
        return <Clock className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const calculateDuration = (startDate: string | null, completionDate: string | null) => {
    if (!startDate) return "Not started";
    if (!completionDate) return `Started ${differenceInDays(new Date(), new Date(startDate))} days ago`;
    return `${differenceInDays(new Date(completionDate), new Date(startDate))} days`;
  };

  const completedModules = moduleProgress?.filter((m: any) => m.status === "COMPLETED").length || 0;
  const inProgressModules = moduleProgress?.filter((m: any) => m.status === "IN_PROGRESS").length || 0;
  const totalModules = moduleProgress?.length || 0;

  const completedUnitStandards = unitStandardProgress?.filter((u: any) => u.status === "COMPLETED").length || 0;
  const totalUnitStandards = unitStandardProgress?.length || 0;

  return (
    <>
      <Header />
      
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Progress Tracking</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor student progress through modules and unit standards</p>
        </div>

        {/* Breadcrumb when student is filtered */}
        {selectedStudentId && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Link href="/progress" className="text-blue-600 hover:text-blue-800 hover:underline">
                  All Students
                </Link>
                <ChevronRight className="w-4 h-4 text-blue-400" />
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    {students?.find((s: any) => s.id === selectedStudentId)?.firstName}{' '}
                    {students?.find((s: any) => s.id === selectedStudentId)?.lastName}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentId("")}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <X className="w-4 h-4" />
                Clear Filter
              </button>
            </div>
          </div>
        )}
        
        {/* Student Filter */}
        <div className="bg-white rounded-xl border border-background-border p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Student
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Students</option>
            {students?.map((student: any) => (
              <option key={student.id} value={student.id}>
                {student.firstName} {student.lastName} ({student.studentId})
              </option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-background-border p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-text">{totalModules}</span>
            </div>
            <p className="text-sm text-text-light">Total Modules</p>
          </div>

          <div className="bg-white rounded-xl border border-background-border p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-text">{completedModules}</span>
            </div>
            <p className="text-sm text-text-light">Completed</p>
          </div>

          <div className="bg-white rounded-xl border border-background-border p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-text">{inProgressModules}</span>
            </div>
            <p className="text-sm text-text-light">In Progress</p>
          </div>

          <div className="bg-white rounded-xl border border-background-border p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-text">
                {completedUnitStandards}/{totalUnitStandards}
              </span>
            </div>
            <p className="text-sm text-text-light">Unit Standards</p>
          </div>
        </div>

        {/* Module Progress */}
        <div className="bg-white rounded-xl border border-background-border p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Module Progress
          </h3>

          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading progress...</div>
          ) : moduleProgress && moduleProgress.length > 0 ? (
            <div className="space-y-4">
              {moduleProgress.map((progress: any) => (
                <div
                  key={progress.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-medium text-gray-900">
                          {progress.module.code} - {progress.module.name}
                        </h4>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border",
                            getStatusColor(progress.status)
                          )}
                        >
                          {getStatusIcon(progress.status)}
                          {progress.status.replace("_", " ")}
                        </span>
                      </div>
                      {selectedStudentId && progress.student && (
                        <p className="text-sm text-gray-500">
                          {progress.student.firstName} {progress.student.lastName} -{" "}
                          {progress.student.group?.name || "No Group"}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{progress.progress}%</div>
                      <p className="text-xs text-gray-500">Complete</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {progress.startDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Started: {format(new Date(progress.startDate), "MMM d, yyyy")}</span>
                      </div>
                    )}
                    {progress.completionDate && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Completed: {format(new Date(progress.completionDate), "MMM d, yyyy")}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 ml-auto">
                      <Clock className="w-4 h-4" />
                      <span>{calculateDuration(progress.startDate, progress.completionDate)}</span>
                    </div>
                  </div>

                  {/* Unit Standards for this module */}
                  {progress.module.unitStandards && progress.module.unitStandards.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-700 mb-2">
                        Unit Standards ({progress.module.unitStandards.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {progress.module.unitStandards.map((us: any) => {
                          const usProgress = unitStandardProgress?.find(
                            (usp: any) =>
                              usp.unitStandardId === us.id &&
                              usp.studentId === progress.studentId
                          );
                          return (
                            <span
                              key={us.id}
                              className={cn(
                                "px-2 py-1 text-xs rounded border",
                                usProgress?.status === "COMPLETED"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-gray-50 text-gray-600 border-gray-200"
                              )}
                            >
                              {us.code}
                              {usProgress?.summativePassed && " ✓"}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>No progress data available</p>
              <p className="text-sm text-gray-400 mt-1">
                Progress will be tracked once students begin their modules
              </p>
            </div>
          )}
        </div>

        {/* Unit Standard Progress Details */}
        {selectedStudentId && unitStandardProgress && unitStandardProgress.length > 0 && (
          <div className="bg-white rounded-xl border border-background-border p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Unit Standard Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unitStandardProgress.map((progress: any) => (
                <div
                  key={progress.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {progress.unitStandard.code}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {progress.unitStandard.module?.name || "Module"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border",
                        getStatusColor(progress.status)
                      )}
                    >
                      {getStatusIcon(progress.status)}
                      {progress.status === "COMPLETED" ? "Complete" : progress.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Formatives Passed:</span>
                      <span className="font-medium text-blue-600">
                        {progress.formativesPassed}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Summative:</span>
                      <span
                        className={cn(
                          "font-medium",
                          progress.summativePassed ? "text-green-600" : "text-gray-400"
                        )}
                      >
                        {progress.summativePassed ? "✓ Passed" : "Pending"}
                      </span>
                    </div>
                  </div>

                  {progress.completionDate && (
                    <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Completed: {format(new Date(progress.completionDate), "MMM d, yyyy")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
