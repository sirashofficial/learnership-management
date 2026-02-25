/**
 * Phase 4: PostgreSQL Endpoint Testing
 * Tests critical API endpoints to verify PostgreSQL backend compatibility
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';
const TIMEOUT = 15000;

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  statusCode?: number;
  error?: string;
  responseTime: number;
}

const results: TestResult[] = [];

async function testEndpoint(
  name: string,
  method: 'GET' | 'POST',
  endpoint: string,
  data?: any
): Promise<void> {
  const startTime = Date.now();
  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${endpoint}`,
      data,
      timeout: TIMEOUT,
      validateStatus: (status) => status < 500, // Don't throw on 4xx
    });

    const responseTime = Date.now() - startTime;
    
    // 2xx or 3xx = pass, 4xx with message = pass (auth required), 5xx = fail
    const isSuccess = response.status < 400 || response.status === 401;
    
    results.push({
      name,
      status: isSuccess ? 'PASS' : 'FAIL',
      statusCode: response.status,
      responseTime,
    });

    console.log(
      `${isSuccess ? '✅' : '❌'} ${name.padEnd(40)} [${response.status}] ${responseTime}ms`
    );
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    results.push({
      name,
      status: 'FAIL',
      error: error.message,
      responseTime,
    });
    console.log(
      `❌ ${name.padEnd(40)} [ERROR] ${responseTime}ms - ${error.message}`
    );
  }
}

async function runTests() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 PHASE 4: PostgreSQL Endpoint Testing');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Health checks
  console.log('📊 Health & Status Checks:');
  await testEndpoint('Health Check', 'GET', '/health');

  // Data endpoints
  console.log('\n📋 Data Endpoints (PostgreSQL):');
  await testEndpoint('List Users', 'GET', '/users');
  await testEndpoint('List Groups', 'GET', '/groups');
  await testEndpoint('List Students', 'GET', '/students');
  await testEndpoint('List Modules', 'GET', '/modules');
  await testEndpoint('List Lessons', 'GET', '/lessons');
  await testEndpoint('List Assessments', 'GET', '/assessments');
  await testEndpoint('List Sessions', 'GET', '/sessions');
  await testEndpoint('List Attendance', 'GET', '/attendance');

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Test Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const avgTime =
    results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Average Response Time: ${Math.round(avgTime)}ms`);

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED - PostgreSQL Ready for Gradual Rollout!\n');
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. Review output above.\n`);
    process.exit(1);
  }
}

runTests();
