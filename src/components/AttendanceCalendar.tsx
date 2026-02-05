"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttendanceRecord {
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  reason?: string;
}

interface AttendanceCalendarProps {
  studentId: string;
  studentName: string;
  attendance: AttendanceRecord[];
  onMarkAttendance: (date: string, status: string, reason?: string) => void;
  onClose: () => void;
}

export default function AttendanceCalendar({ studentId, studentName, attendance, onMarkAttendance, onClose }: AttendanceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("PRESENT");
  const [selectedReason, setSelectedReason] = useState("");

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getAttendanceForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return attendance.find((a) => a.date === dateStr);
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateStr);
    const existing = attendance.find((a) => a.date === dateStr);
    if (existing) {
      setSelectedStatus(existing.status);
      setSelectedReason(existing.reason || "");
    } else {
      setSelectedStatus("PRESENT");
      setSelectedReason("");
    }
  };

  const handleSave = () => {
    if (selectedDate) {
      onMarkAttendance(selectedDate, selectedStatus, selectedReason);
      setSelectedDate(null);
    }
  };

  const handleMarkAllPresent = () => {
    const days = getDaysInMonth(currentDate).filter((d) => d !== null);
    days.forEach((day) => {
      if (day) {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const existing = attendance.find((a) => a.date === dateStr);
        if (!existing) {
          onMarkAttendance(dateStr, "PRESENT");
        }
      }
    });
  };

  const statusColors = {
    PRESENT: "bg-green-100 text-green-800 border-green-300",
    ABSENT: "bg-red-100 text-red-800 border-red-300",
    LATE: "bg-yellow-100 text-yellow-800 border-yellow-300",
    EXCUSED: "bg-blue-100 text-blue-800 border-blue-300",
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-gray-900">Mark Attendance</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <p className="text-gray-600">Student: {studentName}</p>
        </div>

        {/* Calendar Controls */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleMarkAllPresent}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Mark All Days Present (This Month)
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {getDaysInMonth(currentDate).map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} />;
              }
              const record = getAttendanceForDate(day);
              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={cn(
                    "aspect-square p-2 rounded-lg border-2 text-center font-medium transition-all hover:scale-105",
                    record
                      ? statusColors[record.status]
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <div className="text-sm">{day}</div>
                  {record && (
                    <div className="text-xs mt-0.5">
                      {record.status === "PRESENT" && "✓"}
                      {record.status === "ABSENT" && "✗"}
                      {record.status === "LATE" && "⏰"}
                      {record.status === "EXCUSED" && "📝"}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Edit Attendance */}
        {selectedDate && (
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3">
              Mark Attendance for {new Date(selectedDate).toLocaleDateString()}
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {["PRESENT", "ABSENT", "LATE", "EXCUSED"].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium transition-all",
                    selectedStatus === status
                      ? statusColors[status as keyof typeof statusColors]
                      : "bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
            {selectedStatus !== "PRESENT" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason (optional)</label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select reason...</option>
                  <option value="Sick">Sick</option>
                  <option value="Business">Business</option>
                  <option value="No Show">No Show</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Save
              </button>
              <button
                onClick={() => setSelectedDate(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Legend</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-300" />
              <span className="text-sm text-gray-700">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-300" />
              <span className="text-sm text-gray-700">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-300" />
              <span className="text-sm text-gray-700">Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-300" />
              <span className="text-sm text-gray-700">Excused</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
