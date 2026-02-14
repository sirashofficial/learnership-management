"use client";

import { useState } from "react";
import { X, Save, Building2, MapPin, Calendar, Users, Loader2 } from "lucide-react";
import { useGroups } from "@/contexts/GroupsContext";
import { generateRolloutPlan } from "@/lib/rolloutPlanGenerator";

interface GroupModalProps {
  group?: any;
  onClose: () => void;
  onSave?: (groupData: any) => void;
}

export default function GroupModal({ group, onClose, onSave }: GroupModalProps) {
  const { addGroup, updateGroup } = useGroups();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: group?.name || "",
    location: group?.location || "",
    coordinator: group?.coordinator || "",
    startDate: group?.startDate ? new Date(group?.startDate).toISOString().split('T')[0] : "",
    endDate: group?.endDate ? new Date(group?.endDate).toISOString().split('T')[0] : "",
    notes: group?.notes || "",
    status: group?.status || "ACTIVE"
  });

  const handleStartDateChange = (value: string) => {
    const updatedEndDate = value ? addMonthsToInput(value, 12) : "";
    setFormData((prev) => ({
      ...prev,
      startDate: value,
      endDate: updatedEndDate,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      alert("Please enter a group name");
      return;
    }

    setIsSubmitting(true);
    try {
      if (group) {
        await updateGroup(group.id, formData);
      } else {
        const createdGroup = await addGroup(formData as any);
        if (createdGroup?.id && formData.startDate) {
          await generateAndSavePlan(createdGroup, formData.startDate);
        }
      }

      alert(group ? 'Group updated successfully!' : 'Group created successfully!');
      if (onSave) onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving group:', error);
      alert('Failed to save group. Please check all fields and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateAndSavePlan = async (createdGroup: any, startDateInput: string) => {
    const planStartDate = toPlanDate(startDateInput);
    const rolloutPlan = generateRolloutPlan(createdGroup.name, 0, planStartDate);
    const rolloutData = buildModuleDates(rolloutPlan);

    await fetch(`/api/groups/${createdGroup.id}/rollout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rolloutPlan: rolloutData }),
    });

    const notesPayload = buildNotesPayload(createdGroup.notes, rolloutPlan);
    await updateGroup(createdGroup.id, {
      startDate: new Date(startDateInput).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      notes: notesPayload,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {group ? 'Edit Group' : 'Add New Group'}
                </h2>
                <p className="text-slate-600 text-sm">
                  {group ? 'Update training group details' : 'Create a new training group'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Group Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., Azelis 26'"
              required
            />
          </div>

          {/* Location & Coordinator */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Johannesburg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Coordinator
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={formData.coordinator}
                  onChange={(e) => setFormData({ ...formData, coordinator: e.target.value })}
                  className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., John Doe"
                />
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                readOnly
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="ON_HOLD">On Hold</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Additional information about this group..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors font-medium flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {group ? 'Save Changes' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function addMonthsToInput(value: string, months: number): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const targetMonth = date.getMonth() + months;
  const targetYear = date.getFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const day = date.getDate();
  const lastDay = new Date(targetYear, normalizedMonth + 1, 0).getDate();
  const result = new Date(targetYear, normalizedMonth, Math.min(day, lastDay));
  return result.toISOString().split('T')[0];
}

function toPlanDate(input: string): string {
  const date = new Date(input);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function parsePlanDate(value: string): Date {
  const [day, month, year] = value.split('/').map((part) => Number(part));
  return new Date(year, month - 1, day);
}

function buildModuleDates(plan: any) {
  const rolloutData: Record<string, Date> = {};

  plan.modules.forEach((module: any) => {
    const first = module.unitStandards[0];
    const last = module.unitStandards[module.unitStandards.length - 1];
    rolloutData[`module${module.moduleNumber}StartDate`] = parsePlanDate(first.startDate);
    rolloutData[`module${module.moduleNumber}EndDate`] = parsePlanDate(last.endDate);
  });

  return rolloutData;
}

function buildNotesPayload(notes: string | null | undefined, plan: any) {
  if (!notes) {
    return JSON.stringify({ rolloutPlan: plan });
  }

  try {
    const parsed = JSON.parse(notes);
    return JSON.stringify({ ...parsed, rolloutPlan: plan });
  } catch {
    return JSON.stringify({ notesText: notes, rolloutPlan: plan });
  }
}
