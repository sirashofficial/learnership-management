/**
 * API Test Suite
 * Comprehensive tests for all critical API endpoints
 * 
 * Run with: node --loader tsx scripts/test-api.js
 */

import APITester from '../src/lib/api-tester';

const tester = new APITester('http://localhost:3000');

// Critical API endpoints to test
const criticalTests = [
  // ========== AUTHENTICATION ==========
  {
    name: 'Login - Valid Credentials',
    endpoint: '/api/auth/login',
    method: 'POST' as const,
    body: {
      email: 'admin@yeha.com',
      password: 'Admin123!',
    },
    expectedStatus: 200,
    description: 'Should authenticate user with valid credentials',
  },
  {
    name: 'Login - Invalid Credentials',
    endpoint: '/api/auth/login',
    method: 'POST' as const,
    body: {
      email: 'wrong@email.com',
      password: 'wrongpass',
    },
    expectedStatus: 401,
    description: 'Should reject invalid credentials',
  },

  // ========== STUDENTS ==========
  {
    name: 'Get All Students',
    endpoint: '/api/students',
    method: 'GET' as const,
    expectedStatus: 200,
    requiresAuth: true,
    description: 'Should return list of all students',
  },
  {
    name: 'Get Student by ID',
    endpoint: '/api/students/1',
    method: 'GET' as const,
    expectedStatus: 200,
    requiresAuth: true,
    description: 'Should return specific student details',
  },
  {
    name: 'Get Student Progress',
    endpoint: '/api/students/1/progress',
    method: 'GET' as const,
    expectedStatus: 200,
    requiresAuth: true,
    description: 'Should return student progress data',
  },

  // ========== GROUPS ==========
  {
    name: 'Get All Groups',
    endpoint: '/api/groups',
    method: 'GET' as const,
    expectedStatus: 200,
    requiresAuth: true,
    description: 'Should return list of all groups',
  },
  {
    name: 'Get Group by ID',
    endpoint: '/api/groups/1',
    method: 'GET' as const,
    expectedStatus: 200,
    requiresAuth: true,
    description: 'Should return specific group details',
  },
  {
    name: 'Get Group Progress',
    endpoint: '/api/groups/progress',
    method: 'GET' as const,
    expectedStatus: 200,
    requiresAuth: true,
    description: 'Should return group progress statistics',
  },

  // ========== ATTENDANCE ==========
  {
    name: 'Get Attendance Records',
    endpoint: '/api/attendance',
    method: 'GET' as const,
    expectedStatus: 200,
    requiresAuth: true,
    description: 'Should return attendance records',
  },
  {
    name: 'Get Attendance Rates',
    endpoint: '/api/attendance/rates',
    method: 'GET' as const,
    expectedStatus: 200,
    requiresAuth: true,
    description: 'Should return attendance rate statistics',
  },

  // ========== ASSESSMENTS ==========
  {
    name: 'Get All Assessments',
    endpoint: '/api/assessments',
    method: 'GET' as const,
    expectedStatus: 200,
    requiresAuth: true,
    description: 'Should return list of all assessments',
  },
  {
    name: 'Get Pending Assessments',
    endpoint: '/api/assessments?status=PENDING',
    method: 'GET' as const,
    expectedStatus: 200,
    requiresAuth: true,
    description: 'Should return only pending assessments',
  },

  // ========== DASHBOARD ==========
  {
    name: 'Get Dashboard Stats',
    endpoint: '/api/dashboard/stats',
    method: 'GET' as const,
    expectedStatus: 200,
    requiresAuth: true,
    description: 'Should return dashboard statistics',
  },
  {
    name: 'Get Recent Activity',
    endpoint: '/api/dashboard/activity',
    method: 'GET' as const,
    expectedStatus: 200,
    requiresAuth: true,
    description: 'Should return recent activity feed',
  },

  // ========== TIMETABLE ==========
  {
    name: 'Get Timetable Sessions',
    endpoint: '/api/timetable',
    method: 'GET' as const,
    expectedStatus: 200,
    requiresAuth: true,
    description: 'Should return timetable sessions',
  },

  // ========== MODULES ==========
  {
    name: 'Get All Modules',
    endpoint: '/api/modules',
    method: 'GET' as const,
    expectedStatus: 200,
    requiresAuth: true,
    description: 'Should return curriculum modules',
  },

  // ========== SETTINGS ==========
  {
    name: 'Get System Settings',
    endpoint: '/api/settings/system',
    method: 'GET' as const,
    expectedStatus: 200,
    requiresAuth: true,
    description: 'Should return system settings (requires admin)',
  },
  {
    name: 'Get Profile Settings',
    endpoint: '/api/settings/profile',
    method: 'GET' as const,
    expectedStatus: 200,
    requiresAuth: true,
    description: 'Should return user profile settings',
  },

  // ========== REPORTS ==========
  {
    name: 'Get Group Progress Report',
    endpoint: '/api/reports/group-progress',
    method: 'GET' as const,
    expectedStatus: 200,
    requiresAuth: true,
    description: 'Should return group progress report',
  },

  // ========== SEARCH ==========
  {
    name: 'Global Search',
    endpoint: '/api/search?q=test',
    method: 'GET' as const,
    expectedStatus: 200,
    requiresAuth: true,
    description: 'Should return search results',
  },

  // ========== ERROR HANDLING ==========
  {
    name: 'Non-existent Endpoint',
    endpoint: '/api/nonexistent',
    method: 'GET' as const,
    expectedStatus: 404,
    description: 'Should return 404 for non-existent endpoints',
  },
  {
    name: 'Unauthorized Access',
    endpoint: '/api/students',
    method: 'GET' as const,
    expectedStatus: 401,
    requiresAuth: false, // Explicitly no auth
    description: 'Should reject unauthenticated requests',
  },
];

// Run tests
async function runAllTests() {
  console.log('🚀 YEHA API Test Suite');
  console.log('Testing against: http://localhost:3000');
  console.log('Make sure the dev server is running: npm run dev\n');

  // First, try to login and get auth token
  console.log('🔐 Authenticating...\n');
  try {
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@yeha.com',
        password: 'Admin123!',
      }),
    });

    if (loginResponse.ok) {
      const data = await loginResponse.json();
      if (data.token) {
        tester.setAuthToken(data.token);
        console.log('✅ Authentication successful\n');
      } else {
        console.log('⚠️  Login succeeded but no token received. Some tests may fail.\n');
      }
    } else {
      console.log('⚠️  Could not authenticate. Tests requiring auth will fail.\n');
      console.log('   Make sure you have seeded the database with: npm run db:seed\n');
    }
  } catch (error) {
    console.log('❌ Could not connect to API. Is the dev server running?\n');
    console.log('   Start it with: npm run dev\n');
    process.exit(1);
  }

  // Run all tests
  const results = await tester.runTests(criticalTests);

  // Exit with error code if any tests failed
  const failedTests = results.filter(r => r.status === 'FAIL').length;
  process.exit(failedTests > 0 ? 1 : 0);
}

// Only run if called directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

export { runAllTests, criticalTests };
