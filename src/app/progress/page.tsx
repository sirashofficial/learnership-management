"use client";

import { useState, useEffect } from "react";
// ...existing code...
import { useProgress } from "@/hooks/useProgress";
import { useStudents } from "@/hooks/useStudents";
import { BookOpen, CheckCircle, Clock, Calendar, TrendingUp, Award, ChevronRight, X, User, Users as UsersIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import Link from "next/link";

type ViewMode = 'individual' | 'group';

interface GroupProgressStudent {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
  completedOutcomes: number;
  totalOutcomes: number;
  completionPercentage: number;
  status: 'ON_TRACK' | 'BEHIND' | 'AT_RISK';
}

interface GroupProgressData {
  students: GroupProgressStudent[];
  summary: {
    totalStudents: number;
    onTrack: number;
    behind: number;
    atRisk: number;
  };
}

export default function ProgressPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('individual');
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [dateRange, setDateRange] = useState<string>('all');
  const [groups, setGroups] = useState<any[]>([]);
  const [groupProgressData, setGroupProgressData] = useState<GroupProgressData | null>(null);
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const [loadingGroupProgress, setLoadingGroupProgress] = useState(false);
  const { students } = useStudents();
  const { moduleProgress, unitStandardProgress, isLoading } = useProgress({
    studentId: viewMode === 'individual' ? (selectedStudentId || undefined) : undefined,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700 border-green-200";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "NOT_STARTED":
        return "bg-slate-100 text-slate-600 border-slate-200";
      case "ON_TRACK":
        return "bg-green-100 text-green-700 border-green-200";
      case "BEHIND":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "AT_RISK":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
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

  // Fetch groups on mount
  useEffect(() => {
    fetchGroups();
  }, []);

  // Fetch group progress when group is selected in group view
  useEffect(() => {
    if (viewMode === 'group' && selectedGroupId) {
      fetchGroupProgress();
    }
  }, [viewMode, selectedGroupId, dateRange]);

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups');
      const data = await response.json();
      setGroups(data.groups || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchGroupProgress = async () => {
    setLoadingGroupProgress(true);
    try {
      const params = new URLSearchParams({ groupId: selectedGroupId });
      if (dateRange !== 'all') {
        params.append('dateRange', dateRange);
      }
      const response = await fetch(`/api/reports/group-progress?${params}`);
      const data = await response.json();
      setGroupProgressData(data.data || null);
    } catch (error) {
      console.error('Error fetching group progress:', error);
      setGroupProgressData(null);
    } finally {
      setLoadingGroupProgress(false);
    }
  };

  const toggleStudentExpanded = (studentId: string) => {
    const newExpanded = new Set(expandedStudents);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedStudents(newExpanded);
  };

  return (
    <>
      
      
      <div className="p-6">
        {/* View Mode Toggle */}
        <div className="bg-white rounded-lg border border-background-border p-4 mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('individual')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'individual'
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Individual View
            </button>
            <button
              onClick={() => setViewMode('group')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'group'
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <UsersIcon className="w-4 h-4 inline mr-2" />
              Group View
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-background-border p-4">
          <div className={`grid grid-cols-1 ${viewMode === 'group' ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-4`}>
            {viewMode === 'group' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Select Group *
                  </label>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">-- Select a group --</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Date Range
                  </label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="30">Last 30 Days</option>
                    <option value="90">Last 90 Days</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
              </>
            )}
            {viewMode === 'individual' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Filter by Student
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full max-w-md px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Students</option>
                  {students?.map((student: any) => (
                    <option key={student.id} value={student.id}>
                      {student.firstName} {student.lastName} ({student.studentId})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Group Progress View */}
        {viewMode === 'group' && selectedGroupId && (
          <>
            {/* Summary Stats */}
            {groupProgressData && groupProgressData.summary && (
              <div className="bg-white rounded-lg border border-background-border p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Group Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {groupProgressData.summary.totalStudents}
                    </div>
                    <div className="text-sm text-slate-600 mt-1">Total Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {groupProgressData.summary.onTrack}
                    </div>
                    <div className="text-sm text-slate-600 mt-1">On Track</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-amber-600">
                      {groupProgressData.summary.behind}
                    </div>
                    <div className="text-sm text-slate-600 mt-1">Behind</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">
                      {groupProgressData.summary.atRisk}
                    </div>
                    <div className="text-sm text-slate-600 mt-1">At Risk</div>
                  </div>
                </div>
                <div className="mt-4 text-center text-sm text-slate-600">
                  <strong>{groupProgressData.summary.onTrack}</strong> of <strong>{groupProgressData.summary.totalStudents}</strong> students on track
                  {groupProgressData.summary.totalStudents > 0 && (
                    <span className="ml-2 text-primary font-medium">
                      ({Math.round((groupProgressData.summary.onTrack / groupProgressData.summary.totalStudents) * 100)}%)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Students Progress Table */}
            <div className="bg-white rounded-lg border border-background-border p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Student Progress
              </h3>

              {loadingGroupProgress ? (
                <div className="text-center py-12 text-slate-500">Loading group progress...</div>
              ) : groupProgressData && groupProgressData.students && groupProgressData.students.length > 0 ? (
                <div className="space-y-2">
                  {groupProgressData.students.map((student: GroupProgressStudent) => {
                    const isExpanded = expandedStudents.has(student.id);
                    return (
                      <div key={student.id} className="border border-slate-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleStudentExpanded(student.id)}
                          className="w-full p-4 hover:bg-slate-50 transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-slate-400" />
                            )}
                            <div className="text-left">
                              <div className="font-medium text-slate-900">
                                {student.firstName} {student.lastName}
                              </div>
                              <div className="text-sm text-slate-500">{student.studentNumber}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-sm font-medium text-slate-900">
                                {student.completedOutcomes} / {student.totalOutcomes}
                              </div>
                              <div className="text-xs text-slate-500">
                                {student.completionPercentage}% complete
                              </div>
                            </div>
                            <div className="w-32">
                              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full transition-all",
                                    student.status === 'ON_TRACK' ? 'bg-green-500' :
                                    student.status === 'BEHIND' ? 'bg-amber-500' :
                                    'bg-red-500'
                                  )}
                                  style={{ width: `${student.completionPercentage}%` }}
                                />
                              </div>
                            </div>
                            <span
                              className={cn(
                                "px-3 py-1 text-xs font-medium rounded-full border",
                                getStatusColor(student.status)
                              )}
                            >
                              {student.status === 'ON_TRACK' ? '✓ On Track' :
                               student.status === 'BEHIND' ? '⚠ Behind' :
                               '✗ At Risk'}
                            </span>
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="p-4 bg-slate-50 border-t border-slate-200">
                            <p className="text-sm text-slate-600">
                              Click to view detailed progress for {student.firstName} {student.lastName}
                            </p>
                            <button
                              onClick={() => {
                                setViewMode('individual');
                                setSelectedStudentId(student.id);
                              }}
                              className="mt-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                            >
                              View Details
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p>No progress data available for this group</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Individual Progress View (existing code) */}
        {viewMode === 'individual' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">\n
          <div className="bg-white rounded-lg border border-background-border p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-text">{totalModules}</span>
            </div>
            <p className="text-sm text-text-light">Total Modules</p>
          </div>

          <div className="bg-white rounded-lg border border-background-border p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-text">{completedModules}</span>
            </div>
            <p className="text-sm text-text-light">Completed</p>
          </div>

          <div className="bg-white rounded-lg border border-background-border p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-text">{inProgressModules}</span>
            </div>
            <p className="text-sm text-text-light">In Progress</p>
          </div>

          <div className="bg-white rounded-lg border border-background-border p-5">
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
        <div className="bg-white rounded-lg border border-background-border p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Module Progress
          </h3>

          {isLoading ? (
            <div className="text-center py-12 text-slate-500">Loading progress...</div>
          ) : moduleProgress && moduleProgress.length > 0 ? (
            <div className="space-y-4">
              {moduleProgress.map((progress: any) => (
                <div
                  key={progress.id}
                  className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-medium text-slate-900">
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
                        <p className="text-sm text-slate-500">
                          {progress.student.firstName} {progress.student.lastName} -{" "}
                          {progress.student.group?.name || "No Group"}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{progress.progress}%</div>
                      <p className="text-xs text-slate-500">Complete</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="flex items-center gap-4 text-sm text-slate-600">
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
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <p className="text-xs font-medium text-slate-700 mb-2">
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
                                  : "bg-slate-50 text-slate-600 border-slate-200"
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
            <div className="text-center py-12 text-slate-500">
              <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p>No progress data available</p>
              <p className="text-sm text-slate-400 mt-1">
                Progress will be tracked once students begin their modules
              </p>
            </div>
          )}
        </div>

        {/* Unit Standard Progress Details */}
        {selectedStudentId && unitStandardProgress && unitStandardProgress.length > 0 && (
          <div className="bg-white rounded-lg border border-background-border p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Unit Standard Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unitStandardProgress.map((progress: any) => (
                <div
                  key={progress.id}
                  className="border border-slate-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-slate-900">
                        {progress.unitStandard.code}
                      </h4>
                      <p className="text-xs text-slate-500">
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
                      <span className="text-slate-600">Formatives Passed:</span>
                      <span className="font-medium text-blue-600">
                        {progress.formativesPassed}
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

                  {progress.completionDate && (
                    <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Completed: {format(new Date(progress.completionDate), "MMM d, yyyy")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </>
  );
}
