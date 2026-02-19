const fetch = require('node-fetch');

async function testModulesAPI() {
    try {
        console.log('Testing Modules API...\n');

        const response = await fetch('http://localhost:3000/api/modules?includeUnitStandards=true');
        const data = await response.json();

        console.log('✅ API Response Status:', response.status);
        console.log('\n📊 Modules Summary:');
        console.log(`   Total Modules: ${data.modules?.length || 0}`);

        if (data.modules && data.modules.length > 0) {
            console.log('\n📚 Module Details:\n');
            data.modules.forEach(module => {
                console.log(`Module ${module.moduleNumber}: ${module.name}`);
                console.log(`  Credits: ${module.credits}`);
                console.log(`  Hours: ${module.notionalHours} (${module.classroomHours} classroom + ${module.workplaceHours} workplace)`);
                console.log(`  Unit Standards: ${module.unitStandards?.length || 0}`);
                console.log(`  Students: ${module._count?.students || 0}`);
                console.log('');
            });

            const totalCredits = data.modules.reduce((sum, m) => sum + m.credits, 0);
            const totalUnitStandards = data.modules.reduce((sum, m) => sum + (m.unitStandards?.length || 0), 0);

            console.log('📈 Overall Statistics:');
            console.log(`   Total Credits: ${totalCredits}/138`);
            console.log(`   Total Unit Standards: ${totalUnitStandards}`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testModulesAPI();
