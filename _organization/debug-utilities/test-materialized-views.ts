/**
 * Test script for materialized views performance
 * 
 * Run this with: npx ts-node test-materialized-views.ts
 */

import { PrismaClient } from '@prisma/client';
import { refreshAllStats, refreshGroupStats } from './src/lib/calculations/materializedViewManager.js';

const prisma = new PrismaClient();

async function testMaterializedViews() {
  console.log('🧪 Testing Materialized Views Performance\n');

  try {
    // 1. Check current state
    console.log('📊 Step 1: Checking current state...');
    const totalGroups = await prisma.group.count();
    const cachedGroups = await prisma.groupStats.count();
    console.log(`   - Total groups: ${totalGroups}`);
    console.log(`   - Cached stats: ${cachedGroups}\n`);

    // 2. Initialize all stats
    if (cachedGroups < totalGroups) {
      console.log('🔄 Step 2: Initializing materialized views...');
      const startInit = Date.now();
      await refreshAllStats();
      const initDuration = Date.now() - startInit;
      console.log(`   ✓ Initialized in ${initDuration}ms\n`);
    } else {
      console.log('✓ Step 2: Stats already initialized\n');
    }

    // 3. Test individual group refresh
    console.log('🔄 Step 3: Testing individual group refresh...');
    const firstGroup = await prisma.group.findFirst();
    if (firstGroup) {
      const startRefresh = Date.now();
      await refreshGroupStats(firstGroup.id);
      const refreshDuration = Date.now() - startRefresh;
      console.log(`   ✓ Refreshed group "${firstGroup.name}" in ${refreshDuration}ms\n`);
    }

    // 4. Verify cached data
    console.log('📈 Step 4: Verifying cached statistics...');
    const stats = await prisma.groupStats.findMany({
      take: 3,
      include: {
        group: {
          select: { name: true },
        },
      },
    });

    if (stats.length > 0) {
      console.log('   Sample cached statistics:');
      for (const stat of stats) {
        const group = await prisma.group.findUnique({ where: { id: stat.groupId } });
        console.log(`   - ${group?.name || 'Unknown'}: ${stat.studentCount} students, ${stat.avgProgress.toFixed(1)}% avg progress, ${stat.attendanceRate.toFixed(1)}% attendance`);
      }
    }
    console.log();

    // 5. Performance comparison
    console.log('⚡ Step 5: Performance comparison...');
    
    // Test cached query
    const startCached = Date.now();
    const cachedResult = await prisma.groupStats.findMany({
      take: 10,
    });
    const cachedDuration = Date.now() - startCached;
    console.log(`   - Cached query (10 groups): ${cachedDuration}ms`);

    // Test live aggregation
    const startLive = Date.now();
    const groups = await prisma.group.findMany({
      take: 10,
      include: {
        students: {
          include: {
            attendance: true,
            assessments: true,
          },
        },
      },
    });
    const liveDuration = Date.now() - startLive;
    console.log(`   - Live aggregation (10 groups): ${liveDuration}ms`);
    
    const improvement = liveDuration > 0 ? ((liveDuration - cachedDuration) / liveDuration * 100).toFixed(1) : 0;
    console.log(`   📊 Performance improvement: ${improvement}%\n`);

    // 6. Dashboard summary metrics
    console.log('📋 Step 6: Dashboard summary metrics...');
    const summaryMetrics = await prisma.dashboardSummary.findMany({
      orderBy: { timestamp: 'desc' },
      take: 5,
    });
    if (summaryMetrics.length > 0) {
      console.log('   Latest metrics:');
      for (const metric of summaryMetrics) {
        console.log(`   - ${metric.metricType}: ${metric.value} (${new Date(metric.timestamp).toLocaleString()})`);
      }
    } else {
      console.log('   ⚠ No dashboard summary metrics found');
    }
    console.log();

    console.log('✅ All tests completed successfully!\n');
    console.log('📝 Summary:');
    console.log(`   - Groups: ${totalGroups}`);
    console.log(`   - Cached stats: ${await prisma.groupStats.count()}`);
    console.log(`   - Dashboard metrics: ${summaryMetrics.length}`);
    console.log(`   - Performance gain: ~${improvement}%`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testMaterializedViews()
  .then(() => {
    console.log('\n✅ Test suite completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });
