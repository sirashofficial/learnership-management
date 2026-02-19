const http = require('http');

const loginData = JSON.stringify({
    email: 'ash@yeha.training',
    password: 'password123'
});

const loginOptions = {
    hostname: 'localhost',
    port: 3001,
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
            console.log('Token starts with:', token.substring(0, 20) + '...');

            // Test with Authorization header
            testWithHeader(token);
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

function testWithHeader(token) {
    console.log('\n--- Testing /api/assessments with Authorization header ---');

    const assessmentsOptions = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/assessments',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };

    const assessmentsReq = http.request(assessmentsOptions, (res) => {
        console.log(`ASSESSMENTS STATUS: ${res.statusCode}`);
        console.log('Response headers:', JSON.stringify(Object.fromEntries(res.headers), null, 2));

        res.setEncoding('utf8');
        let body = '';
        res.on('data', (chunk) => {
            body += chunk;
        });
        res.on('end', () => {
            console.log('Response body:', body);
        });
    });

    assessmentsReq.on('error', (e) => {
        console.error(`Assessments request error: ${e.message}`);
    });

    assessmentsReq.end();
}