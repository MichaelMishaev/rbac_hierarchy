#!/usr/bin/env tsx
/**
 * Integration Test Runner for Worker-Supervisor Business Rules
 *
 * Run all automated tests to verify business logic
 */

import { setupWorkerSupervisorTestData, cleanupWorkerSupervisorTestData } from './test-setup';
import { testWorkerCreation } from './01-worker-creation.test';
import { testWorkerUpdates } from './02-worker-updates.test';
import { testSupervisorAssignment } from './03-supervisor-assignment.test';
import { testSupervisorRemoval } from './04-supervisor-removal.test';
import { testDataIntegrity } from './05-data-integrity.test';

interface TestResult {
  name: string;
  passed: number;
  failed: number;
  errors: string[];
  duration: number;
}

async function runTestSuite(name: string, testFn: Function): Promise<TestResult> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 Running: ${name}`);
  console.log('='.repeat(60));

  const startTime = Date.now();
  const result: TestResult = {
    name,
    passed: 0,
    failed: 0,
    errors: [],
    duration: 0,
  };

  try {
    await testFn(result);
  } catch (error) {
    result.failed++;
    result.errors.push(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
  }

  result.duration = Date.now() - startTime;

  if (result.failed === 0) {
    console.log(`\n✅ ${name}: All ${result.passed} tests passed (${result.duration}ms)`);
  } else {
    console.log(`\n❌ ${name}: ${result.failed} failed, ${result.passed} passed (${result.duration}ms)`);
    result.errors.forEach(err => console.log(`   - ${err}`));
  }

  return result;
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   Worker-Supervisor Integration Test Suite              ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const overallStart = Date.now();
  let testData: any;

  try {
    // Setup test data
    console.log('🔧 Setting up test data...');
    testData = await setupWorkerSupervisorTestData();
    console.log('✅ Test data ready\n');

    // Run all test suites
    const results: TestResult[] = [];

    results.push(await runTestSuite('Worker Creation Validation', (r: TestResult) => testWorkerCreation(testData, r)));
    results.push(await runTestSuite('Worker Updates & Site Changes', (r: TestResult) => testWorkerUpdates(testData, r)));
    results.push(await runTestSuite('Supervisor Assignment & Auto-Assignment', (r: TestResult) => testSupervisorAssignment(testData, r)));
    results.push(await runTestSuite('Supervisor Removal & Reassignment', (r: TestResult) => testSupervisorRemoval(testData, r)));
    results.push(await runTestSuite('Data Integrity Checks', (r: TestResult) => testDataIntegrity(testData, r)));

    // Calculate totals
    const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
    const totalDuration = Date.now() - overallStart;

    // Print summary
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║                    FINAL SUMMARY                         ║');
    console.log('╚══════════════════════════════════════════════════════════╝');

    results.forEach(r => {
      const status = r.failed === 0 ? '✅' : '❌';
      const duration = `${r.duration}ms`;
      console.log(`${status} ${r.name.padEnd(45)} ${r.passed}/${r.passed + r.failed} (${duration})`);
    });

    console.log('\n' + '─'.repeat(60));
    console.log(`Total: ${totalPassed + totalFailed} tests`);
    console.log(`Passed: ${totalPassed} ✅`);
    console.log(`Failed: ${totalFailed} ${totalFailed > 0 ? '❌' : ''}`);
    console.log(`Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log('─'.repeat(60));

    if (totalFailed === 0) {
      console.log('\n🎉 All tests passed! System is working correctly.\n');
      process.exit(0);
    } else {
      console.log(`\n❌ ${totalFailed} test(s) failed. Please review errors above.\n`);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 Fatal error during test execution:');
    console.error(error);
    process.exit(1);
  } finally {
    // Cleanup
    if (testData) {
      console.log('\n🧹 Cleaning up test data...');
      await cleanupWorkerSupervisorTestData(testData);
      console.log('✅ Cleanup complete\n');
    }
  }
}

// Run tests
main().catch(console.error);
