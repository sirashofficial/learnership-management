import { calculatePerformanceStatus } from '../src/lib/statusUtils';
import { PlanStatus } from '../src/types/rollout';

const testCases = [
    {
        name: 'On Track (Normal Attendance, No Module Lag)',
        args: [50, 55, true, 85, 4, 4, 'ON_TRACK'],
        expected: 'ON_TRACK'
    },
    {
        name: 'At Risk due to Low Attendance (< 50%)',
        args: [50, 55, true, 45, 4, 4, 'ON_TRACK'],
        expected: 'AT_RISK'
    },
    {
        name: 'Behind due to Module Lag (Expected 5, Actual 4)',
        args: [50, 50, true, 85, 4, 5, 'ON_TRACK'],
        expected: 'BEHIND'
    },
    {
        name: 'At Risk due to Major Module Lag (Expected 6, Actual 4)',
        args: [50, 50, true, 85, 4, 6, 'ON_TRACK'],
        expected: 'AT_RISK'
    },
    {
        name: 'Completed Plan Verification (Success)',
        args: [100, 100, true, 85, 6, 6, 'COMPLETE'],
        expected: 'COMPLETE'
    },
    {
        name: 'Overdue Plan (Complete date passed but incomplete)',
        args: [100, 80, true, 85, 5, 6, 'COMPLETE'],
        expected: 'AT_RISK'
    },
    {
        name: 'No Plan Handling',
        args: [0, 0, false, 85, 0, 0, 'NO_PLAN'],
        expected: 'NO_PLAN'
    }
];

console.log('🧪 Running Status Logic Unit Tests...\n');

let passed = 0;
testCases.forEach((tc, i) => {
    const result = (calculatePerformanceStatus as any)(...tc.args);
    const status = result === tc.expected ? '✅ PASS' : '❌ FAIL';
    console.log(`${i + 1}. ${status}: ${tc.name}`);
    if (result !== tc.expected) {
        console.log(`   - Expected: ${tc.expected}, Got: ${result}`);
    } else {
        passed++;
    }
});

console.log(`\n📊 Results: ${passed}/${testCases.length} tests passed.`);

if (passed === testCases.length) {
    console.log('\n✨ Status Logic Verified Successfully.');
    process.exit(0);
} else {
    process.exit(1);
}
