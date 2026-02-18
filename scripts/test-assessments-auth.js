const http = require('http');

const loginData = JSON.stringify({
    email: 'ash@yeha.training',
    password: 'password123'
});

const loginOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
    }
};

const req = http.request(loginOptions, (res) => {
    console.log(`LOGIN STATUS: ${res.statusCode}`);

    res.setEncoding('utf8');
    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });
    res.on('end', () => {
        if (res.statusCode === 200) {
            const loginResponse = JSON.parse(body);
            const token = loginResponse.data.token;

            console.log('✅ Login successful, got token');

            // Now test assessments endpoint
            testAssessmentsEndpoint(token);
        } else {
            console.log('❌ Login failed:', body);
        }
    });
});

req.on('error', (e) => {
    console.error(`Login error: ${e.message}`);
});

req.write(loginData);
req.end();

function testAssessmentsEndpoint(token) {
    console.log('\n--- Testing /api/assessments with token ---');

    const assessmentsOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/assessments',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    const assessmentsReq = http.request(assessmentsOptions, (res) => {
        console.log(`ASSESSMENTS STATUS: ${res.statusCode}`);

        res.setEncoding('utf8');
        let body = '';
        res.on('data', (chunk) => {
            body += chunk;
        });
        res.on('end', () => {
            if (res.statusCode === 200) {
                const data = JSON.parse(body);
                console.log('✅ Assessments endpoint works!');
                console.log(`Found ${data.length} assessments`);

                if (data.length > 0) {
                    console.log('\nSample assessment:');
                    console.log(`- Student: ${data[0].student?.firstName} ${data[0].student?.lastName}`);
                    console.log(`- Type: ${data[0].type}`);
                    console.log(`- Result: ${data[0].result || 'Pending'}`);
                    console.log(`- Group: ${data[0].student?.group?.name}`);
                }
            } else {
                console.log('❌ Assessments endpoint failed:', body);
            }
        });
    });

    assessmentsReq.on('error', (e) => {
        console.error(`Assessments request error: ${e.message}`);
    });

    assessmentsReq.end();
}