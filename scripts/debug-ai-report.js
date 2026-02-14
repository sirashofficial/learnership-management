
async function main() {
    try {
        const response = await fetch('http://localhost:3000/api/reports/daily/generate-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: '2026-02-09',
                groupName: 'Debug Group',
                facilitator: 'Debug Fac',
                modulesCovered: 'Mod 1',
                topicsCovered: 'Top 1',
                activitiesCompleted: ['Act 1'],
                observations: 'Obs',
                challengesFaced: 'None'
            })
        });

        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Body:', text);
    } catch (e) {
        console.error('Error:', e);
    }
}

main();
