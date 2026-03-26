'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCurriculum } from '@/hooks/useCurriculum';
import { useStudents } from '@/hooks/useStudents';
import { useAuth } from '@/contexts/AuthContext';
import { useGroups } from '@/contexts/GroupsContext';
import { formatGroupNameDisplay } from '@/lib/groupName';
import { invalidateRelatedCache } from '@/lib/cache-invalidation';
import {
  ChevronDown, ChevronRight, Plus, Trash2, Edit2, Check, X, Users, TrendingUp,
  BarChart3, AlertTriangle, Download, Filter, Search, Award, Target, Loader2,
  FileText, Clock, CheckCircle, Settings, Save, Eye, Mail
} from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { mutate as globalMutate } from 'swr';
import Toast, { useToast } from '@/components/Toast';
import BulkMarkingModal, { type AssessmentResult, type AssessmentType as BulkAssessmentType } from '@/components/BulkMarkingModal';

interface Assessment {
  id: string;
  type: 'FORMATIVE' | 'SUMMATIVE' | 'WORKPLACE' | 'INTEGRATED';
  result: 'COMPETENT' | 'NOT_YET_COMPETENT' | 'PENDING';
  dueDate: string;
  assessedDate?: string;
  score?: number;
  notes?: string;
  student: { id: string; firstName: string; lastName: string; studentId: string };
  moderationStatus: string;
  unitStandard?: { id: string; code: string; title: string; module: { id: string; name: string } };
}

interface UnitStandard {
  id: string;
  code: string;
  title: string;
  type: string;
  credits: number;
  level: number;
  module: { id: string; name: string };
  assessments: Assessment[];
  _count?: { assessments: number };
}

