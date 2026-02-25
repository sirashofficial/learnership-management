/**
 * UNIFIED METRICS CALCULATION ENGINE - COMPREHENSIVE TEST SUITE
 * 
 * Tests verify correct calculation behavior across edge cases:
 * - Empty groups (zero students)
 * - Missing assessments (incomplete records)
 * - Partial attendance (students with no attendance yet)
 * - Consistent results between Dashboard and Groups endpoints
 * - SSETA regulatory compliance (140 credit hours)
 * - Gating logic (SUMMATIVE, FORMATIVE, WORKPLACE requirements)
 */

import {
  calculateGroupMetrics,
  calculateStudentProgress,
  calculateAttendanceRate,
  calculateMultipleGroupMetrics,
  validateGroupMetrics,
  UnifiedGroupMetrics,
  StudentProgressMetrics,
  AttendanceMetrics,
} from '../unifiedMetrics';
import prisma from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    student: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      aggregate: jest.fn(),
    },
    assessment: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    attendance: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('UnifiedMetrics - calculateGroupMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Edge Case: Empty Groups (Zero Students)', () => {
    it('should return zero metrics for empty group', async () => {
      const groupId = 'test-group-empty';
      
      (prisma.student.count as jest.Mock).mockResolvedValue(0);

      const result = await calculateGroupMetrics(groupId);

      expect(result).toEqual({
        avgCreditsPerStudent: 0,
        avgProgressPercent: 0,
        totalCreditsEarned: 0,
        totalUniqueUnitsPassed: 0,
        totalCreditsRequired: 138,
        studentCount: 0,
        atRiskCount: 0,
      });

      expect(prisma.student.count).toHaveBeenCalledWith({
        where: {
          groupId: groupId,
          status: { not: 'WITHDRAWN' }
        }
      });
    });

    it('should handle division by zero safely', async () => {
      const groupId = 'test-group-div-zero';
      
      (prisma.student.count as jest.Mock).mockResolvedValue(0);

      const result = await calculateGroupMetrics(groupId);
      
      // Should not throw, all values should be 0
      expect(result.avgProgressPercent).toBe(0);
      expect(result.avgCreditsPerStudent).toBe(0);
    });
  });

  describe('Edge Case: Missing Assessments (Incomplete Records)', () => {
    it('should handle group with students but no competent assessments', async () => {
      const groupId = 'test-group-no-assessments';

      (prisma.student.count as jest.Mock).mockResolvedValue(3);
      (prisma.assessment.findMany as jest.Mock)
        .mockResolvedValueOnce([])  // No competent assessments
        .mockResolvedValueOnce([]);  // No gated assessments

      const result = await calculateGroupMetrics(groupId);

      expect(result).toEqual({
        avgCreditsPerStudent: 0,
        avgProgressPercent: 0,
        totalCreditsEarned: 0,
        totalUniqueUnitsPassed: 0,
        totalCreditsRequired: 138,
        studentCount: 3,
        atRiskCount: 0,
      });
    });

    it('should count each unit standard only once per student', async () => {
      const groupId = 'test-group-duplicate-units';

      (prisma.student.count as jest.Mock).mockResolvedValue(1);

      // Student has completed Unit A multiple times (multiple assessments for same unit)
      const mockAssessments = [
        {
          studentId: 'student-1',
          unitStandardId: 'unit-a',
          unitStandard: { credits: 10, code: 'USA001', module: { moduleNumber: 1, id: 'mod-1' } },
        },
        {
          studentId: 'student-1',
          unitStandardId: 'unit-a',
          unitStandard: { credits: 10, code: 'USA001', module: { moduleNumber: 1, id: 'mod-1' } },
        },
        {
          studentId: 'student-1',
          unitStandardId: 'unit-b',
          unitStandard: { credits: 8, code: 'USA002', module: { moduleNumber: 1, id: 'mod-1' } },
        },
      ];

      (prisma.assessment.findMany as jest.Mock)
        .mockResolvedValueOnce(mockAssessments)  // Competent assessments
        .mockResolvedValueOnce([]);  // Gated assessments for at-risk check

      const result = await calculateGroupMetrics(groupId);

      // Should count 10 credits from unit-a ONCE, plus 8 from unit-b = 18 total
      expect(result.totalCreditsEarned).toBe(18);
      expect(result.totalUniqueUnitsPassed).toBe(2);
      expect(result.avgCreditsPerStudent).toBe(18); // 18 / 1 student
    });

    it('should skip assessments without unitStandardId', async () => {
      const groupId = 'test-group-null-units';

      (prisma.student.count as jest.Mock).mockResolvedValue(1);

      const mockAssessments = [
        {
          studentId: 'student-1',
          unitStandardId: null, // Missing unit
          unitStandard: null,
        },
        {
          studentId: 'student-1',
          unitStandardId: 'unit-a',
          unitStandard: { credits: 10, code: 'USA001', module: { moduleNumber: 1, id: 'mod-1' } },
        },
      ];

      (prisma.assessment.findMany as jest.Mock)
        .mockResolvedValueOnce(mockAssessments)
        .mockResolvedValueOnce([]);

      const result = await calculateGroupMetrics(groupId);

      // Should only count the valid unit
      expect(result.totalCreditsEarned).toBe(10);
      expect(result.totalUniqueUnitsPassed).toBe(1);
    });
  });

  describe('Edge Case: Gating Logic (Assessment Types)', () => {
    it('should only count module as complete with SUMMATIVE, FORMATIVE, and WORKPLACE', async () => {
      const groupId = 'test-group-gating';

      (prisma.student.count as jest.Mock).mockResolvedValue(2);
      (prisma.assessment.findMany as jest.Mock)
        .mockResolvedValueOnce([]); // No competent assessments for credit calc

      // Gating logic: student-1 has all three types in module 1
      // student-2 only has SUMMATIVE and FORMATIVE (missing WORKPLACE)
      const mockGatedAssessments = [
        {
          studentId: 'student-1',
          type: 'SUMMATIVE',
          unitStandard: { module: { moduleNumber: 1 } },
        },
        {
          studentId: 'student-1',
          type: 'FORMATIVE',
          unitStandard: { module: { moduleNumber: 1 } },
        },
        {
          studentId: 'student-1',
          type: 'WORKPLACE',
          unitStandard: { module: { moduleNumber: 1 } },
        },
        {
          studentId: 'student-2',
          type: 'SUMMATIVE',
          unitStandard: { module: { moduleNumber: 1 } },
        },
        {
          studentId: 'student-2',
          type: 'FORMATIVE',
          unitStandard: { module: { moduleNumber: 1 } },
        },
        // student-2 is missing WORKPLACE for module 1
      ];

      (prisma.assessment.findMany as jest.Mock)
        .mockResolvedValueOnce(mockGatedAssessments);

      const result = await calculateGroupMetrics(groupId);

      // student-1: highest complete module = 1
      // student-2: highest complete module = 0 (incomplete in module 1)
      // group max = 1
      // at-risk count = 1 (student-2 is below max)
      expect(result.atRiskCount).toBe(1);
    });

    it('should identify highest fully-complete module per student', async () => {
      const groupId = 'test-group-module-progress';

      (prisma.student.count as jest.Mock).mockResolvedValue(1);
      (prisma.assessment.findMany as jest.Mock)
        .mockResolvedValueOnce([]); // No competent assessments

      // Student has complete modules 1 and 2, but incomplete module 3
      const mockGatedAssessments = [
        // Module 1 - all three types
        {
          studentId: 'student-1',
          type: 'SUMMATIVE',
          unitStandard: { module: { moduleNumber: 1 } },
        },
        {
          studentId: 'student-1',
          type: 'FORMATIVE',
          unitStandard: { module: { moduleNumber: 1 } },
        },
        {
          studentId: 'student-1',
          type: 'WORKPLACE',
          unitStandard: { module: { moduleNumber: 1 } },
        },
        // Module 2 - all three types
        {
          studentId: 'student-1',
          type: 'SUMMATIVE',
          unitStandard: { module: { moduleNumber: 2 } },
        },
        {
          studentId: 'student-1',
          type: 'FORMATIVE',
          unitStandard: { module: { moduleNumber: 2 } },
        },
        {
          studentId: 'student-1',
          type: 'WORKPLACE',
          unitStandard: { module: { moduleNumber: 2 } },
        },
        // Module 3 - only SUMMATIVE (incomplete)
        {
          studentId: 'student-1',
          type: 'SUMMATIVE',
          unitStandard: { module: { moduleNumber: 3 } },
        },
      ];

      (prisma.assessment.findMany as jest.Mock)
        .mockResolvedValueOnce(mockGatedAssessments);

      const result = await calculateGroupMetrics(groupId);

      // Highest complete module should be 2
      expect(result.atRiskCount).toBe(0); // Student is at group max
    });
  });

  describe('Consistency: Dashboard vs Groups Endpoints', () => {
    it('should return identical metrics regardless of calculation path', async () => {
      const groupId = 'test-group-consistency';

      (prisma.student.count as jest.Mock).mockResolvedValue(2);

      const mockAssessments = [
        {
          studentId: 'student-1',
          unitStandardId: 'unit-1',
          unitStandard: { credits: 10, code: 'USA001', module: { moduleNumber: 1, id: 'mod-1' } },
        },
        {
          studentId: 'student-2',
          unitStandardId: 'unit-1',
          unitStandard: { credits: 10, code: 'USA001', module: { moduleNumber: 1, id: 'mod-1' } },
        },
        {
          studentId: 'student-2',
          unitStandardId: 'unit-2',
          unitStandard: { credits: 8, code: 'USA002', module: { moduleNumber: 1, id: 'mod-1' } },
        },
      ];

      (prisma.assessment.findMany as jest.Mock)
        .mockResolvedValueOnce(mockAssessments)  // First call
        .mockResolvedValueOnce(mockAssessments)  // Second call (if called again)
        .mockResolvedValueOnce([]);               // Gated assessments

      const result1 = await calculateGroupMetrics(groupId);
      
      jest.clearAllMocks();
      (prisma.student.count as jest.Mock).mockResolvedValue(2);
      (prisma.assessment.findMany as jest.Mock)
        .mockResolvedValueOnce(mockAssessments)
        .mockResolvedValueOnce([]);

      const result2 = await calculateGroupMetrics(groupId);

      expect(result1).toEqual(result2);
      expect(result1.totalCreditsEarned).toBe(28); // 10 + 10 + 8
      expect(result1.avgCreditsPerStudent).toBe(14); // 28 / 2
    });
  });

  describe('SSETA Compliance: 140 Credit Requirement', () => {
    it('should calculate progress based on 140 credit requirement', async () => {
      const groupId = 'test-group-sseta';

      (prisma.student.count as jest.Mock).mockResolvedValue(1);

      const mockAssessments = [
        {
          studentId: 'student-1',
          unitStandardId: 'unit-1',
          unitStandard: { credits: 70, code: 'USA001', module: { moduleNumber: 1, id: 'mod-1' } },
        },
      ];

      (prisma.assessment.findMany as jest.Mock)
        .mockResolvedValueOnce(mockAssessments)
        .mockResolvedValueOnce([]);

      // 70 credits out of 140 = 50% progress
      const result = await calculateGroupMetrics(groupId, 140);

      expect(result.totalCreditsEarned).toBe(70);
      expect(result.avgProgressPercent).toBe(50);
    });

    it('should handle custom credit requirements', async () => {
      const groupId = 'test-group-custom-credits';

      (prisma.student.count as jest.Mock).mockResolvedValue(1);

      const mockAssessments = [
        {
          studentId: 'student-1',
          unitStandardId: 'unit-1',
          unitStandard: { credits: 50, code: 'USA001', module: { moduleNumber: 1, id: 'mod-1' } },
        },
      ];

      (prisma.assessment.findMany as jest.Mock)
        .mockResolvedValueOnce(mockAssessments)
        .mockResolvedValueOnce([]);

      // 50 credits out of 100 = 50% progress
      const result = await calculateGroupMetrics(groupId, 100);

      expect(result.avgProgressPercent).toBe(50);
      expect(result.totalCreditsRequired).toBe(100);
    });
  });
});

