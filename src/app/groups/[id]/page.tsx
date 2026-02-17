'use client';

import { useState, useEffect, useMemo, useCallback, Fragment } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft,
    Calendar,
    Users,
    Clock,
    FileText,
    RefreshCw,
    Sparkles,
    TrendingUp,
    CheckCircle2,
    AlertCircle,
    Download,
    ChevronUp,
    Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import useSWR, { mutate as globalMutate } from 'swr';
import { cn } from '@/lib/utils';
import { Breadcrumb, BackButton, StatusBadge, IconButton } from '@/components/ui/AccessibilityComponents';
import { formatGroupNameDisplay } from '@/lib/groupName';
import { generateRolloutPlan } from '@/lib/rolloutPlanGenerator';
import { downloadRolloutDocx } from '@/lib/downloadRolloutDocx';
import { TodayClassesDashboard } from '@/components/TodayClassesDashboard';
import Toast, { useToast } from '@/components/Toast';
import { fetcher } from '@/lib/swr-config';
import {
    extractRolloutPlan,
    buildRolloutPlanFromUnitRollouts,
    buildRolloutPlanFromGroupRollout,
    isCurrentlyActive,
    getTotalCredits,
    getProjectedCompletionDate,
    calculateProjectedVsActual
} from '@/lib/rolloutUtils';

interface GroupDetailProps {
    params: {
        id: string;
    };
}

interface AssessmentStats {
    statusMap: Record<string, string>;
    completedIds: string[];
    earnedCredits: number;
}

type AssessmentType = 'FORMATIVE' | 'SUMMATIVE' | 'WORKPLACE';

