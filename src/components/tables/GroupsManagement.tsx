'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Users, Calendar, MapPin, Phone, Mail, User, Plus, Edit, Trash2, CheckCircle, AlertTriangle, UserPlus } from 'lucide-react';
import { useStudents } from '@/hooks/useStudents';
import { useGroups } from '@/contexts/GroupsContext';
import { generateRolloutPlan } from '@/lib/rolloutPlanGenerator';
import { formatGroupNameDisplay } from '@/lib/groupName';

export default function GroupsManagement() {
  const { students } = useStudents();
  const { groups, addGroup, updateGroup, deleteGroup } = useGroups();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    industry: '',
    startDate: '',
    endDate: '',
    status: 'PLANNING' as const,
    location: '',
    coordinator: '',
    notes: ''
  });

  // Get students for a specific group
  const getGroupStudents = (groupId: string) => {
    return students.filter(student => student.group?.id === groupId);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      industry: '',
      startDate: '',
      endDate: '',
      status: 'PLANNING',
      location: '',
      coordinator: '',
      notes: ''
    });
  };

  const handleCreate = () => {
    setShowCreateForm(true);
    setEditingGroup(null);
    resetForm();
  };

  const handleEdit = (group: any) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      contactPerson: group.contactPerson || '',
      email: group.email || '',
      phone: group.phone || '',
      address: group.address || '',
      industry: group.industry || '',
      startDate: group.startDate,
      endDate: group.endDate,
      status: group.status,
      location: group.location,
      coordinator: group.coordinator,
      notes: group.notes
    });
    setShowCreateForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const groupData = {
        name: formData.name,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        industry: formData.industry,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
        location: formData.location,
        coordinator: formData.coordinator,
        notes: formData.notes
      };

      if (editingGroup) {
        await updateGroup(editingGroup.id, groupData);
      } else {
        const createdGroup = await addGroup(groupData as any);
        if (createdGroup?.id && formData.startDate) {
          await generateAndSavePlan(createdGroup, formData.startDate, formData.endDate);
        }
      }

      setShowCreateForm(false);
      resetForm();
      setEditingGroup(null);
    } catch (error) {
      console.error('Error saving group:', error);
      alert('Failed to save group. Please try again.');
    }
  };

  const handleStartDateChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      startDate: value,
      endDate: value ? addMonthsToInput(value, 12) : '',
    }));
  };

  const generateAndSavePlan = async (createdGroup: any, startDateInput: string, endDateInput: string) => {
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
      endDate: new Date(endDateInput).toISOString(),
      notes: notesPayload,
    });
  };

  const handleDelete = async (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    const studentCount = group?._count?.students || 0;

    if (studentCount > 0) {
      alert(`Cannot delete group "${formatGroupNameDisplay(group?.name || '')}". There are ${studentCount} students assigned to this group. Please reassign students first.`);
      return;
    }

    if (confirm('Are you sure you want to delete this group?')) {
      try {
        await deleteGroup(groupId);
        setSelectedGroup(null);
      } catch (error: any) {
        alert(error.message || 'Failed to delete group');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Planning': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-slate-100 text-slate-800';
      case 'On Hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active': return <CheckCircle className="h-4 w-4" />;
      case 'Planning': return <Calendar className="h-4 w-4" />;
      case 'Completed': return <CheckCircle className="h-4 w-4" />;
      case 'On Hold': return <AlertTriangle className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const calculateProgress = (group: any) => {
    const start = new Date(group.startDate);
    const end = new Date(group.endDate);
    const now = new Date();

    if (now < start) return 0;
    if (now > end) return 100;

    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.round((elapsed / total) * 100);
  };

  const totalStudents = groups.reduce((sum, g) => sum + (g._count?.students || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Groups & Companies Management</h2>
          <p className="text-slate-600">Manage training groups with student assignments and optional company details</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create New Group
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Groups</p>
              <p className="text-3xl font-bold text-slate-900">{groups.length}</p>
            </div>
            <Building2 className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active Groups</p>
              <p className="text-3xl font-bold text-slate-900">
                {groups.filter(g => g.status === 'ACTIVE').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Students</p>
              <p className="text-3xl font-bold text-slate-900">{totalStudents}</p>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Groups List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold">Training Groups</h3>
            </div>
            <div className="divide-y divide-slate-200">
              {groups.map((group) => {
                const studentCount = group._count?.students || 0;
                const groupStudents = getGroupStudents(group.id);

                return (
                  <div
                    key={group.id}
                    className={`p-6 cursor-pointer hover:bg-slate-50 ${selectedGroup?.id === group.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    onClick={() => setSelectedGroup(group)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-slate-900">{formatGroupNameDisplay(group.name)}</h4>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(group.status)}`}>
                            {getStatusIcon(group.status)}
                            {group.status}
                          </span>
                        </div>

                        <div className="space-y-1 text-sm text-slate-600">
                          {group.industry && (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              <span>{group.industry}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{studentCount} students {studentCount > 0 ? `(${groupStudents.map(s => `${s.firstName} ${s.lastName}`).join(', ')})` : ''}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {renderPlanStatus(group)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{group.startDate ? new Date(group.startDate).toLocaleDateString() : 'TBD'} - {group.endDate ? new Date(group.endDate).toLocaleDateString() : 'TBD'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{group.location}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {group.status === 'ACTIVE' && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                              <span>Progress</span>
                              <span>{calculateProgress(group)}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${calculateProgress(group)}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(group);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(group.id);
                          }}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Group Details */}
        <div className="lg:col-span-1">
          {selectedGroup ? (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Group Details</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Group Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {formatGroupNameDisplay(selectedGroup.name)}</div>
                    <div><strong>Status:</strong> {selectedGroup.status}</div>
                    <div><strong>Students:</strong> {selectedGroup._count?.students || 0}</div>
                    <div><strong>Location:</strong> {selectedGroup.location}</div>
                    <div><strong>Coordinator:</strong> {selectedGroup.coordinator}</div>
                  </div>
                </div>

                {/* Students List */}
                {getGroupStudents(selectedGroup.id).length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-slate-900 mb-2">Assigned Students</h4>
                    <div className="space-y-1 text-sm">
                      {getGroupStudents(selectedGroup.id).map(student => (
                        <div key={student.id} className="flex items-center gap-2 py-1">
                          <UserPlus className="h-3 w-3 text-green-500" />
                          <span>{student.firstName} {student.lastName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedGroup.industry && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-slate-900 mb-2">Contact Information</h4>
                    <div className="space-y-2 text-sm">
                      {selectedGroup.industry && <div><strong>Industry:</strong> {selectedGroup.industry}</div>}
                      {selectedGroup.contactPerson && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{selectedGroup.contactPerson}</span>
                        </div>
                      )}
                      {selectedGroup.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{selectedGroup.email}</span>
                        </div>
                      )}
                      {selectedGroup.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{selectedGroup.phone}</span>
                        </div>
                      )}
                      {selectedGroup.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{selectedGroup.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h4 className="font-medium text-slate-900 mb-2">Timeline</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Start Date:</strong> {new Date(selectedGroup.startDate).toLocaleDateString()}</div>
                    <div><strong>End Date:</strong> {new Date(selectedGroup.endDate).toLocaleDateString()}</div>
                    <div><strong>Duration:</strong> {Math.ceil((new Date(selectedGroup.endDate).getTime() - new Date(selectedGroup.startDate).getTime()) / (1000 * 60 * 60 * 24 * 7))} weeks</div>
                  </div>
                </div>

                {selectedGroup.notes && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-slate-900 mb-2">Notes</h4>
                    <p className="text-sm text-slate-600">{selectedGroup.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="text-center text-slate-500">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>Select a group to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold">
                  {editingGroup ? 'Edit Group' : 'Create New Group'}
                </h3>
              </div>

              <div className="p-6 space-y-6">
                {/* Group Information */}
                <div>
                  <h4 className="font-medium mb-4">Group Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Group Name *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-md"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., NVC Level 2 - Cohort A"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <select
                        className="w-full px-3 py-2 border border-slate-300 rounded-md"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      >
                        <option value="Planning">Planning</option>
                        <option value="Active">Active</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Date *</label>
                      <input
                        type="date"
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-md"
                        value={formData.startDate}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Date *</label>
                      <input
                        type="date"
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-md"
                        value={formData.endDate}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Coordinator</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md"
                        value={formData.coordinator}
                        onChange={(e) => setFormData({ ...formData, coordinator: e.target.value })}
                        placeholder="Training coordinator name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Location</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Training location"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="border-t pt-6">
                  <h4 className="font-medium mb-4">Contact Information</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Contact Person</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-slate-300 rounded-md"
                          value={formData.contactPerson}
                          onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                          placeholder="Primary contact name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Industry</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-slate-300 rounded-md"
                          value={formData.industry}
                          onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                          placeholder="e.g., Technology, Retail"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                          type="email"
                          className="w-full px-3 py-2 border border-slate-300 rounded-md"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="contact@company.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Phone</label>
                        <input
                          type="tel"
                          className="w-full px-3 py-2 border border-slate-300 rounded-md"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+27 11 234 5678"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Address</label>
                      <textarea
                        className="w-full px-3 py-2 border border-slate-300 rounded-md"
                        rows={2}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Company address"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="border-t pt-6">
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes about the group..."
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                    setEditingGroup(null);
                  }}
                  className="px-4 py-2 text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingGroup ? 'Update Group' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function renderPlanStatus(group: any) {
  const plan = extractStoredPlan(group.notes);
  if (!plan) {
    return (
      <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-xs font-medium">
        <AlertTriangle className="h-3 w-3" />
        NO PLAN
      </span>
    );
  }

  const status = getPlanStatus(plan);

  if (status === 'NOT_STARTED') {
    return (
      <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs font-medium">
        <Calendar className="h-3 w-3" />
        NOT STARTED
      </span>
    );
  }

  if (status === 'BEHIND') {
    return (
      <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs font-medium">
        <AlertTriangle className="h-3 w-3" />
        BEHIND SCHEDULE
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs font-medium">
      <CheckCircle className="h-3 w-3" />
      ON TRACK
    </span>
  );
}

function getPlanStatus(plan: any): 'NOT_STARTED' | 'ON_TRACK' | 'BEHIND' {
  const today = normalizeDate(new Date());
  const unitStandards = plan.modules.flatMap((module: any) => module.unitStandards || []);

  if (unitStandards.length === 0) {
    return 'NOT_STARTED';
  }

  const starts = unitStandards.map((unit: any) => normalizeDate(parsePlanDate(unit.startDate)));
  const ends = unitStandards.map((unit: any) => normalizeDate(parsePlanDate(unit.endDate)));
  const earliestStart = starts.reduce((min: Date, current: Date) => (current < min ? current : min), starts[0]);
  const latestEnd = ends.reduce((max: Date, current: Date) => (current > max ? current : max), ends[0]);

  if (today < earliestStart) {
    return 'NOT_STARTED';
  }

  const isCurrent = unitStandards.some((unit: any) => {
    const start = normalizeDate(parsePlanDate(unit.startDate));
    const end = normalizeDate(parsePlanDate(unit.endDate));
    return start <= today && end >= today;
  });

  if (isCurrent) {
    return 'ON_TRACK';
  }

  if (today > latestEnd) {
    return 'BEHIND';
  }

  return 'BEHIND';
}

function extractStoredPlan(notes: string | null | undefined) {
  if (!notes) {
    return null;
  }

  try {
    const parsed = JSON.parse(notes);
    if (parsed && parsed.rolloutPlan) {
      return parsed.rolloutPlan;
    }
  } catch {
    return null;
  }

  return null;
}

function parsePlanDate(value: string): Date {
  const [day, month, year] = value.split('/').map((part) => Number(part));
  return new Date(year, month - 1, day);
}

function normalizeDate(date: Date): Date {
  const result = new Date(date.getTime());
  result.setHours(0, 0, 0, 0);
  return result;
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
