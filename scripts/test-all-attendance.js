async function testAttendanceEndpoints() {
  console.log("=== TESTING ATTENDANCE ENDPOINTS ===\n");

  // Test 1: GET /api/attendance
  console.log("1. Testing GET /api/attendance");
  try {
    const response = await fetch("http://localhost:3000/api/attendance", {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    console.log(`   Status: ${response.status}`);
    const data = await response.json();
    console.log(`   Response: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  console.log("\n2. Testing POST /api/attendance (records format)");
  try {
    const response = await fetch("http://localhost:3000/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        records: [
          { studentId: "NVC001", groupId: "G001", status: "PRESENT", date: "2024-01-15" },
          { studentId: "NVC002", groupId: "G001", status: "ABSENT", date: "2024-01-15", notes: "Sick" }
        ]
      })
    });
    console.log(`   Status: ${response.status}`);
    const data = await response.json();
    if (data.success) {
      console.log(`   ✅ Response: ${data.message}`);
      console.log(`   Saved: ${data.data.saved}, Failed: ${data.data.failed}`);
    } else {
      console.log(`   ❌ Error: ${JSON.stringify(data, null, 2).substring(0, 300)}`);
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  console.log("\n3. Testing POST /api/attendance/bulk (studentIds format)");
  try {
    const response = await fetch("http://localhost:3000/api/attendance/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentIds: ["NVC001", "NVC002"],
        groupId: "G001",
        status: "PRESENT",
        date: "2024-01-16",
        markedBy: "test"
      })
    });
    console.log(`   Status: ${response.status}`);
    const data = await response.json();
    if (data.success) {
      console.log(`   ✅ Response: ${data.message}`);
    } else {
      console.log(`   ❌ Error: ${JSON.stringify(data, null, 2).substring(0, 300)}`);
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  console.log("\n4. Testing GET /api/attendance (show saved records)");
  try {
    const response = await fetch("http://localhost:3000/api/attendance", {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    console.log(`   Status: ${response.status}`);
    const data = await response.json();
    if (data.success && data.data && data.data.length > 0) {
      console.log(`   ✅ Found ${data.data.length} records`);
    } else if (data.success) {
      console.log(`   No records found (expected if first run)`);
    } else {
      console.log(`   ❌ Error: ${JSON.stringify(data, null, 2).substring(0, 300)}`);
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  console.log("\n=== TEST COMPLETE ===");
}

testAttendanceEndpoints();

// Wait a bit before exit to ensure all logs are printed
setTimeout(() => process.exit(0), 1000);
