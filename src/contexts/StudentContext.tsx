"use client";

import { createContext, useContext, ReactNode } from "react";
import useSWR, { mutate } from "swr";

export interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  name?: string; // Computed field for backward compatibility
  currentModule?: number;
  moduleName?: string;
  progress: number;
  status: "ACTIVE" | "AT_RISK" | "COMPLETED" | "WITHDRAWN";
  lastAttendance?: string;
  attendanceStreak?: number;
  absenceCount?: number;
  site?: string;
  groupId: string;
  group?: any;
  phone?: string;
  email?: string;
  avatar?: string;
  dateOfBirth?: string;
  idNumber?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  enrollmentDate?: string;
  expectedGraduation?: string;
  notes?: Note[];
  moduleProgress?: ModuleProgress[];
  dailyAttendanceRate?: number;
  createdAt?: string;
  updatedAt?: string;
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
  isLoading: boolean;
  error: any;
  addStudent: (student: any) => Promise<void>;
  updateStudent: (id: string, updates: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  refreshStudents: () => void;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

const fetcher = (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return fetch(url, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  }).then((res) => res.json()).then((data) => {
    // Transform data to include computed name field
    const students = (data.data || data || []).map((student: any) => ({
      ...student,
      name: student.firstName && student.lastName 
        ? `${student.firstName} ${student.lastName}` 
        : student.name || '',
      site: student.group?.name || student.site ||'',
    }));
    return students;
  });
};

export function StudentProvider({ children }: { children: ReactNode }) {
  const { data: studentsData, error, isLoading } = useSWR('/api/students', fetcher);

  const students = studentsData || [];

  const addStudent = async (studentData: any) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const currentUser = userStr ? JSON.parse(userStr) : null;
      
      // Transform the data to match API expectations
      const apiData = {
        studentId: studentData.studentId,
        firstName: studentData.firstName || studentData.name?.split(' ')[0] || studentData.name || '',
        lastName: studentData.lastName || studentData.name?.split(' ').slice(1).join(' ') || '',
        email: studentData.email || null,
        phone: studentData.phone || null,
        idNumber: studentData.idNumber || null,
        groupId: studentData.group || studentData.groupId,
        facilitatorId: studentData.facilitatorId || currentUser?.id || null,
        status: studentData.status || 'ACTIVE',
        progress: studentData.progress || 0,
      };

      console.log('🔄 StudentContext: Sending POST request to /api/students');
      console.log('📦 API Data:', apiData);
      
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(apiData),
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.error || errorData.message || 'Failed to create student');
      }
      
      const result = await response.json();
      console.log('✅ API Success:', result);

      // Refresh the student list
      mutate('/api/students');
      
      // Also refresh dashboard stats
      mutate('/api/dashboard/stats');
    } catch (error) {
      console.error('Error adding student:', error);
      throw error;
    }
  };

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      const response = await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update student');

      mutate('/api/students');
      mutate('/api/dashboard/stats');
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      const response = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error('Failed to delete student');

      mutate('/api/students');
      mutate('/api/dashboard/stats');
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  };

  const refreshStudents = () => {
    mutate('/api/students');
  };

  return (
    <StudentContext.Provider
      value={{
        students,
        isLoading,
        error,
        addStudent,
        updateStudent,
        deleteStudent,
        refreshStudents,
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
