'use client';

import { useState, useEffect } from 'react';
import {
    Bell,
    CheckCircle2,
    Clock,
    AlertCircle,
    BookOpen,
    ChevronRight,
    Calendar,
    MoreVertical,
    Check
} from 'lucide-react';
import { format } from 'date-fns';

interface TeachingTask {
    id: string;
    unitStandard: {
        code: string;
        title: string;
        module: {
            moduleNumber: number;
        };
    };
    startDate: string;
    endDate: string;
}

interface TeachingNotificationsProps {
    groupId?: string;
}

export default function TeachingNotifications({ groupId }: TeachingNotificationsProps) {
    const [tasks, setTasks] = useState<{
        todayUnits: TeachingTask[];
        overdueUnits: TeachingTask[];
        upcomingUnits: TeachingTask[];
        manualTasks: any[];
    } | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchTasks = async () => {
        try {
            // If no groupId, fetch all tasks for the facilitator
            const url = groupId
                ? `/api/facilitator/checklist?groupId=${groupId}`
                : `/api/facilitator/checklist`;

            const res = await fetch(url, { credentials: 'include' });
            const data = await res.json();
            if (data.success) {
                setTasks(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch teaching tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [groupId]);

    const markDone = async (rolloutId: string) => {
        try {
            const res = await fetch('/api/facilitator/checklist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rolloutId, facilitated: true }),
            });
            if (res.ok) {
                fetchTasks();
            }
        } catch (err) {
            console.error('Failed to mark task as done:', err);
        }
    };

    if (loading) return (
        <div className="animate-pulse bg-white dark:bg-slate-800 rounded-xl p-6 h-48 flex items-center justify-center">
            <Clock className="w-6 h-6 text-slate-300 animate-spin" />
        </div>
    );

    const hasTasks = tasks && (tasks.todayUnits.length > 0 || tasks.overdueUnits.length > 0);

    if (!hasTasks) return null;

    return (
        <div className="space-y-4">
            {/* TODAY'S TEACHING */}
            {tasks.todayUnits.map((task) => (
                <div key={task.id} className="relative overflow-hidden bg-white dark:bg-slate-800 border border-teal-100 dark:border-teal-900/30 rounded-xl shadow-sm">
                    <div className="absolute top-0 left-0 w-1 h-full bg-teal-500" />
                    <div className="p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                                    <BookOpen className="w-3 h-3" />
                                    Currently Facilitating - Module {task.unitStandard.module.moduleNumber}
                                </div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                                    Teaching: {task.unitStandard.code}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">
                                    {task.unitStandard.title}
                                </p>
                            </div>
                            <button
                                onClick={() => markDone(task.id)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400 rounded-lg border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition-colors text-xs font-bold"
                            >
                                <Check className="w-3.5 h-3.5" />
                                Mark Done
                            </button>
                        </div>

                        <div className="mt-4 flex items-center gap-4 text-[10px] text-slate-500 font-medium border-t border-slate-50 dark:border-slate-700/50 pt-3">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" />
                                Due: {format(new Date(task.endDate), 'EEE, dd MMM')}
                            </div>
                            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                                <AlertCircle className="w-3 h-3" />
                                Check if ready before session
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* OVERDUE REMINDERS */}
            {tasks.overdueUnits.map((task) => (
                <div key={task.id} className="relative overflow-hidden bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-xl">
                    <div className="p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                                <Bell className="w-4 h-4 animate-bounce" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-rose-900 dark:text-rose-100">Did you finish {task.unitStandard.code}?</p>
                                <p className="text-[10px] text-rose-600 dark:text-rose-400">This was due on {format(new Date(task.endDate), 'dd MMM')}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => markDone(task.id)}
                            className="text-[10px] font-bold text-rose-700 dark:text-rose-300 hover:underline"
                        >
                            Mark Done
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
