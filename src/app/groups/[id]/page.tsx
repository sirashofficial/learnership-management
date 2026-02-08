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
    Edit2,
    FileText
} from 'lucide-react';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { cn } from '../../../lib/utils';
import { calculateRolloutPlan } from '@/lib/rollout-utils';
import { RefreshCw, Save, Sparkles } from 'lucide-react';
import GranularRolloutTable from '@/components/GranularRolloutTable';

interface GroupDetailProps {
    params: {
        id: string;
    };
}

export default function GroupDetailPage({ params }: GroupDetailProps) {
    const router = useRouter();
    const [group, setGroup] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingLessons, setIsGeneratingLessons] = useState(false);

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

            if (response.ok) {
                const result = await response.json();
                alert(result.message);
                router.refresh();
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to generate lessons');
            }
        } catch (error) {
            console.error('Error generating lessons:', error);
            alert('An unexpected error occurred');
        } finally {
            setIsGeneratingLessons(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen bg-[#f8fafc] noise-texture">
                <Sidebar />
                <div className="flex-1 flex flex-col">
                    <Header />
                    <main className="flex-1 flex items-center justify-center">
                        <div className="animate-spin rounded-xl h-12 w-12 border-b-2 border-emerald-600"></div>
                    </main>
                </div>
            </div>
        );
    }

    if (!group) {
        return (
            <div className="flex min-h-screen bg-[#f8fafc] noise-texture">
                <Sidebar />
                <div className="flex-1 flex flex-col">
                    <Header />
                    <main className="flex-1 p-12 text-center">
                        <div className="max-w-md mx-auto card-premium p-12">
                            <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight mb-4">Infrastructure Error</h2>
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mb-8">Group identifier not found in registry</p>
                            <button
                                onClick={() => router.back()}
                                className="btn-slate w-full"
                            >
                                Revert to Previous State
                            </button>
                        </div>
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
        <div className="flex min-h-screen bg-[#f8fafc] noise-texture font-main">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header />

                <main className="flex-1 overflow-y-auto p-8 lg:p-12">
                    <div className="max-w-7xl mx-auto space-y-12">

                        {/* Immersive Header Banner */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 to-slate-900 rounded-[2.5rem] shadow-premium transform group-hover:scale-[1.01] transition-transform duration-500 overflow-hidden">
                                <div className="absolute inset-0 opacity-20 noise-texture" />
                                <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full" />
                            </div>

                            <div className="relative p-10 lg:p-14 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                <div className="flex items-center gap-8">
                                    <button
                                        onClick={() => router.back()}
                                        className="w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 transition-all text-white group/btn"
                                    >
                                        <ArrowLeft className="w-6 h-6 group-hover/btn:-translate-x-1 transition-transform" />
                                    </button>
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-emerald-500/20 rounded-lg backdrop-blur-md border border-emerald-500/20">
                                                <Building2 className="w-5 h-5 text-emerald-400" />
                                            </div>
                                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Operational Unit</span>
                                        </div>
                                        <h1 className="text-4xl lg:text-5xl font-black text-white font-display tracking-tighter leading-none mb-3">
                                            {group.name}
                                        </h1>
                                        <div className="flex items-center gap-6 text-slate-400 text-sm font-bold uppercase tracking-widest">
                                            <span className="flex items-center gap-2">
                                                <Users className="w-4 h-4" />
                                                {group._count?.students || 0} Students Allocated
                                            </span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                                            <span>{group.company?.name || 'Independent Registry'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {group.rolloutPlan && (
                                        <button
                                            onClick={handleGenerateLessons}
                                            disabled={isGeneratingLessons}
                                            className="btn-emerald px-8 h-16 relative overflow-hidden group/sparkle"
                                        >
                                            <div className="relative z-10 flex items-center gap-3">
                                                <Sparkles className={cn("w-5 h-5", isGeneratingLessons ? 'animate-spin' : 'group-hover/sparkle:rotate-12 transition-transform')} />
                                                <span className="text-base font-black tracking-tight">Generate Smart Lessons</span>
                                            </div>
                                            <div className="absolute top-0 right-0 p-1">
                                                <div className="bg-white text-emerald-950 text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-sm">AI POWERED</div>
                                            </div>
                                        </button>
                                    )}
                                    <button className="w-16 h-16 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center text-white transition-all">
                                        <MoreVertical className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Strategic Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                            {/* Roadmap Section - Spans 8 cols */}
                            <div className="lg:col-span-8 space-y-8">
                                <div className="flex items-center justify-between px-2">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight flex items-center gap-3">
                                            <Calendar className="w-6 h-6 text-emerald-600" />
                                            Curriculum Roadmap
                                        </h2>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                            Granular unit standard execution tracking
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleGenerateRollout}
                                        className="px-6 py-2.5 bg-white hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-600 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-emerald-200 hover:text-emerald-700 flex items-center gap-2"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        {group.rolloutPlan ? 'Resync Architecture' : 'Initialize Roadmap'}
                                    </button>
                                </div>

                                <div className="min-h-[400px]">
                                    {group.unitStandardRollouts?.length > 0 ? (
                                        <GranularRolloutTable
                                            rollouts={group.unitStandardRollouts}
                                            lessons={group.lessonPlans || []}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 shadow-sm text-center">
                                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                                                <Clock className="w-10 h-10 text-slate-200" />
                                            </div>
                                            <p className="text-slate-900 font-black font-display tracking-tight text-xl mb-2">Roadmap Pending</p>
                                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest max-w-[240px]">
                                                Initialize the management grid to track unit standard delivery
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Lateral Intelligence - Spans 4 cols */}
                            <div className="lg:col-span-4 space-y-8">

                                {/* Performance Telemetry */}
                                <div className="card-premium p-8 noise-texture">
                                    <h3 className="text-lg font-black text-slate-900 font-display tracking-tight mb-8">Performance Telemetry</h3>
                                    <div className="space-y-8">
                                        <div className="relative">
                                            <div className="flex justify-between items-end mb-3">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance Velocity</p>
                                                    <p className="text-2xl font-black text-emerald-600 tracking-tighter">87.4%</p>
                                                </div>
                                                <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">+2.1%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
                                                <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full shadow-lg shadow-emerald-500/20" style={{ width: '87%' }}></div>
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <div className="flex justify-between items-end mb-3">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assessment Saturation</p>
                                                    <p className="text-2xl font-black text-blue-600 tracking-tighter">45.0%</p>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">Target: 60%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
                                                <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-2 rounded-full shadow-lg shadow-blue-500/20" style={{ width: '45%' }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-10 p-5 bg-slate-900 rounded-[1.5rem] text-white">
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mb-2">Group Health Index</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                                                <CheckCircle2 className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-black tracking-tight leading-none mb-1 text-emerald-400">OPTIMAL</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Engagement at capacity</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Asset Registry */}
                                <div className="card-premium p-8 noise-texture">
                                    <h3 className="text-lg font-black text-slate-900 font-display tracking-tight mb-8">Asset Registry</h3>
                                    {group.rolloutPlan?.rolloutDocPath ? (
                                        <div className="group/item p-5 bg-white hover:bg-slate-50 rounded-[1.5rem] border border-slate-100 transition-all cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center group-hover/item:scale-110 transition-transform">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-black text-slate-900 truncate">
                                                        Master Rollout Strategy
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Verified PDF • 2.4MB</p>
                                                </div>
                                                <button className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline">Download</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                                <FileText className="w-6 h-6 text-slate-200" />
                                            </div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No assets cataloged</p>
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}
