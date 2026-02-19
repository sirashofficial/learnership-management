// Test attendance API
const attendanceData = {
  records: [
    {
      studentId: "NVC001",
      groupId: "G001",
      status: "PRESENT",
      date: "2024-01-15",
      notes: "Test attendance save"
    },
    {
      studentId: "NVC002",  
      groupId: "G001",
      status: "ABSENT",
      date: "2024-01-15",
      notes: "Test attendance save"
    }
  ]
};

async function testAttendance() {
  try {
    console.log("Testing POST /api/attendance...");
    const response = await fetch("http://localhost:3000/api/attendance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(attendanceData)
    });
    
    const data = await response.json();
    console.log("Status Code:", response.status);
    console.log("Response:", JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log(`\n✅ SUCCESS! Saved ${data.data.savedCount}/${attendanceData.records.length} records`);
      if (data.data.saved.length > 0) {
        console.log("\nSaved records:");
        data.data.saved.forEach(r => {
          console.log(`  - Student: ${r.studentId}, Status: ${r.status}, Date: ${r.date}`);
        });
      }
      if (data.data.failed.length > 0) {
        console.log("\nFailed records:");
        data.data.failed.forEach(r => {
          console.log(`  - Student: ${r.record.studentId}, Error: ${r.error}`);
        });
      }
    } else {
      console.log("❌ Failed:", data.message);
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testAttendance();
