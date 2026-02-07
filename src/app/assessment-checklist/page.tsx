'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronRight, Users, BookOpen, Award, Loader2 } from 'lucide-react';

interface StudentAssessment {
    studentId: string;
    studentNumber: string;
    studentName: string;
    assessmentId: string | null;
    result: string;
    assessedDate: string | null;
    isComplete: boolean;
}

interface UnitStandard {
    unitStandardId: string;
    code: string;
    title: string;
    credits: number;
    completedCount: number;
    totalCount: number;
    completionPercentage: number;
    students: StudentAssessment[];
}

interface Module {
    moduleId: string;
    moduleNumber: number;
    moduleName: string;
    moduleCode: string;
    totalCredits: number;
    unitStandards: UnitStandard[];
}

export default function AssessmentChecklistPage() {
    const [groups, setGroups] = useState<any[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [selectedModuleId, setSelectedModuleId] = useState('');
    const [modules, setModules] = useState<Module[]>([]);
    const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchGroups();
    }, []);

    useEffect(() => {
        if (selectedGroupId) {
            fetchAssessments();
        }
    }, [selectedGroupId, selectedModuleId]);

    const fetchGroups = async () => {
        try {
            const response = await fetch('/api/groups');
            const data = await response.json();
            setGroups(data.groups || []);
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    };

    const fetchAssessments = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ groupId: selectedGroupId });
            if (selectedModuleId) params.append('moduleId', selectedModuleId);

            const response = await fetch(`/api/assessments/by-group?${params}`);
            const data = await response.json();
            setModules(data.modules || []);
        } catch (error) {
            console.error('Error fetching assessments:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleUnit = (unitId: string) => {
        const newExpanded = new Set(expandedUnits);
        if (newExpanded.has(unitId)) {
            newExpanded.delete(unitId);
        } else {
            newExpanded.add(unitId);
        }
        setExpandedUnits(newExpanded);
    };

    const handleToggleStudent = async (assessmentId: string | null, currentResult: string) => {
        if (!assessmentId) {
            alert('Assessment not found. Please generate assessments for this student first.');
            return;
        }

        const newResult = currentResult === 'COMPETENT' ? 'PENDING' : 'COMPETENT';

        setUpdating(true);
        try {
            const response = await fetch('/api/assessments/bulk-update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assessmentIds: [assessmentId],
                    result: newResult,
                    assessedDate: newResult === 'COMPETENT' ? new Date().toISOString() : null
                })
            });

            if (!response.ok) throw new Error('Failed to update assessment');
            await fetchAssessments();
        } catch (error) {
            console.error('Error updating assessment:', error);
            alert('Failed to update assessment. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    const handleMarkAllComplete = async (unitStandard: UnitStandard) => {
        const assessmentIds = unitStandard.students
            .filter(s => s.assessmentId && !s.isComplete)
            .map(s => s.assessmentId as string);

        if (assessmentIds.length === 0) {
            alert('All students are already marked as complete!');
            return;
        }

        if (!confirm(`Mark ${assessmentIds.length} students as complete for ${unitStandard.code}?`)) {
            return;
        }

        setUpdating(true);
        try {
            const response = await fetch('/api/assessments/bulk-update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assessmentIds,
                    result: 'COMPETENT',
                    assessedDate: new Date().toISOString()
                })
            });

            if (!response.ok) throw new Error('Failed to update assessments');
            await fetchAssessments();
        } catch (error) {
            console.error('Error bulk updating:', error);
            alert('Failed to update assessments. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                        Assessment Checklist
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Simple checkbox tracking for student assessments
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Select Group *
                            </label>
                            <select
                                value={selectedGroupId}
                                onChange={(e) => setSelectedGroupId(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            >
                                <option value="">-- Select a group --</option>
                                {groups.map((group) => (
                                    <option key={group.id} value={group.id}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Filter by Module (Optional)
                            </label>
                            <select
                                value={selectedModuleId}
                                onChange={(e) => setSelectedModuleId(e.target.value)}
                                disabled={!selectedGroupId}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">All Modules</option>
                                {modules.map((module) => (
                                    <option key={module.moduleId} value={module.moduleId}>
                                        Module {module.moduleNumber}: {module.moduleName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="h-12 w-12 animate-spin text-teal-500" />
                    </div>
                )}

                {/* No Group Selected */}
                {!selectedGroupId && !loading && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-12 text-center">
                        <Users className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-600 dark:text-slate-400">
                            Select a group to view assessments
                        </p>
                    </div>
                )}

                {/* Modules List */}
                {!loading && selectedGroupId && modules.length > 0 && (
                    <div className="space-y-4">
                        {modules.map((module) => (
                            <div key={module.moduleId} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
                                {/* Module Header */}
                                <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-4 text-white">
                                    <div className="flex items-center gap-3">
                                        <BookOpen className="h-6 w-6" />
                                        <div>
                                            <h2 className="text-xl font-bold">
                                                Module {module.moduleNumber}: {module.moduleName}
                                            </h2>
                                            <p className="text-white/90 text-sm">
                                                {module.unitStandards.length} unit standards • {module.totalCredits} credits
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Unit Standards */}
                                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {module.unitStandards.map((unitStandard) => {
                                        const isExpanded = expandedUnits.has(unitStandard.unitStandardId);

                                        return (
                                            <div key={unitStandard.unitStandardId}>
                                                {/* Unit Standard Header */}
                                                <button
                                                    onClick={() => toggleUnit(unitStandard.unitStandardId)}
                                                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-4 flex-1">
                                                        {isExpanded ? (
                                                            <ChevronDown className="h-5 w-5 text-slate-400" />
                                                        ) : (
                                                            <ChevronRight className="h-5 w-5 text-slate-400" />
                                                        )}
                                                        <div className="text-left flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-semibold text-slate-900 dark:text-white">
                                                                    {unitStandard.code}
                                                                </span>
                                                                <span className="text-xs px-2 py-1 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300">
                                                                    {unitStandard.credits} credits
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                                {unitStandard.title}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                                {unitStandard.completedCount} / {unitStandard.totalCount}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                {unitStandard.completionPercentage}% complete
                                                            </p>
                                                        </div>
                                                        <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                                            <div
                                                                className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2 rounded-full transition-all"
                                                                style={{ width: `${unitStandard.completionPercentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </button>

                                                {/* Student Checkboxes */}
                                                {isExpanded && (
                                                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                                Students ({unitStandard.totalCount})
                                                            </p>
                                                            <button
                                                                onClick={() => handleMarkAllComplete(unitStandard)}
                                                                disabled={updating || unitStandard.completedCount === unitStandard.totalCount}
                                                                className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
                                                            >
                                                                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : '✓'}
                                                                Mark All Complete
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                            {unitStandard.students.map((student) => (
                                                                <button
                                                                    key={student.studentId}
                                                                    onClick={() => handleToggleStudent(student.assessmentId, student.result)}
                                                                    disabled={updating || !student.assessmentId}
                                                                    className="flex items-center gap-3 p-3 rounded-lg border-2 transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    style={{
                                                                        borderColor: student.isComplete ? '#10b981' : '#e2e8f0',
                                                                        backgroundColor: student.isComplete ? '#f0fdf4' : '#ffffff'
                                                                    }}
                                                                >
                                                                    {student.isComplete ? (
                                                                        <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                                                                    ) : (
                                                                        <Circle className="h-5 w-5 text-slate-300 flex-shrink-0" />
                                                                    )}
                                                                    <div className="text-left flex-1 min-w-0">
                                                                        <p className="font-medium text-slate-900 truncate text-sm">
                                                                            {student.studentName}
                                                                        </p>
                                                                        <p className="text-xs text-slate-500">
                                                                            {student.studentNumber}
                                                                        </p>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* No Data */}
                {!loading && selectedGroupId && modules.length === 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-12 text-center">
                        <Award className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                            No assessments found for this group
                        </p>
                        <p className="text-sm text-slate-500">
                            Make sure assessments have been generated for students in this group
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
