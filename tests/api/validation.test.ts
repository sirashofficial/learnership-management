/**
 * Validation API Test Suite
 * Tests all Phase 1 validation endpoints for correctness
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Test Data IDs (will be populated in beforeAll)
let testStudentId: string;
let testGroupId: string;
let testUnitStandardId: string;
let testFacilitatorId: string;
let testModuleId: string;

describe('Validation API Endpoints', () => {
  beforeAll(async () => {
    // Create test facilitator
    const facilitator = await prisma.user.create({
      data: {
        email: 'test-facilitator@test.com',
        name: 'Test Facilitator',
        password: 'password123',
        role: 'FACILITATOR',
      },
    });
    testFacilitatorId = facilitator.id;

    // Create test module
    const module = await prisma.module.create({
      data: {
        moduleNumber: 999,
        code: 'TEST-MODULE',
        name: 'Test Module',
        fullName: 'Test Module Full Name',
        purpose: 'Testing purposes',
        credits: 10,
        notionalHours: 40,
        classroomHours: 20,
        workplaceHours: 20,
        order: 1,
      },
    });
    testModuleId = module.id;

    // Create test group
    const testGroup = await prisma.group.create({
      data: {
        name: 'Test Validation Group',
        status: 'ACTIVE',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      },
    });
    testGroupId = testGroup.id;

    // Create test unit standard
    const testUnitStandard = await prisma.unitStandard.create({
      data: {
        code: 'TEST001',
        title: 'Test Unit Standard',
        credits: 10,
        level: 5,
        type: 'Core',
        moduleId: testModuleId,
      },
    });
    testUnitStandardId = testUnitStandard.id;

    // Create test student
    const testStudent = await prisma.student.create({
      data: {
        studentId: 'TEST-STU-001',
        firstName: 'Test',
        lastName: 'Student',
        email: 'test@example.com',
        status: 'ACTIVE',
        groupId: testGroupId,
        facilitatorId: testFacilitatorId,
        totalCreditsEarned: 0,
      },
    });
    testStudentId = testStudent.id;
  });

  afterAll(async () => {
    // Cleanup test data (cascade deletes will handle related records)
    await prisma.student.deleteMany({ where: { id: testStudentId } }).catch(() => {});
    await prisma.unitStandard.deleteMany({ where: { id: testUnitStandardId } }).catch(() => {});
    await prisma.rolloutPlan.deleteMany({ where: { groupId: testGroupId } }).catch(() => {});
    await prisma.group.deleteMany({ where: { id: testGroupId } }).catch(() => {});
    await prisma.module.deleteMany({ where: { id: testModuleId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: testFacilitatorId } }).catch(() => {});
    await prisma.$disconnect();
  });

  describe('GET /api/validation/data-integrity', () => {
    it('should return validation summary with correct structure', async () => {
      const response = await fetch(`${API_BASE}/api/validation/data-integrity`, {
        headers: {
          Authorization: `Bearer ${process.env.TEST_API_TOKEN}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('summary');
      expect(data).toHaveProperty('issues');

      // Verify summary structure
      expect(data.summary).toHaveProperty('totalIssues');
      expect(data.summary).toHaveProperty('critical');
      expect(data.summary).toHaveProperty('warnings');
      expect(data.summary).toHaveProperty('info');
      expect(data.summary).toHaveProperty('studentsChecked');
      expect(data.summary).toHaveProperty('timestamp');

      // Verify issues array
      expect(Array.isArray(data.issues)).toBe(true);
    });

    it('should classify issues by severity', async () => {
      const response = await fetch(`${API_BASE}/api/validation/data-integrity`, {
        headers: {
          Authorization: `Bearer ${process.env.TEST_API_TOKEN}`,
        },
      });

      const data = await response.json();
      const { issues } = data;

      // All issues should have valid severity
      const validSeverities = ['critical', 'warning', 'info'];
      issues.forEach((issue: any) => {
        expect(validSeverities).toContain(issue.severity);
        expect(issue).toHaveProperty('category');
        expect(issue).toHaveProperty('issue');
      });
    });

    it('should detect credit mismatches', async () => {
      // Create assessment with credits
      await prisma.assessment.create({
        data: {
          studentId: testStudentId,
          unitStandardId: testUnitStandardId,
          type: 'FORMATIVE',
          method: 'Written Test',
          result: 'COMPETENT',
          dueDate: new Date(),
        },
      });

      // Student totalCreditsEarned is still 0, should detect mismatch
      const response = await fetch(`${API_BASE}/api/validation/data-integrity`, {
        headers: {
          Authorization: `Bearer ${process.env.TEST_API_TOKEN}`,
        },
      });

      const data = await response.json();
      const creditIssue = data.issues.find(
        (issue: any) => issue.category.toLowerCase().includes('credit')
      );

      expect(creditIssue).toBeDefined();
      expect(creditIssue.severity).toBe('critical');
    });
  });

  describe('POST /api/validation/fix-credits', () => {
    it('should fix credit mismatches in dry-run mode', async () => {
      // Ensure test student has mismatch
      await prisma.student.update({
        where: { id: testStudentId },
        data: { totalCreditsEarned: 0 },
      });

      const response = await fetch(`${API_BASE}/api/validation/fix-credits`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.TEST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentIds: [testStudentId],
          dryRun: true,
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('dryRun', true);
      expect(data).toHaveProperty('studentsChecked');
      expect(data).toHaveProperty('fixes');

      // Should find at least our test student
      expect(data.studentsChecked).toBeGreaterThan(0);
    });

    it('should not modify data in dry-run mode', async () => {
      const before = await prisma.student.findUnique({
        where: { id: testStudentId },
        select: { totalCreditsEarned: true },
      });

      await fetch(`${API_BASE}/api/validation/fix-credits`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.TEST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentIds: [testStudentId],
          dryRun: true,
        }),
      });

      const after = await prisma.student.findUnique({
        where: { id: testStudentId },
        select: { totalCreditsEarned: true },
      });

      expect(after?.totalCreditsEarned).toBe(before?.totalCreditsEarned);
    });

    it('should fix credits when dryRun=false', async () => {
      // Ensure mismatch exists
      await prisma.student.update({
        where: { id: testStudentId },
        data: { totalCreditsEarned: 0 },
      });

      const response = await fetch(`${API_BASE}/api/validation/fix-credits`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.TEST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentIds: [testStudentId],
          dryRun: false,
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.dryRun).toBe(false);
      expect(data.studentsFixed).toBeGreaterThan(0);

      // Verify credits were actually fixed
      const student = await prisma.student.findUnique({
        where: { id: testStudentId },
      });
      expect(student?.totalCreditsEarned).toBe(10); // From test unit standard
    });
  });

  describe('POST /api/validation/generate-missing-assessments', () => {
    it('should identify missing assessments in dry-run', async () => {
      // Create rollout plan
      await prisma.rolloutPlan.create({
        data: {
          groupId: testGroupId,
          moduleId: testModuleId,
          moduleNumber: 1,
          projectedStartDate: new Date(),
          projectedEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      }).catch(() => {}); // Might already exist from previous test

      // Delete any existing assessments
      await prisma.assessment.deleteMany({
        where: { studentId: testStudentId, type: 'FORMATIVE' },
      });

      const response = await fetch(`${API_BASE}/api/validation/generate-missing-assessments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.TEST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentIds: [testStudentId],
          dryRun: true,
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('dryRun', true);
      expect(data).toHaveProperty('preview');
      expect(Array.isArray(data.preview)).toBe(true);
    });

    it('should not create assessments in dry-run mode', async () => {
      const before = await prisma.assessment.count({
        where: { studentId: testStudentId },
      });

      await fetch(`${API_BASE}/api/validation/generate-missing-assessments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.TEST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentIds: [testStudentId],
          dryRun: true,
        }),
      });

      const after = await prisma.assessment.count({
        where: { studentId: testStudentId },
      });

      expect(after).toBe(before);
    });
  });

  describe('POST /api/validation/fix-duplicates', () => {
    it('should identify duplicate assessments', async () => {
      // Create intentional duplicates
      await prisma.assessment.createMany({
        data: [
          {
            studentId: testStudentId,
            unitStandardId: testUnitStandardId,
            type: 'FORMATIVE',
            method: 'Written Test',
            result: 'COMPETENT',
            dueDate: new Date(),
          },
          {
            studentId: testStudentId,
            unitStandardId: testUnitStandardId,
            type: 'FORMATIVE',
            method: 'Written Test',
            result: 'COMPETENT',
            dueDate: new Date(),
          },
        ],
      });

      const response = await fetch(`${API_BASE}/api/validation/fix-duplicates`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.TEST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dryRun: true }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('duplicatesFound');
      expect(data.duplicatesFound).toBeGreaterThan(0);
    });

    it('should keep most recent assessment when removing duplicates', async () => {
      // Ensure duplicates exist
      await prisma.assessment.deleteMany({ where: { studentId: testStudentId } });

      const [older, newer] = await Promise.all([
        prisma.assessment.create({
          data: {
            studentId: testStudentId,
            unitStandardId: testUnitStandardId,
            type: 'FORMATIVE',
            method: 'Written Test',
            result: 'COMPETENT',
            dueDate: new Date('2024-01-01'),
            createdAt: new Date('2024-01-01'),
          },
        }),
        prisma.assessment.create({
          data: {
            studentId: testStudentId,
            unitStandardId: testUnitStandardId,
            type: 'FORMATIVE',
            method: 'Written Test',
            result: 'COMPETENT',
            dueDate: new Date('2024-12-01'),
            createdAt: new Date('2024-12-01'),
          },
        }),
      ]);

      // Remove duplicates
      await fetch(`${API_BASE}/api/validation/fix-duplicates`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.TEST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dryRun: false }),
      });

      // Verify only newer one remains
      const remaining = await prisma.assessment.findMany({
        where: {
          studentId: testStudentId,
          unitStandardId: testUnitStandardId,
          type: 'FORMATIVE',
        },
      });

      expect(remaining.length).toBe(1);
      // Verify the newer record remains (created on 2024-12-01)
      expect(remaining[0].createdAt.toISOString()).toContain('2024-12');
    });
  });

  describe('POST /api/validation/cleanup-orphaned-progress', () => {
    it('should identify orphaned progress records', async () => {
      // Create orphaned progress (no assessments)
      await prisma.assessment.deleteMany({ where: { studentId: testStudentId } });
      await prisma.unitStandardProgress.create({
        data: {
          studentId: testStudentId,
          unitStandardId: testUnitStandardId,
          status: 'IN_PROGRESS',
        },
      });

      const response = await fetch(`${API_BASE}/api/validation/cleanup-orphaned-progress`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.TEST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dryRun: true }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('orphanedFound');
      expect(data.orphanedFound).toBeGreaterThan(0);
    });

    it('should not remove progress with matching assessments', async () => {
      // Ensure assessments exist
      await prisma.assessment.create({
        data: {
          studentId: testStudentId,
          unitStandardId: testUnitStandardId,
          type: 'FORMATIVE',
          method: 'Written Test',
          result: 'COMPETENT',
          dueDate: new Date(),
        },
      });

      await prisma.unitStandardProgress.upsert({
        where: {
          studentId_unitStandardId: {
            studentId: testStudentId,
            unitStandardId: testUnitStandardId,
          },
        },
        create: {
          studentId: testStudentId,
          unitStandardId: testUnitStandardId,
          status: 'IN_PROGRESS',
        },
        update: {},
      });

      const progressBefore = await prisma.unitStandardProgress.count({
        where: { studentId: testStudentId },
      });

      await fetch(`${API_BASE}/api/validation/cleanup-orphaned-progress`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.TEST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dryRun: false }),
      });

      const progressAfter = await prisma.unitStandardProgress.count({
        where: { studentId: testStudentId },
      });

      // Should not have deleted progress with matching assessment
      expect(progressAfter).toBe(progressBefore);
    });
  });

  describe('Authentication', () => {
    it('should reject requests without auth token', async () => {
      const response = await fetch(`${API_BASE}/api/validation/data-integrity`);
      expect(response.status).toBe(401);
    });

    it('should reject requests with invalid token', async () => {
      const response = await fetch(`${API_BASE}/api/validation/data-integrity`, {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });
      expect(response.status).toBe(401);
    });
  });

  describe('Response Format', () => {
    it('should return consistent success response format', async () => {
      const response = await fetch(`${API_BASE}/api/validation/data-integrity`, {
        headers: {
          Authorization: `Bearer ${process.env.TEST_API_TOKEN}`,
        },
      });

      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(typeof data.success).toBe('boolean');
    });

    it('should return consistent error response format', async () => {
      const response = await fetch(`${API_BASE}/api/validation/fix-credits`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.TEST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invalid: 'data' }),
      });

      // Should handle invalid data gracefully
      const data = await response.json();
      expect(data).toHaveProperty('success');
    });
  });
});
