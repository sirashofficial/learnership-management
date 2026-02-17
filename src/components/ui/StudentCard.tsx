"use client";

import { memo } from "react";
import Image from "next/image";
import { User, Calendar, TrendingUp, AlertCircle, Edit, Trash2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentCardProps {
  student: {
    id: string;
    name: string;
    studentId: string;
    currentModule: number;
    moduleName: string;
    progress: number;
    status: "ACTIVE" | "AT_RISK" | "COMPLETED" | "WITHDRAWN";
    lastAttendance: string;
    attendanceStreak: number;
    absenceCount: number;
    site: string;
    group?: string;
    phone?: string;
    email?: string;
    avatar?: string;
    dailyAttendanceRate?: number;
  };
  onMarkAttendance: () => void;
  onUpdateProgress: () => void;
  onAddNote: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function StudentCard({ 
  student, 
  onMarkAttendance, 
  onUpdateProgress, 
  onAddNote, 
  onEdit, 
  onDelete
}: StudentCardProps) {
  const statusColors = {
    ACTIVE: "bg-green-100 text-green-800 border-green-200",
    AT_RISK: "bg-red-100 text-red-800 border-red-200",
    COMPLETED: "bg-blue-100 text-blue-800 border-blue-200",
    WITHDRAWN: "bg-slate-100 text-slate-800 border-slate-200",
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const daysAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    return diff === 0 ? "Today" : diff === 1 ? "Yesterday" : `${diff} days ago`;
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar */}
        <div className="relative">
          {student.avatar ? (
            <Image
              src={student.avatar}
              alt={student.name}
              width={56}
              height={56}
              sizes="56px"
              loading="lazy"
              className="w-14 h-14 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-white font-bold text-lg">{getInitials(student.name)}</span>
            </div>
          )}
          {student.attendanceStreak >= 5 && (
            <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              🔥 {student.attendanceStreak}
            </div>
          )}
          
          {/* Daily Attendance Badge */}
          {student.dailyAttendanceRate && (
            <div className={cn(
              "absolute -top-2 -left-2 px-2 py-1 text-xs font-bold rounded-full",
              student.dailyAttendanceRate >= 90 ? "bg-green-100 text-green-700" :
              student.dailyAttendanceRate >= 75 ? "bg-yellow-100 text-yellow-700" :
              "bg-red-100 text-red-700"
            )}>
              {student.dailyAttendanceRate}%
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <h3 className="font-semibold text-slate-900 text-lg truncate">{student.name}</h3>
              <p className="text-sm text-slate-500">ID: {student.studentId}</p>
              {student.group && (
                <p className="text-xs text-slate-400">{student.group} • {student.site}</p>
              )}
            </div>
            <div className="flex gap-1">
              <button
                onClick={onEdit}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                title="Edit student"
                aria-label="Edit student"
              >
                <Edit className="w-4 h-4 text-slate-600" />
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete student"
                aria-label="Delete student"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>

          {/* Status & Warnings */}
          <div className="flex flex-wrap gap-2 mb-2">
            <span className={cn("px-2 py-1 text-xs font-medium rounded-full border", statusColors[student.status])}>
              {student.status.replace("_", " ")}
            </span>
            
            {student.dailyAttendanceRate && (
              <span className={cn(
                "px-2 py-1 text-xs font-medium rounded-full border",
                student.dailyAttendanceRate >= 90 ? "bg-green-50 text-green-700 border-green-200" :
                student.dailyAttendanceRate >= 75 ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                "bg-red-50 text-red-700 border-red-200"
              )}>
              {student.dailyAttendanceRate >= 90 ? "Excellent" :
               student.dailyAttendanceRate >= 75 ? "Good" :
               student.dailyAttendanceRate >= 60 ? "Fair" : "Poor"}
              </span>
            )}
            
            {student.absenceCount >= 3 && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {student.absenceCount} absences
              </span>
            )}
          </div>

          {/* Current Module */}
          <div className="flex items-center gap-1.5 text-sm text-slate-700 mb-1">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="font-medium">Module {student.currentModule}:</span>
            <span className="truncate">{student.moduleName}</span>
          </div>

          {/* Last Attendance */}
          <div className="flex items-center gap-1.5 text-sm text-slate-600">
            <Calendar className="w-4 h-4" />
            <span>Last seen: {daysAgo(student.lastAttendance)}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="text-slate-700 font-medium">Overall Progress</span>
          <span className="text-slate-900 font-semibold">{student.progress}%</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
            style={{ width: `${student.progress}%` }}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={onMarkAttendance}
          className="px-3 py-2 text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors flex items-center justify-center gap-1.5"
        >
          <Calendar className="w-4 h-4" />
          Attendance
        </button>
        <button
          onClick={onUpdateProgress}
          className="px-3 py-2 text-sm font-medium text-secondary bg-secondary/5 hover:bg-secondary/10 rounded-lg transition-colors flex items-center justify-center gap-1.5"
        >
          <TrendingUp className="w-4 h-4" />
          Progress
        </button>
        <button
          onClick={onAddNote}
          className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-1.5"
        >
          <FileText className="w-4 h-4" />
          Note
        </button>
      </div>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(StudentCard);
