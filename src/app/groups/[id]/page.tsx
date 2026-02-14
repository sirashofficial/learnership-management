'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
    Download
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { generateRolloutPlan } from '@/lib/rolloutPlanGenerator';
import { downloadRolloutDocx } from '@/lib/downloadRolloutDocx';
import { TodayClassesDashboard } from '@/components/TodayClassesDashboard';
import {
    extractRolloutPlan,
    formatDate,
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

export default function GroupDetailPage({ params }: GroupDetailProps) {
    const router = useRouter();
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

    const planSummary = rolloutPlan || extractRolloutPlan(group?.notes);

    // Derived stats
    const totalCredits = useMemo(() => getTotalCredits(planSummary), [planSummary]);
    const projectedDate = useMemo(() => getProjectedCompletionDate(planSummary), [planSummary]);
    const projectedVsActual = useMemo(() =>
        calculateProjectedVsActual(planSummary, assessmentStats.completedIds),
        [planSummary, assessmentStats.completedIds]
    );

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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{group.name}</h1>
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
                                                <th className="px-6 py-4 min-w-[140px]">Dates</th>
                                                <th className="px-6 py-4 min-w-[200px]">Module & Unit Standard</th>
                                                <th className="px-6 py-4 w-24 text-center">Credits</th>
                                                <th className="px-6 py-4 w-32 text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {planSummary.modules?.map((module: any, index: number) => (
                                                <ModuleSection
                                                    key={index}
                                                    module={module}
                                                    index={index}
                                                    statusMap={assessmentStats.statusMap}
                                                    router={router}
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
        </div>
    );
}

function ModuleSection({ module, index, statusMap, router }: { module: any, index: number, statusMap: any, router: any }) {
    const moduleNumber = module.moduleNumber ?? module.moduleIndex ?? index + 1;
    const moduleName = module.moduleName || `Module ${moduleNumber}`;
    const units = Array.isArray(module.unitStandards) ? module.unitStandards : [];

    const workplaceStart = module.workplaceActivity?.startDate || module.workplaceActivityStartDate;
    const workplaceEnd = module.workplaceActivity?.endDate || module.workplaceActivityEndDate;
    const hasWorkplace = !!workplaceStart;

    return (
        <>
            {/* Module Separator */}
            <tr className="bg-slate-50/50 border-b border-t border-slate-200">
                <td colSpan={4} className="px-6 py-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                            MODULE {moduleNumber}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            {moduleName}
                        </span>
                    </div>
                </td>
            </tr>

            {/* Unit Standards */}
            {units.map((unit: any) => {
                const isActive = isCurrentlyActive(unit.startDate, unit.endDate);
                const status = statusMap[unit.id] || 'not-started';

                return (
                    <tr
                        key={unit.id}
                        onClick={() => router.push(`/assessments?unitStandardId=${unit.id}`)}
                        className={cn(
                            "group cursor-pointer transition-all border-l-[4px] border-b border-slate-50",
                            isActive
                                ? "bg-emerald-50/50 border-l-emerald-500 hover:bg-emerald-100/50"
                                : "bg-white border-l-transparent hover:bg-slate-50 hover:border-l-slate-300"
                        )}
                    >
                        {/* Dates */}
                        <td className="px-6 py-4 align-top">
                            <div className="flex flex-col gap-1 text-xs">
                                <span className={cn("font-medium", isActive ? "text-emerald-900" : "text-slate-900")}>
                                    {unit.startDate} - {unit.endDate}
                                </span>
                                {(unit.summativeDate || unit.assessingDate) && (
                                    <div className="mt-1 text-slate-500 flex flex-col gap-0.5">
                                        {unit.summativeDate && <span>Summ: {unit.summativeDate}</span>}
                                        {unit.assessingDate && <span>Assess: {unit.assessingDate}</span>}
                                    </div>
                                )}
                            </div>
                        </td>

                        {/* Details */}
                        <td className="px-6 py-4 align-top">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-mono text-xs text-slate-500 min-w-[34px]">{unit.id}</span>
                                    <span className={cn("font-medium text-sm line-clamp-1", isActive ? "text-emerald-900" : "text-slate-900")}>
                                        {unit.title}
                                    </span>
                                </div>
                            </div>
                        </td>

                        {/* Credits */}
                        <td className="px-6 py-4 align-top text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                                {unit.credits}
                            </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 align-top text-center">
                            <StatusPill status={status} />
                        </td>
                    </tr>
                );
            })}

            {/* Workplace Activity */}
            {hasWorkplace && (
                <tr className="bg-amber-50 border-b border-amber-100 border-l-[4px] border-l-amber-400">
                    <td className="px-6 py-4 align-middle text-xs font-semibold text-amber-900" style={{ fontFamily: 'monospace' }}>
                        {formatDate(workplaceStart)} - {formatDate(workplaceEnd)}
                    </td>
                    <td colSpan={2} className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider border border-amber-200">
                                Workplace Activity
                            </span>
                            <span className="text-xs font-medium text-amber-900">
                                {module.workplaceActivity?.label || 'Workplace Experience Component'}
                            </span>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                        <span className="text-[10px] font-bold text-amber-700/60 uppercase">
                            Required
                        </span>
                    </td>
                </tr>
            )}
        </>
    );
}

function StatusPill({ status }: { status: string }) {
    switch (status) {
        case 'complete':
            return (
                <div className="flex justify-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Complete
                    </span>
                </div>
            );
        case 'summative-done':
            return (
                <div className="flex justify-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-purple-100 text-purple-800 border border-purple-200">
                        Summative Done
                    </span>
                </div>
            );
        case 'in-progress':
            return (
                <div className="flex justify-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-blue-100 text-blue-800 border border-blue-200">
                        In Progress
                    </span>
                </div>
            );
        default:
            return (
                <div className="flex justify-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-500 border border-slate-200">
                        Not Started
                    </span>
                </div>
            );
    }
}
