// Test attendance save endpoint
console.log('🧪 Testing Attendance Save API...\n');

async function testAttendanceSave() {
  try {
    // First, get a student to test with
    console.log('📥 Fetching students...');
    const studentsResponse = await fetch('http://localhost:3000/api/students');
    const studentsData = await studentsResponse.json();
    
    if (!studentsData.data || studentsData.data.length === 0) {
      console.error('❌ No students found in database');
      return;
    }
    
    const testStudent = studentsData.data[0];
    console.log('✅ Found test student:', testStudent.studentId, testStudent.firstName, testStudent.lastName);
    console.log('   Group:', testStudent.group?.name || 'NO GROUP');
    
    // Create test attendance record
    const testRecord = {
      records: [
        {
          studentId: testStudent.id,
          groupId: testStudent.group?.id || null,
          sessionId: null,
          status: 'PRESENT',
          date: new Date().toISOString(),
          markedBy: 'Test Script',
          notes: 'Test attendance record'
        }
      ]
    };
    
    console.log('\n📤 Sending attendance record...');
    console.log(JSON.stringify(testRecord, null, 2));
    
    const response = await fetch('http://localhost:3000/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testRecord)
    });
    
    console.log('\n📡 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Request failed:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('\n✅ Response received:');
    console.log(JSON.stringify(result, null, 2));
    
    // Analyze response structure
    console.log('\n📊 Analysis:');
    console.log('  - Success:', result.success);
    console.log('  - Has data:', !!result.data);
    console.log('  - Successful records:', result.data?.success?.length || result.data?.summary?.successful || 0);
    console.log('  - Failed records:', result.data?.failed?.length || result.data?.summary?.failed || 0);
    
    if (result.data?.failed?.length > 0) {
      console.log('\n❌ Failed records details:');
      result.data.failed.forEach((fail, i) => {
        console.log(`  ${i + 1}. Reason: ${fail.reason}`);
        console.log(`     Record:`, JSON.stringify(fail.record, null, 6));
      });
    }
    
    console.log('\n✅ TEST PASSED!');
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    console.error(error);
  }
}

testAttendanceSave();