describe('UnifiedMetrics - calculateStudentProgress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Edge Case: Student with No Assessments', () => {
    it('should return zero progress for student with no competent assessments', async () => {
      const studentId = 'student-no-assessments';

      (prisma.assessment.findMany as jest.Mock).mockResolvedValue([]);

      const result = await calculateStudentProgress(studentId);

      expect(result).toEqual({
        studentId,
        totalCreditsEarned: 0,
        progress: 0,
        status: 'ACTIVE',
        currentModuleNumber: 0,
        competentUnits: 0,
      });
    });
  });

  describe('Status Determination', () => {
    it('should mark student as COMPLETED when progress >= 100%', async () => {
      const studentId = 'student-completed';

      const mockAssessments = [
        {
          unitStandardId: 'unit-1',
          unitStandard: { credits: 140, module: { moduleNumber: 1 } },
        },
      ];

      (prisma.assessment.findMany as jest.Mock).mockResolvedValue(mockAssessments);

      const result = await calculateStudentProgress(studentId);

      expect(result.status).toBe('COMPLETED');
      expect(result.progress).toBe(100);
    });

    it('should mark student as AT_RISK when progress < 25%', async () => {
      const studentId = 'student-at-risk';

      const mockAssessments = [
        {
          unitStandardId: 'unit-1',
          unitStandard: { credits: 10, module: { moduleNumber: 1 } },
        },
      ];

      (prisma.assessment.findMany as jest.Mock).mockResolvedValue(mockAssessments);

      const result = await calculateStudentProgress(studentId);

      expect(result.status).toBe('AT_RISK');
      expect(result.progress).toBe(7); // 10 / 140 * 100 = 7%
    });

    it('should mark student as ACTIVE when 25% <= progress < 100%', async () => {
      const studentId = 'student-active';

      const mockAssessments = [
        {
          unitStandardId: 'unit-1',
          unitStandard: { credits: 50, module: { moduleNumber: 1 } },
        },
      ];

      (prisma.assessment.findMany as jest.Mock).mockResolvedValue(mockAssessments);

      const result = await calculateStudentProgress(studentId);

      expect(result.status).toBe('ACTIVE');
      expect(result.progress).toBe(36); // 50 / 140 * 100 = 35.7% (rounded)
    });
  });
});

