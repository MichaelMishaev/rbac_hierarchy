#!/usr/bin/env tsx
/**
 * Performance Analysis Script - v1.3 Compliance
 * Analyzes database indexes, query performance, and schema efficiency
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PerformanceMetric {
  category: string;
  name: string;
  status: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT';
  value: any;
  recommendation?: string;
}

const metrics: PerformanceMetric[] = [];

function log(emoji: string, message: string) {
  console.log(`${emoji} ${message}`);
}

function addMetric(metric: PerformanceMetric) {
  metrics.push(metric);
  const emoji =
    metric.status === 'EXCELLENT'
      ? '🚀'
      : metric.status === 'GOOD'
        ? '✅'
        : '⚠️';
  // Convert BigInt to string for JSON serialization
  const valueStr = JSON.stringify(metric.value, (_, v) =>
    typeof v === 'bigint' ? Number(v) : v
  );
  log(emoji, `${metric.name}: ${valueStr}`);
}

async function main() {
  log('⚡', 'Starting Performance Analysis...\n');

  // Category 1: Database Indexes
  log('📊', '=== DATABASE INDEXES ===');

  // Check indexes via raw SQL
  const indexes = await prisma.$queryRaw<any[]>`
    SELECT
      schemaname,
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `;

  const indexCount = indexes.length;
  const tableCount = new Set(indexes.map((i) => i.tablename)).size;

  addMetric({
    category: 'Indexes',
    name: 'Index Coverage',
    status: indexCount > tableCount * 2 ? 'EXCELLENT' : 'GOOD',
    value: { totalIndexes: indexCount, tables: tableCount },
  });

  // Check composite indexes
  const compositeIndexes = indexes.filter((i) =>
    i.indexdef.includes(', ')
  );

  addMetric({
    category: 'Indexes',
    name: 'Composite Indexes',
    status: compositeIndexes.length >= 2 ? 'EXCELLENT' : 'GOOD',
    value: { count: compositeIndexes.length },
    recommendation:
      compositeIndexes.length < 2
        ? 'Consider adding composite indexes for frequently joined columns'
        : undefined,
  });

  // Category 2: Table Statistics
  log('\n📈', '=== TABLE STATISTICS ===');

  const tables = ['users', 'corporations', 'sites', 'workers', 'supervisor_sites'];
  for (const table of tables) {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        '${table}' as table_name,
        COUNT(*) as row_count,
        pg_size_pretty(pg_total_relation_size('${table}')) as total_size
      FROM ${table};
    `);

    if (result[0]) {
      addMetric({
        category: 'Table Stats',
        name: `${table} size`,
        status: 'GOOD',
        value: {
          rows: result[0].row_count,
          size: result[0].total_size,
        },
      });
    }
  }

  // Category 3: Query Performance
  log('\n⚡', '=== QUERY PERFORMANCE ===');

  // Test 1: Simple query performance
  const startTime1 = Date.now();
  await prisma.user.findMany({ take: 100 });
  const duration1 = Date.now() - startTime1;

  addMetric({
    category: 'Query Performance',
    name: 'Simple Query (100 users)',
    status: duration1 < 50 ? 'EXCELLENT' : duration1 < 200 ? 'GOOD' : 'NEEDS_IMPROVEMENT',
    value: { durationMs: duration1 },
    recommendation:
      duration1 > 200 ? 'Consider adding indexes on frequently queried columns' : undefined,
  });

  // Test 2: Join query performance
  const startTime2 = Date.now();
  await prisma.activist.findMany({
    include: {
      neighborhood: true,
      city: true,
      activistCoordinator: true,
    },
    take: 50,
  });
  const duration2 = Date.now() - startTime2;

  addMetric({
    category: 'Query Performance',
    name: 'Join Query (50 workers + 3 joins)',
    status: duration2 < 100 ? 'EXCELLENT' : duration2 < 300 ? 'GOOD' : 'NEEDS_IMPROVEMENT',
    value: { durationMs: duration2 },
    recommendation:
      duration2 > 300
        ? 'Consider optimizing foreign key indexes'
        : undefined,
  });

  // Test 3: Composite FK query performance
  const startTime3 = Date.now();
  await prisma.activistCoordinatorNeighborhood.findMany({
    include: {
      activistCoordinator: true,
      neighborhood: true,
    },
    take: 50,
  });
  const duration3 = Date.now() - startTime3;

  addMetric({
    category: 'Query Performance',
    name: 'Composite FK Query',
    status: duration3 < 100 ? 'EXCELLENT' : duration3 < 300 ? 'GOOD' : 'NEEDS_IMPROVEMENT',
    value: { durationMs: duration3 },
    recommendation:
      duration3 > 300
        ? 'Composite FK queries may benefit from additional indexes'
        : undefined,
  });

  // Category 4: Connection Pooling
  log('\n🔌', '=== CONNECTION INFO ===');

  const connections = await prisma.$queryRaw<any[]>`
    SELECT
      COUNT(*) as active_connections,
      MAX(backend_start) as oldest_connection
    FROM pg_stat_activity
    WHERE datname = current_database();
  `;

  addMetric({
    category: 'Connections',
    name: 'Active Connections',
    status:
      connections[0].active_connections < 10
        ? 'EXCELLENT'
        : connections[0].active_connections < 50
          ? 'GOOD'
          : 'NEEDS_IMPROVEMENT',
    value: { count: Number(connections[0].active_connections) },
    recommendation:
      connections[0].active_connections > 50
        ? 'Consider implementing connection pooling (PgBouncer)'
        : undefined,
  });

  // Category 5: Schema Efficiency
  log('\n🏗️', '=== SCHEMA EFFICIENCY ===');

  // Check for missing foreign key indexes
  const fkIndexes = indexes.filter(
    (i) => i.indexname.includes('_fkey') || i.indexdef.toLowerCase().includes('foreign')
  );

  addMetric({
    category: 'Schema',
    name: 'Foreign Key Indexes',
    status: fkIndexes.length > 0 ? 'GOOD' : 'NEEDS_IMPROVEMENT',
    value: { count: fkIndexes.length },
    recommendation:
      fkIndexes.length === 0
        ? 'Add indexes on foreign key columns for better join performance'
        : undefined,
  });

  // Print summary
  log('\n📊', 'Performance Analysis Summary:');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', '');

  const excellent = metrics.filter((m) => m.status === 'EXCELLENT').length;
  const good = metrics.filter((m) => m.status === 'GOOD').length;
  const needsImprovement = metrics.filter(
    (m) => m.status === 'NEEDS_IMPROVEMENT'
  ).length;

  log('🚀', `Excellent: ${excellent}`);
  log('✅', `Good: ${good}`);
  log('⚠️', `Needs Improvement: ${needsImprovement}`);

  const overallStatus =
    needsImprovement === 0 && excellent > good
      ? 'EXCELLENT'
      : needsImprovement === 0
        ? 'GOOD'
        : 'NEEDS_IMPROVEMENT';

  log(
    overallStatus === 'EXCELLENT' ? '🎉' : overallStatus === 'GOOD' ? '✅' : '⚠️',
    `Overall Performance: ${overallStatus}`
  );

  // Print recommendations
  const recommendations = metrics.filter((m) => m.recommendation);
  if (recommendations.length > 0) {
    log('\n💡', 'Optimization Recommendations:');
    recommendations.forEach((m, i) => {
      log('→', `${i + 1}. ${m.name}: ${m.recommendation}`);
    });
  } else {
    log('\n🎉', 'No performance optimizations needed!');
  }

  console.log('\n📋 Detailed Metrics:');
  // Convert BigInt for JSON serialization
  console.log(JSON.stringify(metrics, (_, v) => typeof v === 'bigint' ? Number(v) : v, 2));

  await prisma.$disconnect();

  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Performance Analysis failed:', error);
  process.exit(1);
});
