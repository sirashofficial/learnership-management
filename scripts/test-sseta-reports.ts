/**
 * SSETA Reports Testing Script
 * Tests all three report generation endpoints
 */

import { SignJWT } from 'jose';

const BASE_URL = 'http://localhost:3000';

// Generate test token using jose (same library as server)
async function generateTestToken(userId = 'test-user-123', role = 'ADMIN'): Promise<string> {
  const secret = 'yeha-learnership-secret-key-2026';
  const key = new TextEncoder().encode(secret);
  
  const now = Math.floor(Date.now() / 1000);
  
  return await new SignJWT({
    userId,
    email: 'testadmin@yeha.org',
    role,
    iat: now,
    exp: now + 3600,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .sign(key);
}

let authToken: string = '';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: Record<string, any>;
}

const results: TestResult[] = [];

async function testWorkplaceAgreement() {
  console.log('\n📄 Testing Workplace Agreement Endpoint...');
  console.log(`  Using token: ${authToken.substring(0, 20)}...`);
  
  try {
    // First, get a student
    const studentsRes = await fetch(`${BASE_URL}/api/students?limit=1`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    console.log(`  Student fetch response: ${studentsRes.status} ${studentsRes.statusText}`);

    if (!studentsRes.ok) {
      const errorData = await studentsRes.json() as any;
      throw new Error(`Failed to fetch students: ${studentsRes.status} - ${errorData.message || studentsRes.statusText}`);
    }

    const studentsData = await studentsRes.json() as any;
    
    if (!studentsData.data || studentsData.data.length === 0) {
      throw new Error('No students found in system');
    }

    const student = studentsData.data[0];
    console.log(`  ✓ Found student: ${student.studentId} - ${student.firstName} ${student.lastName}`);

    // Generate workplace agreement
    const agreementData = {
      studentId: student.id,
      employerName: 'Tech Corp South Africa',
      employerContact: 'John Smith, HR Manager',
      employerAddress: '123 Engineering Road, Johannesburg, Gauteng 2000',
      workplaceMentorName: 'Sarah Johnson',
      workplaceMentorEmail: 'sarah.johnson@techcorp.co.za',
      trainingPeriodStart: '2024-01-15',
      trainingPeriodEnd: '2025-01-15',
      qualificationTitle: 'NVC Level 2: Generic Management',
      qualificationLevel: 'NQF Level 2',
      ssetaCode: '67465',
      providerName: 'YEHA Training Academy',
      providerAccreditationNumber: 'ACC-2024-001',
      coordinatorName: 'Ms. Thandi Dlamini',
      coordinatorContact: 'thandi@yehatraining.org',
      format: 'docx',
    };

    const agreementRes = await fetch(`${BASE_URL}/api/reports/sseta/workplace-agreement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(agreementData),
    });

    if (agreementRes.ok) {
      const buffer = await agreementRes.arrayBuffer();
      const fileName = agreementRes.headers.get('content-disposition')?.split('filename="')[1]?.split('"')[0] || 'agreement.docx';
      console.log(`  ✓ Workplace agreement generated: ${fileName}`);
      console.log(`  ✓ File size: ${buffer.byteLength} bytes`);
      
      results.push({
        name: 'Workplace Agreement Generation',
        passed: true,
        details: {
          student: `${student.studentId} - ${student.firstName} ${student.lastName}`,
          fileName,
          fileSize: buffer.byteLength,
          format: 'DOCX',
        },
      });
    } else {
      const errorText = await agreementRes.text();
      throw new Error(`${agreementRes.status}: ${errorText}`);
    }
  } catch (error) {
    console.error(`  ✗ Error: ${error}`);
    results.push({
      name: 'Workplace Agreement Generation',
      passed: false,
      error: String(error),
    });
  }
}

async function testMonthlyProgress() {
  console.log('\n📊 Testing Monthly Progress Report Endpoint...');
  
  try {
    // First, get groups
    const groupsRes = await fetch(`${BASE_URL}/api/data/groups?limit=1`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    if (!groupsRes.ok) {
      throw new Error(`Failed to fetch groups: ${groupsRes.status} ${groupsRes.statusText}`);
    }

    const groupsData = await groupsRes.json() as any;
    
    if (!groupsData.data?.groups || groupsData.data.groups.length === 0) {
      throw new Error('No groups found in system');
    }

    const group = groupsData.data.groups[0];
    console.log(`  ✓ Found group: ${group.name}`);
    console.log(`    Fields available: ${Object.keys(group).join(', ')}`);
    console.log(`    Raw group object (stringified):`, JSON.stringify(group, null, 2).split('\n').slice(0, 10).join('\n'));

    // Generate monthly progress report
    const currentMonth = new Date();
    const monthStr = currentMonth.toISOString();

    const progressData = {
      groupIds: [group.id],
      reportMonth: monthStr,
      format: 'docx',
    };

    const progressRes = await fetch(`${BASE_URL}/api/reports/sseta/monthly-progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(progressData),
    });

    if (progressRes.ok) {
      const buffer = await progressRes.arrayBuffer();
      const fileName = progressRes.headers.get('content-disposition')?.split('filename="')[1]?.split('"')[0] || 'progress.docx';
      console.log(`  ✓ Monthly progress report generated: ${fileName}`);
      console.log(`  ✓ File size: ${buffer.byteLength} bytes`);
      
      results.push({
        name: 'Monthly Progress Report Generation',
        passed: true,
        details: {
          group: group.name,
          fileName,
          fileSize: buffer.byteLength,
          format: 'DOCX',
          month: monthStr.slice(0, 7),
        },
      });
    } else {
      const errorText = await progressRes.text();
      throw new Error(`${progressRes.status}: ${errorText}`);
    }
  } catch (error) {
    console.error(`  ✗ Error: ${error}`);
    results.push({
      name: 'Monthly Progress Report Generation',
      passed: false,
      error: String(error),
    });
  }
}

async function testAssessmentSchedule() {
  console.log('\n📅 Testing Assessment Schedule Endpoint...');
  
  try {
    // First, get groups
    const groupsRes = await fetch(`${BASE_URL}/api/data/groups?limit=1`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    
    if (!groupsRes.ok) {
      throw new Error(`Failed to fetch groups: ${groupsRes.status} ${groupsRes.statusText}`);
    }

    const groupsData = await groupsRes.json() as any;
    
    if (!groupsData.data?.groups || groupsData.data.groups.length === 0) {
      throw new Error('No groups found in system');
    }

    const group = groupsData.data.groups[0];
    console.log(`  ✓ Found group: ${group.name}`);

    // Generate assessment schedule using group's actual date range
    const startDate = new Date(group.startDate || new Date());
    const endDate = new Date(group.endDate || new Date());

    const scheduleData = {
      groupId: group.id,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      includeCompleted: true,
      format: 'docx',
    };

    const scheduleRes = await fetch(`${BASE_URL}/api/reports/sseta/assessment-schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(scheduleData),
    });

    if (scheduleRes.ok) {
      const buffer = await scheduleRes.arrayBuffer();
      const fileName = scheduleRes.headers.get('content-disposition')?.split('filename="')[1]?.split('"')[0] || 'schedule.docx';
      console.log(`  ✓ Assessment schedule generated: ${fileName}`);
      console.log(`  ✓ File size: ${buffer.byteLength} bytes`);
      
      results.push({
        name: 'Assessment Schedule Generation',
        passed: true,
        details: {
          group: group.name,
          fileName,
          fileSize: buffer.byteLength,
          format: 'DOCX',
          dateRange: `${startDate.toISOString().slice(0, 10)} to ${endDate.toISOString().slice(0, 10)}`,
        },
      });
    } else {
      const errorText = await scheduleRes.text();
      throw new Error(`${scheduleRes.status}: ${errorText}`);
    }
  } catch (error) {
    console.error(`  ✗ Error: ${error}`);
    results.push({
      name: 'Assessment Schedule Generation',
      passed: false,
      error: String(error),
    });
  }
}

async function testAPIEndpoints() {
  console.log('\n✅ SSETA Compliance Reports - API Endpoint Tests');
  console.log('='.repeat(60));
  console.log(`Testing against: ${BASE_URL}`);
  console.log('='.repeat(60));

  // Test each endpoint
  await testWorkplaceAgreement();
  await testMonthlyProgress();
  await testAssessmentSchedule();

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  results.forEach((result) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`\n${status} ${result.name}`);
    
    if (result.passed && result.details) {
      console.log('  Details:');
      Object.entries(result.details).forEach(([key, value]) => {
        console.log(`    - ${key}: ${value}`);
      });
    }
    
    if (!result.passed && result.error) {
      console.log(`  Error: ${result.error}`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60));

  if (failed === 0) {
    console.log('\n🎉 All tests passed! SSETA reports are working correctly.');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. See errors above.`);
  }
}

// Run tests
async function main() {
  console.log('\n📋 Generating authentication token...');
  authToken = await generateTestToken();
  console.log(`✅ Token generated (length: ${authToken.length})`);
  console.log(`Token starts with: ${authToken.substring(0, 30)}...`);
  
  await testAPIEndpoints();
}

main().catch(console.error);
