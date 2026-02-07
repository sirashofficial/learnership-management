'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import {
    ArrowLeft,
    Calendar,
    Users,
    Building2,
    Clock,
    CheckCircle2,
    AlertTriangle,
    MoreVertical,
    Edit2
} from 'lucide-react';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { calculateRolloutPlan } from '@/lib/rollout-utils';
import { RefreshCw, Save } from 'lucide-react';

interface GroupDetailProps {
    params: {
        id: string;
    };
}

export default function GroupDetailPage({ params }: GroupDetailProps) {
    const router = useRouter();
    const [group, setGroup] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchGroup = async () => {
            try {
                const response = await fetch(`/api/groups/${params.id}`);
                if (response.ok) {
                    const data = await response.json();
                    setGroup(data.data); // Assuming standardized response structure
                } else {
                    console.error('Failed to fetch group');
                }
            } catch (error) {
                console.error('Error fetching group:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (params.id) {
            fetchGroup();
        }
    }, [params.id]);

    const handleGenerateRollout = async () => {
        if (!group?.startDate) {
            alert('Group must have a start date to calculate rollout.');
            return;
        }

        const plan = calculateRolloutPlan(new Date(group.startDate));

        try {
            const rolloutData = {
                module1StartDate: plan[0].startDate,
                module1EndDate: plan[0].endDate,
                module2StartDate: plan[1].startDate,
                module2EndDate: plan[1].endDate,
                module3StartDate: plan[2].startDate,
                module3EndDate: plan[2].endDate,
                module4StartDate: plan[3].startDate,
                module4EndDate: plan[3].endDate,
                module5StartDate: plan[4].startDate,
                module5EndDate: plan[4].endDate,
                module6StartDate: plan[5].startDate,
                module6EndDate: plan[5].endDate,
            };

            const response = await fetch(`/api/groups/${params.id}/rollout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rolloutPlan: rolloutData }),
            });

            if (response.ok) {
                const updatedPlan = await response.json();
                setGroup({ ...group, rolloutPlan: updatedPlan.data });
                alert('Official Rollout Plan generated and saved!');
            } else {
                console.error('Failed to save rollout plan');
            }
        } catch (error) {
            console.error('Error saving rollout plan:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
                <Sidebar />
                <div className="flex-1 flex flex-col">
                    <Header />
                    <main className="flex-1 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                    </main>
                </div>
            </div>
        );
    }

    if (!group) {
        return (
            <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
                <Sidebar />
                <div className="flex-1 flex flex-col">
                    <Header />
                    <main className="flex-1 p-8 text-center">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Group not found</h2>
                        <button
                            onClick={() => router.back()}
                            className="mt-4 text-teal-600 hover:underline"
                        >
                            Go Back
                        </button>
                    </main>
                </div>
            </div>
        );
    }

    // Timeline Logic
    const modules = [
        { id: 1, name: 'Module 1: Numeracy', credits: 16, start: group.rolloutPlan?.module1StartDate, end: group.rolloutPlan?.module1EndDate },
        { id: 2, name: 'Module 2: Communication', credits: 24, start: group.rolloutPlan?.module2StartDate, end: group.rolloutPlan?.module2EndDate },
        { id: 3, name: 'Module 3: Market Requirements', credits: 22, start: group.rolloutPlan?.module3StartDate, end: group.rolloutPlan?.module3EndDate },
        { id: 4, name: 'Module 4: Sector & Industry', credits: 26, start: group.rolloutPlan?.module4StartDate, end: group.rolloutPlan?.module4EndDate },
        { id: 5, name: 'Module 5: Financial Management', credits: 23, start: group.rolloutPlan?.module5StartDate, end: group.rolloutPlan?.module5EndDate },
        { id: 6, name: 'Module 6: Business Operations', credits: 26, start: group.rolloutPlan?.module6StartDate, end: group.rolloutPlan?.module6EndDate },
    ];

    const today = new Date();

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header />

                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-5xl mx-auto space-y-6">

                        {/* Header */}
                        <div className="flex items-center gap-4 mb-6">
                            <button
                                onClick={() => router.back()}
                                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Building2 className="w-6 h-6 text-teal-600" />
                                    {group.name}
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {group.company?.name || 'No Company'} • {group._count?.students || 0} Students
                                </p>
                            </div>
                        </div>

                        {/* Timeline Section */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-indigo-500" />
                                        Rollout Timeline
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Module completion roadmap
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleGenerateRollout}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors border border-indigo-200"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        {group.rolloutPlan ? 'Recalculate Official' : 'Generate Official'}
                                    </button>
                                    {group.rolloutPlan && (
                                        <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold uppercase tracking-wide">
                                            Active Plan
                                        </span>
                                    )}
                                </div>
                            </div>

                            {!group.rolloutPlan ? (
                                <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                                    <Clock className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">No rollout plan assigned</p>
                                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                                        Contact coordinator to assign a rollout plan
                                    </p>
                                </div>
                            ) : (
                                <div className="relative border-l-2 border-indigo-200 dark:border-indigo-900 ml-4 space-y-8 py-2">
                                    {modules.map((mod, index) => {
                                        if (!mod.start || !mod.end) return null;

                                        const startDate = new Date(mod.start);
                                        const endDate = new Date(mod.end);
                                        const isActive = isAfter(today, startDate) && isBefore(today, endDate);
                                        const isCompleted = isAfter(today, endDate);
                                        const isUpcoming = isBefore(today, startDate);

                                        return (
                                            <div key={mod.id} className="relative pl-6">
                                                {/* Dot Indicator */}
                                                <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 ${isCompleted ? 'bg-emerald-500 border-emerald-500' :
                                                    isActive ? 'bg-indigo-500 border-indigo-500 animate-pulse' :
                                                        'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                                                    }`} />

                                                <div className={`p-4 rounded-lg border ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 shadow-sm' :
                                                    'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                                                    }`}>
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                        <div>
                                                            <h3 className={`font-semibold ${isActive ? 'text-indigo-700 dark:text-indigo-300' :
                                                                isCompleted ? 'text-emerald-700 dark:text-emerald-300' :
                                                                    'text-slate-700 dark:text-slate-300'
                                                                }`}>
                                                                {mod.name}
                                                            </h3>
                                                            <div className="flex items-center gap-4 mt-1">
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {format(startDate, 'MMM d, yyyy')} — {format(endDate, 'MMM d, yyyy')}
                                                                </p>
                                                                <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded font-medium">
                                                                    {mod.credits} Credits ({Math.ceil(mod.credits * 1.25)} Days)
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            {isActive && (
                                                                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">In Progress</span>
                                                            )}
                                                            {isCompleted && (
                                                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium flex items-center gap-1">
                                                                    <CheckCircle2 className="w-3 h-3" /> Completed
                                                                </span>
                                                            )}
                                                            {isUpcoming && (
                                                                <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs font-medium">Upcoming</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Quick Stats or Students Preview */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Group Performance</h3>
                                <div className="space-y-4">
                                    {/* Placeholder stats */}
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 dark:text-slate-400">Attendance Rate</span>
                                        <span className="font-bold text-slate-900 dark:text-white">87%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                                        <div className="bg-teal-500 h-2 rounded-full" style={{ width: '87%' }}></div>
                                    </div>

                                    <div className="flex justify-between items-center text-sm pt-2">
                                        <span className="text-slate-600 dark:text-slate-400">POE Submitted</span>
                                        <span className="font-bold text-slate-900 dark:text-white">45%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Documents</h3>
                                {group.rolloutPlan?.rolloutDocPath ? (
                                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                                        <div className="p-2 bg-red-100 text-red-600 rounded">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                                Associated Rollout Plan.pdf
                                            </p>
                                            <p className="text-xs text-slate-500">Document referenced in seed</p>
                                        </div>
                                        <button className="text-blue-600 text-xs font-medium hover:underline">View</button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500">No documents linked.</p>
                                )}
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}
