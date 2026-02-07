'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, Calendar, Users, AlertCircle } from 'lucide-react';

interface Module {
    id: string;
    moduleNumber: number;
    name: string;
    unitStandards: UnitStandard[];
}

interface UnitStandard {
    id: string;
    code: string;
    title: string;
    credits: number;
}

interface BulkAssessmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentIds: string[];
    onSuccess?: () => void;
}

export default function BulkAssessmentModal({
    isOpen,
    onClose,
    studentIds,
    onSuccess
}: BulkAssessmentModalProps) {
    const [modules, setModules] = useState<Module[]>([]);
    const [selectedModuleId, setSelectedModuleId] = useState('');
    const [selectedUnitStandardId, setSelectedUnitStandardId] = useState('');
    const [assessedDate, setAssessedDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchModules();
        }
    }, [isOpen]);

    const fetchModules = async () => {
        try {
            const response = await fetch('/api/modules?includeUnitStandards=true');
            const data = await response.json();
            setModules(data.modules || []);
        } catch (err) {
            console.error('Error fetching modules:', err);
            setError('Failed to load modules');
        }
    };

    const selectedModule = modules.find(m => m.id === selectedModuleId);
    const unitStandards = selectedModule?.unitStandards || [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!selectedUnitStandardId) {
            setError('Please select a unit standard');
            return;
        }

        if (studentIds.length === 0) {
            setError('No students selected');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/assessments/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentIds,
                    unitStandardId: selectedUnitStandardId,
                    result: 'COMPETENT',
                    assessedDate: new Date(assessedDate).toISOString(),
                    type: 'SUMMATIVE',
                    method: 'PORTFOLIO'
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to award bulk credits');
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error in bulk assessment:', err);
            setError(err.message || 'Failed to complete bulk assessment');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full">
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                            <CheckCircle className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                Bulk Credit Award
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Marking {studentIds.length} students as Competent
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-center gap-3 border border-blue-100 dark:border-blue-800">
                        <Users className="h-5 w-5 text-blue-600" />
                        <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                            {studentIds.length} students will be awarded credits for the selected unit standard.
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Module
                            </label>
                            <select
                                value={selectedModuleId}
                                onChange={(e) => {
                                    setSelectedModuleId(e.target.value);
                                    setSelectedUnitStandardId('');
                                }}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg dark:bg-slate-900 dark:border-slate-600"
                                required
                            >
                                <option value="">Select a module...</option>
                                {modules.map(m => (
                                    <option key={m.id} value={m.id}>Module {m.moduleNumber}: {m.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Unit Standard
                            </label>
                            <select
                                value={selectedUnitStandardId}
                                onChange={(e) => setSelectedUnitStandardId(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg dark:bg-slate-900 dark:border-slate-600 disabled:opacity-50"
                                disabled={!selectedModuleId}
                                required
                            >
                                <option value="">Select a unit standard...</option>
                                {unitStandards.map(us => (
                                    <option key={us.id} value={us.id}>{us.code} - {us.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Assessment Date
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                type="date"
                                value={assessedDate}
                                onChange={(e) => setAssessedDate(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg dark:bg-slate-900 dark:border-slate-600"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !selectedUnitStandardId}
                            className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 font-medium"
                        >
                            {loading ? 'Processing...' : 'Award Credits'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
