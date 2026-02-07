'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Calendar, FileText } from 'lucide-react';

interface Module {
    id: string;
    moduleNumber: number;
    name: string;
    fullName: string;
    unitStandards: UnitStandard[];
}

interface UnitStandard {
    id: string;
    code: string;
    title: string;
    credits: number;
}

interface CreateAssessmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: string;
    onSuccess?: () => void;
    preselectedModuleId?: string;
    preselectedUnitStandardId?: string;
}

export default function CreateAssessmentModal({
    isOpen,
    onClose,
    studentId,
    onSuccess,
    preselectedModuleId,
    preselectedUnitStandardId
}: CreateAssessmentModalProps) {
    const [modules, setModules] = useState<Module[]>([]);
    const [selectedModuleId, setSelectedModuleId] = useState(preselectedModuleId || '');
    const [selectedUnitStandardId, setSelectedUnitStandardId] = useState(preselectedUnitStandardId || '');
    const [type, setType] = useState<'FORMATIVE' | 'SUMMATIVE' | 'INTEGRATED'>('FORMATIVE');
    const [method, setMethod] = useState<'KNOWLEDGE' | 'PRACTICAL' | 'OBSERVATION' | 'PORTFOLIO'>('KNOWLEDGE');
    const [dueDate, setDueDate] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch modules on mount
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

        if (!dueDate) {
            setError('Please select a due date');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/assessments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId,
                    unitStandardId: selectedUnitStandardId,
                    type,
                    method,
                    dueDate: new Date(dueDate).toISOString(),
                    notes: notes || undefined,
                    result: 'PENDING'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create assessment');
            }

            const data = await response.json();

            // Reset form
            setSelectedModuleId('');
            setSelectedUnitStandardId('');
            setType('FORMATIVE');
            setMethod('KNOWLEDGE');
            setDueDate('');
            setNotes('');

            if (onSuccess) {
                onSuccess();
            }

            onClose();
        } catch (err) {
            console.error('Error creating assessment:', err);
            setError('Failed to create assessment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                            <Plus className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                Create Assessment
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Add a new assessment for this student
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Module Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Module *
                        </label>
                        <select
                            value={selectedModuleId}
                            onChange={(e) => {
                                setSelectedModuleId(e.target.value);
                                setSelectedUnitStandardId(''); // Reset unit standard when module changes
                            }}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            required
                        >
                            <option value="">Select a module...</option>
                            {modules.map((module) => (
                                <option key={module.id} value={module.id}>
                                    Module {module.moduleNumber}: {module.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Unit Standard Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Unit Standard *
                        </label>
                        <select
                            value={selectedUnitStandardId}
                            onChange={(e) => setSelectedUnitStandardId(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!selectedModuleId}
                            required
                        >
                            <option value="">
                                {selectedModuleId ? 'Select a unit standard...' : 'Select a module first...'}
                            </option>
                            {unitStandards.map((us) => (
                                <option key={us.id} value={us.id}>
                                    {us.code} - {us.title} ({us.credits} credits)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Assessment Type & Method */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Assessment Type *
                            </label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as any)}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                required
                            >
                                <option value="FORMATIVE">Formative</option>
                                <option value="SUMMATIVE">Summative</option>
                                <option value="INTEGRATED">Integrated</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Assessment Method *
                            </label>
                            <select
                                value={method}
                                onChange={(e) => setMethod(e.target.value as any)}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                required
                            >
                                <option value="KNOWLEDGE">Knowledge Test</option>
                                <option value="PRACTICAL">Practical Task</option>
                                <option value="OBSERVATION">Observation</option>
                                <option value="PORTFOLIO">Portfolio</option>
                            </select>
                        </div>
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Due Date *
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                required
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Notes / Instructions
                        </label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={4}
                                placeholder="Add any notes or instructions for this assessment..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg hover:from-teal-600 hover:to-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating...' : 'Create Assessment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