export default function AssessmentsPage() {
  const { modules } = useCurriculum();
  const { students } = useStudents();
  const { groups } = useGroups();
  const { user } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const filteredUnitStandardId = searchParams.get('unitStandardId');

  // Views
  const [activeView, setActiveView] = useState<'manage' | 'moderation' | 'progress' | 'compliance' | 'bulk' | 'export' | 'analytics'>('manage');

  // State
  const [unitStandards, setUnitStandards] = useState<UnitStandard[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [filterType, setFilterType] = useState<'FORMATIVE' | 'SUMMATIVE' | null>(null);
  const [showNeedsModeration, setShowNeedsModeration] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [bulkPassing, setBulkPassing] = useState(false);

  // Bulk Marking Modal state
  const [bulkModal, setBulkModal] = useState<{
    open: boolean;
    unitStandard: { id: string; code: string; title: string };
    assessmentType: BulkAssessmentType;
    defaultResult: AssessmentResult;
  } | null>(null);

  const pendingModerationCount = useMemo(
    () => assessments.filter((assessment: any) => assessment.moderationStatus === 'PENDING').length,
    [assessments]
  );

  const filteredStudents = useMemo(() => {
    if (!selectedGroup) return students;
    return students.filter((student: any) => student.groupId === selectedGroup || student.group?.id === selectedGroup);
  }, [students, selectedGroup]);

  const filteredStudentIds = useMemo(() => new Set(filteredStudents.map((student: any) => student.id)), [filteredStudents]);

  const filteredAssessments = useMemo(() => {
    let filtered = assessments;
    if (selectedGroup) {
      filtered = filtered.filter((assessment: any) => filteredStudentIds.has(assessment.student?.id));
    }
    if (showNeedsModeration) {
      filtered = filtered.filter((assessment: any) => assessment.moderationStatus === 'PENDING');
    }
    return filtered;
  }, [assessments, filteredStudentIds, selectedGroup, showNeedsModeration]);

  const scopedStudents = filteredStudents;
  const scopedAssessments = filteredAssessments;

  // Fetch unit standards and assessments
  useEffect(() => {
    fetchUnitStandards();
    fetchAssessments();
  }, []);

  const fetchUnitStandards = async () => {
    try {
      const res = await fetch('/api/unit-standards');
      const data = await res.json();
      setUnitStandards(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Error fetching unit standards:', error);
    }
  };

  const fetchAssessments = async () => {
    try {
      const res = await fetch('/api/assessments', { credentials: 'include' });
      const data = await res.json();
      setAssessments(Array.isArray(data) ? data : data.data || []);
      // Auto-sync related data across the app
      globalMutate('/api/students');
      globalMutate('/api/groups');
      globalMutate('/api/groups/progress');
    } catch (error) {
      console.error('Error fetching assessments:', error);
    }
  };

  // Handle unit standard filter from URL
  useEffect(() => {
    if (filteredUnitStandardId && unitStandards.length > 0) {
      const targetUnit = unitStandards.find(u => u.id === filteredUnitStandardId);
      if (targetUnit) {
        // Expand the module containing this unit
        setExpandedModules(new Set([targetUnit.module.id]));
        // Expand only the filtered unit
        setExpandedUnits(new Set([filteredUnitStandardId]));
      }
    }
  }, [filteredUnitStandardId, unitStandards]);

  // ====================
  // MANAGE VIEW
  // ====================
  const ManageView = () => {
    const [newUSData, setNewUSData] = useState({ code: '', title: '', moduleId: '', credits: 1, level: 2, type: 'Core' });
    const [showNewForm, setShowNewForm] = useState(false);

    const handleAddUnitStandard = async () => {
      if (!newUSData.code || !newUSData.title || !newUSData.moduleId) {
        alert('Please fill in all fields');
        return;
      }

      try {
        const res = await fetch('/api/unit-standards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUSData)
        });

        if (res.ok) {
          alert('Unit Standard created');
          setNewUSData({ code: '', title: '', moduleId: '', credits: 1, level: 2, type: 'Core' });
          setShowNewForm(false);
          fetchUnitStandards();
        } else {
          const error = await res.json();
          alert(`Error: ${error.error}`);
        }
      } catch (error) {
        console.error('Error creating unit standard:', error);
      }
    };

    const handleDeleteUnitStandard = async (id: string) => {
      if (!confirm('Delete this unit standard?')) return;

      try {
        const res = await fetch(`/api/unit-standards/${id}`, { method: 'DELETE' });
        if (res.ok) {
          alert('Unit Standard deleted');
          fetchUnitStandards();
        } else {
          const error = await res.json();
          alert(`Error: ${error.error}`);
        }
      } catch (error) {
        console.error('Error deleting unit standard:', error);
      }
    };

    const handleUpdateUnitStandard = async (id: string) => {
      try {
        const res = await fetch(`/api/unit-standards/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editData)
        });

        if (res.ok) {
          alert('Unit Standard updated');
          setIsEditing(null);
          fetchUnitStandards();
        } else {
          const error = await res.json();
          alert(`Error: ${error.error}`);
        }
      } catch (error) {
        console.error('Error updating unit standard:', error);
      }
    };

    // Helper to mark assessment — supports 3-state: COMPETENT, NOT_YET_COMPETENT, PENDING (reset)
    const handleMarkAssessment = async (unitStandardId: string, studentId: string, type: 'FORMATIVE' | 'SUMMATIVE' | 'WORKPLACE', result: string) => {
      try {
        // Check if assessment exists
        const existing = scopedAssessments.find(a =>
          a.student.id === studentId &&
          a.unitStandard?.id === unitStandardId &&
          a.type === type
        );

        if (existing) {
          // Update via the [id] route — supports PENDING as reset
          const res = await fetch(`/api/assessments/${existing.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              result: result,
              assessedDate: result !== 'PENDING' ? new Date().toISOString() : null
            })
          });

          if (res.ok) {
            await invalidateRelatedCache('assessment:mark');
            fetchAssessments();
          }
        } else {
          // Only create if we're actually marking (not resetting)
          if (result === 'PENDING') return;

          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 7);

          const res = await fetch('/api/assessments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              studentId,
              unitStandardId,
              type,
              method: 'PRACTICAL',
              result,
              dueDate,
              assessedDate: new Date().toISOString()
            })
          });

          if (res.ok) {
            await invalidateRelatedCache('assessment:mark');
            fetchAssessments();
          }
        }
      } catch (error) {
        console.error('Error marking assessment:', error);
      }
    };

    // Bulk mark similar students
    const handleBulkMark = async (unitStandardId: string, assessmentType: 'FORMATIVE' | 'SUMMATIVE' | 'WORKPLACE', result: string, selectedStudents: Set<string>) => {
      setLoading(true);
      try {
        for (const studentId of selectedStudents) {
          await handleMarkAssessment(unitStandardId, studentId, assessmentType, result);
        }
        alert(`Marked ${selectedStudents.size} students as ${result}`);
      } finally {
        setLoading(false);
      }
    };

    const handleBulkPassAll = async (
      unitStandardId: string,
      assessmentType: 'FORMATIVE' | 'SUMMATIVE' | 'WORKPLACE',
      studentIds: string[]
    ) => {
      if (studentIds.length === 0) return;

      setBulkPassing(true);
      try {
        const res = await fetch('/api/assessments/bulk-pass', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            unitStandardId,
            assessmentType,
            studentIds,
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to bulk mark assessments');
        }

        const data = await res.json();
        const updated = data?.data?.updated ?? data?.updated ?? 0;
        const skipped = data?.data?.skipped ?? data?.skipped ?? 0;

        showToast(
          `✓ ${updated} students marked as Passed. ${skipped} students skipped (already passed or failed).`,
          'success'
        );

        await fetchAssessments();
        globalMutate('/api/assessments');
        globalMutate('/api/students');
        globalMutate('/api/groups');
        globalMutate('/api/groups/progress');
      } catch (error: any) {
        console.error('Error bulk passing assessments:', error);
        showToast(error?.message || 'Failed to bulk mark assessments', 'error');
      } finally {
        setBulkPassing(false);
      }
    };

    return (
      <div className="space-y-6">
        {/* Add new unit standard */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-gray-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold dark:text-white">Unit Standards Management</h3>
            <button
              onClick={() => setShowNewForm(!showNewForm)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
            >
              <Plus size={18} /> New Unit Standard
            </button>
          </div>

          {showNewForm && (
            <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded mb-4 space-y-3">
              <input
                type="text"
                placeholder="Code (e.g., 119673)"
                value={newUSData.code}
                onChange={(e) => setNewUSData({ ...newUSData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300"
              />
              <input
                type="text"
                placeholder="Title"
                value={newUSData.title}
                onChange={(e) => setNewUSData({ ...newUSData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300"
              />
              <select
                value={newUSData.moduleId}
                onChange={(e) => setNewUSData({ ...newUSData, moduleId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300"
              >
                <option value="">Select Module</option>
                {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>

              <div className="grid grid-cols-3 gap-3">
                <input
                  type="number"
                  placeholder="Credits"
                  value={newUSData.credits}
                  onChange={(e) => setNewUSData({ ...newUSData, credits: parseInt(e.target.value) })}
                  className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300"
                />
                <select
                  value={newUSData.level}
                  onChange={(e) => setNewUSData({ ...newUSData, level: parseInt(e.target.value) })}
                  className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300"
                >
                  <option value={2}>Level 2</option>
                  <option value={3}>Level 3</option>
                </select>
                <select
                  value={newUSData.type}
                  onChange={(e) => setNewUSData({ ...newUSData, type: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300"
                >
                  <option value="Core">Core</option>
                  <option value="Fundamental">Fundamental</option>
                  <option value="Elective">Elective</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddUnitStandard}
                  className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 flex items-center gap-2"
                >
                  <Check size={18} /> Add
                </button>
                <button
                  onClick={() => setShowNewForm(false)}
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 flex items-center gap-2"
                >
                  <X size={18} /> Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Unit standards by module */}
        {modules.map(module => {
          const moduleUnits = unitStandards.filter(u => u.module.id === module.id);
          if (moduleUnits.length === 0) return null;

          const isModuleExpanded = expandedModules.has(module.id);

          return (
            <div key={module.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
              <button
                onClick={() => {
                  const newSet = new Set(expandedModules);
                  if (newSet.has(module.id)) {
                    newSet.delete(module.id);
                  } else {
                    newSet.add(module.id);
                  }
                  setExpandedModules(newSet);
                }}
                className="w-full p-4 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-700 font-semibold text-lg dark:text-white"
              >
                {isModuleExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                {module.name}
                <span className="text-gray-500 dark:text-slate-400 text-sm ml-auto">({moduleUnits.length} units)</span>
              </button>

              {isModuleExpanded && (
                <div className="border-t border-gray-200 dark:border-slate-700 divide-y divide-gray-200 dark:divide-slate-700">
                  {moduleUnits.map(unit => {
                    const isUnitExpanded = expandedUnits.has(unit.id);

                    return (
                      <div key={unit.id}>
                        <button
                          onClick={() => {
                            const newSet = new Set(expandedUnits);
                            if (newSet.has(unit.id)) {
                              newSet.delete(unit.id);
                            } else {
                              newSet.add(unit.id);
                            }
                            setExpandedUnits(newSet);
                          }}
                          className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 text-left dark:text-white"
                        >
                          {isUnitExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          <div className="flex-1">
                            <div className="font-semibold">
                              {unit.code} - {unit.title}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-slate-400">
                              Level {unit.level} • {unit.credits} credits • {unit.type}
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsEditing(unit.id);
                              setEditData(unit);
                            }}
                            className="p-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteUnitStandard(unit.id);
                            }}
                            className="p-2 hover:bg-red-100 text-red-600 rounded"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </button>

                        {isEditing === unit.id && (
                          <div className="bg-slate-50 dark:bg-slate-700 border-t border-slate-200 dark:border-slate-600 p-4 space-y-3">
                            <input
                              type="text"
                              value={editData?.title || ''}
                              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300"
                              placeholder="Title"
                            />
                            <input
                              type="text"
                              value={editData?.code || ''}
                              onChange={(e) => setEditData({ ...editData, code: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300"
                              placeholder="Code"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateUnitStandard(unit.id)}
                                className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 flex items-center gap-2"
                              >
                                <Save size={18} /> Save
                              </button>
                              <button
                                onClick={() => setIsEditing(null)}
                                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 flex items-center gap-2"
                              >
                                <X size={18} /> Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {isUnitExpanded && (
                          <AssessmentTabs
                            unitStandard={unit}
                            students={scopedStudents}
                            assessments={scopedAssessments.filter(a => a.unitStandard?.id === unit.id)}
                            onMarkAssessment={handleMarkAssessment}
                            onBulkMark={handleBulkMark}
                            onOpenBulkModal={(us: any, type: BulkAssessmentType, result: AssessmentResult) => {
                              setBulkModal({ open: true, unitStandard: us, assessmentType: type, defaultResult: result });
                            }}
                            loading={loading}
                            bulkPassing={bulkPassing}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ====================
  // ASSESSMENT TABS COMPONENT
  // ====================
  const AssessmentTabs = ({ unitStandard, students, assessments, onMarkAssessment, onBulkMark, onOpenBulkModal, loading, bulkPassing }: any) => {
    const [activeTab, setActiveTab] = useState<'FORMATIVE' | 'SUMMATIVE' | 'WORKPLACE'>('FORMATIVE');
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

    const formativeAssessments = assessments.filter((a: any) => a.type === 'FORMATIVE');
    const summativeAssessments = assessments.filter((a: any) => a.type === 'SUMMATIVE');
    const workplaceAssessments = assessments.filter((a: any) => a.type === 'WORKPLACE');

    const getAssessmentStatus = (studentId: string, type: 'FORMATIVE' | 'SUMMATIVE' | 'WORKPLACE') => {
      const assessment = assessments.find((a: any) => a.student.id === studentId && a.type === type);
      return assessment?.result || 'PENDING';
    };

    const getStatusColor = (status: string) => {
      if (status === 'COMPETENT') return 'bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-400';
      if (status === 'NOT_YET_COMPETENT') return 'bg-red-100 border-red-300 text-red-700';
      return 'bg-gray-100 border-gray-300 text-gray-700';
    };

    const getCompletionStats = () => {
      const types: ('FORMATIVE' | 'SUMMATIVE' | 'WORKPLACE')[] = ['FORMATIVE', 'SUMMATIVE', 'WORKPLACE'];
      return types.map(type => {
        const completedCount = students.filter((student: any) =>
          getAssessmentStatus(student.id, type) === 'COMPETENT'
        ).length;
        return { type, completedCount, total: students.length };
      });
    };

    const getCompletionColor = (completed: number, total: number) => {
      if (completed === 0) return 'text-gray-500'; // None done
      if (completed === total) return 'text-emerald-600'; // All done
      return 'text-orange-600'; // Some done
    };

    return (
      <div className="bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700 p-4">
        {/* Tab buttons */}
        <div className="flex gap-2 mb-4">
          {['FORMATIVE', 'SUMMATIVE', 'WORKPLACE'].map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab as 'FORMATIVE' | 'SUMMATIVE' | 'WORKPLACE');
                setSelectedStudents(new Set());
              }}
              className={`px-4 py-2 rounded font-semibold transition ${activeTab === tab
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
            >
              {tab} Assessment
            </button>
          ))}
        </div>

        {/* Bulk actions */}
        {selectedStudents.size > 0 && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3 rounded mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
              {selectedStudents.size} student(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => onBulkMark(unitStandard.id, activeTab, 'COMPETENT', selectedStudents)}
                disabled={loading}
                className="bg-emerald-600 text-white px-3 py-1 rounded text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Mark Competent
              </button>
              <button
                onClick={() => onBulkMark(unitStandard.id, activeTab, 'NOT_YET_COMPETENT', selectedStudents)}
                disabled={loading}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
              >
                Mark Not Yet
              </button>
            </div>
          </div>
        )}

        {/* Completion Summary */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded border border-gray-200 dark:border-slate-700 mb-4">
          <div className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-2">Assessment Progress</div>
          <div className="flex gap-6">
            {getCompletionStats().map(stat => (
              <div key={stat.type} className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${getCompletionColor(stat.completedCount, stat.total)}`}>
                  {stat.type}: {stat.completedCount}/{stat.total}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Students grid */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-gray-700 dark:text-slate-300">
            {unitStandard.code} — {unitStandard.title}
          </div>
          <button
            onClick={() => onOpenBulkModal(unitStandard, activeTab, 'COMPETENT')}
            disabled={bulkPassing || students.length === 0}
            className="px-3 py-1.5 rounded text-sm font-semibold border-2 border-emerald-600 text-emerald-700 dark:text-emerald-400 dark:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-50"
          >
            {bulkPassing ? <Loader2 size={14} className="animate-spin inline mr-1" /> : null}
            ✓ Mark All as Passed
          </button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {students.map((student: any) => {
            const status = getAssessmentStatus(student.id, activeTab);
            const isSelected = selectedStudents.has(student.id);

            return (
              <div
                key={student.id}
                className="bg-white dark:bg-slate-800 p-3 rounded border border-gray-200 dark:border-slate-700 flex items-center justify-between hover:shadow-sm"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    const newSet = new Set(selectedStudents);
                    if (e.target.checked) {
                      newSet.add(student.id);
                    } else {
                      newSet.delete(student.id);
                    }
                    setSelectedStudents(newSet);
                  }}
                  className="mr-3 w-4 h-4"
                />

                <div className="flex-1">
                  <div className="font-semibold text-sm text-slate-900 dark:text-white">
                    {student.firstName} {student.lastName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-400">{student.studentId}</div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Current state indicator */}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${status === 'COMPETENT' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    status === 'NOT_YET_COMPETENT' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                    }`}>
                    {status === 'COMPETENT' ? 'Passed' : status === 'NOT_YET_COMPETENT' ? 'NYC' : 'Not marked'}
                  </span>
                  {/* Pass toggle — clicking again resets to unmarked */}
                  <button
                    onClick={() => onMarkAssessment(
                      unitStandard.id,
                      student.id,
                      activeTab,
                      status === 'COMPETENT' ? 'PENDING' : 'COMPETENT'
                    )}
                    title={status === 'COMPETENT' ? 'Click to reset to unmarked' : 'Mark as Competent'}
                    className={`px-3 py-1.5 rounded text-sm font-semibold border-2 transition-all ${status === 'COMPETENT'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-200'
                      : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-300 dark:border-slate-600 hover:border-emerald-400 hover:text-emerald-600'
                      }`}
                  >
                    ✓
                  </button>
                  {/* Fail toggle — clicking again resets to unmarked */}
                  <button
                    onClick={() => onMarkAssessment(
                      unitStandard.id,
                      student.id,
                      activeTab,
                      status === 'NOT_YET_COMPETENT' ? 'PENDING' : 'NOT_YET_COMPETENT'
                    )}
                    title={status === 'NOT_YET_COMPETENT' ? 'Click to reset to unmarked' : 'Mark as Not Yet Competent'}
                    className={`px-3 py-1.5 rounded text-sm font-semibold border-2 transition-all ${status === 'NOT_YET_COMPETENT'
                      ? 'bg-red-600 text-white border-red-600 shadow-sm ring-2 ring-red-200'
                      : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-300 dark:border-slate-600 hover:border-red-400 hover:text-red-600'
                      }`}
                  >
                    ✗
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ====================
  // MODERATION VIEW
  // ====================
  const ModerationView = () => {
    const [unreviewed, setUnreviewed] = useState<Assessment[]>([]);
    const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
    const [moderationNotes, setModerationNotes] = useState('');

    useEffect(() => {
      setUnreviewed(scopedAssessments.filter(a => a.moderationStatus === 'PENDING'));
    }, [scopedAssessments]);

    const handleApprove = async (assessmentId: string) => {
      try {
        const res = await fetch(`/api/assessments/${assessmentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            moderationStatus: 'APPROVED',
            moderationNotes
          })
        });

        if (res.ok) {
          setSelectedAssessment(null);
          setModerationNotes('');
          fetchAssessments();
        }
      } catch (error) {
        console.error('Error approving assessment:', error);
      }
    };

    const handleReject = async (assessmentId: string) => {
      try {
        const res = await fetch(`/api/assessments/${assessmentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            moderationStatus: 'REJECTED',
            moderationNotes
          })
        });

        if (res.ok) {
          setSelectedAssessment(null);
          setModerationNotes('');
          fetchAssessments();
        }
      } catch (error) {
        console.error('Error rejecting assessment:', error);
      }
    };

    const handleRequestRevision = async (assessmentId: string) => {
      try {
        const res = await fetch(`/api/assessments/${assessmentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            moderationStatus: 'RESUBMIT',
            moderationNotes
          })
        });

        if (res.ok) {
          setSelectedAssessment(null);
          setModerationNotes('');
          fetchAssessments();
        }
      } catch (error) {
        console.error('Error requesting revision:', error);
      }
    };

    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded border border-gray-200 dark:border-slate-700">
          <h3 className="font-semibold mb-2 dark:text-white">Pending Assessments for Moderation</h3>
          <div className="text-sm text-gray-500 dark:text-slate-400 mb-4">
            {unreviewed.length} assessment(s) waiting for review
          </div>

          {unreviewed.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-slate-400">
              ✅ All assessments have been reviewed!
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {unreviewed.map(assessment => (
                <button
                  key={assessment.id}
                  onClick={() => setSelectedAssessment(assessment)}
                  className={`w-full p-3 rounded border text-left transition ${selectedAssessment?.id === assessment.id
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 dark:border-emerald-600'
                    : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-600'
                    }`}
                >
                  <div className="font-semibold text-sm dark:text-white">
                    {assessment.student.firstName} {assessment.student.lastName} - {assessment.type}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-400">
                    Submitted: {assessment.assessedDate ? format(new Date(assessment.assessedDate), 'MMM dd, yyyy') : 'Pending'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedAssessment && (
          <div className="bg-white dark:bg-slate-800 p-4 rounded border border-gray-200 dark:border-slate-700">
            <h3 className="font-semibold mb-4 dark:text-white">
              Review: {selectedAssessment.student.firstName} {selectedAssessment.student.lastName}
            </h3>

            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 dark:text-slate-400">Assessment Type</label>
                  <div className="font-semibold">{selectedAssessment.type}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-slate-400">Current Result</label>
                  <div className="font-semibold">{selectedAssessment.result}</div>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 dark:text-slate-400">Moderator Notes</label>
                <textarea
                  value={moderationNotes}
                  onChange={(e) => setModerationNotes(e.target.value)}
                  placeholder="Add your feedback and comments..."
                  className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(selectedAssessment.id)}
                className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 flex items-center gap-2"
              >
                <Check size={18} /> Approve
              </button>
              <button
                onClick={() => handleRequestRevision(selectedAssessment.id)}
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 flex items-center gap-2"
              >
                <AlertTriangle size={18} /> Request Revision
              </button>
              <button
                onClick={() => handleReject(selectedAssessment.id)}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2"
              >
                <X size={18} /> Reject
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ====================
  // PROGRESS VIEW
  // ====================
  const ProgressView = () => {
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

    const getStudentProgress = (studentId: string) => {
      const studentAssessments = scopedAssessments.filter(a => a.student.id === studentId);
      const totalUnits = unitStandards.length;

      let competentUnits = 0;
      unitStandards.forEach(unit => {
        const hasFormative = studentAssessments.some(a => a.unitStandard?.id === unit.id && a.type === 'FORMATIVE' && a.result === 'COMPETENT');
        const hasSummative = studentAssessments.some(a => a.unitStandard?.id === unit.id && a.type === 'SUMMATIVE' && a.result === 'COMPETENT');

        if (hasFormative && hasSummative) {
          competentUnits++;
        }
      });

      return {
        competent: competentUnits,
        total: totalUnits,
        percentage: totalUnits > 0 ? Math.round((competentUnits / totalUnits) * 100) : 0
      };
    };

    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded border border-gray-200 dark:border-slate-700">
          <h3 className="font-semibold mb-4 dark:text-white">Module Progress</h3>

          <div className="space-y-3">
            {modules.map(module => {
              const moduleUnits = unitStandards.filter(u => u.module.id === module.id);
              const moduleProgress = modules.map(m => {
                const units = unitStandards.filter(u => u.module.id === m.id);
                let competentCount = 0;
                units.forEach(unit => {
                  const hasCompleteAssessments = scopedStudents.filter(s => {
                    const formative = scopedAssessments.find(a => a.student.id === s.id && a.unitStandard?.id === unit.id && a.type === 'FORMATIVE' && a.result === 'COMPETENT');
                    const summative = scopedAssessments.find(a => a.student.id === s.id && a.unitStandard?.id === unit.id && a.type === 'SUMMATIVE' && a.result === 'COMPETENT');
                    return formative && summative;
                  });
                  competentCount += hasCompleteAssessments.length;
                });
                return { moduleId: m.id, moduleName: m.name, competent: competentCount, total: units.length * scopedStudents.length, percentage: units.length * scopedStudents.length > 0 ? Math.round((competentCount / (units.length * scopedStudents.length)) * 100) : 0 };
              });

              const modProg = moduleProgress.find(mp => mp.moduleId === module.id);
              if (!modProg) return null;

              return (
                <div key={module.id} className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm dark:text-white">{module.name}</span>
                    <span className="text-sm text-gray-600 dark:text-slate-400">{modProg.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition"
                      style={{ width: `${modProg.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded border border-gray-200 dark:border-slate-700">
          <h3 className="font-semibold mb-4 dark:text-white">Student Progress</h3>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {scopedStudents.map(student => {
              const progress = getStudentProgress(student.id);
              return (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(selectedStudent === student.id ? null : student.id)}
                  className="w-full p-3 rounded border border-gray-200 dark:border-slate-700 hover:border-blue-300 text-left transition dark:text-white"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-white">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400">{student.studentId}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm text-slate-900 dark:text-white">
                        {progress.competent}/{progress.total}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400">{progress.percentage}%</div>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ====================
  // COMPLIANCE VIEW
  // ====================
  const ComplianceView = () => {
    const getComplianceStatus = (studentId: string) => {
      const studentAssessments = scopedAssessments.filter(a => a.student.id === studentId);
      const allAssessmentsMade = unitStandards.every(unit => {
        const hasFormative = studentAssessments.some(a => a.unitStandard?.id === unit.id && a.type === 'FORMATIVE');
        const hasSummative = studentAssessments.some(a => a.unitStandard?.id === unit.id && a.type === 'SUMMATIVE');
        return hasFormative && hasSummative;
      });

      return allAssessmentsMade;
    };

    const getCompliancePercentage = () => {
      const compliantStudents = scopedStudents.filter(s => getComplianceStatus(s.id)).length;
      return scopedStudents.length > 0 ? Math.round((compliantStudents / scopedStudents.length) * 100) : 0;
    };

    const getNonCompliantStudents = () => {
      return scopedStudents.filter(s => !getComplianceStatus(s.id));
    };

    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded border border-gray-200 dark:border-slate-700">
          <h3 className="font-semibold mb-4 dark:text-white">Compliance Status</h3>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold dark:text-white">Overall Compliance</span>
              <span className="text-2xl font-bold text-emerald-600">{getCompliancePercentage()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-green-600 h-4 rounded-full transition"
                style={{ width: `${getCompliancePercentage()}%` }}
              />
            </div>
          </div>

          {getNonCompliantStudents().length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <h4 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                <AlertTriangle size={18} /> Students Missing Required Assessments
              </h4>

              <div className="space-y-2">
                {getNonCompliantStudents().map(student => {
                  const missing = unitStandards.filter(unit => {
                    const studentAssessments = scopedAssessments.filter(a => a.student.id === student.id && a.unitStandard?.id === unit.id);
                    const hasFormative = studentAssessments.some(a => a.type === 'FORMATIVE');
                    const hasSummative = studentAssessments.some(a => a.type === 'SUMMATIVE');
                    return !hasFormative || !hasSummative;
                  });

                  return (
                    <div key={student.id} className="bg-white dark:bg-slate-700 p-2 rounded text-sm">
                      <div className="font-semibold dark:text-white">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-gray-600 dark:text-slate-400">
                        Missing assessments for {missing.length} unit(s)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ====================
  // BULK ACTIONS VIEW
  // ====================
  const BulkActionsView = () => {
    const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set());
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [assessmentType, setAssessmentType] = useState<'FORMATIVE' | 'SUMMATIVE'>('FORMATIVE');
    const [markAs, setMarkAs] = useState<'COMPETENT' | 'NOT_YET_COMPETENT'>('COMPETENT');

    const handleBulkMark = async () => {
      if (selectedUnits.size === 0 || selectedStudents.size === 0) {
        alert('Select at least one unit and one student');
        return;
      }

      setLoading(true);
      try {
        for (const unitId of selectedUnits) {
          for (const studentId of selectedStudents) {
            await fetch('/api/assessments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                studentId,
                unitStandardId: unitId,
                type: assessmentType,
                method: 'PRACTICAL',
                result: markAs,
                dueDate: new Date(),
                assessedDate: new Date().toISOString()
              })
            });
          }
        }

        console.log(`Marked ${selectedUnits.size * selectedStudents.size} assessment(s)`);
        setSelectedUnits(new Set());
        setSelectedStudents(new Set());
        fetchAssessments();
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded border border-gray-200 dark:border-slate-700">
            <h3 className="font-semibold mb-4 dark:text-white">Select Unit Standards</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {unitStandards.map(unit => (
                <label key={unit.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUnits.has(unit.id)}
                    onChange={(e) => {
                      const newSet = new Set(selectedUnits);
                      if (e.target.checked) {
                        newSet.add(unit.id);
                      } else {
                        newSet.delete(unit.id);
                      }
                      setSelectedUnits(newSet);
                    }}
                    className="w-4 h-4"
                  />
                  <div className="text-sm">
                    <div className="font-semibold dark:text-white">{unit.code} - {unit.title}</div>
                    <div className="text-gray-500 dark:text-slate-400 text-xs">{unit.module.name}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded border border-gray-200 dark:border-slate-700">
            <h3 className="font-semibold mb-4 dark:text-white">Select Students</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {scopedStudents.map(student => (
                <label key={student.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStudents.has(student.id)}
                    onChange={(e) => {
                      const newSet = new Set(selectedStudents);
                      if (e.target.checked) {
                        newSet.add(student.id);
                      } else {
                        newSet.delete(student.id);
                      }
                      setSelectedStudents(newSet);
                    }}
                    className="w-4 h-4"
                  />
                  <div className="text-sm">
                    <div className="font-semibold dark:text-white">{student.firstName} {student.lastName}</div>
                    <div className="text-gray-500 dark:text-slate-400 text-xs">{student.studentId}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded border border-gray-200 dark:border-slate-700">
          <h3 className="font-semibold mb-4 dark:text-white">Mark As</h3>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold dark:text-slate-300">Assessment Type</label>
              <select
                value={assessmentType}
                onChange={(e) => setAssessmentType(e.target.value as 'FORMATIVE' | 'SUMMATIVE')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300"
              >
                <option value="FORMATIVE">Formative</option>
                <option value="SUMMATIVE">Summative</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold dark:text-slate-300">Result</label>
              <select
                value={markAs}
                onChange={(e) => setMarkAs(e.target.value as 'COMPETENT' | 'NOT_YET_COMPETENT')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300"
              >
                <option value="COMPETENT">Competent</option>
                <option value="NOT_YET_COMPETENT">Not Yet Competent</option>
              </select>
            </div>

            <button
              onClick={handleBulkMark}
              disabled={loading || selectedUnits.size === 0 || selectedStudents.size === 0}
              className="w-full bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              Mark {selectedUnits.size * selectedStudents.size} Assessment(s)
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ====================
  // EXPORT VIEW
  // ====================
  const ExportView = () => {
    const [exportFormat, setExportFormat] = useState<'PDF' | 'CSV'>('PDF');
    const [exportScope, setExportScope] = useState<'all' | 'group' | 'student'>('all');
    const [selectedStudentForExport, setSelectedStudentForExport] = useState<string>('');
    const [selectedGroupForExport, setSelectedGroupForExport] = useState<string>('');
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
      setIsExporting(true);
      try {
        // Build query params
        const params = new URLSearchParams({
          format: exportFormat,
          scope: exportScope,
          ...(exportScope === 'student' && { studentId: selectedStudentForExport }),
          ...(exportScope === 'group' && { groupId: selectedGroupForExport })
        });

        const response = await fetch(`/api/assessments/export?${params.toString()}`, {
          credentials: 'include'
        });

        if (response.ok) {
          // Handle file download
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `assessments-export.${exportFormat.toLowerCase()}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          alert('Export failed');
        }
      } catch (error) {
        console.error('Export error:', error);
      } finally {
        setIsExporting(false);
      }
    };

    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded border border-gray-200 dark:border-slate-700 max-w-md mx-auto">
        <h3 className="font-semibold text-lg mb-6 dark:text-white">Export Assessments</h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold dark:text-slate-300">Format</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'PDF' | 'CSV')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300"
            >
              <option value="PDF">PDF Report</option>
              <option value="CSV">CSV Spreadsheet</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold dark:text-slate-300">Scope</label>
            <select
              value={exportScope}
              onChange={(e) => setExportScope(e.target.value as 'all' | 'group' | 'student')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300"
            >
              <option value="all">All Data</option>
              <option value="group">By Group</option>
              <option value="student">By Student</option>
            </select>
          </div>

          {exportScope === 'student' && (
            <div>
              <label className="text-sm font-semibold dark:text-slate-300">Student</label>
              <select
                value={selectedStudentForExport}
                onChange={(e) => setSelectedStudentForExport(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300"
              >
                <option value="">Select student</option>
                {scopedStudents.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {exportScope === 'group' && (
            <div>
              <label className="text-sm font-semibold dark:text-slate-300">Group</label>
              <select
                value={selectedGroupForExport}
                onChange={(e) => setSelectedGroupForExport(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300"
              >
                <option value="">Select group</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleExport}
            disabled={isExporting || (exportScope === 'student' && !selectedStudentForExport) || (exportScope === 'group' && !selectedGroupForExport)}
            className="w-full bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={18} />
                Export
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  // ====================
  // ANALYTICS VIEW
  // ====================
  const AnalyticsView = () => {
    // Calculate statistics
    const totalAssessments = scopedAssessments.length;
    const competentCount = scopedAssessments.filter(a => a.result === 'COMPETENT').length;
    const notYetCount = scopedAssessments.filter(a => a.result === 'NOT_YET_COMPETENT').length;
    const competencyRate = totalAssessments > 0 ? Math.round((competentCount / totalAssessments) * 100) : 0;

    // Per-unit-standard data
    const unitStandardStats = unitStandards.map(unit => {
      const unitAssessments = scopedAssessments.filter(a => a.unitStandard?.id === unit.id);
      const competent = unitAssessments.filter(a => a.result === 'COMPETENT').length;
      return {
        unit: `${unit.code}`,
        competent,
        total: unitAssessments.length,
        rate: unitAssessments.length > 0 ? Math.round((competent / unitAssessments.length) * 100) : 0
      };
    }).sort((a, b) => b.rate - a.rate);

    // Per-assessment-type data
    const formativeStats = scopedAssessments.filter(a => a.type === 'FORMATIVE');
    const summativeStats = scopedAssessments.filter(a => a.type === 'SUMMATIVE');

    const typeData = [
      {
        name: 'Formative',
        competent: formativeStats.filter(a => a.result === 'COMPETENT').length,
        notYet: formativeStats.filter(a => a.result === 'NOT_YET_COMPETENT').length,
        pending: formativeStats.filter(a => a.result === 'PENDING').length
      },
      {
        name: 'Summative',
        competent: summativeStats.filter(a => a.result === 'COMPETENT').length,
        notYet: summativeStats.filter(a => a.result === 'NOT_YET_COMPETENT').length,
        pending: summativeStats.filter(a => a.result === 'PENDING').length
      }
    ];

    const pieData = [
      { name: 'Competent', value: competentCount },
      { name: 'Not Yet', value: notYetCount },
      { name: 'Pending', value: totalAssessments - competentCount - notYetCount }
    ];

    const COLORS = ['#10b981', '#ef4444', '#9ca3af'];

    return (
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded border border-gray-200 dark:border-slate-700 text-center">
            <div className="text-3xl font-bold text-blue-600">{totalAssessments}</div>
            <div className="text-sm text-gray-600 dark:text-slate-400">Total Assessments</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded border border-gray-200 dark:border-slate-700 text-center">
            <div className="text-3xl font-bold text-emerald-600">{competentCount}</div>
            <div className="text-sm text-gray-600 dark:text-slate-400">Competent</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded border border-gray-200 dark:border-slate-700 text-center">
            <div className="text-3xl font-bold text-red-600">{notYetCount}</div>
            <div className="text-sm text-gray-600 dark:text-slate-400">Not Yet</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded border border-gray-200 dark:border-slate-700 text-center">
            <div className="text-3xl font-bold text-purple-600">{competencyRate}%</div>
            <div className="text-sm text-gray-600 dark:text-slate-400">Pass Rate</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded border border-gray-200 dark:border-slate-700">
            <h3 className="font-semibold mb-4 dark:text-white">Overall Results</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded border border-gray-200 dark:border-slate-700">
            <h3 className="font-semibold mb-4 dark:text-white">By Assessment Type</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="competent" stackId="a" fill="#10b981" name="Competent" />
                <Bar dataKey="notYet" stackId="a" fill="#ef4444" name="Not Yet" />
                <Bar dataKey="pending" stackId="a" fill="#9ca3af" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Unit standard breakdown */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded border border-gray-200 dark:border-slate-700">
          <h3 className="font-semibold mb-4 dark:text-white">Unit Standard Pass Rates</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {unitStandardStats.map(stat => (
              <div key={stat.unit} className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm dark:text-white">{stat.unit}</span>
                  <span className="text-sm dark:text-slate-300">{stat.competent}/{stat.total} ({stat.rate}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: `${stat.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ====================
  // MAIN RENDER
  // ====================
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Assessment Management</h1>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Group filter</label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300"
            >
              <option value="">All groups</option>
              {(groups || []).map((group: any) => (
                <option key={group.id} value={group.id}>
                  {formatGroupNameDisplay(group.name)}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowNeedsModeration((prev) => !prev)}
              className={`px-3 py-2 rounded text-sm font-semibold flex items-center gap-2 ${showNeedsModeration
                ? 'bg-orange-500 text-white'
                : 'bg-orange-50 text-orange-700 border border-orange-200'
                }`}
            >
              Needs Moderation
              <span className={`px-2 py-0.5 rounded-full text-xs ${showNeedsModeration ? 'bg-white/20 text-white' : 'bg-orange-200 text-orange-800'}`}>
                {pendingModerationCount}
              </span>
            </button>
            {selectedGroup && (
              <span className="text-xs text-gray-500 dark:text-slate-400">
                {scopedStudents.length} students, {scopedAssessments.length} assessments
              </span>
            )}
          </div>
        </div>

        {/* View tabs */}
        <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 rounded-t-lg overflow-x-auto">
          <div className="flex gap-0">
            {[
              { id: 'manage', label: 'Manage', icon: CheckCircle },
              { id: 'moderation', label: 'Moderation', icon: Eye },
              { id: 'progress', label: 'Progress', icon: TrendingUp },
              { id: 'compliance', label: 'Compliance', icon: AlertTriangle },
              { id: 'bulk', label: 'Bulk Actions', icon: Users },
              { id: 'export', label: 'Export', icon: Download },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id as any)}
                  className={`px-4 py-3 font-semibold flex items-center gap-2 whitespace-nowrap transition ${activeView === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* View content */}
        {activeView === 'manage' && filteredUnitStandardId && (
          <div className="bg-blue-50 border border-blue-200 rounded-b-lg border-t-0 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-blue-900">
                Showing results for Unit Standard {unitStandards.find(u => u.id === filteredUnitStandardId)?.code}
              </span>
            </div>
            <button
              onClick={() => {
                router.push('/assessments');
                setExpandedModules(new Set());
                setExpandedUnits(new Set());
              }}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm underline"
            >
              View all
            </button>
          </div>
        )}
        <div className="bg-white dark:bg-slate-800 rounded-b-lg p-6 border border-t-0 border-gray-200 dark:border-slate-700">
          {activeView === 'manage' && <ManageView />}
          {activeView === 'moderation' && <ModerationView />}
          {activeView === 'progress' && <ProgressView />}
          {activeView === 'compliance' && <ComplianceView />}
          {activeView === 'bulk' && <BulkActionsView />}
          {activeView === 'export' && <ExportView />}
          {activeView === 'analytics' && <AnalyticsView />}
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

        {/* Bulk Marking Modal */}
        {bulkModal?.open && (
          <BulkMarkingModal
            isOpen={bulkModal.open}
            onClose={() => setBulkModal(null)}
            onConfirm={async (studentIds, result, assessmentType) => {
              setBulkPassing(true);
              try {
                const res = await fetch('/api/assessments/bulk-pass', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    unitStandardId: bulkModal.unitStandard.id,
                    assessmentType,
                    studentIds,
                    result,
                  }),
                });
                if (!res.ok) {
                  const err = await res.json();
                  throw new Error(err.error || 'Failed to bulk mark assessments');
                }
                const data = await res.json();
                const updated = data?.data?.updated ?? data?.updated ?? 0;
                showToast(
                  `✓ ${updated} student${updated !== 1 ? 's' : ''} marked as ${
                    result === 'COMPETENT' ? 'Competent' : 'Not Yet Competent'
                  }.`,
                  'success'
                );
                await fetchAssessments();
                globalMutate('/api/assessments');
                globalMutate('/api/students');
                globalMutate('/api/groups');
                globalMutate('/api/groups/progress');
              } catch (error: any) {
                showToast(error?.message || 'Failed to bulk mark', 'error');
                throw error; // keeps modal open on error
              } finally {
                setBulkPassing(false);
              }
            }}
            unitStandard={bulkModal.unitStandard}
            students={scopedStudents.map((s: any) => ({
              id: s.id,
              firstName: s.firstName,
              lastName: s.lastName,
              studentId: s.studentId,
              currentStatus: scopedAssessments.find(
                (a: any) => a.student?.id === s.id &&
                  a.unitStandard?.id === bulkModal.unitStandard.id &&
                  a.type === bulkModal.assessmentType
              )?.result,
            }))}
            assessmentType={bulkModal.assessmentType}
            defaultResult={bulkModal.defaultResult}
          />
        )}
      </div>
    </div>
  );
}
