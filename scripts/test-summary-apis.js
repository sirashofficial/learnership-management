#!/usr/bin/env node

/**
 * Performance Optimization API Test Script
 * Tests all new summary APIs and measures response times
 * 
 * Usage: node scripts/test-summary-apis.js
 */

const BASE_URL = 'http://localhost:3000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

async function testAPI(name, url) {
  try {
    console.log(`\n${colors.cyan}📡 Testing: ${name}${colors.reset}`);
    console.log(`   URL: ${url}`);
    
    const startTime = performance.now();
    const response = await fetch(url);
    const endTime = performance.now();
    
    if (!response.ok) {
      console.log(`${colors.red}❌ Failed (${response.status})${colors.reset}`);
      return null;
    }
    
    const data = await response.json();
    const responseTime = endTime - startTime;
    
    console.log(`${colors.green}✅ Success${colors.reset}`);
    console.log(`${colors.yellow}⏱️  Response time: ${responseTime.toFixed(0)}ms${colors.reset}`);
    
    // Show data sample
    if (typeof data === 'object' && data !== null) {
      const sampleSize = JSON.stringify(data).length;
      console.log(`   Data size: ${(sampleSize / 1024).toFixed(2)} KB`);
      
      // Show first key-value pairs
      const keys = Object.keys(data).slice(0, 3);
      if (keys.length > 0) {
        console.log(`   Sample keys: ${keys.join(', ')}`);
      }
    }
    
    return {
      name,
      url,
      success: true,
      responseTime,
      dataSize: JSON.stringify(data).length,
      data,
    };
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    return {
      name,
      url,
      success: false,
      error: error.message,
    };
  }
}

async function main() {
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}  Performance Optimization: Summary APIs Test${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
  
  const tests = [
    {
      name: 'Dashboard Summary (Lite)',
      url: `${BASE_URL}/api/dashboard/summary/lite`,
      expected: ['totalStudents', 'totalGroups', 'totalAssessments'],
    },
    {
      name: 'Groups Summary',
      url: `${BASE_URL}/api/groups/summary`,
      expected: ['groups'],
    },
    {
      name: 'Students Summary',
      url: `${BASE_URL}/api/students/summary`,
      expected: ['students', 'count'],
    },
    {
      name: 'Students Summary (With Group)',
      url: `${BASE_URL}/api/students/summary?groupId=test`,
      expected: ['students', 'groupId'],
    },
    {
      name: 'Assessment Details (Page 1)',
      url: `${BASE_URL}/api/assessments/detail?page=1&pageSize=50`,
      expected: ['assessments', 'pagination'],
    },
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await testAPI(test.name, test.url);
    if (result) {
      results.push(result);
      
      // Validate expected fields
      if (test.expected && result.data) {
        const hasAllFields = test.expected.every(field => field in result.data);
        if (!hasAllFields) {
          console.log(`${colors.yellow}⚠️  Missing expected fields: ${test.expected.filter(f => !(f in result.data)).join(', ')}${colors.reset}`);
        } else {
          console.log(`${colors.green}✅ All expected fields present${colors.reset}`);
        }
      }
    }
  }
  
  // Summary Report
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}  Summary Report${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\n${colors.green}✅ Successful: ${successful.length}/${results.length}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${failed.length}/${results.length}${colors.reset}`);
  
  if (successful.length > 0) {
    console.log(`\n${colors.cyan}Response Times:${colors.reset}`);
    successful.forEach(r => {
      const status = r.responseTime < 500 ? colors.green : r.responseTime < 1000 ? colors.yellow : colors.red;
      console.log(`  ${status}⏱️  ${r.name.padEnd(35)} ${r.responseTime.toFixed(0).padStart(5)}ms${colors.reset}`);
    });
    
    const avgTime = successful.reduce((sum, r) => sum + r.responseTime, 0) / successful.length;
    console.log(`\n  ${colors.cyan}Average response time: ${avgTime.toFixed(0)}ms${colors.reset}`);
  }
  
  if (failed.length > 0) {
    console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
    failed.forEach(r => {
      console.log(`  ❌ ${r.name}`);
      console.log(`     Error: ${r.error}`);
    });
  }
  
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  
  // Performance recommendations
  if (successful.length > 0) {
    console.log(`\n${colors.cyan}📊 Performance Analysis:${colors.reset}`);
    const slowTests = successful.filter(r => r.responseTime > 500);
    if (slowTests.length > 0) {
      console.log(`${colors.yellow}⚠️  ${slowTests.length} APIs exceed 500ms target:${colors.reset}`);
      slowTests.forEach(r => {
        console.log(`   - ${r.name}: ${r.responseTime.toFixed(0)}ms`);
      });
    } else {
      console.log(`${colors.green}✅ All APIs meet performance targets (< 500ms)${colors.reset}`);
    }
  }
  
  console.log(`\n`);
  process.exit(failed.length > 0 ? 1 : 0);
}

// Run tests
main().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
