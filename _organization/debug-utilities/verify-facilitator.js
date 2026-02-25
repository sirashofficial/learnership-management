const http = require('http');

const groupId = 'AZELIS_LP_2025';
const baseUrl = 'http://localhost:3000';

async function request(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function verify() {
    console.log('--- Phase 6 Verification Script ---');

    // 1. Fetch Checklist
    console.log('1. Fetching checklist for group:', groupId);
    const checklist = await request(`/api/facilitator/checklist?groupId=${groupId}`);
    console.log('Success:', checklist.success);

    // 2. Create Manual Task
    console.log('2. Creating manual task...');
    const newTask = await request('/api/facilitator/tasks', 'POST', {
        title: 'Verification Test Task',
        description: 'Testing manual task creation',
        dueDate: '2026-03-01',
        groupId: groupId
    });
    console.log('Task Created:', newTask.success ? newTask.data.id : 'FAILED');

    if (newTask.success) {
        const taskId = newTask.data.id;

        // 3. Update Task Status
        console.log('3. Updating task status to COMPLETED...');
        const updatedTask = await request('/api/facilitator/tasks', 'PATCH', {
            taskId: taskId,
            status: 'COMPLETED'
        });
        console.log('Task Updated:', updatedTask.success ? updatedTask.data.status : 'FAILED');
    }

    // 4. Mark Unit Standard as Facilitated (if any)
    if (checklist.success && checklist.data.today.length > 0) {
        const rolloutId = checklist.data.today[0].id;
        console.log('4. Marking US rollout as facilitated:', rolloutId);
        const markRes = await request('/api/facilitator/checklist', 'POST', {
            rolloutId: rolloutId,
            facilitated: true,
            notes: 'Verification test note'
        });
        console.log('Marked Facilitated:', markRes.success);
    } else if (checklist.success) {
        // Try overdue or upcoming if today is empty
        const otherTasks = [...checklist.data.overdue, ...checklist.data.upcoming];
        if (otherTasks.length > 0) {
            const rolloutId = otherTasks[0].id;
            console.log('4. Marking US rollout (overdue/upcoming) as facilitated:', rolloutId);
            const markRes = await request('/api/facilitator/checklist', 'POST', {
                rolloutId: rolloutId,
                facilitated: true,
                notes: 'Verification test note'
            });
            console.log('Marked Facilitated:', markRes.success);
        }
    }

    console.log('--- Verification Complete ---');
}

verify().catch(console.error);
