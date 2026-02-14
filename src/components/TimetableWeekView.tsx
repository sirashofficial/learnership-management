'use client';

import { useState, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { ChevronDown } from 'lucide-react';

interface Session {
  day: string;
  venue: string;
  groups: string[];
  startTime: string;
  endTime: string;
  color: string;
}

interface TimetableWeekViewProps {
  currentDate: Date;
  selectedGroup: string | null;
  onSelectGroup: (groupName: string) => void;
  groups: string[];
  weeklySchedule: Record<string, Record<string, string[]>>;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00', '13:00-14:00'];

const GROUP_COLORS: Record<string, string> = {
  'Montzelity 26\'': 'bg-purple-100 border-purple-300 text-purple-900',
  'Azelis 25\'': 'bg-teal-100 border-teal-300 text-teal-900',
  'Beyond Insights 26\'': 'bg-blue-100 border-blue-300 text-blue-900',
  'City Logistics 26\'': 'bg-cyan-100 border-cyan-300 text-cyan-900',
  'Monteagle 25\'': 'bg-pink-100 border-pink-300 text-pink-900',
  'Kelpack 25\'': 'bg-green-100 border-green-300 text-green-900',
  'Flint Group 25\'': 'bg-indigo-100 border-indigo-300 text-indigo-900',
  'Wahl 25\'': 'bg-amber-100 border-amber-300 text-amber-900',
  'Packaging World 25\'': 'bg-emerald-100 border-emerald-300 text-emerald-900',
};

export default function TimetableWeekView({
  currentDate,
  selectedGroup,
  onSelectGroup,
  groups,
  weeklySchedule
}: TimetableWeekViewProps) {
  const [expandedVenues, setExpandedVenues] = useState<Record<string, boolean>>({
    'Lecture Room': true,
    'Computer Lab': true,
  });

  // Build sessions from weekly schedule
  const sessions = useMemo(() => {
    const result: Session[] = [];
    
    Object.entries(weeklySchedule).forEach(([day, venues]) => {
      Object.entries(venues).forEach(([venue, groupList]) => {
        if (groupList.length > 0) {
          result.push({
            day,
            venue,
            groups: groupList,
            startTime: '09:00',
            endTime: '14:00',
            color: GROUP_COLORS[groupList[0]] || 'bg-gray-100'
          });
        }
      });
    });
    
    return result;
  }, [weeklySchedule]);

  const toggleVenue = (venue: string) => {
    setExpandedVenues(prev => ({
      ...prev,
      [venue]: !prev[venue]
    }));
  };

  // Filter sessions by selected group
  const filteredSessions = selectedGroup
    ? sessions.filter(s => s.groups.includes(selectedGroup))
    : sessions;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
      {/* Group Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Filter by Group
        </label>
        <select
          value={selectedGroup || ''}
          onChange={(e) => onSelectGroup(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Groups</option>
          {groups.map(group => (
            <option key={group} value={group}>{group}</option>
          ))}
        </select>
      </div>

      {/* Weekly Timetable */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Week of {format(currentDate, 'MMM d, yyyy')}
        </h3>

        {/* Schedule by Venue */}
        {(['Lecture Room', 'Computer Lab'] as const).map(venue => {
          const venueSessions = filteredSessions.filter(s => s.venue === venue);
          const isExpanded = expandedVenues[venue];

          return (
            <div key={venue} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              {/* Venue Header */}
              <button
                onClick={() => toggleVenue(venue)}
                className="w-full bg-slate-100 dark:bg-slate-700 p-4 flex items-center justify-between hover:bg-slate-150 dark:hover:bg-slate-600 transition-colors"
              >
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">{venue}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {venueSessions.length} sessions per week
                  </p>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-slate-600 dark:text-slate-400 transition-transform ${
                    isExpanded ? 'rotate-0' : '-rotate-90'
                  }`}
                />
              </button>

              {/* Venue Sessions */}
              {isExpanded && (
                <div className="p-4 space-y-3">
                  {venueSessions.length > 0 ? (
                    venueSessions.map((session, idx) => (
                      <div
                        key={`${session.day}-${venue}-${idx}`}
                        className={`p-4 border-2 rounded-lg ${GROUP_COLORS[session.groups[0]] || 'bg-gray-100'}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold">{session.day}</p>
                            <p className="text-sm opacity-75">
                              {session.startTime} - {session.endTime}
                            </p>
                          </div>
                          <span className="text-xs font-medium bg-black bg-opacity-10 px-2 py-1 rounded">
                            {venue}
                          </span>
                        </div>

                        {/* Groups assigned to this session */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {session.groups.map(group => (
                            <span
                              key={group}
                              className="text-xs font-medium bg-white bg-opacity-50 px-2 py-1 rounded"
                            >
                              {group}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 dark:text-slate-400 text-sm italic">
                      No sessions scheduled in this venue
                      {selectedGroup && ` for ${selectedGroup}`}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Group Colors</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(GROUP_COLORS).map(([groupName, colors]) => (
            <div key={groupName} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded border-2 ${colors}`}></div>
              <span className="text-xs text-slate-600 dark:text-slate-400">{groupName}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
