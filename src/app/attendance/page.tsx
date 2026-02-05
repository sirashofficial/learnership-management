"use client";

import { useState, useMemo } from "react";
import Header from "@/components/Header";
import { useStudents } from "@/hooks/useStudents";
import { 
  Calendar, Users, TrendingUp, ChevronDown, ChevronRight, Check, X, 
  ChevronLeft, ChevronRight as ChevronRightIcon, Clock, MapPin, AlertCircle, Plus, Grid3x3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface GroupCollection {
  id: string;
  name: string;
  subGroupNames: string[];
}

export default function AttendancePage() {
  const { students: apiStudents, isLoading } = useStudents();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedCollection, setExpandedCollection] = useState<string | null>("montazility");
  const [attendanceData, setAttendanceData] = useState<{[key: string]: string}>({});

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

  // Determine current group
  const currentGroupId = useMemo(() => {
    const groupIds = Object.keys(groupedStudents);
    return groupIds.length > 0 ? groupIds[0] : null;
  }, [groupedStudents]);

  const currentGroup = currentGroupId ? groupedStudents[currentGroupId] : null;

  const formatDateStr = (date: Date) => {
    return format(date, 'yyyy-MM-dd');
  };

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
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

  const getAttendanceKey = (studentId: string, date: string) => {
    return `${studentId}_${date}`;
  };

  const getAttendanceStatus = (studentId: string) => {
    const key = getAttendanceKey(studentId, formatDateStr(selectedDate));
    return attendanceData[key] || 'NOT_MARKED';
  };

  const markAttendance = (studentId: string, status: string) => {
    const key = getAttendanceKey(studentId, formatDateStr(selectedDate));
    setAttendanceData(prev => ({
      ...prev,
      [key]: status
    }));
  };

  const calculateGroupStats = (students: any[]) => {
    let present = 0, absent = 0, late = 0, notMarked = 0;

    students.forEach(student => {
      const status = getAttendanceStatus(student.id);
      if (status === 'PRESENT') present++;
      else if (status === 'ABSENT') absent++;
      else if (status === 'LATE') late++;
      else notMarked++;
    });

    return { present, absent, late, notMarked, total: students.length };
  };

  const markAllPresent = (students: any[]) => {
    students.forEach(student => {
      if (getAttendanceStatus(student.id) === 'NOT_MARKED') {
        markAttendance(student.id, 'PRESENT');
      }
    });
  };

  const renderAttendanceRow = (student: any) => {
    const status = getAttendanceStatus(student.id);

    return (
      <div
        key={student.id}
        className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
            {student.firstName[0]}{student.lastName[0]}
          </div>
          <div>
            <h4 className="font-medium text-gray-900">
              {student.firstName} {student.lastName}
            </h4>
            <p className="text-sm text-gray-500">{student.studentId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => markAttendance(student.id, 'PRESENT')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-1",
              status === 'PRESENT' 
                ? "bg-green-500 text-white" 
                : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600"
            )}
          >
            <Check className="w-4 h-4" />
            Present
          </button>
          <button
            onClick={() => markAttendance(student.id, 'LATE')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-1",
              status === 'LATE' 
                ? "bg-orange-500 text-white" 
                : "bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600"
            )}
          >
            <Clock className="w-4 h-4" />
            Late
          </button>
          <button
            onClick={() => markAttendance(student.id, 'ABSENT')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-1",
              status === 'ABSENT' 
                ? "bg-red-500 text-white" 
                : "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600"
            )}
          >
            <X className="w-4 h-4" />
            Absent
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Attendance" subtitle="Track daily learner attendance by group" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading attendance...</div>
          </div>
        </div>
      </div>
    );
  }

  const todayStr = formatDateStr(selectedDate);
  const isToday = formatDateStr(new Date()) === todayStr;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Attendance" subtitle="Track daily learner attendance by group" />

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Date Navigation */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={goToPreviousDay}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <span className="font-semibold text-lg text-gray-900">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
              <button
                onClick={goToNextDay}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRightIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            {!isToday && (
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Today
              </button>
            )}
          </div>
        </div>

        {/* Current Group */}
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
                <button
                  onClick={() => markAllPresent(currentGroup.students)}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                >
                  Mark All Present
                </button>
              </div>

              {/* Stats */}
              {(() => {
                const stats = calculateGroupStats(currentGroup.students);
                return (
                  <div className="mt-4 grid grid-cols-4 gap-4">
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="text-blue-100 text-sm">Present</p>
                      <p className="text-2xl font-bold">{stats.present}/{stats.total}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="text-blue-100 text-sm">Late</p>
                      <p className="text-2xl font-bold">{stats.late}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="text-blue-100 text-sm">Absent</p>
                      <p className="text-2xl font-bold">{stats.absent}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <p className="text-blue-100 text-sm">Not Marked</p>
                      <p className="text-2xl font-bold">{stats.notMarked}</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="space-y-3">
              {currentGroup.students.map(renderAttendanceRow)}
            </div>
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
                    const stats = calculateGroupStats(group.students);

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
                                {stats.present}/{stats.total} present • {stats.absent} absent • {stats.late} late
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAllPresent(group.students);
                            }}
                            className="px-3 py-1 bg-purple-50 text-purple-600 text-sm rounded-lg hover:bg-purple-100 transition-colors"
                          >
                            Mark All Present
                          </button>
                        </button>

                        {isExpanded && (
                          <div className="px-6 pb-6 space-y-3">
                            {group.students.map(renderAttendanceRow)}
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
                const stats = calculateGroupStats(group.students);

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
                            {stats.present}/{stats.total} present • {stats.absent} absent • {stats.late} late
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAllPresent(group.students);
                        }}
                        className="px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        Mark All Present
                      </button>
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-6 space-y-3">
                        {group.students.map(renderAttendanceRow)}
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
            <p className="text-gray-500">Add learners to start tracking attendance</p>
          </div>
        )}
      </div>
    </div>
  );
}

