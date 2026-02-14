async function testEndpoints() {
  console.log("=== Testing API Endpoints ===\n");

  // Test new endpoint
  console.log("1. Testing POST /api/test-endpoint");
  try {
    const response = await fetch("http://localhost:3000/api/test-endpoint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test: "data" })
    });
    console.log(`   Status: ${response.status}`);
    const data = await response.json();
    console.log(`   Response: ${JSON.stringify(data)}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  console.log("\n2. Testing POST /api/attendance");
  try {
    const response = await fetch("http://localhost:3000/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        records: [
          { studentId: "NVC001", groupId: "G001", status: "PRESENT", date: "2024-01-15" }
        ]
      })
    });
    console.log(`   Status: ${response.status}`);
    const data = await response.json();
    console.log(`   Response: ${JSON.stringify(data)}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
}

testEndpoints();
setTimeout(() => process.exit(0), 1000);
