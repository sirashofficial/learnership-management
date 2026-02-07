'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Edit2 } from 'lucide-react';

interface CreditAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: {
        id: string;
        firstName: string;
        lastName: string;
        totalCreditsEarned: number | null;
    } | null;
    onSuccess?: () => void;
}

export default function CreditAdjustmentModal({
    isOpen,
    onClose,
    student,
    onSuccess
}: CreditAdjustmentModalProps) {
    const [credits, setCredits] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && student) {
            setCredits(student.totalCreditsEarned?.toString() || '0');
        }
    }, [isOpen, student]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!student) return;

        const newCredits = parseInt(credits);
        if (isNaN(newCredits) || newCredits < 0) {
            setError('Please enter a valid credit amount');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`/api/students/${student.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    totalCreditsEarned: newCredits
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to update credits');
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error updating credits:', err);
            setError(err.message || 'Failed to update credits');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !student) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full">
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                            <Edit2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                Adjust Credits
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                {student.firstName} {student.lastName}
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

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Total Credits Earned
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="138"
                            value={credits}
                            onChange={(e) => setCredits(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg dark:bg-slate-900 dark:border-slate-600 focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <p className="mt-2 text-xs text-slate-500">
                            Manually overriding the calculated total. Max: 138.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 dark:border-slate-600 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
