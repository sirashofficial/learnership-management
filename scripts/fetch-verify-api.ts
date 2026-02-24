
async function test() {
    console.log('--- FETCHING API: /api/students ---');
    try {
        const res = await fetch('http://localhost:3000/api/students');
        if (!res.ok) {
            console.error('API responded with status:', res.status);
            const text = await res.text();
            console.error('Response body:', text);
            process.exit(1);
        }
        const json = await res.json();
        console.log('--- API SUMMARY VERIFICATION ---');
        console.log(JSON.stringify(json.summary, null, 2));

        console.log('--- STUDENT 1 VERIFICATION ---');
        if (json.data && json.data.length > 0) {
            const s = json.data[0];
            console.log('Name:', s.firstName, s.lastName);
            console.log('ID:', s.studentId);
            console.log('Company:', s.company);
        } else {
            console.log('No students returned in data array.');
        }
        process.exit(0);
    } catch (e) {
        console.error('Fetch failed:', e.message);
        process.exit(1);
    }
}
test();
