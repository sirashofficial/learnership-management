"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { useStudents } from "@/hooks/useStudents";
import { 
  Building2, Users, Calendar, MapPin, ChevronDown, ChevronUp,
  Plus, Edit2, Trash2, Grid3x3
} from "lucide-react";
import { format } from "date-fns";

interface GroupCollection {
  id: string;
  name: string;
  subGroupNames: string[];
}

export default function GroupsPage() {
  const { students } = useStudents();
  const [expandedCollection, setExpandedCollection] = useState<string | null>("montazility");

  // Montazility collection with sub-groups
  const groupCollections: GroupCollection[] = [
    {
      id: "montazility",
      name: "Montazility 26'",
      subGroupNames: ["Azelis 26'", "Beyond Insights 26'", "City Logistics 26'", "Monteagle 26'"]
    }
  ];

  // Get all unique groups from students
  const allGroups = Array.from(
    new Map(
      students
        .filter(s => s.group)
        .map(s => [s.group!.id, s.group!])
    ).values()
  );

  // Separate groups: Montazility sub-groups vs individual groups
  const montazilitySubGroups = allGroups.filter(g => 
    groupCollections[0].subGroupNames.includes(g.name)
  );

  const individualGroups = allGroups.filter(g => 
    !groupCollections[0].subGroupNames.includes(g.name)
  );

  // Get students count for each group
  const getGroupStudentCount = (groupId: string) => {
    return students.filter(s => s.group?.id === groupId).length;
  };

  // Get total students in collection
  const getCollectionStudentCount = (collection: GroupCollection) => {
    return montazilitySubGroups.reduce((total, group) => 
      total + getGroupStudentCount(group.id), 0
    );
  };

  // Calculate group progress
  const getGroupProgress = (groupId: string) => {
    const groupStudents = students.filter(s => s.group?.id === groupId);
    if (groupStudents.length === 0) return 0;
    const totalProgress = groupStudents.reduce((sum, s) => sum + (s.progress || 0), 0);
    return Math.round(totalProgress / groupStudents.length);
  };

  const toggleCollection = (collectionId: string) => {
    setExpandedCollection(expandedCollection === collectionId ? null : collectionId);
  };

  return (
    <>
      <Header 
        title="Groups Management" 
        subtitle="Manage training groups and collections"
      />
      
      <div className="p-6 space-y-6">
        {/* Add New Group Button */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Training Groups</h2>
            <p className="text-sm text-gray-500 mt-1">
              {allGroups.length} total groups • {students.length} total students
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            Add New Group
          </button>
        </div>

        {/* Montazility Collection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200 p-6 cursor-pointer hover:from-purple-100 hover:to-purple-150 transition-colors"
            onClick={() => toggleCollection("montazility")}
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
                    {montazilitySubGroups.length} sub-groups • {getCollectionStudentCount(groupCollections[0])} total students
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-purple-200 rounded-lg transition-colors">
                  <Edit2 className="w-5 h-5 text-purple-700" />
                </button>
                {expandedCollection === "montazility" ? (
                  <ChevronUp className="w-5 h-5 text-purple-700" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-purple-700" />
                )}
              </div>
            </div>
          </div>

          {/* Sub-groups */}
          {expandedCollection === "montazility" && (
            <div className="p-6 bg-purple-50/30 space-y-3">
              {montazilitySubGroups.map((group) => {
                const studentCount = getGroupStudentCount(group.id);
                const progress = getGroupProgress(group.id);
                
                return (
                  <div 
                    key={group.id}
                    className="bg-white rounded-lg border border-purple-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <Building2 className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{group.name}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {studentCount} {studentCount === 1 ? 'student' : 'students'}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {group.location || 'No location set'}
                            </span>
                            {group.startDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(group.startDate), 'MMM yyyy')} - {group.endDate ? format(new Date(group.endDate), 'MMM yyyy') : 'Ongoing'}
                              </span>
                            )}
                          </div>
                          {/* Progress Bar */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                              <span>Average Progress</span>
                              <span className="font-medium">{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <Edit2 className="w-5 h-5 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Individual Groups */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Individual Groups</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {individualGroups.map((group) => {
              const studentCount = getGroupStudentCount(group.id);
              const progress = getGroupProgress(group.id);
              
              return (
                <div 
                  key={group.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg">{group.name}</h4>
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium mt-1 inline-block">
                          {group.status || 'Active'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Edit2 className="w-5 h-5 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">{studentCount}</span> {studentCount === 1 ? 'student' : 'students'}
                    </div>
                    
                    {group.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {group.location}
                      </div>
                    )}
                    
                    {group.startDate && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(group.startDate), 'MMM dd, yyyy')} - {group.endDate ? format(new Date(group.endDate), 'MMM dd, yyyy') : 'Ongoing'}
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="pt-3">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                        <span className="font-medium">Average Progress</span>
                        <span className="font-semibold text-blue-600">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {group.notes && (
                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">{group.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Empty State */}
        {allGroups.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Groups Yet</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first training group</p>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Create First Group
            </button>
          </div>
        )}
      </div>
    </>
  );
}
