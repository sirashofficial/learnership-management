'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, isAfter, isBefore, differenceInDays } from 'date-fns';
import {
  Calendar, CheckCircle, Clock, AlertTriangle, TrendingUp, TrendingDown,
  ChevronDown, ChevronRight, Edit2, RefreshCw, Loader2, Save, X, Plus
} from 'lucide-react';

interface RolloutPlanEntry {
  id: string;
  moduleId: string;
  moduleNumber: number;
  projectedStartDate: string;
  projectedEndDate: string;
  projectedSummativeDate?: string;
  projectedAssessmentDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  actualSummativeDate?: string;
  actualAssessmentDate?: string;
  computedStatus: string;
  varianceDays: number | null;
  credits: number;
  notes?: string;
  module: {
    id: string;
    name: string;
    moduleNumber: number;
    credits: number;
    unitStandards: { id: string; code: string; title: string; credits: number }[];
  };
}

interface RolloutPlanTableProps {
  groupId: string;
  groupName: string;
  groupStartDate?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  NOT_STARTED: { label: 'Not Started', color: 'bg-gray-100 text-gray-700', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: TrendingUp },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  BEHIND: { label: 'Behind', color: 'bg-red-100 text-red-700', icon: TrendingDown },
  AHEAD: { label: 'Ahead', color: 'bg-purple-100 text-purple-700', icon: TrendingUp },
  AT_RISK: { label: 'At Risk', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
};

export default function RolloutPlanTable({ groupId, groupName, groupStartDate }: RolloutPlanTableProps) {
  const [plans, setPlans] = useState<RolloutPlanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<RolloutPlanEntry>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rollout?groupId=${groupId}`, { credentials: 'include' });
      const data = await res.json();
      setPlans(Array.isArray(data) ? data : data.data || []);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const startDate = groupStartDate ?? new Date().toISOString();
      const res = await fetch('/api/rollout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ groupId, startDate }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to generate rollout plan');
        return;
      }
      await fetchPlans();
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveEdit = async (planId: string) => {
    setSavingId(planId);
    try {
      const res = await fetch(`/api/rollout/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editData),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to save changes');
        return;
      }
      setEditingId(null);
      setEditData({});
      await fetchPlans();
    } finally {
      setSavingId(null);
    }
  };

  const toggleExpand = (moduleId: string) => {
    const next = new Set(expandedModules);
    if (next.has(moduleId)) next.delete(moduleId);
    else next.add(moduleId);
    setExpandedModules(next);
  };

  const formatDate = (d?: string | null) => {
    if (!d) return '—';
    try { return format(new Date(d), 'd MMM yyyy'); } catch { return '—'; }
  };

  const getVarianceLabel = (days: number | null) => {
    if (days === null) return null;
    if (days === 0) return <span className="text-green-600 text-xs">On time</span>;
    if (days > 0) return <span className="text-red-600 text-xs">{days}d behind</span>;
    return <span className="text-emerald-600 text-xs">{Math.abs(days)}d ahead</span>;
  };

  const overallStats = plans.reduce(
    (acc, p) => ({
      total: acc.total + 1,
      completed: acc.completed + (p.computedStatus === 'COMPLETED' ? 1 : 0),
      behind: acc.behind + (p.computedStatus === 'BEHIND' ? 1 : 0),
      inProgress: acc.inProgress + (p.computedStatus === 'IN_PROGRESS' ? 1 : 0),
    }),
    { total: 0, completed: 0, behind: 0, inProgress: 0 }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading rollout plan...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header + Generate button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{groupName} — Rollout Plan</h2>
          <p className="text-sm text-gray-500 mt-0.5">Projected vs actual module delivery dates</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-semibold disabled:opacity-50"
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          {plans.length === 0 ? 'Generate Plan' : 'Regenerate Plan'}
        </button>
      </div>

      {/* Summary stats */}
      {plans.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Modules', value: overallStats.total, color: 'bg-gray-50 border-gray-200' },
            { label: 'Completed', value: overallStats.completed, color: 'bg-green-50 border-green-200' },
            { label: 'In Progress', value: overallStats.inProgress, color: 'bg-blue-50 border-blue-200' },
            { label: 'Behind', value: overallStats.behind, color: 'bg-red-50 border-red-200' },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.color} border rounded-lg p-3 text-center`}>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-600 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {plans.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <Calendar size={40} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-700 font-semibold mb-1">No rollout plan generated yet</p>
          <p className="text-gray-500 text-sm mb-4">Click "Generate Plan" to auto-calculate projected dates for all modules</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wide">
            <div>Module</div>
            <div>Proj. Start</div>
            <div>Proj. End</div>
            <div>Actual Start</div>
            <div>Actual End</div>
            <div>Status</div>
            <div></div>
          </div>

          {/* Rows */}
          {plans.map((plan) => {
            const config = STATUS_CONFIG[plan.computedStatus] ?? STATUS_CONFIG.NOT_STARTED;
            const Icon = config.icon;
            const isExpanded = expandedModules.has(plan.moduleId);
            const isEditing = editingId === plan.id;

            return (
              <div key={plan.id} className="border-b border-gray-100 last:border-b-0">
                {/* Main row */}
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2 px-4 py-3 items-center hover:bg-gray-50">
                  {/* Module name */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleExpand(plan.moduleId)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <div>
                      <div className="font-semibold text-sm text-gray-900">
                        Module {plan.moduleNumber}
                      </div>
                      <div className="text-xs text-gray-500">{plan.module.name}</div>
                    </div>
                  </div>

                  {/* Projected dates */}
                  {isEditing ? (
                    <>
                      <input
                        type="date"
                        value={editData.projectedStartDate ? editData.projectedStartDate.toString().slice(0, 10) : plan.projectedStartDate.slice(0, 10)}
                        onChange={(e) => setEditData({ ...editData, projectedStartDate: e.target.value })}
                        className="text-xs border border-gray-300 rounded px-1.5 py-1"
                      />
                      <input
                        type="date"
                        value={editData.projectedEndDate ? editData.projectedEndDate.toString().slice(0, 10) : plan.projectedEndDate.slice(0, 10)}
                        onChange={(e) => setEditData({ ...editData, projectedEndDate: e.target.value })}
                        className="text-xs border border-gray-300 rounded px-1.5 py-1"
                      />
                      <input
                        type="date"
                        value={editData.actualStartDate !== undefined ? (editData.actualStartDate as string)?.slice(0, 10) ?? '' : plan.actualStartDate?.slice(0, 10) ?? ''}
                        onChange={(e) => setEditData({ ...editData, actualStartDate: e.target.value || undefined })}
                        className="text-xs border border-gray-300 rounded px-1.5 py-1"
                      />
                      <input
                        type="date"
                        value={editData.actualEndDate !== undefined ? (editData.actualEndDate as string)?.slice(0, 10) ?? '' : plan.actualEndDate?.slice(0, 10) ?? ''}
                        onChange={(e) => setEditData({ ...editData, actualEndDate: e.target.value || undefined })}
                        className="text-xs border border-gray-300 rounded px-1.5 py-1"
                      />
                    </>
                  ) : (
                    <>
                      <div className="text-sm text-gray-700">{formatDate(plan.projectedStartDate)}</div>
                      <div className="text-sm text-gray-700">{formatDate(plan.projectedEndDate)}</div>
                      <div className="text-sm text-gray-700">{formatDate(plan.actualStartDate)}</div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm text-gray-700">{formatDate(plan.actualEndDate)}</span>
                        {getVarianceLabel(plan.varianceDays)}
                      </div>
                    </>
                  )}

                  {/* Status */}
                  <div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${config.color}`}>
                      <Icon size={12} />
                      {config.label}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(plan.id)}
                          disabled={savingId === plan.id}
                          className="p-1.5 text-green-600 hover:bg-green-100 rounded"
                          title="Save"
                        >
                          {savingId === plan.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        </button>
                        <button
                          onClick={() => { setEditingId(null); setEditData({}); }}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => { setEditingId(plan.id); setEditData({}); }}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                        title="Edit dates"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded: unit standards */}
                {isExpanded && (
                  <div className="bg-gray-50 border-t border-gray-100 px-8 py-3">
                    <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                      Unit Standards ({plan.module.unitStandards.length})
                    </div>
                    {plan.module.unitStandards.length === 0 ? (
                      <p className="text-xs text-gray-400">No unit standards linked</p>
                    ) : (
                      <div className="space-y-1.5">
                        {plan.module.unitStandards.map((us) => (
                          <div key={us.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2">
                            <span className="text-xs font-mono text-blue-700 font-semibold">{us.code}</span>
                            <span className="text-xs text-gray-700 flex-1">{us.title}</span>
                            <span className="text-xs text-gray-500">{us.credits} credits</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {plan.notes && (
                      <div className="mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                        <strong>Notes:</strong> {plan.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
