'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Circle, Clock, ArrowRight, AlertCircle } from 'lucide-react';

interface Module {
    id: string;
    moduleNumber: number;
    name: string;
    fullName: string;
    credits: number;
}

interface ModuleProgress {
    moduleId: string;
    moduleNumber: number;
    moduleName: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    creditsEarned: number;
    totalCredits: number;
    progress: number;
    unitStandardsCompleted: number;
    totalUnitStandards: number;
    startDate?: string;
    completionDate?: string;
}

interface ModuleProgressionPanelProps {
    studentId: string;
    onModuleChange?: () => void;
}

export default function ModuleProgressionPanel({ studentId, onModuleChange }: ModuleProgressionPanelProps) {
    const [modules, setModules] = useState<Module[]>([]);
    const [moduleProgress, setModuleProgress] = useState<ModuleProgress[]>([]);
    const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchProgress = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/students/${studentId}/progress`);
            const data = await response.json();

            setModuleProgress(data.moduleProgress || []);
            setCurrentModuleId(data.student?.currentModuleId || null);

            // Fetch modules if needed
            const modulesResponse = await fetch('/api/modules');
            const modulesData = await modulesResponse.json();
            setModules(modulesData.modules || []);

            setError('');
        } catch (err) {
            console.error('Error fetching progress:', err);
            setError('Failed to load module progression');
        } finally {
            setLoading(false);
        }
    }, [studentId]);

    useEffect(() => {
        fetchProgress();
    }, [fetchProgress]);

    const handleStartModule = async (moduleId: string) => {
        if (!confirm('Start this module? This will set it as the student\'s current module.')) {
            return;
        }

        setActionLoading(true);
        try {
            const response = await fetch(`/api/students/${studentId}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'START',
                    moduleId
                })
            });

            if (!response.ok) {
                throw new Error('Failed to start module');
            }

            await fetchProgress();
            if (onModuleChange) onModuleChange();
        } catch (err) {
            console.error('Error starting module:', err);
            alert('Failed to start module. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCompleteModule = async (moduleId: string) => {
        const moduleInfo = moduleProgress.find(m => m.moduleId === moduleId);

        if (!moduleInfo) return;

        // Validation
        if (moduleInfo.creditsEarned < moduleInfo.totalCredits) {
            alert(`Cannot complete module. Student has only earned ${moduleInfo.creditsEarned}/${moduleInfo.totalCredits} credits. All unit standards must be completed first.`);
            return;
        }

        if (!confirm(`Mark Module ${moduleInfo.moduleNumber}: ${moduleInfo.moduleName} as complete?`)) {
            return;
        }

        setActionLoading(true);
        try {
            const response = await fetch(`/api/students/${studentId}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'COMPLETE',
                    moduleId
                })
            });

            if (!response.ok) {
                throw new Error('Failed to complete module');
            }

            await fetchProgress();
            if (onModuleChange) onModuleChange();
        } catch (err) {
            console.error('Error completing module:', err);
            alert('Failed to complete module. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusIcon = (status: string, isCurrent: boolean) => {
        if (status === 'COMPLETED') {
            return <CheckCircle2 className="h-8 w-8 text-emerald-500" />;
        } else if (status === 'IN_PROGRESS' || isCurrent) {
            return <Clock className="h-8 w-8 text-cyan-500" />;
        } else {
            return <Circle className="h-8 w-8 text-slate-300 dark:text-slate-600" />;
        }
    };

    const getStatusColor = (status: string, isCurrent: boolean) => {
        if (status === 'COMPLETED') {
            return 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
        } else if (status === 'IN_PROGRESS' || isCurrent) {
            return 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20';
        } else {
            return 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Module Timeline */}
            <div className="space-y-4">
                {moduleProgress.map((module, index) => {
                    const isCurrent = module.moduleId === currentModuleId;
                    const isComplete = module.status === 'COMPLETED';
                    const canStart = index === 0 || moduleProgress[index - 1]?.status === 'COMPLETED';
                    const canComplete = module.status === 'IN_PROGRESS' && module.creditsEarned === module.totalCredits;

                    return (
                        <div key={module.moduleId}>
                            <div className={`border-2 rounded-xl p-6 transition-all ${getStatusColor(module.status, isCurrent)}`}>
                                <div className="flex items-start gap-4">
                                    {/* Status Icon */}
                                    <div className="flex-shrink-0 mt-1">
                                        {getStatusIcon(module.status, isCurrent)}
                                    </div>

                                    {/* Module Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                                    Module {module.moduleNumber}: {module.moduleName}
                                                </h3>
                                                {isCurrent && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-500 text-white mt-1">
                                                        Current Module
                                                    </span>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2">
                                                {module.status === 'NOT_STARTED' && canStart && (
                                                    <button
                                                        onClick={() => handleStartModule(module.moduleId)}
                                                        disabled={actionLoading}
                                                        className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 text-sm font-medium"
                                                    >
                                                        Start Module
                                                    </button>
                                                )}

                                                {module.status === 'IN_PROGRESS' && (
                                                    <button
                                                        onClick={() => handleCompleteModule(module.moduleId)}
                                                        disabled={actionLoading || !canComplete}
                                                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                                        title={!canComplete ? 'Complete all unit standards first' : 'Mark module as complete'}
                                                    >
                                                        Mark Complete
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mb-3">
                                            <div className="flex items-center justify-between text-sm mb-1">
                                                <span className="text-slate-600 dark:text-slate-400">
                                                    Credits: {module.creditsEarned} / {module.totalCredits}
                                                </span>
                                                <span className="font-medium text-slate-900 dark:text-white">
                                                    {module.progress}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-full transition-all ${isComplete ? 'bg-emerald-500' : 'bg-cyan-500'
                                                        }`}
                                                    style={{ width: `${module.progress}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Unit Standards Progress */}
                                        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                            <span>
                                                Unit Standards: {module.unitStandardsCompleted} / {module.totalUnitStandards}
                                            </span>
                                            {module.startDate && (
                                                <span>
                                                    Started: {new Date(module.startDate).toLocaleDateString()}
                                                </span>
                                            )}
                                            {module.completionDate && (
                                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                                    Completed: {new Date(module.completionDate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>

                                        {/* Validation Messages */}
                                        {module.status === 'IN_PROGRESS' && !canComplete && (
                                            <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                                <div className="text-sm text-amber-700 dark:text-amber-300">
                                                    <p className="font-medium">Cannot complete module yet</p>
                                                    <p>Complete all unit standards to earn the remaining {module.totalCredits - module.creditsEarned} credits.</p>
                                                </div>
                                            </div>
                                        )}

                                        {module.status === 'NOT_STARTED' && !canStart && (
                                            <div className="mt-3 flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                                                <AlertCircle className="h-5 w-5 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
                                                <div className="text-sm text-slate-600 dark:text-slate-400">
                                                    Complete Module {module.moduleNumber - 1} first
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Connector Arrow */}
                            {index < moduleProgress.length - 1 && (
                                <div className="flex justify-center py-2">
                                    <ArrowRight className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Summary */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {moduleProgress.filter(m => m.status === 'COMPLETED').length}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Completed</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                            {moduleProgress.filter(m => m.status === 'IN_PROGRESS').length}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">In Progress</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                            {moduleProgress.filter(m => m.status === 'NOT_STARTED').length}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Not Started</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