export default function GroupDetailPage({ params }: GroupDetailProps) {
    const router = useRouter();
    const { toast, showToast, hideToast } = useToast();
    const [group, setGroup] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingLessons, setIsGeneratingLessons] = useState(false);
    const [rolloutPlan, setRolloutPlan] = useState<any>(null);
    const [showStartDateModal, setShowStartDateModal] = useState(false);
    const [startDateInput, setStartDateInput] = useState('');
    const [assessmentStats, setAssessmentStats] = useState<AssessmentStats>({
        statusMap: {},
        completedIds: [],
        earnedCredits: 0
    });

    const planSummary = rolloutPlan
        || buildRolloutPlanFromUnitRollouts(group?.unitStandardRollouts)
        || extractRolloutPlan(group?.notes)
        || buildRolloutPlanFromGroupRollout(group?.rolloutPlan);

    const { data: assessmentsData, mutate: mutateAssessments } = useSWR(
        params.id ? `/api/assessments?groupId=${params.id}` : null,
        fetcher
    );
    const assessments = useMemo(() => {
        const raw = assessmentsData?.data || assessmentsData || [];
        return Array.isArray(raw) ? raw : [];
    }, [assessmentsData]);

    const { data: unitStandardsData } = useSWR('/api/unit-standards', fetcher);
    const unitStandards = useMemo(() => {
        const raw = unitStandardsData?.data || unitStandardsData || [];
        return Array.isArray(raw) ? raw : [];
    }, [unitStandardsData]);
    const unitStandardByCode = useMemo(() => {
        const map = new Map<string, any>();
        unitStandards.forEach((unit: any) => {
            if (unit?.code) {
                map.set(String(unit.code), unit);
            }
        });
        return map;
    }, [unitStandards]);

    const students = useMemo(() => group?.students || [], [group]);

    // Derived stats
    const totalCredits = useMemo(() => getTotalCredits(planSummary), [planSummary]);
    const projectedDate = useMemo(() => getProjectedCompletionDate(planSummary), [planSummary]);
    const projectedVsActual = useMemo(() =>
        calculateProjectedVsActual(planSummary, assessmentStats.completedIds),
        [planSummary, assessmentStats.completedIds]
    );

    const [openRowKey, setOpenRowKey] = useState<string | null>(null);

    const assessmentIndex = useMemo(() => {
        const map = new Map<string, any>();
        assessments.forEach((assessment: any) => {
            const unitId = assessment.unitStandard?.id || assessment.unitStandardId;
            const studentId = assessment.student?.id || assessment.studentId;
            if (!unitId || !studentId || !assessment.type) return;
            const key = `${studentId}|${unitId}|${assessment.type}`;
            map.set(key, assessment);
        });
        return map;
    }, [assessments]);

    const toggleRow = useCallback((rowKey: string) => {
        setOpenRowKey((prev) => (prev === rowKey ? null : rowKey));
    }, []);

    const refreshAssessmentStats = useCallback(async () => {
        try {
            const statusRes = await fetch(`/api/groups/${params.id}/assessment-status`);
            if (statusRes.ok) {
                setAssessmentStats(await statusRes.json());
            }
        } catch (error) {
            console.error('Error refreshing assessment stats:', error);
        }
    }, [params.id]);

    const updateAssessmentsCache = useCallback((updatedAssessment: any) => {
        mutateAssessments((prev: any) => {
            const previousList = Array.isArray(prev) ? prev : prev?.data || [];
            const next = previousList.map((item: any) =>
                item.id === updatedAssessment.id ? updatedAssessment : item
            );
            const exists = previousList.some((item: any) => item.id === updatedAssessment.id);
            const nextList = exists ? next : [updatedAssessment, ...previousList];
            return Array.isArray(prev) ? nextList : { ...prev, data: nextList };
        }, { revalidate: false });
    }, [mutateAssessments]);

    const handleAssessmentToggle = useCallback(async (
        studentId: string,
        unitStandardId: string,
        type: AssessmentType,
        targetResult: 'COMPETENT' | 'NOT_YET_COMPETENT'
    ) => {
        if (!unitStandardId) return;
        const key = `${studentId}|${unitStandardId}|${type}`;
        const existing = assessmentIndex.get(key);
        const current = existing?.result || 'PENDING';
        const newResult = current === targetResult ? 'PENDING' : targetResult;

        console.log('TOGGLE CALLED', {
            studentId,
            unitStandardId,
            assessmentType: type,
            currentResult: current,
        });

        try {
            if (existing?.id) {
                const res = await fetch(`/api/assessments/${existing.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        result: newResult,
                        assessedDate: newResult !== 'PENDING' ? new Date().toISOString() : null,
                    }),
                });

                if (res.ok) {
                    const updated = await res.json();
                    updateAssessmentsCache(updated?.data || updated);
                }
            } else if (newResult !== 'PENDING') {
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + 7);
                const res = await fetch('/api/assessments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        studentId,
                        unitStandardId,
                        type,
                        method: 'PRACTICAL',
                        result: newResult,
                        dueDate,
                        assessedDate: new Date().toISOString(),
                    }),
                });

                if (res.ok) {
                    const created = await res.json();
                    updateAssessmentsCache(created?.data || created);
                }
            }

            refreshAssessmentStats();
            globalMutate('/api/assessments');
            globalMutate('/api/students');
            globalMutate('/api/groups');
            globalMutate(`/api/groups/${params.id}`);
        } catch (error) {
            console.error('Failed to update assessment', error);
            showToast('Failed to update assessment', 'error');
        }
    }, [assessmentIndex, params.id, refreshAssessmentStats, showToast, updateAssessmentsCache]);

    const handleBulkPass = useCallback(async (
        unitStandardId: string,
        assessmentType: AssessmentType,
        studentIds: string[]
    ) => {
        if (!unitStandardId || studentIds.length === 0) return;

        try {
            const res = await fetch('/api/assessments/bulk-pass', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    unitStandardId,
                    assessmentType,
                    studentIds,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to bulk pass assessments');
            }

            const data = await res.json();
            const updated = data?.data?.updated ?? data?.updated ?? 0;
            const skipped = data?.data?.skipped ?? data?.skipped ?? 0;

            showToast(
                `✓ ${updated} students marked as Passed. ${skipped} students skipped (already passed or failed).`,
                'success'
            );

            mutateAssessments();
            refreshAssessmentStats();
            globalMutate('/api/assessments');
            globalMutate('/api/students');
            globalMutate('/api/groups');
            globalMutate(`/api/groups/${params.id}`);
        } catch (error: any) {
            console.error('Failed to bulk pass assessments', error);
            showToast(error?.message || 'Failed to bulk pass assessments', 'error');
        }
    }, [mutateAssessments, params.id, refreshAssessmentStats, showToast]);

    useEffect(() => {
        const fetchGroupData = async () => {
            try {
                // Fetch Group
                const groupRes = await fetch(`/api/groups/${params.id}`);
                if (groupRes.ok) {
                    const data = await groupRes.json();
                    setGroup(data.data);
                    setRolloutPlan(extractRolloutPlan(data.data?.notes));
                }

                // Fetch Assessment Status
                const statusRes = await fetch(`/api/groups/${params.id}/assessment-status`);
                if (statusRes.ok) {
                    const stats = await statusRes.json();
                    setAssessmentStats(stats);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (params.id) {
            fetchGroupData();
        }
    }, [params.id]);

    const handleGenerateRollout = async () => {
        if (!group?.startDate) {
            setStartDateInput(new Date().toISOString().split('T')[0]);
            setShowStartDateModal(true);
            return;
        }

        const date = new Date(group.startDate);
        const startDateValue = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
        await generateAndPersistPlan(startDateValue);
    };

    const generateAndPersistPlan = async (startDateValue: string) => {
        if (!group) return;

        const learnersCount = group._count?.students || group.students?.length || 0;
        const plan = generateRolloutPlan(group.name, learnersCount, startDateValue);
        setRolloutPlan(plan);

        try {
            // Helper to build dates for API
            const buildModuleDates = (p: any) => {
                const dates: Record<string, any> = {};
                p.modules.forEach((m: any) => {
                    if (m.unitStandards?.length) {
                        const first = m.unitStandards[0];
                        const last = m.unitStandards[m.unitStandards.length - 1];
                        const parse = (d: string) => {
                            const [day, mo, yr] = d.split('/').map(Number);
                            return new Date(yr, mo - 1, day);
                        };
                        dates[`module${m.moduleNumber}StartDate`] = parse(first.startDate);
                        dates[`module${m.moduleNumber}EndDate`] = parse(last.endDate);
                    }
                });
                return dates;
            };

            const moduleDates = buildModuleDates(plan);

            // 1. Update Rollout Dates in DB
            await fetch(`/api/groups/${params.id}/rollout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rolloutPlan: moduleDates }),
            });

            // 2. Update Group Notes & Dates
            const updatedNotes = group.notes ? JSON.parse(group.notes) : {};
            updatedNotes.rolloutPlan = plan;

            const updateRes = await fetch(`/api/groups/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startDate: moduleDates[`module1StartDate`], // implicit start
                    notes: JSON.stringify(updatedNotes),
                }),
            });

            if (updateRes.ok) {
                const updatedGroup = await updateRes.json();
                setGroup({ ...group, ...updatedGroup.data });
            }

            setShowStartDateModal(false);

            // Refresh stats
            const statusRes = await fetch(`/api/groups/${params.id}/assessment-status`);
            if (statusRes.ok) {
                setAssessmentStats(await statusRes.json());
            }

        } catch (error) {
            console.error('Error saving rollout plan:', error);
        }
    };

    const handleGenerateLessons = async () => {
        if (!group?.rolloutPlan) {
            alert('Please generate a rollout plan first.');
            return;
        }

        if (!confirm('This will generate daily lesson plans for Module 3 based on the curriculum. Continue?')) {
            return;
        }

        setIsGeneratingLessons(true);
        try {
            const response = await fetch(`/api/groups/${params.id}/lessons/generate`, {
                method: 'POST',
            });
            const result = await response.json();
            alert(result.message || result.error);
            router.refresh();
        } catch (error) {
            console.error('Error generating lessons:', error);
        } finally {
            setIsGeneratingLessons(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24 min-h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!group) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
                    <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">Group not found</h2>
                    <p className="text-slate-500 mb-6">The group you are looking for does not exist or has been deleted.</p>
                    <button onClick={() => router.back()} className="btn-secondary w-full justify-center">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Breadcrumb Navigation */}
                <Breadcrumb 
                    items={[
                        { label: 'Dashboard', href: '/' },
                        { label: 'Groups', href: '/groups' },
                        { label: group?.name ? formatGroupNameDisplay(group.name) : 'Group' }
                    ]} 
                />

                {/* Back Button */}
                <BackButton href="/groups" label="Back to Groups" />
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{formatGroupNameDisplay(group.name)}</h1>
                        <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                            <span className="flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-indigo-500" />
                                {group._count?.students || 0} Learners
                                </span>
                                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium">
                                    {group.company?.name || 'Independent Group'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {group.rolloutPlan && (
                            <button
                                onClick={handleGenerateLessons}
                                disabled={isGeneratingLessons}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium border border-indigo-100"
                            >
                                <Sparkles className={cn("w-4 h-4", isGeneratingLessons && 'animate-spin')} />
                                {isGeneratingLessons ? 'Generating...' : 'Generate Lessons'}
                            </button>
                        )}
                        <button
                            onClick={handleGenerateRollout}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium border border-slate-200 shadow-sm"
                        >
                            <RefreshCw className="w-4 h-4" />
                            {rolloutPlan ? 'Regenerate Plan' : 'Generate Plan'}
                        </button>
                        <button
                            onClick={() => planSummary && downloadRolloutDocx(planSummary)}
                            disabled={!planSummary}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download className="w-4 h-4" />
                            Download PDF
                        </button>
                    </div>
                </div>

                {/* Dashboard Stats Row */}
                <TodayClassesDashboard />

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

                    {/* Main Timetable */}
                    <div className="xl:col-span-8 space-y-6">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-indigo-500" />
                                    Rollout Schedule
                                </h2>
                                {projectedDate && (
                                    <div className="text-sm text-slate-500">
                                        Completion: <span className="font-medium text-slate-900">{projectedDate}</span>
                                    </div>
                                )}
                            </div>

                            {planSummary ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-4 min-w-[180px]">Dates</th>
                                                <th className="px-6 py-4">Unit Standard</th>
                                                <th className="px-6 py-4 w-[70px] text-center">Credits</th>
                                                <th className="px-6 py-4 w-[150px] text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {planSummary.modules?.map((module: any, index: number) => (
                                                <ModuleSection
                                                    key={index}
                                                    module={module}
                                                    index={index}
                                                    students={students}
                                                    assessmentIndex={assessmentIndex}
                                                    unitStandardByCode={unitStandardByCode}
                                                    openRowKey={openRowKey}
                                                    onToggleRow={toggleRow}
                                                    onToggleAssessment={handleAssessmentToggle}
                                                    onBulkPass={handleBulkPass}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                        <Calendar className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-900 mb-2">No Rollout Plan</h3>
                                    <p className="text-slate-500 max-w-sm mx-auto mb-6">Generate a rollout plan to visualize the schedule, credits, and assessment tracking for this group.</p>
                                    <button
                                        onClick={handleGenerateRollout}
                                        className="btn-primary"
                                    >
                                        Generate Plan Now
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="xl:col-span-4 space-y-6 sticky top-8">

                        {/* Credits Progress */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                Credit Progress
                            </h3>

                            <div className="flex items-end justify-between text-sm">
                                <span className="text-slate-500">Total Earned</span>
                                <span className="font-bold text-slate-900 text-lg">
                                    {assessmentStats.earnedCredits} <span className="text-slate-400 text-sm font-normal">/ {totalCredits}</span>
                                </span>
                            </div>

                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${Math.min(100, totalCredits > 0 ? (assessmentStats.earnedCredits / totalCredits) * 100 : 0)}%` }}
                                />
                            </div>

                            <p className="text-xs text-slate-400 leading-relaxed">
                                Credits are awarded when all students in the group have passed both formative and summative assessments for a unit standard.
                            </p>
                        </div>

                        {/* Projected vs Actual */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
                            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-indigo-500" />
                                Pace Tracker
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Target</div>
                                    <div className="text-lg font-bold text-slate-900 truncate">
                                        Module {projectedVsActual.projectedModule || '-'}
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        {projectedVsActual.projectedDate || '-'}
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Actual</div>
                                    <div className="text-lg font-bold text-slate-900 truncate">
                                        Module {projectedVsActual.actualModule || '-'}
                                    </div>
                                    <div className="text-xs text-slate-400">Last Completed</div>
                                </div>
                            </div>

                            <div className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border",
                                projectedVsActual.status === 'ahead' ? "bg-emerald-50 border-emerald-100" :
                                    projectedVsActual.status === 'behind' ? "bg-amber-50 border-amber-100" :
                                        "bg-blue-50 border-blue-100"
                            )}>
                                <div className={cn(
                                    "w-3 h-3 rounded-full flex-shrink-0",
                                    projectedVsActual.status === 'ahead' ? "bg-emerald-500" :
                                        projectedVsActual.status === 'behind' ? "bg-amber-500" :
                                            "bg-blue-500"
                                )} />
                                <div className="flex-1 min-w-0">
                                    <p className={cn(
                                        "text-sm font-semibold truncate",
                                        projectedVsActual.status === 'ahead' ? "text-emerald-700" :
                                            projectedVsActual.status === 'behind' ? "text-amber-700" :
                                                "text-blue-700"
                                    )}>
                                        {projectedVsActual.status === 'ahead' ? 'Running Ahead of Schedule' :
                                            projectedVsActual.status === 'behind' ? `Behind Schedule (${projectedVsActual.weeksAhead} weeks)` :
                                                'On Track'}
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>

            {/* Start Date Modal */}
            {showStartDateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-lg font-semibold text-slate-900">Set Start Date</h3>
                            <p className="text-sm text-slate-500 mt-1">Select the official start date for this group to generate the rollout plan.</p>
                        </div>
                        <div className="p-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Start Date</label>
                                <input
                                    type="date"
                                    value={startDateInput}
                                    onChange={(e) => setStartDateInput(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                            <button
                                onClick={() => setShowStartDateModal(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (!startDateInput) return;
                                    const [y, m, d] = startDateInput.split('-');
                                    generateAndPersistPlan(`${d}/${m}/${y}`);
                                }}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition-all"
                            >
                                Generate Plan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
        </div>
    );
}

function ModuleSection({
    module,
    index,
    students,
    assessmentIndex,
    unitStandardByCode,
    openRowKey,
    onToggleRow,
    onToggleAssessment,
    onBulkPass,
}: {
    module: any;
    index: number;
    students: any[];
    assessmentIndex: Map<string, any>;
    unitStandardByCode: Map<string, any>;
    openRowKey: string | null;
    onToggleRow: (rowKey: string) => void;
    onToggleAssessment: (studentId: string, unitStandardId: string, type: AssessmentType, targetResult: 'COMPETENT' | 'NOT_YET_COMPETENT') => void;
    onBulkPass: (unitStandardId: string, assessmentType: AssessmentType, studentIds: string[]) => void;
}) {
    const moduleNumber = module.moduleNumber ?? module.moduleIndex ?? index + 1;
    const moduleName = module.moduleName || `Module ${moduleNumber}`;
    const units = Array.isArray(module.unitStandards) ? module.unitStandards : [];

    const workplaceStart = module.workplaceActivity?.startDate || module.workplaceActivityStartDate;
    const workplaceEnd = module.workplaceActivity?.endDate || module.workplaceActivityEndDate;
    const derivedWorkplace = !workplaceStart ? deriveWorkplaceActivity(units) : null;
    const resolvedWorkplaceStart = workplaceStart || derivedWorkplace?.startDate;
    const resolvedWorkplaceEnd = workplaceEnd || derivedWorkplace?.endDate;
    const resolvedWorkplaceLabel = module.workplaceActivity?.label || derivedWorkplace?.label || 'Workplace Experience Component';
    const hasWorkplace = !!resolvedWorkplaceStart;
    const resolveUnitStandardId = (unitId: string) => {
        if (!unitId) return '';
        const fromCode = unitStandardByCode.get(String(unitId))?.id;
        if (fromCode) return fromCode;
        if (String(unitId).includes('-')) return unitId;
        return '';
    };

    const workplaceAnchorUnitId = resolveUnitStandardId(units[0]?.id || '');

    const getResultFor = (studentId: string, unitStandardId: string, type: AssessmentType | 'INTEGRATED') => {
        if (!unitStandardId) return 'PENDING';
        const key = `${studentId}|${unitStandardId}|${type}`;
        return assessmentIndex.get(key)?.result || 'PENDING';
    };

    const isOverdue = (dateValue?: string | null) => {
        const parsed = parsePlanDate(dateValue || '');
        if (!parsed) return false;
        return normalizeDate(new Date()) > normalizeDate(parsed);
    };

    const getUnitStatus = (unit: any) => {
        if (students.length === 0) {
            return 'NOT_STARTED';
        }

        const resolvedUnitId = resolveUnitStandardId(unit.id);
        if (!resolvedUnitId) return 'NOT_STARTED';

        const formativePassed = students.filter((student) =>
            getResultFor(student.id, resolvedUnitId, 'FORMATIVE') === 'COMPETENT'
        ).length;

        const summativePassed = students.filter((student) => {
            const summative = getResultFor(student.id, resolvedUnitId, 'SUMMATIVE') === 'COMPETENT';
            const integrated = getResultFor(student.id, resolvedUnitId, 'INTEGRATED') === 'COMPETENT';
            return summative || integrated;
        }).length;

        const allComplete = formativePassed === students.length && summativePassed === students.length;

        const hasAnyAssessment = students.some((student) => {
            return ['FORMATIVE', 'SUMMATIVE', 'WORKPLACE', 'INTEGRATED'].some((type) =>
                assessmentIndex.has(`${student.id}|${resolvedUnitId}|${type}`)
            );
        });

        const scheduledDate = unit.assessingDate || unit.endDate || unit.summativeDate;

        if (allComplete) return 'COMPLETED';
        if (scheduledDate && isOverdue(scheduledDate)) return 'OVERDUE';
        if (hasAnyAssessment) return 'IN_PROGRESS';
        return 'NOT_STARTED';
    };

    const getWorkplaceStatus = () => {
        if (!workplaceAnchorUnitId || students.length === 0) {
            return 'REQUIRED';
        }

        const passedCount = students.filter((student) =>
            getResultFor(student.id, workplaceAnchorUnitId, 'WORKPLACE') === 'COMPETENT'
        ).length;

        const hasAnyAssessment = students.some((student) =>
            assessmentIndex.has(`${student.id}|${workplaceAnchorUnitId}|WORKPLACE`)
        );

        if (passedCount === students.length) return 'COMPLETED';
        if (hasAnyAssessment) return 'IN_PROGRESS';
        return 'REQUIRED';
    };

    return (
        <>
            <tr className="bg-gray-100 border-b-2 border-gray-200">
                <td colSpan={4} className="py-3 px-4 text-sm font-bold uppercase text-slate-600">
                    MODULE {moduleNumber} - {moduleName}
                </td>
            </tr>

            {units.map((unit: any) => {
                const rowKey = `unit:${unit.id}`;
                const isOpen = openRowKey === rowKey;
                const status = getUnitStatus(unit);
                const code = unit.code || unit.id;
                const resolvedUnitId = resolveUnitStandardId(unit.id);

                return (
                    <Fragment key={unit.id}>
                        <tr
                            className={cn(
                                "border-b border-slate-50",
                                isCurrentlyActive(unit.startDate, unit.endDate)
                                    ? "bg-emerald-50/40"
                                    : "bg-white"
                            )}
                        >
                            <td className="px-6 py-5 align-top">
                                <div className="flex flex-col gap-1 text-sm text-slate-700">
                                    <span className="font-medium">
                                        {formatDateRange(unit.startDate, unit.endDate)}
                                    </span>
                                    {(unit.summativeDate || unit.assessingDate) && (
                                        <div className="text-xs text-slate-500 flex flex-col gap-0.5">
                                            {unit.summativeDate && (
                                                <span>Summ: {formatShortDate(unit.summativeDate)}</span>
                                            )}
                                            {unit.assessingDate && (
                                                <span>Assess: {formatShortDate(unit.assessingDate)}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </td>

                            <td className="px-6 py-5 align-top">
                                <div className="flex flex-col gap-1">
                                    <span className="font-mono text-xs text-slate-500">{code}</span>
                                    <span className="font-medium text-sm text-slate-900 whitespace-normal">
                                        {unit.title}
                                    </span>
                                </div>
                            </td>

                            <td className="px-6 py-5 align-top text-center">
                                <div className="font-bold text-slate-900">{unit.credits}</div>
                                <div className="text-xs text-slate-400">cr</div>
                            </td>

                            <td className="px-6 py-5 align-top text-center">
                                <button
                                    type="button"
                                    onClick={() => onToggleRow(rowKey)}
                                    className="w-full flex justify-center"
                                >
                                    <StatusPill status={status} />
                                </button>
                            </td>
                        </tr>

                        {isOpen && (
                            <tr>
                                <td colSpan={4} className="bg-white">
                                    <InlineMarkingPanel
                                        rowKey={rowKey}
                                        unit={unit}
                                        module={module}
                                        students={students}
                                        assessmentIndex={assessmentIndex}
                                        onToggleAssessment={onToggleAssessment}
                                        onBulkPass={onBulkPass}
                                        isWorkplaceActivity={false}
                                        hasWorkplace={hasWorkplace}
                                        unitStandardId={resolvedUnitId}
                                        onClose={() => onToggleRow(rowKey)}
                                    />
                                </td>
                            </tr>
                        )}
                    </Fragment>
                );
            })}

            {hasWorkplace && (
                <>
                    <tr className="bg-amber-50 border-b border-amber-100 border-l-4 border-l-amber-400">
                        <td className="px-6 py-5 align-top text-sm font-semibold text-amber-900">
                            {formatDateRange(resolvedWorkplaceStart, resolvedWorkplaceEnd)}
                        </td>
                        <td className="px-6 py-5 align-top">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                                    Workplace Activity
                                </span>
                                <span className="text-sm font-medium text-amber-900 whitespace-normal">
                                    {resolvedWorkplaceLabel}
                                </span>
                            </div>
                        </td>
                        <td className="px-6 py-5 align-top text-center">
                            <div className="font-bold text-amber-900">-</div>
                            <div className="text-xs text-amber-700/70">module</div>
                        </td>
                        <td className="px-6 py-5 align-top text-center">
                            <button
                                type="button"
                                onClick={() => onToggleRow(`workplace:${moduleNumber}`)}
                                className="w-full flex justify-center"
                            >
                                <StatusPill status={getWorkplaceStatus()} />
                            </button>
                        </td>
                    </tr>

                    {openRowKey === `workplace:${moduleNumber}` && (
                        <tr>
                            <td colSpan={4} className="bg-white">
                                <InlineMarkingPanel
                                    rowKey={`workplace:${moduleNumber}`}
                                    module={module}
                                    students={students}
                                    assessmentIndex={assessmentIndex}
                                    onToggleAssessment={onToggleAssessment}
                                    onBulkPass={onBulkPass}
                                    isWorkplaceActivity
                                    hasWorkplace
                                    unitStandardId={workplaceAnchorUnitId}
                                    onClose={() => onToggleRow(`workplace:${moduleNumber}`)}
                                />
                            </td>
                        </tr>
                    )}
                </>
            )}
        </>
    );
}

function InlineMarkingPanel({
    rowKey,
    unit,
    module,
    students,
    assessmentIndex,
    onToggleAssessment,
    onBulkPass,
    isWorkplaceActivity,
    hasWorkplace,
    unitStandardId,
    onClose,
}: {
    rowKey: string;
    unit?: any;
    module: any;
    students: any[];
    assessmentIndex: Map<string, any>;
    onToggleAssessment: (studentId: string, unitStandardId: string, type: AssessmentType, targetResult: 'COMPETENT' | 'NOT_YET_COMPETENT') => void;
    onBulkPass: (unitStandardId: string, assessmentType: AssessmentType, studentIds: string[]) => void;
    isWorkplaceActivity: boolean;
    hasWorkplace: boolean;
    unitStandardId?: string;
    onClose: () => void;
}) {
    const [activeTab, setActiveTab] = useState<AssessmentType>(
        isWorkplaceActivity ? 'WORKPLACE' : 'FORMATIVE'
    );

    useEffect(() => {
        setActiveTab(isWorkplaceActivity ? 'WORKPLACE' : 'FORMATIVE');
    }, [isWorkplaceActivity, rowKey]);

    const moduleName = module?.moduleName || module?.name || `Module ${module?.moduleNumber || ''}`;

    const getResult = (studentId: string, type: AssessmentType) => {
        if (!unitStandardId) return 'PENDING';
        const key = `${studentId}|${unitStandardId}|${type}`;
        return assessmentIndex.get(key)?.result || 'PENDING';
    };

    const completionCounts = useMemo(() => {
        const total = students.length;
        const formative = students.filter((student) => getResult(student.id, 'FORMATIVE') === 'COMPETENT').length;
        const summative = students.filter((student) => getResult(student.id, 'SUMMATIVE') === 'COMPETENT').length;
        const workplace = students.filter((student) => getResult(student.id, 'WORKPLACE') === 'COMPETENT').length;

        return { total, formative, summative, workplace };
    }, [students, unitStandardId, assessmentIndex]);

    const canShowWorkplace = isWorkplaceActivity || hasWorkplace;

    return (
        <div className="border-t border-slate-200 px-6 py-5 bg-slate-50">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                    {isWorkplaceActivity ? (
                        <>
                            <div className="text-sm font-semibold text-slate-900">
                                Workplace Activity - {moduleName}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                                This is the module-level workplace collection assessment covering all unit standards in Module {module?.moduleNumber || ''}.
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                                Mark each student's overall workplace assessment here.
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="text-sm font-semibold text-slate-900">
                                {unit?.code || unit?.id} - {unit?.title}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                                {unit?.credits} credits - Level {unit?.level}
                            </div>
                        </>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                    Collapse
                    <ChevronUp className="w-4 h-4" />
                </button>
            </div>

            {!isWorkplaceActivity && (
                <div className="flex flex-wrap gap-2 mt-4">
                    {(['FORMATIVE', 'SUMMATIVE', 'WORKPLACE'] as AssessmentType[]).map((tab) => {
                        const isDisabled = tab === 'WORKPLACE' && !canShowWorkplace;
                        return (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => !isDisabled && setActiveTab(tab)}
                                disabled={isDisabled}
                                className={cn(
                                    "px-3 py-2 rounded-lg text-xs font-semibold transition-all",
                                    activeTab === tab
                                        ? "bg-slate-900 text-white"
                                        : "bg-white text-slate-600 border border-slate-200",
                                    isDisabled && "opacity-40 cursor-not-allowed"
                                )}
                            >
                                {tab}
                            </button>
                        );
                    })}
                </div>
            )}

            {isWorkplaceActivity && (
                <div className="flex flex-wrap gap-2 mt-4">
                    <span className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white">
                        WORKPLACE
                    </span>
                </div>
            )}

            <div className="mt-4 bg-white border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <div className="text-sm font-semibold text-slate-700">Student Marking</div>
                    <button
                        type="button"
                        onClick={() => unitStandardId && onBulkPass(unitStandardId, activeTab, students.map((s) => s.id))}
                        disabled={!unitStandardId || students.length === 0}
                        className="px-3 py-1.5 text-xs font-semibold border border-green-600 text-green-700 rounded-lg hover:bg-green-50 disabled:opacity-50"
                    >
                        ✓ Mark All as Passed
                    </button>
                </div>

                <div className="divide-y divide-slate-100">
                    {students.map((student: any) => {
                        const result = getResult(student.id, activeTab);
                        return (
                            <div key={student.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
                                            result === 'COMPETENT'
                                                ? 'bg-green-100 text-green-700'
                                                : result === 'NOT_YET_COMPETENT'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-gray-100 text-gray-500'
                                        )}
                                    >
                                        {result === 'COMPETENT' ? 'Passed' : result === 'NOT_YET_COMPETENT' ? 'Failed' : 'Not marked'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => unitStandardId && onToggleAssessment(student.id, unitStandardId, activeTab, 'COMPETENT')}
                                        className={cn(
                                            "px-3 py-1.5 rounded text-xs font-semibold border-2 transition-all",
                                            result === 'COMPETENT'
                                                ? 'bg-green-600 text-white border-green-600'
                                                : 'bg-white text-gray-500 border-gray-300'
                                        )}
                                    >
                                        ✓
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => unitStandardId && onToggleAssessment(student.id, unitStandardId, activeTab, 'NOT_YET_COMPETENT')}
                                        className={cn(
                                            "px-3 py-1.5 rounded text-xs font-semibold border-2 transition-all",
                                            result === 'NOT_YET_COMPETENT'
                                                ? 'bg-red-600 text-white border-red-600'
                                                : 'bg-white text-gray-500 border-gray-300'
                                        )}
                                    >
                                        ✗
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="text-xs text-slate-500 mt-3">
                {isWorkplaceActivity
                    ? `Workplace: ${completionCounts.workplace}/${completionCounts.total} Passed`
                    : `Formative: ${completionCounts.formative}/${completionCounts.total} Passed | Summative: ${completionCounts.summative}/${completionCounts.total} Passed | Workplace: ${completionCounts.workplace}/${completionCounts.total} Passed`}
            </div>
        </div>
    );
}

function StatusPill({ status }: { status: string }) {
    const styles: Record<string, string> = {
        COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        IN_PROGRESS: 'bg-amber-100 text-amber-800 border-amber-200',
        OVERDUE: 'bg-red-100 text-red-700 border-red-200',
        NOT_STARTED: 'bg-slate-100 text-slate-600 border-slate-200',
        REQUIRED: 'bg-amber-100 text-amber-800 border-amber-200',
    };

    const labelMap: Record<string, string> = {
        COMPLETED: 'COMPLETED',
        IN_PROGRESS: 'IN PROGRESS',
        OVERDUE: 'OVERDUE',
        NOT_STARTED: 'NOT STARTED',
        REQUIRED: 'REQUIRED',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border',
                styles[status] || styles.NOT_STARTED
            )}
        >
            {labelMap[status] || labelMap.NOT_STARTED}
        </span>
    );
}

function parsePlanDate(value: string): Date | null {
    if (!value) return null;
    if (value.includes('-')) {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    if (value.includes('/')) {
        const [day, month, year] = value.split('/').map((part) => Number(part));
        if (!day || !month || !year) return null;
        return new Date(year, month - 1, day);
    }
    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function normalizeDate(date: Date): Date {
    const normalized = new Date(date.getTime());
    normalized.setHours(0, 0, 0, 0);
    return normalized;
}

function formatPlanDate(date: Date): string {
    return format(date, 'dd/MM/yyyy');
}

function isWorkingDay(date: Date): boolean {
    const day = date.getDay();
    return day !== 0 && day !== 6;
}

function addWorkingDays(date: Date, days: number): Date {
    const result = new Date(date.getTime());
    let remaining = days;
    const step = days >= 0 ? 1 : -1;

    while (remaining !== 0) {
        result.setDate(result.getDate() + step);
        if (isWorkingDay(result)) {
            remaining -= step;
        }
    }

    return result;
}

function nextMonday(date: Date): Date {
    const result = new Date(date.getTime());
    result.setDate(result.getDate() + 1);
    while (result.getDay() !== 1 || !isWorkingDay(result)) {
        result.setDate(result.getDate() + 1);
    }
    return result;
}

function deriveWorkplaceActivity(units: any[]) {
    const dates = units
        .map((unit) => parsePlanDate(unit.assessingDate || unit.summativeDate || unit.endDate || ''))
        .filter((value): value is Date => Boolean(value));

    if (dates.length === 0) return null;

    const lastAssessing = dates.reduce((latest, current) => (current > latest ? current : latest), dates[0]);
    const workplaceStart = nextMonday(lastAssessing);
    const workplaceEnd = addWorkingDays(workplaceStart, 9);

    return {
        startDate: formatPlanDate(workplaceStart),
        endDate: formatPlanDate(workplaceEnd),
        label: `Workplace Activity - (${format(workplaceStart, 'dd MMM')} - ${format(workplaceEnd, 'dd MMM yyyy')})`,
    };
}

function formatShortDate(value: string): string {
    const parsed = parsePlanDate(value);
    return parsed ? format(parsed, 'dd MMM') : value;
}

function formatDateRange(start?: string | null, end?: string | null): string {
    const startDate = start ? parsePlanDate(start) : null;
    const endDate = end ? parsePlanDate(end) : null;
    if (startDate && endDate) {
        return `${format(startDate, 'dd MMM')} - ${format(endDate, 'dd MMM yyyy')}`;
    }
    if (startDate) {
        return format(startDate, 'dd MMM yyyy');
    }
    if (endDate) {
        return format(endDate, 'dd MMM yyyy');
    }
    return '-';
}
