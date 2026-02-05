"use client";

import { useState, useMemo } from "react";
import Header from "@/components/Header";
import { useStudents } from "@/hooks/useStudents";
import AddStudentModal from "@/components/AddStudentModal";
import StudentDetailsModal from "@/components/StudentDetailsModal";
import EditStudentModal from "@/components/EditStudentModal";
import { 
  Search, Users, ChevronDown, ChevronRight, Plus, Calendar, 
  Phone, Mail, User, TrendingUp, Clock, MapPin, Edit, Trash2, FileText, Grid3x3, Home
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isWithinInterval, parse } from "date-fns";

interface GroupCollection {
  id: string;
  name: string;
  subGroupNames: string[];
}

export default function StudentsPage() {
  const { students: apiStudents, isLoading } = useStudents();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedCollection, setExpandedCollection] = useState<string | null>("montazility");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [viewingStudent, setViewingStudent] = useState<any>(null);

  // Montazility collection
  const groupCollections: GroupCollection[] = [
    {
      id: "montazility",
      name: "Montazility 26'",
      subGroupNames: ["Azelis 26'", "Beyond Insights 26'", "City Logistics 26'", "Monteagle 26'"]
    }
  ];

  // Group students by their group
  const groupedStudents = useMemo(() => {
    const groups: { [key: string]: any } = {};
    apiStudents.forEach((student) => {
      const groupId = student.group?.id || 'no-group';
      if (!groups[groupId]) {
        groups[groupId] = {
          id: groupId,
          name: student.group?.name || 'No Group',
          students: [],
          group: student.group,
        };
      }
      groups[groupId].students.push(student);
    });
    return groups;
  }, [apiStudents]);

  // Separate Montazility sub-groups from other groups
  const montazilityGroups = Object.values(groupedStudents).filter(
    (group: any) => groupCollections[0].subGroupNames.includes(group.name)
  );
  const individualGroups = Object.values(groupedStudents).filter(
    (group: any) => !groupCollections[0].subGroupNames.includes(group.name)
  );

  // Determine current group based on day and time
  // For demo purposes, we'll use the first group as "current"
  // TODO: Implement actual schedule logic based on day/time
  const currentGroupId = useMemo(() => {
    const groupIds = Object.keys(groupedStudents);
    return groupIds.length > 0 ? groupIds[0] : null;
  }, [groupedStudents]);

  const currentGroup = currentGroupId ? groupedStudents[currentGroupId] : null;

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const filterStudents = (students: any[]) => {
    if (!searchQuery) return students;
    return students.filter((student) =>
      `${student.firstName} ${student.lastName} ${student.studentId}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  };

  const renderStudentCard = (student: any) => (
    <div
      key={student.id}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg relative">
            {student.firstName[0]}{student.lastName[0]}
            {student.workingLocation === 'home' && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white">
                <Home className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              {student.firstName} {student.lastName}
              {student.workingLocation === 'home' && (
                <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full flex items-center gap-1">
                  <Home className="w-3 h-3" />
                  Remote
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-500">{student.studentId}</p>
          </div>
        </div>
        <span className={cn(
          "px-2 py-1 text-xs font-medium rounded-full",
          student.status === "ACTIVE" ? "bg-green-100 text-green-700" :
          student.status === "INACTIVE" ? "bg-gray-100 text-gray-700" :
          "bg-red-100 text-red-700"
        )}>
          {student.status}
        </span>
      </div>

      <div className="space-y-2">
        {student.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4" />
            <span>{student.email}</span>
          </div>
        )}
        {student.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="w-4 h-4" />
            <span>{student.phone}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <TrendingUp className="w-4 h-4" />
            <span>Progress: {student.progress}%</span>
          </div>
          <div className="w-32 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${student.progress}%` }}
            />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditingStudent(student)}
            className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete ${student.firstName} ${student.lastName}?`)) {
                // TODO: Implement delete
                console.log('Delete student:', student.id);
              }
            }}
            className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <button
            onClick={() => setViewingStudent(student)}
            className="flex-1 px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors flex items-center justify-center gap-1"
          >
            <FileText className="w-4 h-4" />
            Details
          </button>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading students...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Learners</h1>
          <p className="text-gray-600">
            Manage and track learner progress across all groups
          </p>
        </div>

        {/* Search and Actions */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search learners by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Learner
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Learners</p>
                <p className="text-2xl font-bold text-gray-900">{apiStudents.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Groups</p>
                <p className="text-2xl font-bold text-gray-900">{Object.keys(groupedStudents).length}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Learners</p>
                <p className="text-2xl font-bold text-gray-900">
                  {apiStudents.filter((s) => s.status === 'ACTIVE').length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Group</p>
                <p className="text-lg font-bold text-gray-900">
                  {currentGroup ? currentGroup.name : 'None'}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Current Group (Always Visible) */}
        {currentGroup && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg shadow-lg p-6 text-white mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Current Group: {currentGroup.name}</h2>
                  <p className="text-blue-100">
                    {currentGroup.students.length} learner{currentGroup.students.length !== 1 ? 's' : ''} • 
                    Teaching now
                  </p>
                </div>
                {currentGroup.group && (
                  <div className="text-right">
                    {currentGroup.group.location && (
                      <div className="flex items-center gap-2 justify-end mb-1">
                        <MapPin className="w-4 h-4" />
                        <span>{currentGroup.group.location}</span>
                      </div>
                    )}
                    {currentGroup.group.startDate && (
                      <div className="flex items-center gap-2 justify-end text-blue-100">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(currentGroup.group.startDate), 'dd MMM yyyy')} - 
                          {format(new Date(currentGroup.group.endDate), 'dd MMM yyyy')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterStudents(currentGroup.students).map(renderStudentCard)}
            </div>

            {filterStudents(currentGroup.students).length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-500">No learners found matching your search</p>
              </div>
            )}
          </div>
        )}

        {/* Montazility 26' Collection */}
        {montazilityGroups.length > 0 && (
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200 p-6 cursor-pointer hover:from-purple-100 hover:to-purple-150 transition-colors"
                onClick={() => setExpandedCollection(expandedCollection === "montazility" ? null : "montazility")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-purple-600 text-white p-3 rounded-lg">
                      <Grid3x3 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {groupCollections[0].name}
                        </h3>
                        <span className="px-2 py-1 text-xs font-medium bg-purple-600 text-white rounded-full">
                          Collection
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {montazilityGroups.length} sub-groups • {montazilityGroups.reduce((sum, g: any) => sum + g.students.length, 0)} total students
                      </p>
                    </div>
                  </div>
                  {expandedCollection === "montazility" ? (
                    <ChevronDown className="w-5 h-5 text-purple-700" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-purple-700" />
                  )}
                </div>
              </div>

              {/* Sub-groups */}
              {expandedCollection === "montazility" && (
                <div className="p-6 bg-purple-50/30 space-y-3">
                  {montazilityGroups.map((group: any) => {
                    const isExpanded = expandedGroups.has(group.id);
                    const filteredStudents = filterStudents(group.students);

                    return (
                      <div key={group.id} className="bg-white rounded-lg border border-purple-200">
                        <button
                          onClick={() => toggleGroup(group.id)}
                          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            )}
                            <Users className="w-5 h-5 text-purple-600" />
                            <div className="text-left">
                              <h3 className="font-semibold text-gray-900">{group.name}</h3>
                              <p className="text-sm text-gray-500">
                                {group.students.length} learner{group.students.length !== 1 ? 's' : ''}
                                {group.group?.location && ` • ${group.group.location}`}
                              </p>
                            </div>
                          </div>
                          {group.group?.startDate && (
                            <div className="text-sm text-gray-500">
                              {format(new Date(group.group.startDate), 'dd MMM yyyy')} - 
                              {format(new Date(group.group.endDate), 'dd MMM yyyy')}
                            </div>
                          )}
                        </button>

                        {isExpanded && (
                          <div className="px-6 pb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {filteredStudents.map(renderStudentCard)}
                            </div>
                            {filteredStudents.length === 0 && (
                              <div className="text-center py-8 text-gray-500">
                                No learners found matching your search
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
          </div>
        )}

        {/* Individual Groups */}
        {individualGroups.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Individual Groups</h2>
            <div className="space-y-2">
              {individualGroups.map((group: any) => {
                const isExpanded = expandedGroups.has(group.id);
                const filteredStudents = filterStudents(group.students);

                return (
                  <div key={group.id} className="bg-white rounded-lg shadow">
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                        <Users className="w-5 h-5 text-blue-500" />
                        <div className="text-left">
                          <h3 className="font-semibold text-gray-900">{group.name}</h3>
                          <p className="text-sm text-gray-500">
                            {group.students.length} learner{group.students.length !== 1 ? 's' : ''}
                            {group.group?.location && ` • ${group.group.location}`}
                          </p>
                        </div>
                      </div>
                      {group.group?.startDate && (
                        <div className="text-sm text-gray-500">
                          {format(new Date(group.group.startDate), 'dd MMM yyyy')} - 
                          {format(new Date(group.group.endDate), 'dd MMM yyyy')}
                        </div>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filteredStudents.map(renderStudentCard)}
                        </div>
                        {filteredStudents.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            No learners found matching your search
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {Object.keys(groupedStudents).length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Learners Yet</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first learner</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Learner
            </button>
          </div>
        )}
      </div>
      
      {/* Add Student Modal */}
      {showAddModal && (
        <AddStudentModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={(data) => {
            // TODO: Implement save
            console.log('Add student:', data);
            setShowAddModal(false);
          }}
        />
      )}

      {/* Edit Student Modal - With formatives and attendance */}
      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSave={(updatedStudent) => {
            // TODO: Implement save
            console.log('Save updated student:', updatedStudent);
            setEditingStudent(null);
          }}
        />
      )}

      {/* Student Details Modal - Read-only view */}
      {viewingStudent && (
        <StudentDetailsModal
          student={viewingStudent}
          onClose={() => setViewingStudent(null)}
          onSave={(updatedStudent) => {
            // TODO: Implement save
            console.log('Save updated student:', updatedStudent);
            setViewingStudent(null);
          }}
        />
      )}
    </div>
  );
}
