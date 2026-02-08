'use client';

import React, { useState } from 'react';
import {
    ChevronDown,
    ChevronRight,
    Calendar,
    CheckCircle2,
    AlertCircle,
    Clock,
    BookOpen,
    ClipboardCheck,
    Briefcase
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Lesson {
    id: string;
    title: string;
    date: string;
    type?: string;
}

interface USRollout {
    id: string;
    unitStandard: {
        code: string;
        title: string;
        credits: number;
        moduleId: string;
    };
    startDate: string | null;
    endDate: string | null;
    summativeDate: string | null;
    assessingDate: string | null;
    lessons?: Lesson[];
}

interface RolloutTableProps {
    rollouts: USRollout[];
    lessons: Lesson[];
}

export default function GranularRolloutTable({ rollouts, lessons }: RolloutTableProps) {
    const [expandedUS, setExpandedUS] = useState<string | null>(null);

    // Group rollouts by Module (using moduleId as a proxy for now)
    const sortedRollouts = [...rollouts].sort((a, b) => {
        if (a.startDate && b.startDate) {
            return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        }
        return 0;
    });

    return (
        <div className="w-full bg-white rounded-2xl shadow-premium border border-slate-200 overflow-hidden noise-texture">
            <div className="bg-slate-950 text-white p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/5">
                <h2 className="text-xl font-bold flex items-center gap-3 tracking-tighter font-display">
                    <BookOpen className="w-6 h-6 text-emerald-400" />
                    Implementation Plan – <span className="text-emerald-400/90 italic font-medium ml-1">NVC Learnership</span>
                </h2>
                <div className="flex gap-6 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                        <span>Teaching</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                        <span>Summative</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                        <span>Workplace</span>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-main">
                    <thead>
                        <tr className="bg-slate-50/50 text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 border-b border-slate-200">
                            <th className="px-6 py-4 w-36 border-r border-slate-100">Start Date</th>
                            <th className="px-6 py-4 w-36 border-r border-slate-100">End Date</th>
                            <th className="px-6 py-4 w-36 border-r border-slate-100 text-amber-700/80">Summative</th>
                            <th className="px-6 py-4 w-36 border-r border-slate-100 text-blue-700/80">Assessing</th>
                            <th className="px-6 py-4 w-24 border-r border-slate-100 text-center">US</th>
                            <th className="px-6 py-4">Unit Standard Title</th>
                            <th className="px-6 py-4 w-24 text-center">Credits</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRollouts.map((rollout) => {
                            const isExpanded = expandedUS === rollout.id;
                            const usLessons = lessons.filter(l => {
                                const lDate = new Date(l.date);
                                const sDate = rollout.startDate ? new Date(rollout.startDate) : null;
                                const eDate = rollout.endDate ? new Date(rollout.endDate) : null;
                                const sumDate = rollout.summativeDate ? new Date(rollout.summativeDate) : null;

                                if (sDate && eDate && lDate >= sDate && lDate <= eDate) return true;
                                if (sumDate && lDate.toDateString() === sumDate.toDateString()) return true;
                                return false;
                            });

                            return (
                                <React.Fragment key={rollout.id}>
                                    <tr
                                        onClick={() => setExpandedUS(isExpanded ? null : rollout.id)}
                                        className={cn(
                                            "border-b border-slate-100 hover:bg-slate-50/80 cursor-pointer transition-all duration-300 group",
                                            isExpanded ? "bg-emerald-50/40 shadow-[inset_4px_0_0_0_#10b981]" : ""
                                        )}
                                    >
                                        <td className="px-6 py-5 text-[13px] font-medium text-slate-500 border-r border-slate-50">
                                            {rollout.startDate ? format(new Date(rollout.startDate), 'dd MMM yyyy') : '—'}
                                        </td>
                                        <td className="px-6 py-5 text-[13px] font-medium text-slate-500 border-r border-slate-50">
                                            {rollout.endDate ? format(new Date(rollout.endDate), 'dd MMM yyyy') : '—'}
                                        </td>
                                        <td className="px-6 py-5 text-[13px] font-bold text-amber-600 border-r border-slate-50 bg-amber-50/30">
                                            {rollout.summativeDate ? format(new Date(rollout.summativeDate), 'dd MMM yyyy') : '—'}
                                        </td>
                                        <td className="px-6 py-5 text-[13px] font-bold text-blue-600 border-r border-slate-50 bg-blue-50/30">
                                            {rollout.assessingDate ? format(new Date(rollout.assessingDate), 'dd MMM yyyy') : '—'}
                                        </td>
                                        <td className="px-6 py-5 text-[13px] font-black text-slate-800 border-r border-slate-50 text-center tracking-tighter">
                                            {rollout.unitStandard.code}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-300",
                                                    isExpanded ? "bg-emerald-500 text-white rotate-90" : "bg-slate-100 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600"
                                                )}>
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </div>
                                                <span className={cn(
                                                    "text-[14px] font-semibold tracking-tight transition-colors duration-300",
                                                    isExpanded ? "text-slate-900" : "text-slate-700 group-hover:text-slate-950"
                                                )}>
                                                    {rollout.unitStandard.title}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-[14px] font-black text-slate-400 text-center">
                                            {rollout.unitStandard.credits}
                                        </td>
                                    </tr>

                                    {isExpanded && (
                                        <tr>
                                            <td colSpan={7} className="p-0 bg-slate-50/50">
                                                <div className="py-8 pl-16 pr-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500 ease-out">
                                                    <div className="flex items-center justify-between">
                                                        <div className="space-y-1">
                                                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Roadmap Strategy</h4>
                                                            <p className="text-[13px] text-slate-500 font-medium">Daily lesson activities and milestone assessments</p>
                                                        </div>
                                                        <div className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-bold text-emerald-700 uppercase tracking-widest cursor-default">
                                                            {usLessons.length} Operational Days
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                                        {usLessons.length === 0 ? (
                                                            <div className="col-span-full py-12 text-center text-slate-400 text-sm italic border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
                                                                No strategic data generated. Execute "Smart Build" to synchronize.
                                                            </div>
                                                        ) : (
                                                            usLessons.map((lesson) => (
                                                                <div
                                                                    key={lesson.id}
                                                                    className={cn(
                                                                        "p-5 rounded-2xl border transition-all duration-300 group/card",
                                                                        lesson.title.includes('SUMMATIVE')
                                                                            ? "bg-amber-50 shadow-sm border-amber-200 hover:shadow-amber-200/20"
                                                                            : "bg-white border-slate-200 hover:shadow-xl hover:shadow-slate-200/40 hover:-translate-y-1"
                                                                    )}
                                                                >
                                                                    <div className="flex items-start justify-between mb-4">
                                                                        <div className="space-y-1">
                                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                                                {format(new Date(lesson.date), 'EEEE')}
                                                                            </span>
                                                                            <p className="text-[12px] font-bold text-slate-500">
                                                                                {format(new Date(lesson.date), 'MMM dd, yyyy')}
                                                                            </p>
                                                                        </div>
                                                                        <div className={cn(
                                                                            "p-2 rounded-xl transition-colors duration-300",
                                                                            lesson.title.includes('SUMMATIVE') ? "bg-amber-100 text-amber-600" : "bg-emerald-50 text-emerald-600 group-hover/card:bg-emerald-600 group-hover/card:text-white"
                                                                        )}>
                                                                            {lesson.title.includes('SUMMATIVE') ? <ClipboardCheck className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                                                                        </div>
                                                                    </div>
                                                                    <h5 className={cn(
                                                                        "text-[14px] font-bold leading-snug mb-4",
                                                                        lesson.title.includes('SUMMATIVE') ? "text-amber-900" : "text-slate-900"
                                                                    )}>
                                                                        {lesson.title}
                                                                    </h5>
                                                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                                                        <span className={cn(
                                                                            "text-[9px] px-2 py-0.5 rounded-lg font-bold uppercase tracking-wider",
                                                                            lesson.title.includes('SUMMATIVE') ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                                                                        )}>
                                                                            {lesson.title.includes('SUMMATIVE') ? 'Summative' : 'Engagement'}
                                                                        </span>
                                                                        <button className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 transition-colors uppercase tracking-widest">
                                                                            Review File
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Workplace Integration Banner */}
            <div className="bg-slate-900 p-5 flex flex-col sm:flex-row items-center justify-center gap-6 border-t border-white/10 glass-effect">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                        <Briefcase className="w-5 h-5 shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                    </div>
                    <span className="text-[11px] font-black text-white uppercase tracking-[0.25em]">
                        Workplace Integration Phase
                    </span>
                </div>
                <div className="h-4 w-px bg-white/10 hidden sm:block"></div>
                <span className="text-[12px] font-medium text-emerald-400 capitalize italic">
                    Integrated Professional Assessment Period (Oct 10 – Oct 23, 2025)
                </span>
            </div>
        </div>
    );
}
