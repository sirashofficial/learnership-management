'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCurriculum } from '@/hooks/useCurriculum';
import { useStudents } from '@/hooks/useStudents';
import { useAuth } from '@/contexts/AuthContext';
import { useGroups } from '@/contexts/GroupsContext';
import {
  ChevronDown, ChevronRight, Plus, Trash2, Edit2, Check, X, Users, TrendingUp,
  BarChart3, AlertTriangle, Download, Filter, Search, Award, Target, Loader2,
  FileText, Clock, CheckCircle, Settings, Save, Eye, Mail
} from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Assessment {
  id: string;
  type: 'FORMATIVE' | 'SUMMATIVE' | 'INTEGRATED';
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
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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
      const res = await fetch('/api/assessments');
      const data = await res.json();
      setAssessments(Array.isArray(data) ? data : data.data || []);
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

    // Helper to mark assessment
    const handleMarkAssessment = async (unitStandardId: string, studentId: string, type: 'FORMATIVE' | 'SUMMATIVE' | 'WORKPLACE', result: string) => {
      try {
        // Check if assessment exists
        const existing = assessments.find(a =>
          a.student.id === studentId &&
          a.unitStandard?.id === unitStandardId &&
          a.type === type
        );

        if (existing) {
          // Update
          const res = await fetch(`/api/assessments/${existing.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ result, assessedDate: new Date().toISOString() })
          });

          if (res.ok) {
            fetchAssessments();
          }
        } else {
          // Create
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 7);

          const res = await fetch('/api/assessments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

    return (
      <div className="space-y-6">
        {/* Add new unit standard */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Unit Standards Management</h3>
            <button
              onClick={() => setShowNewForm(!showNewForm)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              <Plus size={18} /> New Unit Standard
            </button>
          </div>

          {showNewForm && (
            <div className="bg-gray-50 p-4 rounded mb-4 space-y-3">
              <input
                type="text"
                placeholder="Code (e.g., 119673)"
                value={newUSData.code}
                onChange={(e) => setNewUSData({ ...newUSData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
              <input
                type="text"
                placeholder="Title"
                value={newUSData.title}
                onChange={(e) => setNewUSData({ ...newUSData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
              <select
                value={newUSData.moduleId}
                onChange={(e) => setNewUSData({ ...newUSData, moduleId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded"
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
                  className="px-3 py-2 border border-gray-300 rounded"
                />
                <select
                  value={newUSData.level}
                  onChange={(e) => setNewUSData({ ...newUSData, level: parseInt(e.target.value) })}
                  className="px-3 py-2 border border-gray-300 rounded"
                >
                  <option value={2}>Level 2</option>
                  <option value={3}>Level 3</option>
                </select>
                <select
                  value={newUSData.type}
                  onChange={(e) => setNewUSData({ ...newUSData, type: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="Core">Core</option>
                  <option value="Fundamental">Fundamental</option>
                  <option value="Elective">Elective</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddUnitStandard}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
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
            <div key={module.id} className="bg-white border border-gray-200 rounded-lg">
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
                className="w-full p-4 flex items-center gap-2 hover:bg-gray-50 font-semibold text-lg"
              >
                {isModuleExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                {module.name}
                <span className="text-gray-500 text-sm ml-auto">({moduleUnits.length} units)</span>
              </button>

              {isModuleExpanded && (
                <div className="border-t border-gray-200 divide-y divide-gray-200">
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
                          className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 text-left"
                        >
                          {isUnitExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          <div className="flex-1">
                            <div className="font-semibold">
                              {unit.code} - {unit.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              Level {unit.level} • {unit.credits} credits • {unit.type}
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsEditing(unit.id);
                              setEditData(unit);
                            }}
                            className="p-2 hover:bg-blue-100 text-blue-600 rounded"
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
                          <div className="bg-blue-50 p-4 space-y-3">
                            <input
                              type="text"
                              value={editData?.title || ''}
                              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded"
                              placeholder="Title"
                            />
                            <input
                              type="text"
                              value={editData?.code || ''}
                              onChange={(e) => setEditData({ ...editData, code: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded"
                              placeholder="Code"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateUnitStandard(unit.id)}
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
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
                            students={students}
                            assessments={assessments.filter(a => a.unitStandard?.id === unit.id)}
                            onMarkAssessment={handleMarkAssessment}
                            onBulkMark={handleBulkMark}
                            loading={loading}
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
  const AssessmentTabs = ({ unitStandard, students, assessments, onMarkAssessment, onBulkMark, loading }: any) => {
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
      if (status === 'COMPETENT') return 'bg-green-100 border-green-300 text-green-700';
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
      if (completed === total) return 'text-green-600'; // All done
      return 'text-orange-600'; // Some done
    };

    return (
      <div className="bg-gray-50 border-t p-4">
        {/* Tab buttons */}
        <div className="flex gap-2 mb-4">
          {['FORMATIVE', 'SUMMATIVE', 'WORKPLACE'].map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab as 'FORMATIVE' | 'SUMMATIVE' | 'WORKPLACE');
                setSelectedStudents(new Set());
              }}
              className={`px-4 py-2 rounded font-semibold transition ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {tab} Assessment
            </button>
          ))}
        </div>

        {/* Bulk actions */}
        {selectedStudents.size > 0 && (
          <div className="bg-blue-50 p-3 rounded mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold">
              {selectedStudents.size} student(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => onBulkMark(unitStandard.id, activeTab, 'COMPETENT', selectedStudents)}
                disabled={loading}
                className="bg-green-600 text-white px-3 py-1  rounded text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
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
        <div className="bg-white p-4 rounded border border-gray-200 mb-4">
          <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Assessment Progress</div>
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
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {students.map((student: any) => {
            const status = getAssessmentStatus(student.id, activeTab);
            const isSelected = selectedStudents.has(student.id);

            return (
              <div
                key={student.id}
                className="bg-white p-3 rounded border border-gray-200 flex items-center justify-between hover:shadow-sm"
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
                  <div className="font-semibold text-sm">
                    {student.firstName} {student.lastName}
                  </div>
                  <div className="text-xs text-gray-500">{student.studentId}</div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onMarkAssessment(
                      unitStandard.id, 
                      student.id, 
                      activeTab, 
                      status === 'COMPETENT' ? 'PENDING' : 'COMPETENT'
                    )}
                    className={`px-3 py-1 rounded text-sm font-semibold border transition ${
                      status === 'COMPETENT'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-green-300'
                    }`}
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => onMarkAssessment(
                      unitStandard.id, 
                      student.id, 
                      activeTab, 
                      status === 'NOT_YET_COMPETENT' ? 'PENDING' : 'NOT_YET_COMPETENT'
                    )}
                    className={`px-3 py-1 rounded text-sm font-semibold border transition ${
                      status === 'NOT_YET_COMPETENT'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-red-300'
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
      setUnreviewed(assessments.filter(a => a.moderationStatus === 'PENDING'));
    }, [assessments]);

    const handleApprove = async (assessmentId: string) => {
      try {
        const res = await fetch(`/api/assessments/${assessmentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
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
        <div className="bg-white p-4 rounded border border-gray-200">
          <h3 className="font-semibold mb-2">Pending Assessments for Moderation</h3>
          <div className="text-sm text-gray-500 mb-4">
            {unreviewed.length} assessment(s) waiting for review
          </div>

          {unreviewed.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              ✅ All assessments have been reviewed!
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {unreviewed.map(assessment => (
                <button
                  key={assessment.id}
                  onClick={() => setSelectedAssessment(assessment)}
                  className={`w-full p-3 rounded border text-left transition ${
                    selectedAssessment?.id === assessment.id
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="font-semibold text-sm">
                    {assessment.student.firstName} {assessment.student.lastName} - {assessment.type}
                  </div>
                  <div className="text-xs text-gray-500">
                    Submitted: {assessment.assessedDate ? format(new Date(assessment.assessedDate), 'MMM dd, yyyy') : 'Pending'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedAssessment && (
          <div className="bg-white p-4 rounded border border-gray-200">
            <h3 className="font-semibold mb-4">
              Review: {selectedAssessment.student.firstName} {selectedAssessment.student.lastName}
            </h3>

            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Assessment Type</label>
                  <div className="font-semibold">{selectedAssessment.type}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Current Result</label>
                  <div className="font-semibold">{selectedAssessment.result}</div>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Moderator Notes</label>
                <textarea
                  value={moderationNotes}
                  onChange={(e) => setModerationNotes(e.target.value)}
                  placeholder="Add your feedback and comments..."
                  className="w-full p-2 border border-gray-300 rounded"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(selectedAssessment.id)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
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
      const studentAssessments = assessments.filter(a => a.student.id === studentId);
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
        <div className="bg-white p-4 rounded border border-gray-200">
          <h3 className="font-semibold mb-4">Module Progress</h3>

          <div className="space-y-3">
            {modules.map(module => {
              const moduleUnits = unitStandards.filter(u => u.module.id === module.id);
              const moduleProgress = modules.map(m => {
                const units = unitStandards.filter(u => u.module.id === m.id);
                let competentCount = 0;
                units.forEach(unit => {
                  const hasCompleteAssessments = students.filter(s => {
                    const formative = assessments.find(a => a.student.id === s.id && a.unitStandard?.id === unit.id && a.type === 'FORMATIVE' && a.result === 'COMPETENT');
                    const summative = assessments.find(a => a.student.id === s.id && a.unitStandard?.id === unit.id && a.type === 'SUMMATIVE' && a.result === 'COMPETENT');
                    return formative && summative;
                  });
                  competentCount += hasCompleteAssessments.length;
                });
                return { moduleId: m.id, moduleName: m.name, competent: competentCount, total: units.length * students.length, percentage: units.length * students.length > 0 ? Math.round((competentCount / (units.length * students.length)) * 100) : 0 };
              });

              const modProg = moduleProgress.find(mp => mp.moduleId === module.id);
              if (!modProg) return null;

              return (
                <div key={module.id} className="bg-gray-50 p-3 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{module.name}</span>
                    <span className="text-sm text-gray-600">{modProg.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition"
                      style={{ width: `${modProg.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-4 rounded border border-gray-200">
          <h3 className="font-semibold mb-4">Student Progress</h3>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {students.map(student => {
              const progress = getStudentProgress(student.id);
              return (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(selectedStudent === student.id ? null : student.id)}
                  className="w-full p-3 rounded border border-gray-200 hover:border-blue-300 text-left transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-semibold text-sm">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{student.studentId}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm">
                        {progress.competent}/{progress.total}
                      </div>
                      <div className="text-xs text-gray-500">{progress.percentage}%</div>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition"
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
      const studentAssessments = assessments.filter(a => a.student.id === studentId);
      const allAssessmentsMade = unitStandards.every(unit => {
        const hasFormative = studentAssessments.some(a => a.unitStandard?.id === unit.id && a.type === 'FORMATIVE');
        const hasSummative = studentAssessments.some(a => a.unitStandard?.id === unit.id && a.type === 'SUMMATIVE');
        return hasFormative && hasSummative;
      });

      return allAssessmentsMade;
    };

    const getCompliancePercentage = () => {
      const compliantStudents = students.filter(s => getComplianceStatus(s.id)).length;
      return students.length > 0 ? Math.round((compliantStudents / students.length) * 100) : 0;
    };

    const getNonCompliantStudents = () => {
      return students.filter(s => !getComplianceStatus(s.id));
    };

    return (
      <div className="space-y-4">
        <div className="bg-white p-4 rounded border border-gray-200">
          <h3 className="font-semibold mb-4">Compliance Status</h3>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Overall Compliance</span>
              <span className="text-2xl font-bold text-green-600">{getCompliancePercentage()}%</span>
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
                    const studentAssessments = assessments.filter(a => a.student.id === student.id && a.unitStandard?.id === unit.id);
                    const hasFormative = studentAssessments.some(a => a.type === 'FORMATIVE');
                    const hasSummative = studentAssessments.some(a => a.type === 'SUMMATIVE');
                    return !hasFormative || !hasSummative;
                  });

                  return (
                    <div key={student.id} className="bg-white p-2 rounded text-sm">
                      <div className="font-semibold">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-gray-600">
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

        alert(`Marked ${selectedUnits.size * selectedStudents.size} assessment(s)`);
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
          <div className="bg-white p-4 rounded border border-gray-200">
            <h3 className="font-semibold mb-4">Select Unit Standards</h3>
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
                    <div className="font-semibold">{unit.code} - {unit.title}</div>
                    <div className="text-gray-500 text-xs">{unit.module.name}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded border border-gray-200">
            <h3 className="font-semibold mb-4">Select Students</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {students.map(student => (
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
                    <div className="font-semibold">{student.firstName} {student.lastName}</div>
                    <div className="text-gray-500 text-xs">{student.studentId}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded border border-gray-200">
          <h3 className="font-semibold mb-4">Mark As</h3>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold">Assessment Type</label>
              <select
                value={assessmentType}
                onChange={(e) => setAssessmentType(e.target.value as 'FORMATIVE' | 'SUMMATIVE')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="FORMATIVE">Formative</option>
                <option value="SUMMATIVE">Summative</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold">Result</label>
              <select
                value={markAs}
                onChange={(e) => setMarkAs(e.target.value as 'COMPETENT' | 'NOT_YET_COMPETENT')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="COMPETENT">Competent</option>
                <option value="NOT_YET_COMPETENT">Not Yet Competent</option>
              </select>
            </div>

            <button
              onClick={handleBulkMark}
              disabled={loading || selectedUnits.size === 0 || selectedStudents.size === 0}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
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

        const response = await fetch(`/api/assessments/export?${params.toString()}`);

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
      <div className="bg-white p-6 rounded border border-gray-200 max-w-md mx-auto">
        <h3 className="font-semibold text-lg mb-6">Export Assessments</h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold">Format</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'PDF' | 'CSV')}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="PDF">PDF Report</option>
              <option value="CSV">CSV Spreadsheet</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold">Scope</label>
            <select
              value={exportScope}
              onChange={(e) => setExportScope(e.target.value as 'all' | 'group' | 'student')}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="all">All Data</option>
              <option value="group">By Group</option>
              <option value="student">By Student</option>
            </select>
          </div>

          {exportScope === 'student' && (
            <div>
              <label className="text-sm font-semibold">Student</label>
              <select
                value={selectedStudentForExport}
                onChange={(e) => setSelectedStudentForExport(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="">Select student</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {exportScope === 'group' && (
            <div>
              <label className="text-sm font-semibold">Group</label>
              <select
                value={selectedGroupForExport}
                onChange={(e) => setSelectedGroupForExport(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
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
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
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
    const totalAssessments = assessments.length;
    const competentCount = assessments.filter(a => a.result === 'COMPETENT').length;
    const notYetCount = assessments.filter(a => a.result === 'NOT_YET_COMPETENT').length;
    const competencyRate = totalAssessments > 0 ? Math.round((competentCount / totalAssessments) * 100) : 0;

    // Per-unit-standard data
    const unitStandardStats = unitStandards.map(unit => {
      const unitAssessments = assessments.filter(a => a.unitStandard?.id === unit.id);
      const competent = unitAssessments.filter(a => a.result === 'COMPETENT').length;
      return {
        unit: `${unit.code}`,
        competent,
        total: unitAssessments.length,
        rate: unitAssessments.length > 0 ? Math.round((competent / unitAssessments.length) * 100) : 0
      };
    }).sort((a, b) => b.rate - a.rate);

    // Per-assessment-type data
    const formativeStats = assessments.filter(a => a.type === 'FORMATIVE');
    const summativeStats = assessments.filter(a => a.type === 'SUMMATIVE');

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
          <div className="bg-white p-4 rounded border border-gray-200 text-center">
            <div className="text-3xl font-bold text-blue-600">{totalAssessments}</div>
            <div className="text-sm text-gray-600">Total Assessments</div>
          </div>
          <div className="bg-white p-4 rounded border border-gray-200 text-center">
            <div className="text-3xl font-bold text-green-600">{competentCount}</div>
            <div className="text-sm text-gray-600">Competent</div>
          </div>
          <div className="bg-white p-4 rounded border border-gray-200 text-center">
            <div className="text-3xl font-bold text-red-600">{notYetCount}</div>
            <div className="text-sm text-gray-600">Not Yet</div>
          </div>
          <div className="bg-white p-4 rounded border border-gray-200 text-center">
            <div className="text-3xl font-bold text-purple-600">{competencyRate}%</div>
            <div className="text-sm text-gray-600">Pass Rate</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded border border-gray-200">
            <h3 className="font-semibold mb-4">Overall Results</h3>
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

          <div className="bg-white p-4 rounded border border-gray-200">
            <h3 className="font-semibold mb-4">By Assessment Type</h3>
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
        <div className="bg-white p-4 rounded border border-gray-200">
          <h3 className="font-semibold mb-4">Unit Standard Pass Rates</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {unitStandardStats.map(stat => (
              <div key={stat.unit} className="bg-gray-50 p-3 rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">{stat.unit}</span>
                  <span className="text-sm">{stat.competent}/{stat.total} ({stat.rate}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
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
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Assessment Management</h1>
        </div>

        {/* View tabs */}
        <div className="bg-white border-b border-gray-200 rounded-t-lg overflow-x-auto">
          <div className="flex gap-0">
            {[
              { id: 'manage', label: 'Manage', icon: CheckCircle },
              { id: 'moderation', label: 'Moderation', icon: Eye },
              { id: 'progress', label: 'Progress' , icon: TrendingUp },
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
                  className={`px-4 py-3 font-semibold flex items-center gap-2 whitespace-nowrap transition ${
                    activeView === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
        <div className="bg-white rounded-b-lg p-6 border border-t-0 border-gray-200">
          {activeView === 'manage' && <ManageView />}
          {activeView === 'moderation' && <ModerationView />}
          {activeView === 'progress' && <ProgressView />}
          {activeView === 'compliance' && <ComplianceView />}
          {activeView === 'bulk' && <BulkActionsView />}
          {activeView === 'export' && <ExportView />}
          {activeView === 'analytics' && <AnalyticsView />}
        </div>
      </div>
    </div>
  );
}
