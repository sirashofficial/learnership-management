/**
 * Performance Testing Script
 * Tests load times for Dashboard, Groups, Students, and Assessments pages
 */

const BASE_URL = 'http://localhost:3000';

const pages = [
  { path: '/api/dashboard/summary/lite', name: 'Dashboard Summary' },
  { path: '/api/groups/summary', name: 'Groups Summary' },
  { path: '/api/students/summary', name: 'Students Summary' },
  { path: '/api/assessments?page=1&limit=50', name: 'Assessments (paginated)' },
  { path: '/api/students?page=1&pageSize=25', name: 'Students List API' },
];

async function testEndpoint(url) {
  try {
    const start = performance.now();
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Bearer test',
        'Cookie': 'sessionToken=test'
      }
    });
    const end = performance.now();
    
    if (!response.ok) {
      return {
        url,
        status: response.status,
        time: (end - start).toFixed(2),
        error: `HTTP ${response.status}`
      };
    }

    const data = await response.json();
    const dataSize = JSON.stringify(data).length / 1024; // KB

    return {
      url,
      status: response.status,
      time: (end - start).toFixed(2),
      dataSize: dataSize.toFixed(2),
      recordCount: data.data?.length || (Array.isArray(data) ? data.length : 'N/A'),
    };
  } catch (error) {
    return {
      url,
      error: error.message
    };
  }
}

async function runTests() {
  console.log('🚀 Starting Performance Tests\n');
  console.log(`Target: ${BASE_URL}\n`);
  console.log('Testing Endpoints:');
  console.log('─'.repeat(120));

  const results = [];

  for (const page of pages) {
    const url = `${BASE_URL}${page.path}`;
    console.log(`Testing: ${page.name}...`);
    const result = await testEndpoint(url);
    results.push({ ...result, name: page.name });
    
    if (result.error) {
      console.log(`  ❌ Error: ${result.error}\n`);
    } else {
      console.log(`  ⏱️  Time: ${result.time}ms`);
      console.log(`  📊 Size: ${result.dataSize}KB`);
      if (result.recordCount && result.recordCount !== 'N/A') {
        console.log(`  📝 Records: ${result.recordCount}`);
      }
      console.log();
    }
  }

  console.log('─'.repeat(120));
  console.log('\n📋 Summary:\n');

  const sortedByTime = results.sort((a, b) => parseFloat(b.time) - parseFloat(a.time));
  
  for (const result of sortedByTime) {
    if (!result.error) {
      const timeNum = parseFloat(result.time);
      const statusIcon = timeNum < 500 ? '✅' : timeNum < 1000 ? '⚠️ ' : '❌';
      console.log(`${statusIcon} ${result.name.padEnd(30)} ${result.time}ms (${result.dataSize}KB)`);
    }
  }

  // Calculate totals
  const validResults = results.filter(r => !r.error && r.time);
  const totalTime = validResults.reduce((sum, r) => sum + parseFloat(r.time), 0);
  const avgTime = (totalTime / validResults.length).toFixed(2);

  console.log('\n' + '─'.repeat(120));
  console.log(`Total time for all endpoints: ${totalTime.toFixed(2)}ms`);
  console.log(`Average time per endpoint: ${avgTime}ms\n`);

  // Target: all endpoints < 1000ms (1 second)
  const allFast = validResults.every(r => parseFloat(r.time) < 1000);
  if (allFast) {
    console.log('🎉 All endpoints load in under 1 second!\n');
  } else {
    console.log('⚠️  Some endpoints exceeding 1 second target\n');
  }
}

runTests().catch(console.error);