describe('UnifiedMetrics - calculateAttendanceRate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Edge Case: No Attendance Records', () => {
    it('should return zero attendance for student with no records', async () => {
      const studentId = 'student-no-attendance';

      (prisma.attendance.findMany as jest.Mock).mockResolvedValue([]);

      const result = await calculateAttendanceRate(studentId, 'STUDENT');

      expect(result).toEqual({
        entityId: studentId,
        entityType: 'STUDENT',
        attendanceRate: 0,
        presentCount: 0,
        lateCount: 0,
        absentCount: 0,
        totalRecords: 0,
      });
    });

    it('should return zero attendance for group with no records', async () => {
      const groupId = 'group-no-attendance';

      (prisma.attendance.findMany as jest.Mock).mockResolvedValue([]);

      const result = await calculateAttendanceRate(groupId, 'GROUP');

      expect(result.attendanceRate).toBe(0);
      expect(result.totalRecords).toBe(0);
    });
  });

  describe('Student-Level Attendance', () => {
    it('should calculate simple rate for student: (PRESENT + LATE) / total', async () => {
      const studentId = 'student-attendance';

      const mockRecords = [
        { status: 'PRESENT', studentId },
        { status: 'PRESENT', studentId },
        { status: 'LATE', studentId },
        { status: 'ABSENT', studentId },
      ];

      (prisma.attendance.findMany as jest.Mock).mockResolvedValue(mockRecords);

      const result = await calculateAttendanceRate(studentId, 'STUDENT');

      // (2 + 1) / 4 = 75%
      expect(result.attendanceRate).toBe(75);
      expect(result.presentCount).toBe(2);
      expect(result.lateCount).toBe(1);
      expect(result.absentCount).toBe(1);
    });
  });

  describe('Group-Level Attendance', () => {
    it('should average per-student rates to normalize by student count', async () => {
      const groupId = 'group-attendance';

      // Student 1: 100% (2 present, 0 absent)
      // Student 2: 50% (1 present, 1 absent)
      // Group average: (100 + 50) / 2 = 75%
      const mockRecords = [
        { status: 'PRESENT', studentId: 'student-1' },
        { status: 'PRESENT', studentId: 'student-1' },
        { status: 'PRESENT', studentId: 'student-2' },
        { status: 'ABSENT', studentId: 'student-2' },
      ];

      (prisma.attendance.findMany as jest.Mock).mockResolvedValue(mockRecords);

      const result = await calculateAttendanceRate(groupId, 'GROUP');

      expect(result.attendanceRate).toBe(75);
      expect(result.presentCount).toBe(3);
      expect(result.absentCount).toBe(1);
    });

    it('should count LATE as present for attendance calculation', async () => {
      const groupId = 'group-with-late';

      const mockRecords = [
        { status: 'PRESENT', studentId: 'student-1' },
        { status: 'LATE', studentId: 'student-1' },
        { status: 'ABSENT', studentId: 'student-1' },
      ];

      (prisma.attendance.findMany as jest.Mock).mockResolvedValue(mockRecords);

      const result = await calculateAttendanceRate(groupId, 'GROUP');

      // (1 + 1) / 3 = 67%
      expect(result.attendanceRate).toBe(67);
    });
  });
});

