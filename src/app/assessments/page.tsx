"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { useCurriculum } from "@/hooks/useCurriculum";
import { useStudents } from "@/hooks/useStudents";
import { 
  ChevronDown, ChevronRight, Users, CheckCircle, Clock, 
  XCircle, Calendar, BookOpen, FileText, TrendingUp, Grid3x3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface GroupProgress {
  groupId: string;
  groupName: string;
  totalStudents: number;
  completedStudents: number;
  inProgressStudents: number;
  notStartedStudents: number;
  predictedCompletionDate?: Date;
}

interface GroupCollection {
  id: string;
  name: string;
  subGroupNames: string[];
}

export default function AssessmentsPage() {
  const { modules, isLoading } = useCurriculum();
  const { students } = useStudents();
  
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedUnitStandards, setExpandedUnitStandards] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedCollection, setExpandedCollection] = useState<string | null>("montazility");

  // Montazility collection
  const groupCollections: GroupCollection[] = [
    {
      id: "montazility",
      name: "Montazility 26'",
      subGroupNames: ["Azelis 26'", "Beyond Insights 26'", "City Logistics 26'", "Monteagle 26'"]
    }
  ];

  // Group students by their group
  const groupedStudents = students.reduce((acc: any, student) => {
    const groupId = student.group?.id || 'no-group';
    const groupName = student.group?.name || 'No Group';
    if (!acc[groupId]) {
      acc[groupId] = { groupId, groupName, students: [] };
    }
    acc[groupId].students.push(student);
    return acc;
  }, {});

  // Separate Montazility sub-groups from other groups
  const montazilityGroupIds = Object.keys(groupedStudents).filter(
    (groupId) => groupCollections[0].subGroupNames.includes(groupedStudents[groupId].groupName)
  );
  const individualGroupIds = Object.keys(groupedStudents).filter(
    (groupId) => !groupCollections[0].subGroupNames.includes(groupedStudents[groupId].groupName)
  );

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const toggleUnitStandard = (usId: string) => {
    const newExpanded = new Set(expandedUnitStandards);
    if (newExpanded.has(usId)) {
      newExpanded.delete(usId);
    } else {
      newExpanded.add(usId);
    }
    setExpandedUnitStandards(newExpanded);
  };

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const updateStudentStatus = async (studentId: string, unitStandardId: string, status: 'COMPETENT' | 'NOT_YET_COMPETENT' | 'IN_PROGRESS') => {
    try {
      // TODO: Implement API call to update student assessment status
      console.log('Update status:', { studentId, unitStandardId, status });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  // Calculate group progress for a unit standard
  const calculateGroupProgress = (groupId: string, unitStandardId: string): GroupProgress => {
    const group = groupedStudents[groupId];
    if (!group) {
      return {
        groupId,
        groupName: 'Unknown',
        totalStudents: 0,
        completedStudents: 0,
        inProgressStudents: 0,
        notStartedStudents: 0,
      };
    }

    // TODO: Fetch actual progress from database
    // For now, return mock data
    const total = group.students.length;
    return {
      groupId,
      groupName: group.groupName,
      totalStudents: total,
      completedStudents: Math.floor(total * 0.4),
      inProgressStudents: Math.floor(total * 0.3),
      notStartedStudents: Math.floor(total * 0.3),
      predictedCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPETENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
            <CheckCircle className="w-3 h-3" />
            Competent
          </span>
        );
      case 'NOT_YET_COMPETENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full">
            <XCircle className="w-3 h-3" />
            NYC
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
            <Clock className="w-3 h-3" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-700 text-xs font-medium rounded-full">
            <Clock className="w-3 h-3" />
            Not Started
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading curriculum...</div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Tracking</h1>
          <p className="text-gray-600">
            Track learner progress across all modules and unit standards
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Modules</p>
                <p className="text-2xl font-bold text-gray-900">{modules.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unit Standards</p>
                <p className="text-2xl font-bold text-gray-900">{modules.reduce((sum, m) => sum + (m.unitStandards?.length || 0), 0)}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Learners</p>
                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Groups</p>
                <p className="text-2xl font-bold text-gray-900">{Object.keys(groupedStudents).length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Hierarchical Assessment View */}
        <div className="bg-white rounded-lg shadow">
          <div className="space-y-1">
            {modules.map((module) => {
              const moduleUnitStandards = module.unitStandards || [];
              const isModuleExpanded = expandedModules.has(module.id);

              return (
                <div key={module.id} className="border-b last:border-b-0">
                  {/* Module Header */}
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isModuleExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                      <BookOpen className="w-5 h-5 text-blue-500" />
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">{module.code}</h3>
                        <p className="text-sm text-gray-600">{module.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">
                        {module.credits} Credits • {moduleUnitStandards.length} Unit Standards
                      </span>
                    </div>
                  </button>

                  {/* Unit Standards */}
                  {isModuleExpanded && (
                    <div className="bg-gray-50">
                      {moduleUnitStandards.map((unitStandard) => {
                        const isUSExpanded = expandedUnitStandards.has(unitStandard.id);

                        return (
                          <div key={unitStandard.id} className="border-t border-gray-200">
                            {/* Unit Standard Header */}
                            <button
                              onClick={() => toggleUnitStandard(unitStandard.id)}
                              className="w-full px-6 py-3 pl-16 flex items-center justify-between hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                {isUSExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                )}
                                <FileText className="w-4 h-4 text-purple-500" />
                                <div className="text-left">
                                  <h4 className="font-medium text-gray-900">{unitStandard.code}</h4>
                                  <p className="text-sm text-gray-600">{unitStandard.title}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-500">
                                  {unitStandard.credits} Credits • NQF Level {unitStandard.level}
                                </span>
                              </div>
                            </button>

                            {/* Groups Progress */}
                            {isUSExpanded && (
                              <div className="bg-white">
                                {/* Montazility Collection */}
                                {montazilityGroupIds.length > 0 && (
                                  <div className="border-t border-gray-100">
                                    <div 
                                      className="px-6 py-3 pl-24 flex items-center gap-3 bg-purple-50 cursor-pointer hover:bg-purple-100 transition-colors"
                                      onClick={() => toggleGroup(`${unitStandard.id}-montazility`)}
                                    >
                                      {expandedGroups.has(`${unitStandard.id}-montazility`) ? (
                                        <ChevronDown className="w-4 h-4 text-purple-600" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4 text-purple-600" />
                                      )}
                                      <Grid3x3 className="w-4 h-4 text-purple-600" />
                                      <span className="font-semibold text-gray-900">
                                        {groupCollections[0].name}
                                      </span>
                                      <span className="px-2 py-0.5 text-xs font-medium bg-purple-600 text-white rounded-full">
                                        Collection
                                      </span>
                                      <span className="text-sm text-gray-500 ml-auto">
                                        {montazilityGroupIds.reduce((sum, gId) => sum + groupedStudents[gId].students.length, 0)} students in {montazilityGroupIds.length} sub-groups
                                      </span>
                                    </div>

                                    {expandedGroups.has(`${unitStandard.id}-montazility`) && (
                                      <div className="bg-purple-50/30">
                                        {montazilityGroupIds.map((groupId) => {
                                          const progress = calculateGroupProgress(groupId, unitStandard.id);
                                          const isGroupExpanded = expandedGroups.has(`${unitStandard.id}-${groupId}`);

                                          return (
                                            <div key={groupId} className="border-t border-purple-100">
                                              <button
                                                onClick={() => toggleGroup(`${unitStandard.id}-${groupId}`)}
                                                className="w-full px-6 py-3 pl-32 flex items-center justify-between hover:bg-white transition-colors"
                                              >
                                                <div className="flex items-center gap-3">
                                                  {isGroupExpanded ? (
                                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                                  ) : (
                                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                                  )}
                                                  <Users className="w-4 h-4 text-purple-600" />
                                                  <span className="font-medium text-gray-900">
                                                    {progress.groupName}
                                                  </span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                  <div className="flex items-center gap-2 text-sm">
                                                    <span className="text-purple-600 font-medium">
                                                      {progress.completedStudents}/{progress.totalStudents}
                                                    </span>
                                                    <span className="text-gray-500">completed</span>
                                                  </div>
                                                  {progress.predictedCompletionDate && (
                                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                                      <Calendar className="w-3 h-3" />
                                                      Est: {format(progress.predictedCompletionDate, 'dd MMM yyyy')}
                                                    </div>
                                                  )}
                                                </div>
                                              </button>

                                              {isGroupExpanded && (
                                                <div className="bg-white">
                                                  {groupedStudents[groupId].students.map((student: any) => {
                                                    const studentStatus = 'NOT_STARTED';

                                                    return (
                                                      <div
                                                        key={student.id}
                                                        className="px-6 py-3 pl-40 flex items-center justify-between border-t border-gray-200"
                                                      >
                                                        <div className="flex items-center gap-3">
                                                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-sm font-medium text-purple-700">
                                                            {student.firstName[0]}{student.lastName[0]}
                                                          </div>
                                                          <div>
                                                            <p className="font-medium text-gray-900">
                                                              {student.firstName} {student.lastName}
                                                            </p>
                                                            <p className="text-sm text-gray-500">
                                                              {student.studentId}
                                                            </p>
                                                          </div>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-3">
                                                          {getStatusBadge(studentStatus)}
                                                          <select
                                                            value={studentStatus}
                                                            onChange={(e) => updateStudentStatus(student.id, unitStandard.id, e.target.value as any)}
                                                            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                          >
                                                            <option value="NOT_STARTED">Not Started</option>
                                                            <option value="IN_PROGRESS">In Progress</option>
                                                            <option value="COMPETENT">Competent</option>
                                                            <option value="NOT_YET_COMPETENT">Not Yet Competent</option>
                                                          </select>
                                                        </div>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Individual Groups */}
                                {individualGroupIds.map((groupId) => {
                                  const progress = calculateGroupProgress(groupId, unitStandard.id);
                                  const isGroupExpanded = expandedGroups.has(`${unitStandard.id}-${groupId}`);

                                  return (
                                    <div key={groupId} className="border-t border-gray-100">
                                      <button
                                        onClick={() => toggleGroup(`${unitStandard.id}-${groupId}`)}
                                        className="w-full px-6 py-3 pl-24 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                      >
                                        <div className="flex items-center gap-3">
                                          {isGroupExpanded ? (
                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                          ) : (
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                          )}
                                          <Users className="w-4 h-4 text-blue-500" />
                                          <span className="font-medium text-gray-900">
                                            {progress.groupName}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                          <div className="flex items-center gap-2 text-sm">
                                            <span className="text-green-600 font-medium">
                                              {progress.completedStudents}/{progress.totalStudents}
                                            </span>
                                            <span className="text-gray-500">completed</span>
                                          </div>
                                          {progress.predictedCompletionDate && (
                                            <div className="flex items-center gap-1 text-sm text-gray-500">
                                              <Calendar className="w-3 h-3" />
                                              Est: {format(progress.predictedCompletionDate, 'dd MMM yyyy')}
                                            </div>
                                          )}
                                        </div>
                                      </button>

                                      {/* Individual Students */}
                                      {isGroupExpanded && (
                                        <div className="bg-gray-50">
                                          {groupedStudents[groupId].students.map((student: any) => {
                                            // TODO: Fetch actual assessment status from database
                                            const studentStatus = 'NOT_STARTED';

                                            return (
                                              <div
                                                key={student.id}
                                                className="px-6 py-3 pl-32 flex items-center justify-between border-t border-gray-200"
                                              >
                                                <div className="flex items-center gap-3">
                                                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                                                    {student.firstName[0]}{student.lastName[0]}
                                                  </div>
                                                  <div>
                                                    <p className="font-medium text-gray-900">
                                                      {student.firstName} {student.lastName}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                      {student.studentId}
                                                    </p>
                                                  </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-3">
                                                  {getStatusBadge(studentStatus)}
                                                  
                                                  <div className="flex gap-2">
                                                    <button
                                                      onClick={() => updateStudentStatus(student.id, unitStandard.id, 'COMPETENT')}
                                                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                                    >
                                                      Complete
                                                    </button>
                                                    <button
                                                      onClick={() => updateStudentStatus(student.id, unitStandard.id, 'IN_PROGRESS')}
                                                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                                    >
                                                      In Progress
                                                    </button>
                                                    <button
                                                      onClick={() => updateStudentStatus(student.id, unitStandard.id, 'NOT_YET_COMPETENT')}
                                                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                                    >
                                                      NYC
                                                    </button>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
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
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
