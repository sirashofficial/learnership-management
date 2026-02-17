// Test Setup & Authentication Utilities
import { hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Environment setup
beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
  process.env.NODE_ENV = 'test';
});

// Create test user credentials
export const testUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@example.com',
  password: 'TestPassword123',
  passwordHash: '', // Will be set after hash
  firstName: 'Test',
  lastName: 'User',
  role: 'ADMIN'
};

// Initialize test user hash
export async function setupTestUser() {
  testUser.passwordHash = await hash(testUser.password, 10);
  return testUser;
}

// Generate test JWT token
export function generateTestToken(userId = testUser.id, role = 'ADMIN') {
  return jwt.sign(
    { userId, role, email: testUser.email },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );
}

// Test fixtures and factories
export const testFixtures = {
  // Valid student data
  validStudent: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+27721234567',
    groupId: '550e8400-e29b-41d4-a716-446655440001'
  },

  // Valid group data
  validGroup: {
    name: 'Grade 10A',
    description: 'Grade 10 Mathematics Group',
    startDate: new Date(2026, 0, 1).toISOString(),
    endDate: new Date(2026, 11, 31).toISOString(),
    code: 'G10A2026'
  },

  // Valid assessment data
  validAssessment: {
    name: 'Mid-Year Exam',
    description: 'Mathematics mid-year assessment',
    status: 'DRAFT',
    groupId: '550e8400-e29b-41d4-a716-446655440001',
    totalMarks: 100,
    dueDate: new Date(2026, 5, 30).toISOString()
  },

  // Valid session data
  validSession: {
    name: 'Monday Lesson',
    startTime: '09:00',
    endTime: '10:00',
    day: 'MONDAY',
    groupId: '550e8400-e29b-41d4-a716-446655440001'
  },

  // Invalid data (for negative test cases)
  invalidEmail: 'not-an-email',
  invalidUUID: 'not-a-uuid',
  weakPassword: 'weak',
  
  // Bulk operations data
  bulkAttendance: [
    {
      studentId: '550e8400-e29b-41d4-a716-446655440010',
      sessionId: '550e8400-e29b-41d4-a716-446655440020',
      status: 'PRESENT'
    },
    {
      studentId: '550e8400-e29b-41d4-a716-446655440011',
      sessionId: '550e8400-e29b-41d4-a716-446655440020',
      status: 'ABSENT'
    }
  ]
};

// API response helpers
export const responseMatchers = {
  isSuccessResponse: (body: any) => ({
    success: true,
    data: expect.any(Object),
    timestamp: expect.any(String)
  }),

  isErrorResponse: (code: string) => ({
    success: false,
    error: expect.any(String),
    code,
    timestamp: expect.any(String)
  }),

  isPaginatedResponse: (body: any) => ({
    success: true,
    data: expect.any(Array),
    pagination: {
      page: expect.any(Number),
      pageSize: expect.any(Number),
      total: expect.any(Number),
      totalPages: expect.any(Number),
      hasMore: expect.any(Boolean)
    },
    timestamp: expect.any(String)
  }),

  isValidationErrorResponse: (body: any) => ({
    success: false,
    error: 'Validation failed',
    code: 'VALIDATION_ERROR',
    data: expect.arrayContaining([
      expect.objectContaining({
        field: expect.any(String),
        message: expect.any(String)
      })
    ]),
    timestamp: expect.any(String)
  })
};

// Clean up after tests
afterAll(() => {
  jest.clearAllMocks();
});
