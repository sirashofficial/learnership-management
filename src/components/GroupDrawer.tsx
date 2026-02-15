"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { format } from "date-fns";
import { X, CheckCircle, ChevronRight, Loader2 } from "lucide-react";
import { fetcher } from "@/lib/swr-config";
import StudentDetailsModal from "@/components/StudentDetailsModal";
import Toast, { useToast } from "@/components/Toast";
import { cn } from "@/lib/utils";

interface GroupDrawerProps {
  isOpen: boolean;
  group: any;
  onClose: () => void;
  attendanceRate?: number;
  actualProgress?: { avgCredits?: number; avgPercent?: number };
  statusLabel?: string;
  currentModuleLabel?: string;
}

type DrawerTab = "students" | "assessments" | "attendance";

type AssessmentType = "FORMATIVE" | "SUMMATIVE" | "WORKPLACE";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

const attendanceStatuses: AttendanceStatus[] = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];

export default function GroupDrawer({
  isOpen,
  group,
  onClose,
  attendanceRate = 0,
  actualProgress,
  statusLabel = "On Track",
  currentModuleLabel = "",
}: GroupDrawerProps) {
  const { toast, showToast, hideToast } = useToast();
  const [activeTab, setActiveTab] = useState<DrawerTab>("students");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  const { data: studentsData } = useSWR(
    isOpen && group?.id ? `/api/students?groupId=${group.id}` : null,
    fetcher
  );
  const students = useMemo(() => {
    const raw = studentsData?.data || studentsData || [];
    return Array.isArray(raw) ? raw : [];
  }, [studentsData]);

  const studentIds = useMemo(() => students.map((s: any) => s.id).filter(Boolean), [students]);

  const { data: attendanceRatesData } = useSWR(
    isOpen && studentIds.length > 0
      ? `/api/attendance/rates?studentIds=${studentIds.join(",")}`
      : null,
    fetcher
  );

  const { data: assessmentsData, mutate: mutateAssessments } = useSWR(
    isOpen && group?.id ? `/api/assessments?groupId=${group.id}` : null,
    fetcher
  );
  const assessments = useMemo(() => {
    const raw = assessmentsData?.data || assessmentsData || [];
    return Array.isArray(raw) ? raw : [];
  }, [assessmentsData]);

  const { data: attendanceData, mutate: mutateAttendance } = useSWR(
    isOpen && group?.id ? `/api/attendance?groupId=${group.id}` : null,
    fetcher
  );
  const attendanceRecords = useMemo(() => {
    const raw = attendanceData?.data || attendanceData || [];
    return Array.isArray(raw) ? raw : [];
  }, [attendanceData]);

  const { data: groupDetailData } = useSWR(
    isOpen && group?.id ? `/api/groups/${group.id}` : null,
    fetcher
  );

  const { data: unitStandardsData } = useSWR(
    isOpen ? "/api/unit-standards" : null,
    fetcher
  );
  const unitStandards = useMemo(() => {
    const raw = unitStandardsData?.data || unitStandardsData || [];
    return Array.isArray(raw) ? raw : [];
  }, [unitStandardsData]);

  const groupUnitStandards = useMemo(() => {
    const rollouts = groupDetailData?.data?.unitStandardRollouts || [];
    if (Array.isArray(rollouts) && rollouts.length > 0) {
      return rollouts
        .map((rollout: any) => rollout.unitStandard)
        .filter(Boolean);
    }
    return unitStandards;
  }, [groupDetailData, unitStandards]);

  const { data: modulesData } = useSWR(
    isOpen ? "/api/modules?includeUnitStandards=true" : null,
    fetcher
  );
  const modules = useMemo(() => {
    const raw = modulesData?.modules || modulesData?.data?.modules || [];
    return Array.isArray(raw) ? raw : [];
  }, [modulesData]);

  const groupUnitStandardIds = useMemo(() => {
    return new Set(groupUnitStandards.map((unit: any) => unit?.id).filter(Boolean));
  }, [groupUnitStandards]);

  const groupModules = useMemo(() => {
    if (modules.length === 0) return [];
    if (groupUnitStandardIds.size === 0) return modules;

    return modules
      .map((module: any) => {
        const unitStandardsForGroup = Array.isArray(module.unitStandards)
          ? module.unitStandards.filter((unit: any) => groupUnitStandardIds.has(unit.id))
          : [];
        return { ...module, unitStandards: unitStandardsForGroup };
      })
      .filter((module: any) => (module.unitStandards || []).length > 0);
  }, [modules, groupUnitStandardIds]);

  const [assessmentType, setAssessmentType] = useState<AssessmentType>("FORMATIVE");
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;
    setAssessmentType("FORMATIVE");
    setShowBulkConfirm(false);
  }, [isOpen]);

  useEffect(() => {
    if (group?.id) {
      setSelectedUnitId("");
      setSelectedModuleId("");
    }
  }, [group?.id]);

  useEffect(() => {
    if (!isOpen || groupModules.length === 0) return;

    const normalizedLabel = (currentModuleLabel || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

    const currentModule = groupModules.find((module: any) => {
      if (group?.currentModuleId && module.id === group.currentModuleId) return true;
      if (!normalizedLabel) return false;
      const name = String(module.name || "").toLowerCase();
      const number = String(module.moduleNumber ?? "").toLowerCase();
      return normalizedLabel.includes(name) || (number && normalizedLabel.includes(number));
    });

    if (!selectedModuleId || !groupModules.some((m: any) => m.id === selectedModuleId)) {
      setSelectedModuleId(currentModule?.id || groupModules[0]?.id || "");
    }
  }, [group?.currentModuleId, currentModuleLabel, groupModules, isOpen, selectedModuleId]);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [bulkPassing, setBulkPassing] = useState(false);

  const selectedModule = useMemo(() => {
    return groupModules.find((module: any) => module.id === selectedModuleId) || groupModules[0];
  }, [groupModules, selectedModuleId]);

  const moduleUnitStandards = useMemo(() => {
    return Array.isArray(selectedModule?.unitStandards) ? selectedModule.unitStandards : [];
  }, [selectedModule]);

  const workplaceAnchorUnitId = useMemo(() => {
    return moduleUnitStandards[0]?.id || "";
  }, [moduleUnitStandards]);

  useEffect(() => {
    if (!isOpen) return;
    if (!selectedModule) {
      setSelectedUnitId("");
      return;
    }

    if (assessmentType === "WORKPLACE") {
      setSelectedUnitId(workplaceAnchorUnitId || "");
      return;
    }

    if (!selectedUnitId || !moduleUnitStandards.some((unit: any) => unit.id === selectedUnitId)) {
      setSelectedUnitId(moduleUnitStandards[0]?.id || "");
    }
  }, [assessmentType, isOpen, moduleUnitStandards, selectedModule, selectedUnitId, workplaceAnchorUnitId]);

  const activeUnitId = assessmentType === "WORKPLACE" ? workplaceAnchorUnitId : selectedUnitId;

  const selectedUnit = useMemo(() => {
    return groupUnitStandards.find((unit: any) => unit.id === activeUnitId)
      || moduleUnitStandards.find((unit: any) => unit.id === activeUnitId);
  }, [activeUnitId, groupUnitStandards, moduleUnitStandards]);

  const filteredAssessments = useMemo(() => {
    return assessments.filter((assessment: any) => {
      if (activeUnitId && assessment.unitStandard?.id !== activeUnitId) return false;
      return assessment.type === assessmentType;
    });
  }, [assessments, assessmentType, activeUnitId]);

  const getAssessmentForStudent = useCallback(
    (studentId: string) => {
      return filteredAssessments.find((assessment: any) => assessment.student?.id === studentId);
    },
    [filteredAssessments]
  );

  const handleAssessmentToggle = useCallback(
    async (studentId: string, targetResult: "COMPETENT" | "NOT_YET_COMPETENT") => {
      if (!activeUnitId) return;
      const assessment = getAssessmentForStudent(studentId);
      const current = assessment?.result || "PENDING";
      const newResult = current === targetResult ? "PENDING" : targetResult;

      try {
        if (assessment?.id) {
          await fetch(`/api/assessments/${assessment.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              result: newResult,
              assessedDate: newResult !== "PENDING" ? new Date().toISOString() : null,
            }),
          });
        } else if (newResult !== "PENDING") {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 7);
          await fetch("/api/assessments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              studentId,
              unitStandardId: activeUnitId,
              type: assessmentType,
              method: "PRACTICAL",
              result: newResult,
              dueDate,
              assessedDate: new Date().toISOString(),
            }),
          });
        }

        mutateAssessments();
        globalMutate("/api/assessments");
        globalMutate("/api/students");
        globalMutate("/api/groups");
        globalMutate("/api/groups/progress");
      } catch (error) {
        console.error("Failed to update assessment", error);
        showToast("Failed to update assessment", "error");
      }
    },
    [activeUnitId, assessmentType, getAssessmentForStudent, mutateAssessments, showToast]
  );

  const handleBulkPass = useCallback(async () => {
    if (!activeUnitId || students.length === 0) return;

    setBulkPassing(true);
    try {
      const res = await fetch("/api/assessments/bulk-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          unitStandardId: activeUnitId,
          assessmentType,
          studentIds: students.map((student: any) => student.id),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to bulk pass assessments");
      }

      const data = await res.json();
      const updated = data?.data?.updated ?? data?.updated ?? 0;
      const skipped = data?.data?.skipped ?? data?.skipped ?? 0;

      showToast(
        `✓ ${updated} students marked as Passed. ${skipped} students skipped (already passed or failed).`,
        "success"
      );

      mutateAssessments();
      globalMutate("/api/assessments");
      globalMutate("/api/students");
      globalMutate("/api/groups");
      globalMutate("/api/groups/progress");
    } catch (error: any) {
      console.error("Failed to bulk pass assessments", error);
      showToast(error?.message || "Failed to bulk pass assessments", "error");
    } finally {
      setBulkPassing(false);
      setShowBulkConfirm(false);
    }
  }, [activeUnitId, assessmentType, mutateAssessments, showToast, students]);

  const progressSummary = useMemo(() => {
    const total = students.length;
    const competentCount = students.filter((student: any) => {
      const assessment = getAssessmentForStudent(student.id);
      return assessment?.result === "COMPETENT";
    }).length;
    return { total, competentCount };
  }, [getAssessmentForStudent, students]);

  const unitProgressMap = useMemo(() => {
    const map = new Map<string, Record<AssessmentType, number>>();
    const base: Record<AssessmentType, number> = {
      FORMATIVE: 0,
      SUMMATIVE: 0,
      WORKPLACE: 0,
    };

    groupUnitStandards.forEach((unit: any) => {
      map.set(unit.id, { ...base });
    });

    const seen = new Map<string, Set<string>>();

    assessments.forEach((assessment: any) => {
      const unitId = assessment.unitStandard?.id;
      const studentId = assessment.student?.id;
      if (!unitId || !studentId || assessment.result !== "COMPETENT") return;
      const key = `${unitId}|${assessment.type}`;
      if (!seen.has(key)) seen.set(key, new Set());
      const set = seen.get(key);
      if (set?.has(studentId)) return;
      set?.add(studentId);

      if (!map.has(unitId)) {
        map.set(unitId, { ...base });
      }
      const entry = map.get(unitId);
      if (entry && assessment.type in entry) {
        entry[assessment.type as AssessmentType] += 1;
      }
    });

    return map;
  }, [assessments, groupUnitStandards]);

  const [attendanceChanges, setAttendanceChanges] = useState<Map<string, AttendanceStatus>>(new Map());
  const [savingAttendance, setSavingAttendance] = useState(false);

  const attendanceByDate = useMemo(() => {
    const map = new Map<
      string,
      { dateKey: string; date: Date; sessionTitle: string; records: Map<string, any> }
    >();

    attendanceRecords.forEach((record: any) => {
      const dateKey = format(new Date(record.date), "yyyy-MM-dd");
      if (!map.has(dateKey)) {
        map.set(dateKey, {
          dateKey,
          date: new Date(record.date),
          sessionTitle: record.session?.title || "Session",
          records: new Map(),
        });
      }
      const entry = map.get(dateKey);
      entry?.records.set(record.studentId, record);
    });

    return Array.from(map.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [attendanceRecords]);

  const getAttendanceStatus = useCallback(
    (dateKey: string, studentId: string) => {
      const entry = attendanceByDate.find((item) => item.dateKey === dateKey);
      const record = entry?.records.get(studentId);
      const override = attendanceChanges.get(`${dateKey}|${studentId}`);
      return override || record?.status || "";
    },
    [attendanceByDate, attendanceChanges]
  );

  const updateAttendanceStatus = useCallback(
    (dateKey: string, studentId: string, status: AttendanceStatus | "") => {
      setAttendanceChanges((prev) => {
        const next = new Map(prev);
        const key = `${dateKey}|${studentId}`;
        if (!status) {
          next.delete(key);
          return next;
        }
        next.set(key, status);
        return next;
      });
    },
    []
  );

  const handleSaveAttendance = useCallback(async () => {
    if (!group?.id || attendanceChanges.size === 0) return;

    setSavingAttendance(true);
    try {
      const records = Array.from(attendanceChanges.entries()).map(([key, status]) => {
        const [dateKey, studentId] = key.split("|");
        return {
          studentId,
          groupId: group.id,
          date: dateKey,
          status,
        };
      });

      const res = await fetch("/api/attendance/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ records }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save attendance");
      }

      setAttendanceChanges(new Map());
      mutateAttendance();
      globalMutate("/api/attendance");
      globalMutate("/api/students");
      globalMutate("/api/groups");
      showToast("Attendance saved successfully", "success");
    } catch (error: any) {
      console.error("Failed to save attendance", error);
      showToast(error?.message || "Failed to save attendance", "error");
    } finally {
      setSavingAttendance(false);
    }
  }, [attendanceChanges, group?.id, mutateAttendance, showToast]);

  if (!isOpen || !group) return null;

  const avgPercent = actualProgress?.avgPercent || 0;

  return (
    <>
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <aside className="absolute right-0 top-0 h-full w-full sm:max-w-[60vw] bg-white shadow-2xl flex flex-col">
          <header className="p-5 border-b border-slate-200 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{group.name}</h2>
              <p className="text-sm text-slate-600">
                Start: {group.startDate ? format(new Date(group.startDate), "MMM d, yyyy") : "N/A"}
              </p>
              <div className="mt-2 inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                {statusLabel}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          <div className="p-5 border-b border-slate-200 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500">Students</div>
                <div className="text-lg font-semibold text-slate-900">{students.length}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500">Attendance</div>
                <div className="text-lg font-semibold text-slate-900">{attendanceRate.toFixed(0)}%</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500">Actual Credits</div>
                <div className="text-lg font-semibold text-slate-900">{avgPercent}%</div>
              </div>
            </div>
            {currentModuleLabel && (
              <div className="text-sm text-slate-600">
                Current Module: <span className="font-semibold text-slate-900">{currentModuleLabel}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 px-5 py-3 border-b border-slate-200">
            {["students", "assessments", "attendance"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as DrawerTab)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold",
                  activeTab === tab
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
              >
                {tab === "students" && "Students"}
                {tab === "assessments" && "Assessments"}
                {tab === "attendance" && "Attendance"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {activeTab === "students" && (
              <div className="space-y-3">
                {students.length === 0 && (
                  <div className="text-sm text-slate-500">No students in this group.</div>
                )}
                {students.map((student: any) => {
                  const attendanceRateForStudent = attendanceRatesData?.data?.[student.id]?.rate ?? 0;
                  const statusClasses =
                    student.status === "AT_RISK"
                      ? "bg-red-100 text-red-700"
                      : student.status === "COMPLETED"
                      ? "bg-blue-100 text-blue-700"
                      : student.status === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-700"
                      : student.status === "WITHDRAWN"
                      ? "bg-slate-200 text-slate-700"
                      : "bg-amber-100 text-amber-700";
                  return (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className="w-full text-left bg-white border border-slate-200 rounded-lg p-3 hover:border-slate-300"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-900">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-xs text-slate-500">{student.studentId}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-slate-600">
                        <div>Attendance: {attendanceRateForStudent.toFixed(0)}%</div>
                        <div>Credits: {student.totalCreditsEarned || 0}</div>
                        <div>
                          <span className={cn("px-2 py-0.5 rounded-full font-semibold", statusClasses)}>
                            {student.status}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {activeTab === "assessments" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  {["FORMATIVE", "SUMMATIVE", "WORKPLACE"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setAssessmentType(tab as AssessmentType)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm font-semibold",
                        assessmentType === tab
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-700"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500">Select Module</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {groupModules.length === 0 && (
                        <div className="text-sm text-slate-500">No modules linked to this group.</div>
                      )}
                      {groupModules.map((module: any) => {
                        const label = `Module ${module.moduleNumber} - ${module.name}`;
                        const isSelected = module.id === selectedModuleId;
                        return (
                          <button
                            key={module.id}
                            onClick={() => setSelectedModuleId(module.id)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                              isSelected
                                ? "bg-green-600 text-white"
                                : "border border-gray-300 text-gray-700 hover:border-green-500"
                            )}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {assessmentType !== "WORKPLACE" && (
                      <div className="text-xs uppercase tracking-wide text-gray-500">Unit Standards</div>
                    )}

                    {assessmentType === "WORKPLACE" ? (
                      <button
                        type="button"
                        className={cn(
                          "w-full text-left bg-white rounded border p-3 hover:border-green-400",
                          "border-green-600 bg-green-50"
                        )}
                      >
                        <div className="text-sm font-semibold text-slate-900">
                          Workplace Activity - {selectedModule?.name || "Module"}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          This covers all {moduleUnitStandards.length} unit standards in this module
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Marking workplace passes the module-level collection assessment
                        </div>
                      </button>
                    ) : (
                      <div className="space-y-2">
                        {moduleUnitStandards.length === 0 && (
                          <div className="text-sm text-slate-500">Select a module to view unit standards.</div>
                        )}
                        {moduleUnitStandards.map((unit: any) => {
                          const isSelected = selectedUnitId === unit.id;
                          const progress = unitProgressMap.get(unit.id) || {
                            FORMATIVE: 0,
                            SUMMATIVE: 0,
                            WORKPLACE: 0,
                          };
                          return (
                            <button
                              key={unit.id}
                              onClick={() => setSelectedUnitId(unit.id)}
                              className={cn(
                                "w-full text-left bg-white rounded border p-3 hover:border-green-400",
                                isSelected ? "border-green-600 bg-green-50" : "border-slate-200"
                              )}
                            >
                              <div className="text-sm font-semibold text-slate-900">
                                {unit.code} - {unit.title}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                {unit.credits} credits - Level {unit.level}
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs text-slate-600 mt-2">
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                  Formative: {progress.FORMATIVE}/{students.length}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                                  Summative: {progress.SUMMATIVE}/{students.length}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                                  Workplace: {progress.WORKPLACE}/{students.length}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {activeUnitId && (
                  <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-700">
                      {assessmentType}: {progressSummary.competentCount}/{progressSummary.total} Passed
                    </div>
                    <button
                      onClick={() => setShowBulkConfirm(true)}
                      className="px-3 py-1.5 text-sm font-semibold border border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                    >
                      ✓ Mark All as Passed
                    </button>
                  </div>
                )}

                {showBulkConfirm && activeUnitId && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                    <div className="text-sm text-green-800">
                      Mark all {students.length} students as PASSED for {assessmentType === "WORKPLACE"
                        ? `Workplace Activity - ${selectedModule?.name || "Module"}`
                        : `${selectedUnit?.code} - ${selectedUnit?.title}`}?
                      You can still update individual students after.
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => setShowBulkConfirm(false)}
                        className="px-3 py-1.5 text-sm rounded border border-slate-300 text-slate-600"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleBulkPass}
                        disabled={bulkPassing}
                        className="px-3 py-1.5 text-sm rounded bg-green-600 text-white disabled:opacity-50"
                      >
                        {bulkPassing ? "Working..." : "Confirm"}
                      </button>
                    </div>
                  </div>
                )}

                {!activeUnitId && (
                  <div className="text-sm text-slate-500">Select a unit standard to view assessments.</div>
                )}

                {activeUnitId && (
                  <div className="space-y-2">
                    {students.map((student: any) => {
                      const assessment = getAssessmentForStudent(student.id);
                      const result = assessment?.result || "PENDING";

                      return (
                        <div
                          key={student.id}
                          className="bg-white p-3 rounded border border-slate-200 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-sm text-slate-900">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-xs text-slate-500">{student.studentId}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "text-xs font-medium px-2 py-0.5 rounded",
                                result === "COMPETENT"
                                  ? "bg-green-100 text-green-700"
                                  : result === "NOT_YET_COMPETENT"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-500"
                              )}
                            >
                              {result === "COMPETENT"
                                ? "Passed"
                                : result === "NOT_YET_COMPETENT"
                                ? "NYC"
                                : "Not marked"}
                            </span>
                            <button
                              onClick={() => handleAssessmentToggle(student.id, "COMPETENT")}
                              className={cn(
                                "px-3 py-1.5 rounded text-sm font-semibold border-2 transition-all",
                                result === "COMPETENT"
                                  ? "bg-green-600 text-white border-green-600"
                                  : "bg-white text-gray-500 border-gray-300"
                              )}
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => handleAssessmentToggle(student.id, "NOT_YET_COMPETENT")}
                              className={cn(
                                "px-3 py-1.5 rounded text-sm font-semibold border-2 transition-all",
                                result === "NOT_YET_COMPETENT"
                                  ? "bg-red-600 text-white border-red-600"
                                  : "bg-white text-gray-500 border-gray-300"
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
            )}

            {activeTab === "attendance" && (
              <div className="space-y-4">
                <div className="text-sm text-slate-600">
                  Update attendance per session and save changes in one batch.
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Date</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Session</th>
                        {students.map((student: any) => (
                          <th key={student.id} className="px-3 py-2 text-xs font-semibold text-slate-500 text-center">
                            {student.firstName}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {attendanceByDate.map((entry) => (
                        <tr key={entry.dateKey}>
                          <td className="px-3 py-3 text-slate-700">
                            {format(entry.date, "MMM d, yyyy")}
                          </td>
                          <td className="px-3 py-3 text-slate-500">{entry.sessionTitle}</td>
                          {students.map((student: any) => (
                            <td key={student.id} className="px-3 py-2 text-center">
                              <select
                                value={getAttendanceStatus(entry.dateKey, student.id)}
                                onChange={(event) =>
                                  updateAttendanceStatus(
                                    entry.dateKey,
                                    student.id,
                                    event.target.value as AttendanceStatus
                                  )
                                }
                                className="px-2 py-1 border border-slate-300 rounded text-xs"
                              >
                                <option value="">Unmarked</option>
                                {attendanceStatuses.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                            </td>
                          ))}
                        </tr>
                      ))}
                      {attendanceByDate.length === 0 && (
                        <tr>
                          <td colSpan={students.length + 2} className="px-3 py-6 text-center text-slate-500">
                            No attendance sessions recorded for this group.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {attendanceChanges.size > 0 && (
                  <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                    <span className="text-sm text-slate-600">
                      {attendanceChanges.size} change(s) pending
                    </span>
                    <button
                      onClick={handleSaveAttendance}
                      disabled={savingAttendance}
                      className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
                    >
                      {savingAttendance ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      {selectedStudent && (
        <StudentDetailsModal
          isOpen={Boolean(selectedStudent)}
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onSave={() => {
            setSelectedStudent(null);
          }}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </>
  );
}
