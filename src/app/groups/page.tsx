'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useGroups } from '@/contexts/GroupsContext';
import GroupModal from '@/components/GroupModal';
import AddStudentModal from '@/components/AddStudentModal';
import {
  Building2,
  Users,
  Search,
  Plus,
  Edit2,
  Archive,
  UserPlus,
  Grid3x3,
  List,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Calendar
} from 'lucide-react';

export default function GroupsPage() {
  const router = useRouter();
  const { groups, isLoading } = useGroups();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCompanies, setExpandedCompanies] = useState<string[]>([]);
  const [expandedCollections, setExpandedCollections] = useState<string[]>(['montazility']);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]);

  // Define Montazility collection
  const montazilityCollection = {
    name: "Montazility 26'",
    groups: (groups || []).filter((g: any) => 
      !g.isArchived && g.name.includes("26'") && 
      ['Azelis 26\'', 'Beyond Insights 26\'', 'City Logistics 26\'', 'Monteagle 26\''].includes(g.name)
    )
  };

  // Get groups not in collection
  const regularGroups = (groups || []).filter((g: any) => 
    !g.isArchived && !montazilityCollection.groups.some((mg: any) => mg.id === g.id)
  );

  // Group regular groups by company
  const groupsByCompany = regularGroups.reduce((acc: any, group: any) => {
    const companyName = group.company?.name || 'No Company';
    if (!acc[companyName]) {
      acc[companyName] = [];
    }
    acc[companyName].push(group);
    return acc;
  }, {});

  // Filter groups by search
  const filteredCollection = {
    ...montazilityCollection,
    groups: montazilityCollection.groups.filter((g: any) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  };

  const filteredCompaniesList = Object.keys(groupsByCompany).filter(companyName =>
    companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    groupsByCompany[companyName].some((g: any) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Calculate statistics
  const activeGroups = (groups || []).filter((g: any) => !g.isArchived);
  const totalStudents = activeGroups.reduce((sum: number, g: any) => sum + (g._count?.students || 0), 0);
  const avgAttendance = activeGroups.reduce((sum: number, g: any) => {
    const attendance = g.attendanceRate || 0;
    return sum + attendance;
  }, 0) / (activeGroups.length || 1);

  const toggleCompany = (companyName: string) => {
    setExpandedCompanies(prev =>
      prev.includes(companyName)
        ? prev.filter(c => c !== companyName)
        : [...prev, companyName]
    );
  };

  const toggleCollection = (collectionId: string) => {
    setExpandedCollections(prev =>
      prev.includes(collectionId)
        ? prev.filter(c => c !== collectionId)
        : [...prev, collectionId]
    );
  };

  const toggleSelectForMerge = (groupId: string) => {
    setSelectedForMerge(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleEditGroup = (group: any) => {
    setSelectedGroup(group);
    setShowGroupModal(true);
  };

  const handleArchiveGroup = async (group: any) => {
    if (!confirm(`Archive ${group.name}?\n\nThis group will be hidden from active views but data will be preserved.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/groups/${group.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: true }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert('Failed to archive group');
      }
    } catch (error) {
      console.error('Error archiving group:', error);
      alert('Failed to archive group');
    }
  };

  const handleAddStudentsToGroup = (group: any) => {
    setSelectedGroup(group);
    setShowAddStudentModal(true);
  };

  const handleViewGroup = (group: any) => {
    setExpandedGroups(prev =>
      prev.includes(group.id)
        ? prev.filter(id => id !== group.id)
        : [...prev, group.id]
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header with Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Groups & Companies</h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Manage training groups and student assignments</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedGroup(null);
                    setShowGroupModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Create Group
                </button>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-teal-600 text-white rounded-lg">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Active Groups</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeGroups.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-600 text-white rounded-lg">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStudents}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-cyan-600 text-white rounded-lg">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Avg Attendance</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgAttendance.toFixed(0)}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and View Toggle */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search groups or companies..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-300 dark:border-gray-600">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-teal-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  <Grid3x3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-teal-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Groups by Company */}
            <div className="space-y-4">
              {/* Merge Button */}
              {selectedForMerge.length >= 2 && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-600 text-white rounded-lg">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {selectedForMerge.length} groups selected
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Click merge to combine these groups into one
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedForMerge([])}
                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setShowMergeModal(true)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Users className="w-5 h-5" />
                        Merge Groups
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Montazility Collection */}
              {(searchQuery === '' || filteredCollection.groups.length > 0) && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                  <div
                    onClick={() => toggleCollection('montazility')}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 cursor-pointer hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-900/30 dark:hover:to-indigo-900/30 transition-colors border-b-2 border-purple-200 dark:border-purple-700"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-600 text-white rounded-lg">
                        <Grid3x3 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {filteredCollection.name}
                          </h3>
                          <span className="px-2 py-1 text-xs font-medium bg-purple-600 text-white rounded-full">
                            Collection
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {filteredCollection.groups.length} group{filteredCollection.groups.length !== 1 ? 's' : ''} • {
                            filteredCollection.groups.reduce((sum: number, g: any) => sum + (g._count?.students || 0), 0)
                          } student{filteredCollection.groups.reduce((sum: number, g: any) => sum + (g._count?.students || 0), 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    {expandedCollections.includes('montazility') ? (
                      <ChevronUp className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    )}
                  </div>

                  {expandedCollections.includes('montazility') && (
                    <div className={`p-4 bg-purple-50/30 dark:bg-purple-900/10 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}`}>
                      {filteredCollection.groups.map((group: any) => (
                        <GroupCard
                          key={group.id}
                          group={group}
                          viewMode={viewMode}
                          onEdit={() => handleEditGroup(group)}
                          onArchive={() => handleArchiveGroup(group)}
                          onAddStudents={() => handleAddStudentsToGroup(group)}
                          onView={() => handleViewGroup(group)}
                          isSelected={selectedForMerge.includes(group.id)}
                          onSelect={() => toggleSelectForMerge(group.id)}
                          isExpanded={expandedGroups.includes(group.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {filteredCompaniesList.map((companyName) => {
                const companyGroups = groupsByCompany[companyName];
                const isExpanded = expandedCompanies.includes(companyName);
                const companyStudentCount = companyGroups.reduce((sum: number, g: any) => sum + (g._count?.students || 0), 0);

                return (
                  <div key={companyName} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    {/* Company Header */}
                    <div
                      onClick={() => toggleCompany(companyName)}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 cursor-pointer hover:from-teal-100 hover:to-emerald-100 dark:hover:from-teal-900/30 dark:hover:to-emerald-900/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-teal-600 text-white rounded-lg">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{companyName}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {companyGroups.length} group{companyGroups.length !== 1 ? 's' : ''} • {companyStudentCount} student{companyStudentCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                      )}
                    </div>

                    {/* Company Groups */}
                    {isExpanded && (
                      <div className={`p-4 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}`}>
                        {companyGroups.map((group: any) => (
                          <GroupCard
                            key={group.id}
                            group={group}
                            viewMode={viewMode}
                            onEdit={() => handleEditGroup(group)}
                            onArchive={() => handleArchiveGroup(group)}
                            onAddStudents={() => handleAddStudentsToGroup(group)}
                            onView={() => handleViewGroup(group)}
                            isSelected={selectedForMerge.includes(group.id)}
                            onSelect={() => toggleSelectForMerge(group.id)}
                            isExpanded={expandedGroups.includes(group.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredCompaniesList.length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
                  <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No groups found</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchQuery ? 'Try a different search term' : 'Create your first group to get started'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      {showGroupModal && (
        <GroupModal
          group={selectedGroup}
          onClose={() => {
            setShowGroupModal(false);
            setSelectedGroup(null);
          }}
          onSave={() => {
            setShowGroupModal(false);
            setSelectedGroup(null);
            router.refresh();
          }}
        />
      )}

      {showAddStudentModal && selectedGroup && (
        <AddStudentModal
          isOpen={true}
          groupId={selectedGroup.id}
          groupName={selectedGroup.name}
          onClose={() => {
            setShowAddStudentModal(false);
            setSelectedGroup(null);
          }}
          onAdd={async (student) => {
            try {
              console.log('📝 Groups page: Received student data:', student);
              
              const response = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  studentId: student.studentId,
                  firstName: student.firstName,
                  lastName: student.lastName,
                  email: student.email || undefined,
                  phone: student.phone || undefined,
                  groupId: student.groupId || student.group,
                  status: student.status || 'ACTIVE',
                  progress: student.progress || 0,
                }),
              });
              
              console.log('📡 Response status:', response.status);
              
              if (response.ok) {
                const result = await response.json();
                console.log('✅ Success:', result);
                alert('Student added successfully!');
                setShowAddStudentModal(false);
                setSelectedGroup(null);
                router.refresh();
              } else {
                const error = await response.json();
                console.error('❌ API Error:', error);
                alert(`Failed to add student: ${error.error || error.message || 'Unknown error'}`);
              }
            } catch (error) {
              console.error('❌ Error adding student:', error);
              alert('Failed to add student. Please try again.');
            }
          }}
        />
      )}

      {showMergeModal && (
        <MergeGroupsModal
          selectedGroupIds={selectedForMerge}
          groups={groups || []}
          onClose={() => setShowMergeModal(false)}
          onMerge={() => {
            setShowMergeModal(false);
            setSelectedForMerge([]);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

interface GroupCardProps {
  group: any;
  viewMode: 'grid' | 'list';
  onEdit: () => void;
  onArchive: () => void;
  onAddStudents: () => void;
  onView: () => void;
  isSelected?: boolean;
  onSelect?: () => void;
  isExpanded?: boolean;
}

function GroupCard({ group, viewMode, onEdit, onArchive, onAddStudents, onView, isSelected, onSelect, isExpanded }: GroupCardProps) {
  const studentCount = group._count?.students || 0;
  const attendanceRate = group.attendanceRate || 0;
  const students = group.students || [];

  if (viewMode === 'list') {
    return (
      <div
        className={`flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 hover:shadow-md transition-all cursor-pointer ${
          isSelected ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-700'
        }`}
      >
        {onSelect && (
          <div className="flex items-center mr-3" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
          </div>
        )}
        <div className="flex items-center gap-4 flex-1" onClick={onView}>
          <div className="p-3 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">{group.name}</h4>
            {group.facilitator && (
              <p className="text-sm text-gray-600 dark:text-gray-400">Facilitator: {group.facilitator.name}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{studentCount}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Students</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{attendanceRate}%</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Attendance</p>
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onAddStudents}
              className="p-2 hover:bg-teal-100 dark:hover:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-lg transition-colors"
              title="Add Students"
            >
              <UserPlus className="w-5 h-5" />
            </button>
            <button
              onClick={onEdit}
              className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
              title="Edit Group"
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button
              onClick={onArchive}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg transition-colors"
              title="Archive Group"
            >
              <Archive className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 hover:shadow-lg transition-all overflow-hidden relative ${
        isSelected ? 'border-purple-500 ring-2 ring-purple-500' : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {onSelect && (
        <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="w-6 h-6 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
          />
        </div>
      )}
      <div className="p-4 cursor-pointer" onClick={onView}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">{group.name}</h4>
              {group.startDate && (
                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Started {new Date(group.startDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {group.facilitator && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Facilitator: {group.facilitator.name}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{studentCount}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Students</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{attendanceRate}%</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Attendance</p>
          </div>
        </div>

        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onAddStudents}
            className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <UserPlus className="w-4 h-4" />
            Add
          </button>
          <button
            onClick={onEdit}
            className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onArchive}
            className="py-2 px-3 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Archive"
          >
            <Archive className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Students List */}
      {isExpanded && studentCount > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Students ({studentCount})
          </h5>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {students.map((student: any) => (
              <div key={student.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-semibold text-xs">
                    {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{student.studentId}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{student.progress || 0}%</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Progress</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {isExpanded && studentCount === 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No students in this group yet</p>
          <button
            onClick={(e) => { e.stopPropagation(); onAddStudents(); }}
            className="mt-2 text-sm text-teal-600 dark:text-teal-400 hover:underline"
          >
            Add first student
          </button>
        </div>
      )}
    </div>
  );
}

interface MergeGroupsModalProps {
  selectedGroupIds: string[];
  groups: any[];
  onClose: () => void;
  onMerge: () => void;
}

function MergeGroupsModal({ selectedGroupIds, groups, onClose, onMerge }: MergeGroupsModalProps) {
  const [targetGroupName, setTargetGroupName] = useState('');
  const [merging, setMerging] = useState(false);

  const selectedGroups = groups.filter(g => selectedGroupIds.includes(g.id));
  const totalStudents = selectedGroups.reduce((sum, g) => sum + (g._count?.students || 0), 0);

  const handleMerge = async () => {
    if (!targetGroupName.trim()) {
      alert('Please enter a name for the merged group');
      return;
    }

    setMerging(true);
    try {
      const response = await fetch('/api/groups/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupIds: selectedGroupIds,
          targetGroupName: targetGroupName.trim(),
        }),
      });

      if (response.ok) {
        alert('Groups merged successfully!');
        onMerge();
      } else {
        const error = await response.json();
        alert(`Failed to merge groups: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error merging groups:', error);
      alert('Failed to merge groups');
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-7 h-7 text-purple-600" />
              Merge Groups
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Groups to merge:</h3>
            <ul className="space-y-2">
              {selectedGroups.map(group => (
                <li key={group.id} className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">• {group.name}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {group._count?.students || 0} student{(group._count?.students || 0) !== 1 ? 's' : ''}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-700">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                Total: {totalStudents} student{totalStudents !== 1 ? 's' : ''} from {selectedGroups.length} groups
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Group Name *
            </label>
            <input
              type="text"
              value={targetGroupName}
              onChange={(e) => setTargetGroupName(e.target.value)}
              placeholder="Enter name for merged group"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              All students will be moved to this new group. The old groups will be archived.
            </p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Warning:</strong> This action will:
            </p>
            <ul className="list-disc list-inside text-sm text-amber-700 dark:text-amber-300 mt-2 space-y-1">
              <li>Create a new group with all students from selected groups</li>
              <li>Archive the original groups (they won't be deleted)</li>
              <li>Preserve all student data and progress</li>
            </ul>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={merging}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleMerge}
            disabled={merging || !targetGroupName.trim()}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {merging ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Merging...
              </>
            ) : (
              <>
                <Users className="w-5 h-5" />
                Merge Groups
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
