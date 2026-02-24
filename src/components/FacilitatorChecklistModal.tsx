"use client";

import React, { useState, useEffect } from 'react';
import {
    CheckCircle2,
    Circle,
    Calendar,
    Clock,
    Plus,
    AlertCircle,
    ChevronRight,
    BookOpen,
    MessageSquare,
    History,
    Save,
    X
} from 'lucide-react';
import { format } from 'date-fns';

interface FacilitatorChecklistModalProps {
    groupId: string;
    groupName: string;
    onClose: () => void;
    onUpdate?: () => void;
}

export default function FacilitatorChecklistModal({ groupId, groupName, onClose, onUpdate }: FacilitatorChecklistModalProps) {
    const [tasks, setTasks] = useState<any[]>([]);
    const [manualTasks, setManualTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'checklist' | 'tasks' | 'history'>('checklist');
    const [submitting, setSubmitting] = useState<string | null>(null);
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: format(new Date(), 'yyyy-MM-dd') });
    const [error, setError] = useState<string | null>(null);

    const fetchChecklist = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`/api/facilitator/checklist?groupId=${groupId}`, { credentials: 'include' });
            const data = await res.json();

            if (data.success && data.data) {
                // Flatten the checklist groups (overdue, today, upcoming) for a master list
                // Using defensive checks for both naming conventions
                const overdue = data.data.overdue || data.data.overdueUnits || [];
                const today = data.data.today || data.data.todayUnits || [];
                const upcoming = data.data.upcoming || data.data.upcomingUnits || [];

                const allRollouts = [
                    ...overdue.map((r: any) => ({ ...r, status: 'overdue' })),
                    ...today.map((r: any) => ({ ...r, status: 'today' })),
                    ...upcoming.map((r: any) => ({ ...r, status: 'upcoming' }))
                ];
                setTasks(allRollouts);
                setManualTasks(data.data.manualTasks || []);

                console.log(`[ChecklistModal] Loaded ${allRollouts.length} tasks for ${groupId}`);
            } else {
                setError(data.error || 'Failed to fetch data');
                console.error(`[ChecklistModal] API Error for ${groupId}:`, data.error);
            }
        } catch (err) {
            setError('An error occurred while fetching data');
            console.error(`[ChecklistModal] Fetch Error for ${groupId}:`, err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (groupId) {
            fetchChecklist();
        }
    }, [groupId]);

    const markDone = async (rolloutId: string, notes?: string) => {
        setSubmitting(rolloutId);
        try {
            const res = await fetch('/api/facilitator/checklist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rolloutId, facilitated: true, notes }),
            });
            if (res.ok) {
                await fetchChecklist();
                if (onUpdate) onUpdate();
            }
        } catch (err) {
            console.error('Error marking task done:', err);
        } finally {
            setSubmitting(null);
        }
    };

    const addTask = async () => {
        if (!newTask.title) return;
        setLoading(true);
        try {
            const res = await fetch('/api/facilitator/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newTask, groupId }),
            });
            if (res.ok) {
                setNewTask({ title: '', description: '', dueDate: format(new Date(), 'yyyy-MM-dd') });
                setShowTaskForm(false);
                await fetchChecklist();
            }
        } catch (err) {
            console.error('Error adding task:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleManualTask = async (taskId: string, currentStatus: string) => {
        const nextStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
        setSubmitting(taskId);
        try {
            const res = await fetch('/api/facilitator/tasks', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId, status: nextStatus }),
            });
            if (res.ok) {
                await fetchChecklist();
            }
        } catch (err) {
            console.error('Error toggling task:', err);
        } finally {
            setSubmitting(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-900/10">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-emerald-600" />
                            Facilitator Checklist
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            Tracking progress for <span className="font-semibold text-emerald-700 dark:text-emerald-400">{groupName}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-slate-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-white dark:bg-slate-900">
                    <button
                        onClick={() => setActiveTab('checklist')}
                        className={`py-4 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'checklist'
                            ? 'border-emerald-600 text-emerald-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Unit Standard Checklist
                    </button>
                    <button
                        onClick={() => setActiveTab('tasks')}
                        className={`py-4 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'tasks'
                            ? 'border-emerald-600 text-emerald-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Reminders & Tasks
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`py-4 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'history'
                            ? 'border-emerald-600 text-emerald-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        History & Logs
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950/50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4">
                            <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin"></div>
                            <p className="text-slate-500 font-medium">Loading items...</p>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'checklist' && (
                                <div className="space-y-6">
                                    {/* Master List of Unit Standards */}
                                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                            <h3 className="font-bold text-slate-900 dark:text-white">Curriculum Rollout</h3>
                                        </div>
                                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {tasks.length > 0 ? (
                                                tasks.map((task) => (
                                                    <div key={task.id} className="p-4 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                        <button
                                                            disabled={submitting === task.id || task.facilitated}
                                                            onClick={() => markDone(task.id)}
                                                            className={`mt-1 flex-shrink-0 transition-all ${task.facilitated
                                                                ? 'text-emerald-500 scale-110'
                                                                : 'text-slate-300 dark:text-slate-700 hover:text-emerald-500'
                                                                }`}
                                                        >
                                                            {task.facilitated ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                                                        </button>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-bold text-slate-900 dark:text-white truncate">
                                                                    {task.unitStandard?.title || 'Unknown Unit'}
                                                                </span>
                                                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded uppercase">
                                                                    US {task.unitStandard?.code}
                                                                </span>
                                                                {task.status === 'overdue' && !task.facilitated && (
                                                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded">OVERDUE</span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                                {task.unitStandard?.module?.name} • {task.unitStandard?.credits} Credits
                                                            </p>
                                                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-500">
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-3.5 h-3.5" />
                                                                    {task.startDate ? format(new Date(task.startDate), 'dd MMM yyyy') : 'No date'}
                                                                </span>
                                                                {task.facilitatedAt && (
                                                                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-500 font-medium">
                                                                        <Clock className="w-3.5 h-3.5" />
                                                                        Completed: {format(new Date(task.facilitatedAt), 'dd MMM')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button className="p-2 text-slate-400 hover:text-emerald-500 transition-colors">
                                                            <MessageSquare className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-12 text-center">
                                                    <BookOpen className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                                                    <p className="text-slate-500">No unit standards in the rollout plan yet.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'tasks' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-bold text-slate-900 dark:text-white">Active Reminders</h3>
                                        <button
                                            onClick={() => setShowTaskForm(!showTaskForm)}
                                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 transition-all shadow-sm"
                                        >
                                            <Plus className="w-4 h-4" />
                                            {showTaskForm ? 'Cancel' : 'Add Reminder'}
                                        </button>
                                    </div>

                                    {showTaskForm && (
                                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-lg animate-in fade-in slide-in-from-top-4">
                                            <h4 className="font-bold text-slate-900 dark:text-white mb-4">Create New Reminder</h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                                                    <input
                                                        type="text"
                                                        value={newTask.title}
                                                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                                        placeholder="e.g., Prepare training materials"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description (Optional)</label>
                                                    <textarea
                                                        value={newTask.description}
                                                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none h-20"
                                                        placeholder="Additional details..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Due Date</label>
                                                    <input
                                                        type="date"
                                                        value={newTask.dueDate}
                                                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                                    />
                                                </div>
                                                <button
                                                    onClick={addTask}
                                                    className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Save className="w-5 h-5" />
                                                    Save Reminder
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {manualTasks.length > 0 ? (
                                        <div className="grid gap-3">
                                            {manualTasks.map((mtask) => (
                                                <div key={mtask.id} className={`bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4 transition-all ${mtask.status === 'COMPLETED' ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                                    <button
                                                        disabled={submitting === mtask.id}
                                                        onClick={() => toggleManualTask(mtask.id, mtask.status)}
                                                        className={`mt-0.5 transition-colors ${mtask.status === 'COMPLETED' ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700 hover:text-emerald-500'}`}
                                                    >
                                                        {mtask.status === 'COMPLETED' ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                                    </button>
                                                    <div className="flex-1">
                                                        <h4 className={`font-bold ${mtask.status === 'COMPLETED' ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>{mtask.title}</h4>
                                                        {mtask.description && <p className="text-sm text-slate-500 mt-1">{mtask.description}</p>}
                                                        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {mtask.status === 'COMPLETED' ? `Completed: ${format(new Date(mtask.completedAt || new Date()), 'dd MMM')}` : `Due: ${format(new Date(mtask.dueDate), 'dd MMM yyyy')}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
                                            <Clock className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                                            <p className="text-slate-500 font-medium">No manual reminders set for this group.</p>
                                            <p className="text-sm text-slate-400 mt-1">Use reminders for prep work, meetings, or field visits.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'history' && (
                                <div className="space-y-4">
                                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                                        <History className="w-5 h-5 text-indigo-500" />
                                        Facilitation Log
                                    </h3>

                                    <div className="space-y-4">
                                        {tasks.filter(t => t.facilitated).length > 0 ? (
                                            tasks.filter(t => t.facilitated).sort((a, b) => new Date(b.facilitatedAt || 0).getTime() - new Date(a.facilitatedAt || 0).getTime()).map((task) => (
                                                <div key={task.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border-l-4 border-l-emerald-500 shadow-sm">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="font-bold text-slate-900 dark:text-white">{task.unitStandard?.title}</span>
                                                        <span className="text-xs font-medium text-slate-500">
                                                            {task.facilitatedAt ? format(new Date(task.facilitatedAt), 'dd MMM yyyy HH:mm') : ''}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                                                        {task.facilitatorNotes || "No notes recorded for this facilitator task."}
                                                    </p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-12">
                                                <p className="text-slate-400">No facilitated units in the log yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                        Close Checklist
                    </button>
                </div>
            </div>
        </div>
    );
}
