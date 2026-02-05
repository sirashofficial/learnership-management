"use client";

import { useState, useMemo } from "react";
import Header from "@/components/Header";
import { useStudents } from "@/hooks/useStudents";
import { 
  Calendar, Clock, MapPin, Users, Edit2, Plus, ChevronLeft, 
  ChevronRight, BookOpen, AlertCircle, Home, Building2, Monitor
} from "lucide-react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

interface TimeSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  groups: string[]; // Group IDs
  venue: string;
  module?: string;
  topic?: string;
  prepareFor?: string;
}

interface Venue {
  id: string;
  name: string;
  icon: any;
  capacity: number;
}

interface GroupCollection {
  id: string;
  name: string;
  subGroups: string[]; // Group IDs that belong to this collection
}

export default function TimetablePage() {
  const { students } = useStudents();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);

  // Get unique groups from students
  const groups = useMemo(() => {
    const uniqueGroups = new Map();
    students.forEach(student => {
      if (student.group && !uniqueGroups.has(student.group.id)) {
        uniqueGroups.set(student.group.id, {
          id: student.group.id,
          name: student.group.name,
          color: "blue" // You can add color logic later
        });
      }
    });
    return Array.from(uniqueGroups.values());
  }, [students]);

  // Available venues
  const venues: Venue[] = [
    { id: "lecture", name: "Lecture Room", icon: Building2, capacity: 40 },
    { id: "computer", name: "Computer Lab", icon: Monitor, capacity: 30 },
    { id: "home", name: "Remote/Home", icon: Home, capacity: 999 },
  ];

  // Group collections - Montzelity 26' contains 4 sub-groups from 2026 cohort
  const [groupCollections] = useState<GroupCollection[]>([
    {
      id: "montzelity-26",
      name: "Montzelity 26'",
      subGroups: ["Azelis 26'", "Beyond Insights 26'", "City Logistics 26'", "Monteagle 26'"] // Using actual group names
    }
  ]);

  // Sample timetable data (09:00 - 14:00) - Using actual group names from database
  const [timetableSlots, setTimetableSlots] = useState<TimeSlot[]>([
    // Monday
    {
      id: "mon-1",
      day: "Monday",
      startTime: "09:00",
      endTime: "14:00",
      groups: ["montzelity-26"], // 2026 cohort collection
      venue: "lecture",
      module: "NVC-M1",
      topic: "Communication and Facilitation Skills",
      prepareFor: "Unit Standard 115753 - Accommodate audience and context needs"
    },
    {
      id: "mon-2",
      day: "Monday",
      startTime: "09:00",
      endTime: "14:00",
      groups: ["Azelis 25'", "Packaging World 25'"], // 2025 cohort groups
      venue: "computer",
      module: "NVC-M2",
      topic: "Organisational Skills - Practical",
      prepareFor: "Unit Standard 7468 - Mathematics exercises"
    },
    // Tuesday
    {
      id: "tue-1",
      day: "Tuesday",
      startTime: "09:00",
      endTime: "14:00",
      groups: ["Flint Group 25'"],
      venue: "lecture",
      module: "NVC-M3",
      topic: "Occupational Health and Safety",
      prepareFor: "Unit Standard 13939 - OHS principles"
    },
    {
      id: "tue-2",
      day: "Tuesday",
      startTime: "09:00",
      endTime: "14:00",
      groups: ["Wahl 25'", "Monteagle 25'"], // 2025 cohort (separate from Monteagle 26' in Montzelity)
      venue: "computer",
      module: "NVC-M2",
      topic: "Organisational Skills - Practical",
      prepareFor: "Unit Standard 12433 - Manage resources"
    },
    // Wednesday
    {
      id: "wed-1",
      day: "Wednesday",
      startTime: "09:00",
      endTime: "14:00",
      groups: ["montzelity-26"], // 2026 cohort collection
      venue: "lecture",
      module: "NVC-M1",
      topic: "Communication and Facilitation Skills",
      prepareFor: "Unit Standard 115754 - Apply communication principles"
    },
    {
      id: "wed-2",
      day: "Wednesday",
      startTime: "09:00",
      endTime: "14:00",
      groups: ["Azelis 25'", "Packaging World 25'"], // 2025 cohort
      venue: "computer",
      module: "NVC-M2",
      topic: "Organisational Skills - Practical",
      prepareFor: "Formative assessment prep"
    },
    // Thursday
    {
      id: "thu-1",
      day: "Thursday",
      startTime: "09:00",
      endTime: "14:00",
      groups: ["Flint Group 25'"],
      venue: "lecture",
      module: "NVC-M3",
      topic: "Occupational Health and Safety",
      prepareFor: "Unit Standard 13940 - Risk assessment"
    },
    {
      id: "thu-2",
      day: "Thursday",
      startTime: "09:00",
      endTime: "14:00",
      groups: ["Wahl 25'", "Monteagle 25'"], // 2025 cohort
      venue: "computer",
      module: "NVC-M2",
      topic: "Organisational Skills - Practical",
      prepareFor: "Computer-based assessments"
    },
    // Friday
    {
      id: "fri-1",
      day: "Friday",
      startTime: "09:00",
      endTime: "14:00",
      groups: ["Kelpack"],
      venue: "lecture",
      module: "NVC-M1",
      topic: "Weekly Review & Assessment",
      prepareFor: "Prepare all weekly materials"
    },
  ]);

  const getGroupName = (groupId: string, showDetails: boolean = true) => {
    // Check if it's a collection
    const collection = groupCollections.find(c => c.id === groupId);
    if (collection) {
      if (showDetails) {
        return `${collection.name} (${collection.subGroups.join(", ")})`;
      } else {
        return collection.name;
      }
    }
    // Otherwise it's a direct group name
    return groupId;
  };

  const isGroupCollection = (groupId: string) => {
    return groupCollections.some(c => c.id === groupId);
  };

  const getCollectionSubGroups = (groupId: string) => {
    const collection = groupCollections.find(c => c.id === groupId);
    if (collection) {
      // Return the sub-group names directly
      return collection.subGroups.map(name => ({ name }));
    }
    return [];
  };

  const getVenueIcon = (venueId: string) => {
    const venue = venues.find(v => v.id === venueId);
    return venue?.icon || MapPin;
  };

  const getVenueName = (venueId: string) => {
    return venues.find(v => v.id === venueId)?.name || venueId;
  };

  // Get current day's schedule
  const currentDayName = format(selectedDate, "EEEE");
  const todaySchedule = timetableSlots.filter(slot => slot.day === currentDayName);

  // Check if current time is within session time
  const isCurrentlyActive = (slot: TimeSlot) => {
    const now = new Date();
    if (!isSameDay(now, selectedDate)) return false;
    
    const [startHour, startMin] = slot.startTime.split(":").map(Number);
    const [endHour, endMin] = slot.endTime.split(":").map(Number);
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    
    const currentTime = currentHour * 60 + currentMin;
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    return currentTime >= startTime && currentTime <= endTime;
  };

  const goToPreviousDay = () => {
    setSelectedDate(addDays(selectedDate, -1));
  };

  const goToNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Timetable" subtitle="Manage training schedules and group sessions" />

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
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </span>
              </div>
              <button
                onClick={goToNextDay}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              {!isSameDay(selectedDate, new Date()) && (
                <button
                  onClick={goToToday}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Today
                </button>
              )}
              <button
                onClick={() => setShowAddSlot(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Session
              </button>
            </div>
          </div>
        </div>

        {/* Today's Schedule */}
        {todaySchedule.length > 0 ? (
          <div className="space-y-4">
            {todaySchedule.map((slot) => {
              const isActive = isCurrentlyActive(slot);
              const VenueIcon = getVenueIcon(slot.venue);

              return (
                <div
                  key={slot.id}
                  className={cn(
                    "bg-white rounded-lg shadow-lg overflow-hidden transition-all",
                    isActive && "ring-2 ring-green-500"
                  )}
                >
                  {/* Header */}
                  <div className={cn(
                    "p-4 flex items-center justify-between",
                    isActive 
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white" 
                      : "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        <span className="font-semibold text-lg">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <VenueIcon className="w-5 h-5" />
                        <span className="font-medium">{getVenueName(slot.venue)}</span>
                      </div>
                      {isActive && (
                        <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                          Currently Active
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setEditingSlot(slot)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Groups */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-gray-400" />
                        <h3 className="font-semibold text-gray-900">Groups</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {slot.groups.map((groupId) => {
                          const isCollection = isGroupCollection(groupId);
                          const subGroups = isCollection ? getCollectionSubGroups(groupId) : [];
                          
                          return (
                            <div key={groupId}>
                              {isCollection ? (
                                <div className="bg-purple-100 border-2 border-purple-300 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Users className="w-4 h-4 text-purple-700" />
                                    <span className="font-semibold text-purple-900">
                                      {getGroupName(groupId, false)}
                                    </span>
                                    <span className="text-xs text-purple-600 bg-purple-200 px-2 py-0.5 rounded-full">
                                      Collection
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {subGroups.map((sg: any) => (
                                      <span
                                        key={sg.id}
                                        className="px-2 py-1 bg-white text-purple-700 border border-purple-300 rounded text-xs font-medium"
                                      >
                                        {sg.name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <span
                                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                                >
                                  {getGroupName(groupId)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Module & Topic */}
                    {slot.module && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="w-5 h-5 text-gray-400" />
                          <h3 className="font-semibold text-gray-900">Current Session</h3>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm font-semibold text-blue-600 mb-1">{slot.module}</p>
                          <p className="text-gray-900 font-medium">{slot.topic}</p>
                        </div>
                      </div>
                    )}

                    {/* Prepare For */}
                    {slot.prepareFor && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-5 h-5 text-orange-400" />
                          <h3 className="font-semibold text-gray-900">Prepare For</h3>
                        </div>
                        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                          <p className="text-gray-700">{slot.prepareFor}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Sessions Scheduled</h3>
            <p className="text-gray-500 mb-4">No training sessions for {currentDayName}</p>
            <button
              onClick={() => setShowAddSlot(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Session
            </button>
          </div>
        )}

        {/* Weekly Overview */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Weekly Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => {
              const daySlots = timetableSlots.filter(s => s.day === day);
              return (
                <div key={day} className="border border-gray-200 rounded-lg p-3">
                  <h3 className="font-semibold text-gray-900 mb-2">{day}</h3>
                  <div className="space-y-2">
                    {daySlots.length > 0 ? (
                      daySlots.map((slot, idx) => (
                        <div key={idx} className="text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Clock className="w-3 h-3" />
                            <span className="text-xs">{slot.startTime}</span>
                          </div>
                          {slot.groups.map((gId) => (
                            <div key={gId} className="text-xs text-gray-700 truncate">
                              {getGroupName(gId)}
                            </div>
                          ))}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400">No sessions</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
