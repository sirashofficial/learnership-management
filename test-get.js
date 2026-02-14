async function testGET() {
  try {
    const response = await fetch("http://localhost:3000/api/attendance", {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });
    
    console.log("GET Status:", response.status);
    const data = await response.json();
    console.log("GET Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testGET();