describe('UnifiedMetrics - Batch Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate metrics for multiple groups efficiently', async () => {
    const groupIds = ['group-1', 'group-2', 'group-3'];

    (prisma.student.count as jest.Mock).mockResolvedValue(0);
    (prisma.assessment.findMany as jest.Mock).mockResolvedValue([]);

    const results = await calculateMultipleGroupMetrics(groupIds);

    expect(results.size).toBe(3);
    expect(results.get('group-1')).toBeDefined();
    expect(results.get('group-2')).toBeDefined();
    expect(results.get('group-3')).toBeDefined();
  });

  it('should handle empty group list', async () => {
    const results = await calculateMultipleGroupMetrics([]);

    expect(results.size).toBe(0);
  });
});

describe('UnifiedMetrics - Validation', () => {
  it('should validate correct metrics', () => {
    const validMetrics: UnifiedGroupMetrics = {
      avgCreditsPerStudent: 50,
      avgProgressPercent: 36,
      totalCreditsEarned: 100,
      totalUniqueUnitsPassed: 10,
      totalCreditsRequired: 140,
      studentCount: 2,
      atRiskCount: 0,
    };

    const result = validateGroupMetrics(validMetrics);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect invalid metrics', () => {
    const invalidMetrics: UnifiedGroupMetrics = {
      avgCreditsPerStudent: -10, // Negative
      avgProgressPercent: 150,   // Out of range
      totalCreditsEarned: 100,
      totalUniqueUnitsPassed: 10,
      totalCreditsRequired: 140,
      studentCount: -1,          // Negative
      atRiskCount: 100,          // Exceeds student count
    };

    const result = validateGroupMetrics(invalidMetrics);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should detect logical inconsistencies', () => {
    const inconsistentMetrics: UnifiedGroupMetrics = {
      avgCreditsPerStudent: 200, // Exceeds total required
      avgProgressPercent: 144,   // Out of range
      totalCreditsEarned: 200,
      totalUniqueUnitsPassed: 10,
      totalCreditsRequired: 100,
      studentCount: 1,
      atRiskCount: 0,
    };

    const result = validateGroupMetrics(inconsistentMetrics);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Average credits per student cannot exceed total required credits'
    );
  });
});
