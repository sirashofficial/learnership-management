'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Clock, AlertTriangle, TrendingUp, Users, Award, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { TOTAL_CREDITS } from '@/lib/constants';

interface UnitStandardProgress {
  unitStandardId: string;
  code: string;
  title: string;
  credits: number;
  status: string; // COMPETENT | NOT_YET_COMPETENT | PENDING | NOT_ATTEMPTED
  attemptCount: number;
  competentDate?: string;
}

interface ModuleProgress {
  moduleId: string;
  moduleNumber: number;
  moduleName: string;
  totalCredits: number;
  earnedCredits: number;
  completionPercent: number;
  unitStandards: UnitStandardProgress[];
}

interface StudentProgress {
  studentId: string;
  firstName: string;
  lastName: string;
  totalCredits: number;
  earnedCredits: number;
  overallPercent: number;
  status: 'AHEAD' | 'ON_TRACK' | 'BEHIND' | 'AT_RISK';
  modules: ModuleProgress[];
}

interface GroupProgressSummary {
  groupId: string;
  groupName: string;
  totalStudents: number;
  avgCreditsEarned: number;
  avgProgressPercent: number;
  currentModuleNumber?: number;
  students: StudentProgress[];
}

interface ProgressDashboardProps {
  groupId: string;
  groupName: string;
  refreshKey?: number;
}

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  AHEAD: { label: 'Ahead', color: 'bg-purple-100 text-purple-700' },
  ON_TRACK: { label: 'On Track', color: 'bg-green-100 text-green-700' },
  BEHIND: { label: 'Behind', color: 'bg-orange-100 text-orange-700' },
  AT_RISK: { label: 'At Risk', color: 'bg-red-100 text-red-700' },
};

const US_STATUS_COLOR: Record<string, string> = {
  COMPETENT: 'bg-green-500',
  NOT_YET_COMPETENT: 'bg-red-400',
  PENDING: 'bg-yellow-400',
  NOT_ATTEMPTED: 'bg-gray-200',
};

const US_STATUS_ICON: Record<string, React.ReactNode> = {
  COMPETENT: <CheckCircle size={12} className="text-green-600" />,
  NOT_YET_COMPETENT: <AlertTriangle size={12} className="text-red-600" />,
  PENDING: <Clock size={12} className="text-yellow-600" />,
  NOT_ATTEMPTED: <Clock size={12} className="text-gray-400" />,
};

