"use client";

import { createContext, useContext, useState, ReactNode } from "react";

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
  dateOfBirth?: string;
  idNumber?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  enrollmentDate: string;
  expectedGraduation?: string;
  notes?: Note[];
  moduleProgress: ModuleProgress[];
  dailyAttendanceRate?: number;
}

export interface Note {
  id: string;
  date: string;
  content: string;
  type: "GENERAL" | "CONCERN" | "ACHIEVEMENT" | "INTERVENTION";
  author: string;
}

export interface ModuleProgress {
  moduleId: number;
  moduleName: string;
  unitStandards: UnitStandardProgress[];
  isCompleted: boolean;
  completionDate?: string;
  overallProgress: number;
}

export interface UnitStandardProgress {
  id: string;
  code: string;
  title: string;
  credits: number;
  isCompleted: boolean;
  completionDate?: string;
  activities: ActivityProgress[];
  progress: number;
}

export interface ActivityProgress {
  id: string;
  description: string;
  isCompleted: boolean;
  completionDate?: string;
  notes?: string;
}

export interface AttendanceRecord {
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  reason?: string;
}

interface StudentContextType {
  students: Student[];
  attendanceData: { [studentId: string]: AttendanceRecord[] };
  addStudent: (student: Omit<Student, "id" | "enrollmentDate" | "moduleProgress">) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  markAttendance: (studentId: string, date: string, status: string, reason?: string) => void;
  getStudentAttendance: (studentId: string) => AttendanceRecord[];
  addStudentNote: (studentId: string, note: Omit<Note, "id" | "date">) => void;
  updateModuleProgress: (studentId: string, moduleId: number, progress: Partial<ModuleProgress>) => void;
  toggleUnitStandard: (studentId: string, moduleId: number, unitStandardId: string) => void;
  toggleActivity: (studentId: string, moduleId: number, unitStandardId: string, activityId: string) => void;
  calculateStudentProgress: (studentId: string) => number;
  getAtRiskStudents: () => Student[];
  getDailyAttendanceStats: (date: string) => {
    totalStudents: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    notMarked: number;
    attendanceRate: number;
  };
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

// Initial sample data
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
    site: "Johannesburg CBD",
    group: "Group A",
    phone: "+27 11 123 4567",
    email: "thabo.m@example.com",
    enrollmentDate: "2026-01-15",
    expectedGraduation: "2026-07-15",
    notes: [
      {
        id: "n1",
        date: "2026-02-01",
        content: "Excellent participation in group discussions. Shows strong leadership potential.",
        type: "ACHIEVEMENT",
        author: "Facilitator"
      }
    ],
    moduleProgress: [
      {
        moduleId: 1,
        moduleName: "Orientation & Induction",
        isCompleted: true,
        completionDate: "2026-01-25",
        overallProgress: 100,
        unitStandards: []
      },
      {
        moduleId: 2,
        moduleName: "Communication Skills",
        isCompleted: true,
        completionDate: "2026-02-05",
        overallProgress: 100,
        unitStandards: []
      },
      {
        moduleId: 3,
        moduleName: "Market Requirements",
        isCompleted: false,
        overallProgress: 85,
        unitStandards: []
      }
    ],
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
    site: "Pretoria Central",
    group: "Group A",
    phone: "+27 12 234 5678",
    email: "zanele.d@example.com",
    enrollmentDate: "2026-01-15",
    expectedGraduation: "2026-07-15",
    notes: [],
    moduleProgress: [
      {
        moduleId: 1,
        moduleName: "Orientation & Induction",
        isCompleted: true,
        completionDate: "2026-01-28",
        overallProgress: 100,
        unitStandards: []
      },
      {
        moduleId: 2,
        moduleName: "Communication Skills",
        isCompleted: false,
        overallProgress: 72,
        unitStandards: []
      }
    ],
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
    site: "Durban Point",
    group: "Group B",
    phone: "+27 31 345 6789",
    email: "sipho.k@example.com",
    enrollmentDate: "2026-01-15",
    expectedGraduation: "2026-07-15",
    notes: [
      {
        id: "n2",
        date: "2026-02-02",
        content: "High absence rate. Need to contact and provide intervention support.",
        type: "CONCERN",
        author: "Facilitator"
      }
    ],
    moduleProgress: [
      {
        moduleId: 1,
        moduleName: "Orientation & Induction",
        isCompleted: true,
        completionDate: "2026-01-30",
        overallProgress: 100,
        unitStandards: []
      },
      {
        moduleId: 2,
        moduleName: "Communication Skills",
        isCompleted: false,
        overallProgress: 45,
        unitStandards: []
      }
    ],
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
    site: "Cape Town CBD",
    group: "Group A",
    phone: "+27 21 456 7890",
    email: "lerato.m@example.com",
    enrollmentDate: "2026-01-15",
    expectedGraduation: "2026-07-15",
    notes: [
      {
        id: "n3",
        date: "2026-02-03",
        content: "Top performer. Helps other students. Consider for peer mentoring role.",
        type: "ACHIEVEMENT",
        author: "Facilitator"
      }
    ],
    moduleProgress: [
      {
        moduleId: 1,
        moduleName: "Orientation & Induction",
        isCompleted: true,
        completionDate: "2026-01-22",
        overallProgress: 100,
        unitStandards: []
      },
      {
        moduleId: 2,
        moduleName: "Communication Skills",
        isCompleted: true,
        completionDate: "2026-01-30",
        overallProgress: 100,
        unitStandards: []
      },
      {
        moduleId: 3,
        moduleName: "Market Requirements",
        isCompleted: true,
        completionDate: "2026-02-15",
        overallProgress: 100,
        unitStandards: []
      },
      {
        moduleId: 4,
        moduleName: "Life Skills & Wellness",
        isCompleted: false,
        overallProgress: 90,
        unitStandards: []
      }
    ],
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

