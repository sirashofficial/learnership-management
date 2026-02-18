/**
 * Shared attendance calculation utility
 * Ensures consistent attendance % calculation across all pages
 * 
 * Formula: Average of per-student attendance rates
 * This accounts for students with different numbers of records
 */

export interface AttendanceRecord {
  studentId: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
  date: Date | string;
}

export interface StudentAttendanceBreakdown {
  studentId: string;
  total: number;
  present: number;
  late: number;
  absent: number;
  excused: number;
  attendanceRate: number;
}

export interface GroupAttendanceStats {
  totalRecords: number;
  totalStudents: number;
  present: number;
  late: number;
  absent: number;
  excused: number;
  attendanceRate: number;
  perStudentBreakdown: StudentAttendanceBreakdown[];
}

/**
 * Calculate attendance rate for a single student
 * Formula: (present + late) / total * 100
 * Note: Both present and late count as "attended"
 */
export function calculateStudentAttendance(
  records: AttendanceRecord[],
  weight: { present: number; late: number } = { present: 1.0, late: 0.5 }
): number {
  if (records.length === 0) return 0;
  
  const present = records.filter(r => r.status === 'PRESENT').length;
  const late = records.filter(r => r.status === 'LATE').length;
  
  const weighted = (present * weight.present + late * weight.late);
  return (weighted / records.length) * 100;
}

/**
 * Calculate attendance rate for a group
 * CORRECT Formula: Average of each student's attendance rate
 * Not: total present / total records (which is wrong)
 */
export function calculateGroupAttendance(
  records: AttendanceRecord[]
): GroupAttendanceStats {
  if (records.length === 0) {
    return {
      totalRecords: 0,
      totalStudents: 0,
      present: 0,
      late: 0,
      absent: 0,
      excused: 0,
      attendanceRate: 0,
      perStudentBreakdown: [],
    };
  }

  // Group records by student
  const studentMap = new Map<string, AttendanceRecord[]>();
  records.forEach(record => {
    if (!studentMap.has(record.studentId)) {
      studentMap.set(record.studentId, []);
    }
    studentMap.get(record.studentId)!.push(record);
  });

  // Calculate per-student attendance rates
  const perStudentBreakdown: StudentAttendanceBreakdown[] = [];
  let totalAttendanceRate = 0;

  studentMap.forEach((studentRecords, studentId) => {
    const present = studentRecords.filter(r => r.status === 'PRESENT').length;
    const late = studentRecords.filter(r => r.status === 'LATE').length;
    const absent = studentRecords.filter(r => r.status === 'ABSENT').length;
    const excused = studentRecords.filter(r => r.status === 'EXCUSED').length;
    const total = studentRecords.length;

    // Student attendance rate: (present + late) / total
    const studentRate = total > 0 ? ((present + late) / total) * 100 : 0;
    totalAttendanceRate += studentRate;

    perStudentBreakdown.push({
      studentId,
      total,
      present,
      late,
      absent,
      excused,
      attendanceRate: Math.round(studentRate * 100) / 100,
    });
  });

  // Group-level attendance is the average of all student rates
  const groupAttendanceRate = studentMap.size > 0
    ? totalAttendanceRate / studentMap.size
    : 0;

  // Totals for display
  const present = records.filter(r => r.status === 'PRESENT').length;
  const late = records.filter(r => r.status === 'LATE').length;
  const absent = records.filter(r => r.status === 'ABSENT').length;
  const excused = records.filter(r => r.status === 'EXCUSED').length;

  return {
    totalRecords: records.length,
    totalStudents: studentMap.size,
    present,
    late,
    absent,
    excused,
    attendanceRate: Math.round(groupAttendanceRate * 100) / 100,
    perStudentBreakdown,
  };
}

/**
 * Calculate what the OLD (WRONG) formula would return
 * This is used for migration/comparison purposes only
 * DEPRECATED: Do not use for new code
 */
export function calculateGroupAttendanceOldMethod(records: AttendanceRecord[]): number {
  if (records.length === 0) return 0;
  const present = records.filter(r => r.status === 'PRESENT').length;
  const late = records.filter(r => r.status === 'LATE').length;
  return ((present + late) / records.length) * 100;
}

/**
 * Get attendance rate formatted as a percentage string
 */
export function formatAttendancePercent(rate: number): string {
  return `${Math.round(rate)}%`;
}

/**
 * Determine attendance status badge
 */
export function getAttendanceStatus(rate: number): { status: string; color: string } {
  if (rate >= 90) return { status: 'Excellent', color: 'emerald' };
  if (rate >= 80) return { status: 'Good', color: 'teal' };
  if (rate >= 70) return { status: 'Fair', color: 'amber' };
  if (rate >= 60) return { status: 'Poor', color: 'orange' };
  return { status: 'Critical', color: 'red' };
}
