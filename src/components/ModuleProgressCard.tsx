'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';

interface ModuleProgressData {
    moduleId: string;
    moduleName: string;
    moduleNumber: number;
    status: string;
    creditsEarned: number;
    totalCredits: number;
    percentage: number;
    startDate: string | null;
    completionDate: string | null;
}

interface StudentProgressData {
    student: {
        id: string;
        name: string;
        totalCreditsEarned: number;
        totalCreditsRequired: number;
        overallProgress: number;
        currentModule: {
            id: string;
            name: string;
            moduleNumber: number;
        } | null;
    };
    moduleProgress: ModuleProgressData[];
}

interface ModuleProgressCardProps {
    studentId: string;
}

export default function ModuleProgressCard({ studentId }: ModuleProgressCardProps) {
    const [progressData, setProgressData] = useState<StudentProgressData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProgress();
    }, [studentId]);

    const fetchProgress = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/students/${studentId}/progress`);
            if (!response.ok) throw new Error('Failed to fetch progress');
            const data = await response.json();
            setProgressData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load progress');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-4 bg-slate-200 rounded"></div>
                        <div className="h-4 bg-slate-200 rounded"></div>
                        <div className="h-4 bg-slate-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !progressData) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="text-red-600">
                    {error || 'Failed to load module progress'}
                </div>
            </div>
        );
    }

    const { student, moduleProgress } = progressData;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'IN_PROGRESS':
                return <Clock className="w-5 h-5 text-blue-600" />;
            default:
                return <Circle className="w-5 h-5 text-slate-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-green-100 text-green-800';
            case 'IN_PROGRESS':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow">
            {/* Header */}
            <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Module Progress
                </h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-600">
                            {student.totalCreditsEarned} of {student.totalCreditsRequired} credits earned
                        </p>
                        {student.currentModule && (
                            <p className="text-sm text-blue-600 font-medium mt-1">
                                Current: Module {student.currentModule.moduleNumber} - {student.currentModule.name}
                            </p>
                        )}
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-slate-900">
                            {student.overallProgress}%
                        </div>
                        <div className="text-xs text-slate-500">Overall</div>
                    </div>
                </div>

                {/* Overall Progress Bar */}
                <div className="mt-4">
                    <div className="w-full bg-slate-200 rounded-full h-3">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${student.overallProgress}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Module List */}
            <div className="p-6">
                <div className="space-y-4">
                    {moduleProgress.map((module) => (
                        <div
                            key={module.moduleId}
                            className={`border rounded-lg p-4 transition-all hover:shadow-md ${module.status === 'IN_PROGRESS' ? 'border-blue-300 bg-blue-50' : 'border-slate-200'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-start gap-3 flex-1">
                                    {getStatusIcon(module.status)}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-medium text-slate-900">
                                                Module {module.moduleNumber}: {module.moduleName}
                                            </h4>
                                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(module.status)}`}>
                                                {module.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 mt-1">
                                            {module.creditsEarned} of {module.totalCredits} credits
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right ml-4">
                                    <div className="text-lg font-semibold text-slate-900">
                                        {module.percentage}%
                                    </div>
                                </div>
                            </div>

                            {/* Module Progress Bar */}
                            <div className="mt-3">
                                <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-500 ${module.status === 'COMPLETED'
                                                ? 'bg-green-500'
                                                : module.status === 'IN_PROGRESS'
                                                    ? 'bg-blue-500'
                                                    : 'bg-slate-400'
                                            }`}
                                        style={{ width: `${module.percentage}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Dates */}
                            {(module.startDate || module.completionDate) && (
                                <div className="mt-2 flex gap-4 text-xs text-slate-500">
                                    {module.startDate && (
                                        <span>Started: {new Date(module.startDate).toLocaleDateString()}</span>
                                    )}
                                    {module.completionDate && (
                                        <span>Completed: {new Date(module.completionDate).toLocaleDateString()}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
