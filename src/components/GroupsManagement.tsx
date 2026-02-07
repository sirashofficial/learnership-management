'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Users, Calendar, MapPin, Phone, Mail, User, Plus, Edit, Trash2, CheckCircle, AlertTriangle, UserPlus } from 'lucide-react';
import { useStudents } from '@/contexts/StudentContextSimple';
import { useGroups } from '@/contexts/GroupsContext';

export default function GroupsManagement() {
  const { getStudentCountByGroup, students } = useStudents();
  const { groups, companies, addGroup, updateGroup, deleteGroup, addCompany, updateCompany, deleteCompany } = useGroups();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [showCompanySection, setShowCompanySection] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    industry: '',
    startDate: '',
    endDate: '',
    status: 'Planning' as const,
    location: '',
    coordinator: '',
    notes: ''
  });

  // Get students for a specific group
  const getGroupStudents = (groupName: string) => {
    return students.filter(student => student.group === groupName);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      industry: '',
      startDate: '',
      endDate: '',
      status: 'Planning',
      location: '',
      coordinator: '',
      notes: ''
    });
    setShowCompanySection(false);
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
      companyName: group.company?.name || '',
      contactPerson: group.company?.contactPerson || '',
      email: group.company?.email || '',
      phone: group.company?.phone || '',
      address: group.company?.address || '',
      industry: group.company?.industry || '',
      startDate: group.startDate,
      endDate: group.endDate,
      status: group.status,
      location: group.location,
      coordinator: group.coordinator,
      notes: group.notes
    });
    setShowCompanySection(!!group.company);
    setShowCreateForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let companyId = editingGroup?.companyId || null;
      
      // Create or update company if provided
      if (showCompanySection && formData.companyName.trim()) {
        if (editingGroup?.companyId) {
          // Update existing company
          await updateCompany(editingGroup.companyId, {
            name: formData.companyName,
            contactPerson: formData.contactPerson,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            industry: formData.industry,
          });
        } else {
          // Create new company
          const newCompanyData = {
            name: formData.companyName,
            contactPerson: formData.contactPerson,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            industry: formData.industry,
          };
          // Note: We'll need to get the ID back from the API
          // For now, we'll handle this by fetching the companies again
          await addCompany(newCompanyData);
          // Get the newly created company
          const response = await fetch('/api/companies');
          const data = await response.json();
          const newCompany = data.data.find((c: any) => c.name === formData.companyName);
          if (newCompany) companyId = newCompany.id;
        }
      }

      const groupData = {
        name: formData.name,
        companyId,
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
        await addGroup(groupData);
      }

      setShowCreateForm(false);
      resetForm();
      setEditingGroup(null);
    } catch (error) {
      console.error('Error saving group:', error);
      alert('Failed to save group. Please try again.');
    }
  };

  const handleDelete = async (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    const studentCount = group?._count?.students || 0;
    
    if (studentCount > 0) {
      alert(`Cannot delete group "${group?.name}". There are ${studentCount} students assigned to this group. Please reassign students first.`);
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
  const totalCompanies = groups.filter(g => g.company).length;

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
                {groups.filter(g => g.status === 'Active').length}
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

        <div className="bg-white rounded-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">With Companies</p>
              <p className="text-3xl font-bold text-slate-900">{totalCompanies}</p>
            </div>
            <Building2 className="h-8 w-8 text-orange-500" />
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
                const groupStudents = getGroupStudents(group.name);
                
                return (
                  <div
                    key={group.id}
                    className={`p-6 cursor-pointer hover:bg-slate-50 ${
                      selectedGroup?.id === group.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => setSelectedGroup(group)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-slate-900">{group.name}</h4>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(group.status)}`}>
                            {getStatusIcon(group.status)}
                            {group.status}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-slate-600">
                          {group.company && (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              <span>{group.company.name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{studentCount} students {studentCount > 0 ? `(${groupStudents.map(s => s.name).join(', ')})` : ''}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(group.startDate).toLocaleDateString()} - {new Date(group.endDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{group.location}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {group.status === 'Active' && (
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
                    <div><strong>Name:</strong> {selectedGroup.name}</div>
                    <div><strong>Status:</strong> {selectedGroup.status}</div>
                    <div><strong>Students:</strong> {selectedGroup._count?.students || 0}</div>
                    <div><strong>Location:</strong> {selectedGroup.location}</div>
                    <div><strong>Coordinator:</strong> {selectedGroup.coordinator}</div>
                  </div>
                </div>

                {/* Students List */}
                {getGroupStudents(selectedGroup.name).length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-slate-900 mb-2">Assigned Students</h4>
                    <div className="space-y-1 text-sm">
                      {getGroupStudents(selectedGroup.name).map(student => (
                        <div key={student.id} className="flex items-center gap-2 py-1">
                          <UserPlus className="h-3 w-3 text-green-500" />
                          <span>{student.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedGroup.company && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-slate-900 mb-2">Company Details</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Company:</strong> {selectedGroup.company.name}</div>
                      {selectedGroup.company.industry && <div><strong>Industry:</strong> {selectedGroup.company.industry}</div>}
                      {selectedGroup.company.contactPerson && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{selectedGroup.company.contactPerson}</span>
                        </div>
                      )}
                      {selectedGroup.company.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{selectedGroup.company.email}</span>
                        </div>
                      )}
                      {selectedGroup.company.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{selectedGroup.company.phone}</span>
                        </div>
                      )}
                      {selectedGroup.company.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{selectedGroup.company.address}</span>
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
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g., NVC Level 2 - Cohort A"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <select
                        className="w-full px-3 py-2 border border-slate-300 rounded-md"
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value as any})}
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
                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Date *</label>
                      <input
                        type="date"
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-md"
                        value={formData.endDate}
                        onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Coordinator</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md"
                        value={formData.coordinator}
                        onChange={(e) => setFormData({...formData, coordinator: e.target.value})}
                        placeholder="Training coordinator name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Location</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        placeholder="Training location"
                      />
                    </div>
                  </div>
                </div>

                {/* Optional Company Information */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Company Information (Optional)</h4>
                    <button
                      type="button"
                      onClick={() => setShowCompanySection(!showCompanySection)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {showCompanySection ? 'Hide Company Details' : 'Add Company Details'}
                    </button>
                  </div>
                  
                  {showCompanySection && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Company Name</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md"
                            value={formData.companyName}
                            onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                            placeholder="Company name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Industry</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md"
                            value={formData.industry}
                            onChange={(e) => setFormData({...formData, industry: e.target.value})}
                            placeholder="e.g., Technology, Retail"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Contact Person</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md"
                            value={formData.contactPerson}
                            onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                            placeholder="Primary contact name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Email</label>
                          <input
                            type="email"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            placeholder="contact@company.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Phone</label>
                          <input
                            type="tel"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
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
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          placeholder="Company address"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="border-t pt-6">
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
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
