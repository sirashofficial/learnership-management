"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  X, User, BookOpen, CheckCircle, Calendar, Edit2, Save,
  TrendingUp, FileText, ClipboardCheck, BarChart3, CalendarCheck,
  Plus, Check, Loader2, ChevronDown, ChevronRight, Award, Target,
  AlertTriangle, Clock, Percent
} from "lucide-react";
import { useCurriculum } from "@/hooks/useCurriculum";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";
import useSWR, { mutate as globalMutate } from "swr";
import { fetcher } from "@/lib/swr-config";
import ModuleProgressionPanel from "./ModuleProgressionPanel";
import CreateAssessmentModal from "./CreateAssessmentModal";

interface StudentDetailsModalProps {
  isOpen: boolean;
  student: any;
  onClose: () => void;
  onSave: (updatedStudent: any) => void;
}

type ActivePanel = 'none' | 'progress' | 'assessments' | 'attendance';

export default function StudentDetailsModal({ isOpen, student, onClose, onSave }: StudentDetailsModalProps) {
  if (!isOpen || !student) return null;

  const { modules } = useCurriculum();
  const [isEditing, setIsEditing] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>('none');
  const [showCreateAssessment, setShowCreateAssessment] = useState(false);
  const [statsCollapsed, setStatsCollapsed] = useState(false);
  const [formData, setFormData] = useState({
    firstName: student.firstName || "",
    lastName: student.lastName || "",
    studentId: student.studentId || "",
    email: student.email || "",
    phone: student.phone || "",
    idNumber: student.idNumber || "",
    status: student.status || "ACTIVE",
  });

  // ========================
  // SWR DATA FETCHING
  // ========================

  // Fetch student assessments
  const { data: assessmentsData, mutate: mutateAssessments } = useSWR(
    student?.id ? `/api/assessments?studentId=${student.id}` : null,
    fetcher,
    { revalidateOnFocus: true, dedupingInterval: 2000 }
  );
  const assessments = useMemo(() => {
    const raw = assessmentsData?.data || assessmentsData || [];
    return Array.isArray(raw) ? raw : [];
  }, [assessmentsData]);

  // Fetch student attendance
  const { data: attendanceData, mutate: mutateAttendance } = useSWR(
    student?.id ? `/api/attendance?studentId=${student.id}` : null,
    fetcher,
    { revalidateOnFocus: true, dedupingInterval: 2000 }
  );
  const attendanceRecords = useMemo(() => {
    const raw = attendanceData?.data || attendanceData || [];
    return Array.isArray(raw) ? raw : [];
  }, [attendanceData]);

  // Fetch unit standards
  const { data: unitStandardsData } = useSWR('/api/unit-standards', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000
  });
  const unitStandards = useMemo(() => {
    const raw = unitStandardsData?.data || unitStandardsData || [];
    return Array.isArray(raw) ? raw : [];
  }, [unitStandardsData]);

  // ========================
  // COMPUTED STATS
  // ========================

  const stats = useMemo(() => {
    // Attendance %
    const totalSessions = attendanceRecords.length;
    const presentSessions = attendanceRecords.filter(
      (r: any) => r.status === 'PRESENT' || r.status === 'LATE'
    ).length;
    const attendancePercent = totalSessions > 0
      ? Math.round((presentSessions / totalSessions) * 100)
      : 0;

    // Credits earned (deduplicated by unit standard)
    const uniqueCompetentUnits = new Map<string, number>();
    assessments.forEach((a: any) => {
      if (a.result === 'COMPETENT' && a.unitStandard) {
        uniqueCompetentUnits.set(a.unitStandard.id, a.unitStandard.credits || 0);
      }
    });
    const creditsEarned = Array.from(uniqueCompetentUnits.values()).reduce((sum, c) => sum + c, 0);
    const totalCredits = 138; // NVC Level 2 total

    // Assessments passed
    const totalUnits = unitStandards.length;
    const passedCount = uniqueCompetentUnits.size;

    // Status logic: compare actual vs projected
    const progressPercent = totalCredits > 0 ? Math.round((creditsEarned / totalCredits) * 100) : 0;
    let statusLabel = 'On Track';
    let statusColor = 'bg-green-100 text-green-700 border-green-200';
    // Use student's stored progress or fallback to calculated
    const projectedPercent = student.progress || 0;
    const diff = projectedPercent - progressPercent;
    if (diff > 10) {
      statusLabel = 'At Risk';
      statusColor = 'bg-red-100 text-red-700 border-red-200';
    } else if (diff > 0) {
      statusLabel = 'Behind';
      statusColor = 'bg-amber-100 text-amber-700 border-amber-200';
    }

    return {
      attendancePercent,
      creditsEarned,
      totalCredits,
      passedCount,
      totalUnits,
      progressPercent,
      statusLabel,
      statusColor,
    };
  }, [assessments, attendanceRecords, unitStandards, student]);

  // ========================
  // HANDLERS
  // ========================

  const handleSave = () => {
    onSave({ ...student, ...formData });
    setIsEditing(false);
  };

  useEffect(() => {
    if (isOpen) {
      setStatsCollapsed(false);
    }
  }, [isOpen]);

  const togglePanel = (panel: ActivePanel) => {
    setActivePanel(prev => prev === panel ? 'none' : panel);
  };

  // ========================
  // ASSESSMENT TOGGLE HANDLER (3-state)
  // ========================

  const handleAssessmentToggle = useCallback(async (
    assessmentId: string | null,
    unitStandardId: string,
    type: string,
    currentResult: string,
    targetResult: 'COMPETENT' | 'NOT_YET_COMPETENT'
  ) => {
    // Determine new state: toggle between target and PENDING
    const newResult = currentResult === targetResult ? 'PENDING' : targetResult;

    try {
      if (assessmentId) {
        // Update existing
        await fetch(`/api/assessments/${assessmentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            result: newResult,
            assessedDate: newResult !== 'PENDING' ? new Date().toISOString() : null,
          }),
        });
      } else if (newResult !== 'PENDING') {
        // Create new assessment
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);
        await fetch('/api/assessments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            studentId: student.id,
            unitStandardId,
            type,
            method: 'PRACTICAL',
            result: newResult,
            dueDate,
            assessedDate: new Date().toISOString(),
          }),
        });
      }

      // Revalidate all affected SWR keys
      mutateAssessments();
      globalMutate(`/api/students`);
      globalMutate(`/api/students/${student.id}`);
      globalMutate('/api/groups');
      globalMutate('/api/groups/progress');
      globalMutate('/api/assessments');
      globalMutate((key: any) => typeof key === 'string' && key.startsWith('/api/assessments/stats'));
    } catch (error) {
      console.error('Error toggling assessment:', error);
    }
  }, [student, mutateAssessments]);

  // ========================
  // RENDER
  // ========================

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
          {/* ============ HEADER ============ */}
          <div className="p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {student.firstName} {student.lastName}
                </h2>
                <p className="text-slate-600">{student.studentId}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStatsCollapsed((prev) => !prev)}
                  className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2 text-sm"
                >
                  {statsCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {statsCollapsed ? "Show Stats" : "Hide Stats"}
                </button>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Info
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                )}
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>

            {/* ============ STATS BAR ============ */}
            {!statsCollapsed && (
              <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200">
                {/* Attendance % */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 border border-orange-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-medium text-orange-700 uppercase tracking-wide">Attendance</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-900">{stats.attendancePercent}%</div>
                </div>

                {/* Credits Earned */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Credits</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {stats.creditsEarned}<span className="text-sm font-normal text-blue-600">/{stats.totalCredits}</span>
                  </div>
                </div>

                {/* Assessments Passed */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-medium text-green-700 uppercase tracking-wide">Passed</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    {stats.passedCount}<span className="text-sm font-normal text-green-600">/{stats.totalUnits}</span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className={`rounded-lg p-3 border ${stats.statusColor}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">Status</span>
                  </div>
                  <div className="text-2xl font-bold">{stats.statusLabel}</div>
                </div>
              </div>
            )}

            {/* ============ ACTION BUTTONS ============ */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200 flex-wrap">
              <button
                onClick={() => togglePanel('progress')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium",
                  activePanel === 'progress'
                    ? "bg-teal-600 text-white shadow-md"
                    : "bg-teal-50 text-teal-700 hover:bg-teal-100"
                )}
              >
                <TrendingUp className="w-4 h-4" />
                Progress
              </button>
              <button
                onClick={() => togglePanel('assessments')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium",
                  activePanel === 'assessments'
                    ? "bg-purple-600 text-white shadow-md"
                    : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                )}
              >
                <ClipboardCheck className="w-4 h-4" />
                Edit Assessments
              </button>
              <button
                onClick={() => togglePanel('attendance')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium",
                  activePanel === 'attendance'
                    ? "bg-orange-600 text-white shadow-md"
                    : "bg-orange-50 text-orange-700 hover:bg-orange-100"
                )}
              >
                <CalendarCheck className="w-4 h-4" />
                Mark Attendance
              </button>
              <Link
                href="/poe"
                className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
              >
                <FileText className="w-4 h-4" />
                POE Checklist
              </Link>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
            {/* ============ INLINE PANELS ============ */}

            {/* Progress Panel */}
            {activePanel === 'progress' && (
              <section className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-teal-500" />
                  Module Progression
                </h3>
                <ModuleProgressionPanel
                  studentId={student.id}
                  onModuleChange={() => {
                    mutateAssessments();
                    globalMutate('/api/groups');
                  }}
                />
              </section>
            )}

            {/* Edit Assessments Panel */}
            {activePanel === 'assessments' && (
              <InlineAssessmentEditor
                studentId={student.id}
                assessments={assessments}
                unitStandards={unitStandards}
                modules={modules}
                onToggle={handleAssessmentToggle}
                creditsEarned={stats.creditsEarned}
                totalCredits={stats.totalCredits}
              />
            )}

            {/* Attendance Panel */}
            {activePanel === 'attendance' && (
              <InlineAttendanceEditor
                studentId={student.id}
                groupId={student.groupId}
                attendanceRecords={attendanceRecords}
                attendancePercent={stats.attendancePercent}
                onSaved={() => {
                  mutateAttendance();
                  globalMutate('/api/students');
                  globalMutate(`/api/students/${student.id}`);
                  globalMutate('/api/groups');
                  globalMutate('/api/groups/progress');
                  globalMutate((key: any) => typeof key === 'string' && key.startsWith('/api/attendance/rates'));
                  globalMutate((key: any) => typeof key === 'string' && key.startsWith('/api/attendance'));
                }}
              />
            )}

            {/* ============ PERSONAL INFORMATION ============ */}
            <section>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                {[
                  { label: "First Name", key: "firstName", type: "text" },
                  { label: "Last Name", key: "lastName", type: "text" },
                  { label: "Student ID", key: "studentId", type: "text" },
                  { label: "ID Number", key: "idNumber", type: "text" },
                  { label: "Email", key: "email", type: "email" },
                  { label: "Phone", key: "phone", type: "tel" },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
                    {isEditing ? (
                      <input
                        type={field.type}
                        value={(formData as any)[field.key]}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-slate-900">{(formData as any)[field.key] || "Not provided"}</p>
                    )}
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Group</label>
                  <p className="text-slate-900">{student.group?.name || "No group"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  {isEditing ? (
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="AT_RISK">At Risk</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="WITHDRAWN">Withdrawn</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${formData.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        formData.status === 'AT_RISK' ? 'bg-yellow-100 text-yellow-800' :
                          formData.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-800'
                      }`}>
                      {formData.status}
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* Close button */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
              >
                Close
              </button>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Assessment Modal */}
      {showCreateAssessment && (
        <CreateAssessmentModal
          isOpen={showCreateAssessment}
          onClose={() => setShowCreateAssessment(false)}
          studentId={student.id}
          onSuccess={() => {
            setShowCreateAssessment(false);
            mutateAssessments();
            globalMutate('/api/groups');
          }}
        />
      )}
    </>
  );
}

// ========================
// INLINE ASSESSMENT EDITOR
// ========================

function InlineAssessmentEditor({
  studentId,
  assessments,
  unitStandards,
  modules,
  onToggle,
  creditsEarned,
  totalCredits,
}: {
  studentId: string;
  assessments: any[];
  unitStandards: any[];
  modules: any[];
  onToggle: (assessmentId: string | null, unitStandardId: string, type: string, currentResult: string, targetResult: 'COMPETENT' | 'NOT_YET_COMPETENT') => void;
  creditsEarned: number;
  totalCredits: number;
}) {
  const [activeTab, setActiveTab] = useState<'FORMATIVE' | 'SUMMATIVE' | 'WORKPLACE'>('FORMATIVE');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Group unit standards by module
  const moduleGroups = useMemo(() => {
    const groups: Record<string, { module: any; units: any[] }> = {};
    unitStandards.forEach((unit: any) => {
      const moduleId = unit.module?.id || unit.moduleId;
      const moduleName = unit.module?.name || 'Unknown Module';
      if (!groups[moduleId]) {
        groups[moduleId] = {
          module: { id: moduleId, name: moduleName },
          units: [],
        };
      }
      groups[moduleId].units.push(unit);
    });
    return Object.values(groups);
  }, [unitStandards]);

  const getAssessment = (unitStandardId: string, type: string) => {
    return assessments.find(
      (a: any) => a.unitStandard?.id === unitStandardId && a.type === type
    );
  };

  const getResult = (unitStandardId: string, type: string): string => {
    const assessment = getAssessment(unitStandardId, type);
    return assessment?.result || 'PENDING';
  };

  const toggleModule = (moduleId: string) => {
    const newSet = new Set(expandedModules);
    if (newSet.has(moduleId)) {
      newSet.delete(moduleId);
    } else {
      newSet.add(moduleId);
    }
    setExpandedModules(newSet);
  };

  return (
    <section className="bg-slate-50 rounded-lg border border-slate-200 p-4">
      {/* Header with credit counter */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-purple-500" />
          Edit Assessments
        </h3>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-purple-200 rounded-lg px-4 py-2 flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-semibold text-purple-900">
              {creditsEarned} / {totalCredits} Credits
            </span>
          </div>
          <div className="bg-white border border-blue-200 rounded-lg px-3 py-2">
            <span className="text-xs font-medium text-blue-700">
              {Math.round((creditsEarned / totalCredits) * 100)}% Complete
            </span>
          </div>
        </div>
      </div>

      {/* Assessment type tabs */}
      <div className="flex gap-2 mb-4">
        {(['FORMATIVE', 'SUMMATIVE', 'WORKPLACE'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 rounded-lg font-semibold text-sm transition-all",
              activeTab === tab
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
            )}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Unit standards by module — accordion */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {moduleGroups.map(({ module, units }) => {
          const isExpanded = expandedModules.has(module.id);
          const completedInModule = units.filter(u => getResult(u.id, activeTab) === 'COMPETENT').length;

          return (
            <div key={module.id} className="bg-white rounded-lg border border-slate-200">
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full p-3 flex items-center gap-2 hover:bg-slate-50 font-medium text-sm text-left"
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="flex-1">{module.name}</span>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  {completedInModule}/{units.length} passed
                </span>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-200 divide-y divide-slate-100">
                  {units.map((unit: any) => {
                    const result = getResult(unit.id, activeTab);
                    const assessment = getAssessment(unit.id, activeTab);

                    return (
                      <div
                        key={unit.id}
                        className="px-4 py-3 flex items-center justify-between hover:bg-slate-50"
                      >
                        <div className="flex-1 min-w-0 mr-3">
                          <div className="text-sm font-medium text-slate-900 truncate">
                            {unit.code} — {unit.title}
                          </div>
                          <div className="text-xs text-slate-500">
                            {unit.credits} credits · Level {unit.level}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Status label */}
                          <span className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded",
                            result === 'COMPETENT' ? 'bg-green-100 text-green-700' :
                              result === 'NOT_YET_COMPETENT' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-500'
                          )}>
                            {result === 'COMPETENT' ? 'Passed' :
                              result === 'NOT_YET_COMPETENT' ? 'NYC' :
                                'Not marked'}
                          </span>

                          {/* Pass button */}
                          <button
                            onClick={() => onToggle(
                              assessment?.id || null,
                              unit.id,
                              activeTab,
                              result,
                              'COMPETENT'
                            )}
                            title={result === 'COMPETENT' ? 'Click to reset' : 'Mark as Competent'}
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm border-2 transition-all",
                              result === 'COMPETENT'
                                ? "bg-green-600 text-white border-green-600 ring-2 ring-green-200"
                                : "bg-white text-slate-400 border-slate-300 hover:border-green-400 hover:text-green-600"
                            )}
                          >
                            ✓
                          </button>

                          {/* Fail button */}
                          <button
                            onClick={() => onToggle(
                              assessment?.id || null,
                              unit.id,
                              activeTab,
                              result,
                              'NOT_YET_COMPETENT'
                            )}
                            title={result === 'NOT_YET_COMPETENT' ? 'Click to reset' : 'Mark as NYC'}
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm border-2 transition-all",
                              result === 'NOT_YET_COMPETENT'
                                ? "bg-red-600 text-white border-red-600 ring-2 ring-red-200"
                                : "bg-white text-slate-400 border-slate-300 hover:border-red-400 hover:text-red-600"
                            )}
                          >
                            ✗
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-500 mt-3 text-center">
        Click ✓ or ✗ to toggle. Clicking an active button resets to unmarked. Changes auto-save.
      </p>
    </section>
  );
}

// ========================
// INLINE ATTENDANCE EDITOR
// ========================

function InlineAttendanceEditor({
  studentId,
  groupId,
  attendanceRecords,
  attendancePercent,
  onSaved,
}: {
  studentId: string;
  groupId: string;
  attendanceRecords: any[];
  attendancePercent: number;
  onSaved: () => void;
}) {
  const [changes, setChanges] = useState<Map<string, string>>(new Map());
  const [saving, setSaving] = useState(false);
  const [newDate, setNewDate] = useState('');

  // Sort records by date descending
  const sortedRecords = useMemo(() => {
    return [...attendanceRecords].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [attendanceRecords]);

  const getEffectiveStatus = (record: any) => {
    return changes.get(record.id) || record.status;
  };

  const updateStatus = (recordId: string, newStatus: string) => {
    setChanges(prev => {
      const next = new Map(prev);
      next.set(recordId, newStatus);
      return next;
    });
  };

  // Compute live attendance %
  const liveAttendancePercent = useMemo(() => {
    if (sortedRecords.length === 0) return 0;
    const total = sortedRecords.length;
    const present = sortedRecords.filter(r => {
      const effective = changes.get(r.id) || r.status;
      return effective === 'PRESENT' || effective === 'LATE';
    }).length;
    return Math.round((present / total) * 100);
  }, [sortedRecords, changes]);

  const handleBatchSave = async () => {
    if (changes.size === 0) return;
    setSaving(true);

    try {
      const records = Array.from(changes.entries()).map(([id, status]) => {
        const original = attendanceRecords.find((r: any) => r.id === id);
        return {
          studentId,
          groupId,
          date: original?.date,
          status,
        };
      });

      const res = await fetch('/api/attendance/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ records }),
      });

      if (res.ok) {
        setChanges(new Map());
        onSaved();
      } else {
        alert('Failed to save attendance changes.');
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNewDate = async () => {
    if (!newDate) return;
    setSaving(true);
    try {
      const res = await fetch('/api/attendance/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          records: [{
            studentId,
            groupId,
            date: newDate,
            status: 'PRESENT',
          }],
        }),
      });

      if (res.ok) {
        setNewDate('');
        onSaved();
      }
    } catch (error) {
      console.error('Error adding attendance:', error);
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const;

  return (
    <section className="bg-slate-50 rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-orange-500" />
          Mark Attendance
        </h3>
        <div className="flex items-center gap-3">
          <div className={cn(
            "bg-white border rounded-lg px-4 py-2 flex items-center gap-2",
            liveAttendancePercent >= 80 ? "border-green-200" : "border-red-200"
          )}>
            <Percent className="w-4 h-4 text-orange-500" />
            <span className={cn(
              "text-sm font-semibold",
              liveAttendancePercent >= 80 ? "text-green-700" : "text-red-700"
            )}>
              {liveAttendancePercent}% Attendance
            </span>
          </div>
        </div>
      </div>

      {/* Add new date */}
      <div className="flex items-center gap-2 mb-4 bg-white p-3 rounded-lg border border-slate-200">
        <input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
        />
        <button
          onClick={handleAddNewDate}
          disabled={!newDate || saving}
          className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm font-medium flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Add Date
        </button>
      </div>

      {/* Attendance records */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {sortedRecords.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p>No attendance records found.</p>
          </div>
        ) : (
          sortedRecords.map((record: any) => {
            const effective = getEffectiveStatus(record);
            const isModified = changes.has(record.id);

            return (
              <div
                key={record.id}
                className={cn(
                  "bg-white rounded-lg border p-3 flex items-center justify-between",
                  isModified ? "border-orange-300 bg-orange-50" : "border-slate-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-700">
                    {format(new Date(record.date), "EEE, MMM d, yyyy")}
                  </span>
                  {isModified && (
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded font-medium">
                      Modified
                    </span>
                  )}
                </div>

                <div className="flex gap-1">
                  {statusOptions.map(status => (
                    <button
                      key={status}
                      onClick={() => updateStatus(record.id, status)}
                      className={cn(
                        "px-3 py-1 rounded text-xs font-semibold transition-all border",
                        effective === status ? (
                          status === 'PRESENT' ? 'bg-green-600 text-white border-green-600' :
                            status === 'LATE' ? 'bg-amber-500 text-white border-amber-500' :
                              status === 'ABSENT' ? 'bg-red-600 text-white border-red-600' :
                                'bg-blue-600 text-white border-blue-600'
                        ) : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'
                      )}
                    >
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Save button */}
      {changes.size > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-sm text-slate-600">
            {changes.size} change(s) pending
          </span>
          <button
            onClick={handleBatchSave}
            disabled={saving}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-semibold flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      )}

      <p className="text-xs text-slate-500 mt-3 text-center">
        Change statuses and click &quot;Save Changes&quot; to submit all updates in one batch.
      </p>
    </section>
  );
}