export default function ProgressDashboard({ groupId, groupName, refreshKey = 0 }: ProgressDashboardProps) {
  const [data, setData] = useState<GroupProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'status'>('progress');

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    try {
      const [groupRes, studentsRes, assessmentsRes] = await Promise.all([
        fetch(`/api/groups/${groupId}`, { credentials: 'include' }),
        fetch(`/api/students?groupId=${groupId}&status=ACTIVE`, { credentials: 'include' }),
        fetch(`/api/assessments?groupId=${groupId}&all=true`, { credentials: 'include' }),
      ]);

      const groupData = await groupRes.json();
      const studentsData = await studentsRes.json();
      const assessmentsData = await assessmentsRes.json();

      const studentList: any[] = Array.isArray(studentsData) ? studentsData : studentsData.data || [];
      const assessmentList: any[] = Array.isArray(assessmentsData) ? assessmentsData : assessmentsData.data || [];
      const group = groupData?.data ?? groupData;

      // Build progress per student
      const studentProgressList: StudentProgress[] = studentList.map((student) => {
        const studentAssessments = assessmentList.filter(
          (a: any) => {
            const aStudentId = a.studentId || a.student?.id || a.student?.studentId;
            return aStudentId === student.id || aStudentId === student.studentId;
          }
        );

        // Group assessments by module
        const moduleMap = new Map<string, ModuleProgress>();

        for (const assessment of studentAssessments) {
          const mod = assessment.unitStandard?.module;

          // Handle missing module by grouping into "Other Unit Standards"
          const moduleId = mod?.id || 'other-standards';
          const moduleNumber = mod?.moduleNumber ?? 99;
          const moduleName = mod?.name ?? mod?.fullName ?? 'Other Unit Standards';

          if (!moduleMap.has(moduleId)) {
            moduleMap.set(moduleId, {
              moduleId,
              moduleNumber,
              moduleName,
              totalCredits: 0,
              earnedCredits: 0,
              completionPercent: 0,
              unitStandards: [],
            });
          }

          const modProgress = moduleMap.get(moduleId)!;
          const us = assessment.unitStandard;
          const credits = us?.credits ?? 0;

          // Check if this US is already tracked
          const existing = modProgress.unitStandards.find((u) => u.unitStandardId === us.id);
          const status = assessment.result === 'COMPETENT' ? 'COMPETENT'
            : assessment.result === 'NOT_YET_COMPETENT' ? 'NOT_YET_COMPETENT'
              : 'PENDING';

          if (!existing) {
            modProgress.totalCredits += credits;
            if (status === 'COMPETENT') modProgress.earnedCredits += credits;
            modProgress.unitStandards.push({
              unitStandardId: us.id,
              code: us.code,
              title: us.title,
              credits,
              status,
              attemptCount: 1,
              competentDate: assessment.assessedDate,
            });
          } else if (status === 'COMPETENT' && existing.status !== 'COMPETENT') {
            // Upgrade status
            existing.status = 'COMPETENT';
            modProgress.earnedCredits += credits;
            existing.competentDate = assessment.assessedDate;
            existing.attemptCount++;
          } else {
            existing.attemptCount++;
          }
        }

        // Recalculate completion per module
        moduleMap.forEach((mod) => {
          mod.completionPercent = mod.totalCredits > 0
            ? Math.round((mod.earnedCredits / mod.totalCredits) * 100)
            : 0;
        });

        const modules = Array.from(moduleMap.values()).sort((a, b) => a.moduleNumber - b.moduleNumber);
        const totalEarned = modules.reduce((sum, m) => sum + m.earnedCredits, 0);
        const overallPercent = Math.round((totalEarned / TOTAL_CREDITS) * 100);

        // Derive status based on progress (unified logic)
        let status: StudentProgress['status'] = 'ON_TRACK';
        if (overallPercent >= 80) status = 'AHEAD';
        else if (overallPercent < 25) status = 'AT_RISK';
        else if (overallPercent < 45) status = 'BEHIND';

        return {
          studentId: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          totalCredits: TOTAL_CREDITS,
          earnedCredits: totalEarned,
          overallPercent,
          status,
          modules,
        };
      });

      const avgCredits = studentProgressList.length > 0
        ? Math.round(studentProgressList.reduce((s, p) => s + p.earnedCredits, 0) / studentProgressList.length)
        : 0;
      const avgPercent = studentProgressList.length > 0
        ? Math.round(studentProgressList.reduce((s, p) => s + p.overallPercent, 0) / studentProgressList.length)
        : 0;

      setData({
        groupId,
        groupName,
        totalStudents: studentProgressList.length,
        avgCreditsEarned: avgCredits,
        avgProgressPercent: avgPercent,
        students: studentProgressList,
      });
    } finally {
      setLoading(false);
    }
  }, [groupId, groupName]);

  useEffect(() => { fetchProgress(); }, [fetchProgress]);

  // Re-fetch when parent signals a data change (e.g. after an assessment toggle)
  useEffect(() => {
    if (refreshKey > 0) fetchProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const toggleStudent = (id: string) => {
    const next = new Set(expandedStudents);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedStudents(next);
  };

  const toggleModule = (key: string) => {
    const next = new Set(expandedModules);
    next.has(key) ? next.delete(key) : next.add(key);
    setExpandedModules(next);
  };

  const sortedStudents = data
    ? [...data.students].sort((a, b) => {
      if (sortBy === 'name') return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      if (sortBy === 'progress') return b.overallPercent - a.overallPercent;
      const order = { AHEAD: 0, ON_TRACK: 1, BEHIND: 2, AT_RISK: 3 };
      return (order[a.status] ?? 4) - (order[b.status] ?? 4);
    })
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading progress data...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-5">
      {/* Group summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: Users, label: 'Students', value: data.totalStudents, color: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: Award, label: 'Avg Credits', value: data.avgCreditsEarned, color: 'text-green-600', bg: 'bg-green-50' },
          { icon: TrendingUp, label: 'Avg Progress', value: `${data.avgProgressPercent}%`, color: 'text-purple-600', bg: 'bg-purple-50' },
          {
            icon: AlertTriangle,
            label: 'At Risk',
            value: data.students.filter((s) => s.status === 'AT_RISK').length,
            color: 'text-red-600',
            bg: 'bg-red-50',
          },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} rounded-xl p-4 flex items-center gap-3`}>
            <stat.icon size={22} className={stat.color} />
            <div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-gray-600">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 font-medium">Sort by:</span>
        {(['name', 'progress', 'status'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${sortBy === s ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Student list */}
      <div className="space-y-2">
        {sortedStudents.map((student) => {
          const isExpanded = expandedStudents.has(student.studentId);
          const badge = STATUS_BADGE[student.status] ?? STATUS_BADGE.ON_TRACK;

          return (
            <div key={student.studentId} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {/* Student row */}
              <button
                onClick={() => toggleStudent(student.studentId)}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 text-left"
              >
                {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900">
                    {student.firstName} {student.lastName}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-36">
                  <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                    <span>{student.earnedCredits}/{student.totalCredits} credits</span>
                    <span>{student.overallPercent}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${student.overallPercent}%` }}
                    />
                  </div>
                </div>

                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${badge.color}`}>
                  {badge.label}
                </span>
              </button>

              {/* Expanded module breakdown */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 space-y-2">
                  {student.modules.length === 0 ? (
                    <p className="text-sm text-gray-400 py-2">No assessments recorded yet</p>
                  ) : (
                    student.modules.map((mod) => {
                      const modKey = `${student.studentId}-${mod.moduleId}`;
                      const isModExpanded = expandedModules.has(modKey);
                      const pct = mod.completionPercent;

                      return (
                        <div key={mod.moduleId} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleModule(modKey)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left"
                          >
                            {isModExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            <span className="text-xs font-semibold text-gray-700 flex-1">
                              Module {mod.moduleNumber}: {mod.moduleName}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${pct === 100 ? 'bg-green-500' : pct > 50 ? 'bg-blue-500' : 'bg-orange-400'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">{mod.earnedCredits}/{mod.totalCredits}cr</span>
                            </div>
                          </button>

                          {isModExpanded && (
                            <div className="border-t border-gray-100 px-4 py-2 space-y-1.5">
                              {mod.unitStandards.map((us) => (
                                <div key={us.unitStandardId} className="flex items-center gap-2">
                                  {US_STATUS_ICON[us.status]}
                                  <span className="text-xs font-mono text-blue-700">{us.code}</span>
                                  <span className="text-xs text-gray-700 flex-1 truncate">{us.title}</span>
                                  <span className="text-xs text-gray-500">{us.credits}cr</span>
                                  {us.attemptCount > 1 && (
                                    <span className="text-xs text-gray-400">({us.attemptCount} attempts)</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
