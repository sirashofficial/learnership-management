"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export interface Student {
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
  enrollmentDate?: string;
  dailyAttendanceRate?: number;
}

export interface AttendanceRecord {
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  reason?: string;
}

interface StudentContextType {
  students: Student[];
  attendanceData: { [studentId: string]: AttendanceRecord[] };
  addStudent: (student: Omit<Student, "id">) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  markAttendance: (studentId: string, date: string, status: string, reason?: string) => void;
  getStudentAttendance: (studentId: string) => AttendanceRecord[];
  getStudentCountByGroup: (groupName: string) => number;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

// Initial sample data with groups
const initialStudents: Student[] = [
  {
    id: "1",
    name: "Thabo Mokwena",
    studentId: "STU001",
    currentModule: 3,
    moduleName: "Market Requirements",
    progress: 85,
    status: "ACTIVE",
    lastAttendance: "2026-02-04",
    attendanceStreak: 7,
    absenceCount: 1,
    site: "NVC Level 2 - Cohort A",
    group: "NVC Level 2 - Cohort A",
    phone: "+27 11 123 4567",
    email: "thabo.m@example.com",
    enrollmentDate: "2026-01-15",
    dailyAttendanceRate: 92
  },
  {
    id: "2",
    name: "Zanele Dlamini",
    studentId: "STU002",
    currentModule: 2,
    moduleName: "Communication Skills",
    progress: 72,
    status: "ACTIVE",
    lastAttendance: "2026-02-04",
    attendanceStreak: 5,
    absenceCount: 2,
    site: "NVC Level 2 - Cohort A",
    group: "NVC Level 2 - Cohort A",
    phone: "+27 12 234 5678",
    email: "zanele.d@example.com",
    enrollmentDate: "2026-01-15",
    dailyAttendanceRate: 87
  },
  {
    id: "3",
    name: "Sipho Khumalo",
    studentId: "STU003",
    currentModule: 2,
    moduleName: "Communication Skills",
    progress: 45,
    status: "AT_RISK",
    lastAttendance: "2026-02-01",
    attendanceStreak: 0,
    absenceCount: 5,
    site: "Business Admin Level 3",
    group: "Business Admin Level 3",
    phone: "+27 31 345 6789",
    email: "sipho.k@example.com",
    enrollmentDate: "2026-01-15",
    dailyAttendanceRate: 63
  },
  {
    id: "4",
    name: "Lerato Mthembu",
    studentId: "STU004",
    currentModule: 4,
    moduleName: "Life Skills & Wellness",
    progress: 90,
    status: "ACTIVE",
    lastAttendance: "2026-02-04",
    attendanceStreak: 12,
    absenceCount: 0,
    site: "NVC Level 2 - Cohort A",
    group: "NVC Level 2 - Cohort A",
    phone: "+27 21 456 7890",
    email: "lerato.m@example.com",
    enrollmentDate: "2026-01-15",
    dailyAttendanceRate: 98
  },
];

const initialAttendance: { [studentId: string]: AttendanceRecord[] } = {
  "1": [
    { date: "2026-02-04", status: "PRESENT" },
    { date: "2026-02-03", status: "PRESENT" },
    { date: "2026-01-31", status: "ABSENT", reason: "Sick" },
    { date: "2026-01-30", status: "PRESENT" },
  ],
  "2": [
    { date: "2026-02-04", status: "PRESENT" },
    { date: "2026-02-03", status: "LATE" },
    { date: "2026-01-31", status: "PRESENT" },
  ],
  "3": [
    { date: "2026-02-01", status: "ABSENT", reason: "No Show" },
    { date: "2026-01-31", status: "ABSENT", reason: "No Show" },
    { date: "2026-01-30", status: "PRESENT" },
  ],
  "4": [
    { date: "2026-02-04", status: "PRESENT" },
    { date: "2026-02-03", status: "PRESENT" },
    { date: "2026-01-31", status: "PRESENT" },
    { date: "2026-01-30", status: "PRESENT" },
  ],
};

export function StudentProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [attendanceData, setAttendanceData] = useState<{ [studentId: string]: AttendanceRecord[] }>(initialAttendance);

  const addStudent = (studentData: Omit<Student, "id">) => {
    const newStudent: Student = {
      ...studentData,
      id: Date.now().toString(),
    };
    setStudents((prev) => [...prev, newStudent]);
    setAttendanceData((prev) => ({ ...prev, [newStudent.id]: [] }));
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    setStudents((prev) => prev.map((student) => (student.id === id ? { ...student, ...updates } : student)));
  };

  const deleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((student) => student.id !== id));
  };

  const markAttendance = (studentId: string, date: string, status: string, reason?: string) => {
    setAttendanceData((prev) => {
      const existing = prev[studentId] || [];
      const updated = existing.filter((a) => a.date !== date);
      updated.push({ date, status: status as any, reason });
      updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return { ...prev, [studentId]: updated };
    });

    // Update student streak and absence count
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const newAbsenceCount = status === "ABSENT" ? s.absenceCount + 1 : s.absenceCount;
          const newStreak = status === "PRESENT" ? s.attendanceStreak + 1 : 0;
          const newStatus = newAbsenceCount >= 3 ? "AT_RISK" : s.status;
          return { ...s, absenceCount: newAbsenceCount, attendanceStreak: newStreak, status: newStatus, lastAttendance: date };
        }
        return s;
      })
    );
  };

  const getStudentAttendance = (studentId: string): AttendanceRecord[] => {
    return attendanceData[studentId] || [];
  };

  const getStudentCountByGroup = (groupName: string): number => {
    return students.filter(student => student.group === groupName).length;
  };

  return (
    <StudentContext.Provider
      value={{
        students,
        attendanceData,
        addStudent,
        updateStudent,
        deleteStudent,
        markAttendance,
        getStudentAttendance,
        getStudentCountByGroup,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}

export function useStudents() {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error("useStudents must be used within a StudentProvider");
  }
  return context;
}