  const addStudent = (studentData: Omit<Student, "id" | "enrollmentDate" | "moduleProgress">) => {
    const newStudent: Student = {
      ...studentData,
      id: Date.now().toString(),
      enrollmentDate: new Date().toISOString().split("T")[0],
      moduleProgress: [
        {
          moduleId: 1,
          moduleName: "Orientation & Induction",
          isCompleted: false,
          overallProgress: 0,
          unitStandards: []
        }
      ],
      notes: [],
      dailyAttendanceRate: 0
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

    // Update student streak, absence count, and daily attendance rate
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const newAbsenceCount = status === "ABSENT" ? s.absenceCount + 1 : s.absenceCount;
          const newStreak = status === "PRESENT" ? s.attendanceStreak + 1 : 0;
          const newStatus = newAbsenceCount >= 5 ? "AT_RISK" : s.status === "AT_RISK" && newAbsenceCount < 3 ? "ACTIVE" : s.status;
          
          // Calculate daily attendance rate (last 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const recentAttendance = (attendanceData[studentId] || []).filter(
            record => new Date(record.date) >= thirtyDaysAgo
          );
          const presentDays = recentAttendance.filter(r => r.status === "PRESENT").length;
          const totalDays = Math.max(recentAttendance.length, 1);
          const attendanceRate = Math.round((presentDays / totalDays) * 100);
          
          return { 
            ...s, 
            absenceCount: newAbsenceCount, 
            attendanceStreak: newStreak, 
            status: newStatus, 
            lastAttendance: date,
            dailyAttendanceRate: attendanceRate
          };
        }
        return s;
      })
    );
  };

  const getStudentAttendance = (studentId: string): AttendanceRecord[] => {
    return attendanceData[studentId] || [];
  };

  const addStudentNote = (studentId: string, note: Omit<Note, "id" | "date">) => {
    const newNote: Note = {
      ...note,
      id: `note_${Date.now()}`,
      date: new Date().toISOString().split("T")[0]
    };

    setStudents((prev) => prev.map((student) => 
      student.id === studentId 
        ? { ...student, notes: [...(student.notes || []), newNote] }
        : student
    ));
  };

  const updateModuleProgress = (studentId: string, moduleId: number, progress: Partial<ModuleProgress>) => {
    setStudents((prev) => prev.map((student) => {
      if (student.id === studentId) {
        const updatedModuleProgress = student.moduleProgress.map((module) =>
          module.moduleId === moduleId ? { ...module, ...progress } : module
        );
        
        // Calculate overall progress
        const totalProgress = updatedModuleProgress.reduce((sum, mod) => sum + mod.overallProgress, 0);
        const avgProgress = Math.round(totalProgress / updatedModuleProgress.length);
        
        return { 
          ...student, 
          moduleProgress: updatedModuleProgress,
          progress: avgProgress
        };
      }
      return student;
    }));
  };

  const toggleUnitStandard = (studentId: string, moduleId: number, unitStandardId: string) => {
    setStudents((prev) => prev.map((student) => {
      if (student.id === studentId) {
        const updatedModuleProgress = student.moduleProgress.map((module) => {
          if (module.moduleId === moduleId) {
            const updatedUnitStandards = module.unitStandards.map((unit) =>
              unit.id === unitStandardId 
                ? { ...unit, isCompleted: !unit.isCompleted, completionDate: !unit.isCompleted ? new Date().toISOString().split("T")[0] : undefined }
                : unit
            );
            
            const completedUnits = updatedUnitStandards.filter(u => u.isCompleted).length;
            const totalUnits = updatedUnitStandards.length;
            const moduleProgress = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;
            
            return {
              ...module,
              unitStandards: updatedUnitStandards,
              overallProgress: moduleProgress,
              isCompleted: moduleProgress === 100,
              completionDate: moduleProgress === 100 ? new Date().toISOString().split("T")[0] : undefined
            };
          }
          return module;
        });
        
        return { ...student, moduleProgress: updatedModuleProgress };
      }
      return student;
    }));
  };

  const toggleActivity = (studentId: string, moduleId: number, unitStandardId: string, activityId: string) => {
    setStudents((prev) => prev.map((student) => {
      if (student.id === studentId) {
        const updatedModuleProgress = student.moduleProgress.map((module) => {
          if (module.moduleId === moduleId) {
            const updatedUnitStandards = module.unitStandards.map((unit) => {
              if (unit.id === unitStandardId) {
                const updatedActivities = unit.activities.map((activity) =>
                  activity.id === activityId 
                    ? { ...activity, isCompleted: !activity.isCompleted, completionDate: !activity.isCompleted ? new Date().toISOString().split("T")[0] : undefined }
                    : activity
                );
                
                const completedActivities = updatedActivities.filter(a => a.isCompleted).length;
                const totalActivities = updatedActivities.length;
                const unitProgress = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;
                
                return {
                  ...unit,
                  activities: updatedActivities,
                  progress: unitProgress,
                  isCompleted: unitProgress === 100,
                  completionDate: unitProgress === 100 ? new Date().toISOString().split("T")[0] : undefined
                };
              }
              return unit;
            });
            
            return { ...module, unitStandards: updatedUnitStandards };
          }
          return module;
        });
        
        return { ...student, moduleProgress: updatedModuleProgress };
      }
      return student;
    }));
  };

  const calculateStudentProgress = (studentId: string): number => {
    const student = students.find(s => s.id === studentId);
    if (!student || student.moduleProgress.length === 0) return 0;
    
    const totalProgress = student.moduleProgress.reduce((sum, module) => sum + module.overallProgress, 0);
    return Math.round(totalProgress / student.moduleProgress.length);
  };

  const getAtRiskStudents = (): Student[] => {
    return students.filter(student => 
      student.status === "AT_RISK" || 
      student.absenceCount >= 3 || 
      (student.dailyAttendanceRate && student.dailyAttendanceRate < 75)
    );
  };

  const getDailyAttendanceStats = (date: string) => {
    const totalStudents = students.length;
    const present = students.filter(s => getStudentAttendance(s.id).some(r => r.date === date && r.status === "PRESENT")).length;
    const absent = students.filter(s => getStudentAttendance(s.id).some(r => r.date === date && r.status === "ABSENT")).length;
    const late = students.filter(s => getStudentAttendance(s.id).some(r => r.date === date && r.status === "LATE")).length;
    const excused = students.filter(s => getStudentAttendance(s.id).some(r => r.date === date && r.status === "EXCUSED")).length;
    const notMarked = totalStudents - (present + absent + late + excused);
    const attendanceRate = totalStudents > 0 ? Math.round((present / totalStudents) * 100) : 0;
    
    return {
      totalStudents,
      present,
      absent,
      late,
      excused,
      notMarked,
      attendanceRate
    };
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
        addStudentNote,
        updateModuleProgress,
        toggleUnitStandard,
        toggleActivity,
        calculateStudentProgress,
        getAtRiskStudents,
        getDailyAttendanceStats,
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
