/**
 * Navigation Performance Tests
 *
 * Automated tests to ensure navigation performance stays within acceptable limits.
 * These tests will fail if performance degrades below thresholds.
 */

import { test, expect, Page } from '@playwright/test';

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  navigationSwitch: 100,        // Tab switch should be < 100ms
  componentRender: 50,          // Component render < 50ms
  totalBlockingTime: 200,       // TBT < 200ms
  firstContentfulPaint: 1000,   // FCP < 1s
  largestContentfulPaint: 2500, // LCP < 2.5s
  cumulativeLayoutShift: 0.1,   // CLS < 0.1
};

test.describe('Navigation Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'superadmin@election.test');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('Navigation tab switch should be fast (<100ms)', async ({ page }) => {
    const tabs = [
      { name: 'Dashboard', selector: 'nav-link-dashboard' },
      { name: 'Activists', selector: 'nav-link-activists' },
      { name: 'Neighborhoods', selector: 'nav-link-neighborhoods' },
      { name: 'Cities', selector: 'nav-link-cities' },
      { name: 'Users', selector: 'nav-link-users' },
    ];

    const measurements: { tab: string; duration: number }[] = [];

    for (const tab of tabs) {
      // Start performance measurement
      const startTime = Date.now();

      // Click navigation tab
      await page.click(`[data-testid="${tab.selector}"]`);

      // Wait for URL to change (navigation complete)
      await page.waitForLoadState('networkidle');

      const endTime = Date.now();
      const duration = endTime - startTime;

      measurements.push({ tab: tab.name, duration });

      // Log individual measurement
      console.log(`✅ ${tab.name} navigation: ${duration}ms`);

      // Assert this navigation is fast enough
      expect(duration, `${tab.name} navigation should be < ${PERFORMANCE_THRESHOLDS.navigationSwitch}ms`).toBeLessThan(
        PERFORMANCE_THRESHOLDS.navigationSwitch
      );
    }

    // Calculate average
    const avgDuration =
      measurements.reduce((sum, m) => sum + m.duration, 0) / measurements.length;
    console.log(`\n📊 Average navigation time: ${avgDuration.toFixed(2)}ms`);

    // Assert average is acceptable
    expect(avgDuration, 'Average navigation time should be reasonable').toBeLessThan(
      PERFORMANCE_THRESHOLDS.navigationSwitch
    );
  });

  test('Component render time should be minimal', async ({ page }) => {
    // Enable performance monitoring
    await page.addInitScript(() => {
      (window as any).__performanceMarks = [];

      // Override React render to measure
      const originalPerformanceMark = performance.mark.bind(performance);
      performance.mark = function(markName: string) {
        if (markName.includes('render')) {
          (window as any).__performanceMarks.push({
            name: markName,
            time: performance.now(),
          });
        }
        return originalPerformanceMark(markName);
      };
    });

    // Navigate to activists page (heavy component)
    await page.goto('/activists');
    await page.waitForLoadState('networkidle');

    // Get render performance data
    const performanceData = await page.evaluate(() => {
      const entries = performance.getEntriesByType('measure');
      return entries.map((entry) => ({
        name: entry.name,
        duration: entry.duration,
      }));
    });

    console.log('📊 Render performance:', performanceData);

    // Check if any render took too long
    const slowRenders = performanceData.filter(
      (entry) => entry.duration > PERFORMANCE_THRESHOLDS.componentRender
    );

    if (slowRenders.length > 0) {
      console.warn('⚠️ Slow renders detected:', slowRenders);
    }

    expect(slowRenders.length, 'No renders should exceed threshold').toBe(0);
  });

  test('Navigation should not cause layout shifts', async ({ page }) => {
    let cumulativeLayoutShift = 0;

    // Track layout shifts
    await page.addInitScript(() => {
      (window as any).__layoutShifts = [];

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            (window as any).__layoutShifts.push({
              value: (entry as any).value,
              time: entry.startTime,
            });
          }
        }
      });

      observer.observe({ type: 'layout-shift', buffered: true });
    });

    // Navigate through tabs
    const tabs = ['dashboard', 'activists', 'neighborhoods', 'cities'];

    for (const tab of tabs) {
      await page.click(`[data-testid="nav-link-${tab}"]`);
      await page.waitForLoadState('networkidle');

      // Get layout shift data
      const layoutShifts = await page.evaluate(() => (window as any).__layoutShifts || []);

      const tabCLS = layoutShifts.reduce((sum: number, shift: any) => sum + shift.value, 0);
      cumulativeLayoutShift += tabCLS;

      console.log(`📊 ${tab} CLS: ${tabCLS.toFixed(4)}`);
    }

    console.log(`\n📊 Total CLS: ${cumulativeLayoutShift.toFixed(4)}`);

    expect(
      cumulativeLayoutShift,
      `CLS should be < ${PERFORMANCE_THRESHOLDS.cumulativeLayoutShift}`
    ).toBeLessThan(PERFORMANCE_THRESHOLDS.cumulativeLayoutShift);
  });

  test('Navigation drawer should open/close smoothly', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip('Mobile drawer test - skipping on desktop');
    }

    const measurements: number[] = [];

    // Test drawer open/close 5 times
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();

      // Open drawer
      await page.click('button[aria-label="menu"]');
      await page.waitForSelector('[data-testid="navigation-sidebar"]', { state: 'visible' });

      // Close drawer
      await page.click('button[aria-label="close"]');
      await page.waitForSelector('[data-testid="navigation-sidebar"]', { state: 'hidden' });

      const endTime = Date.now();
      const duration = endTime - startTime;
      measurements.push(duration);

      console.log(`✅ Drawer toggle ${i + 1}: ${duration}ms`);
    }

    const avgDuration = measurements.reduce((sum, d) => sum + d, 0) / measurements.length;
    console.log(`\n📊 Average drawer toggle time: ${avgDuration.toFixed(2)}ms`);

    // Drawer should be very responsive
    expect(avgDuration, 'Drawer toggle should be fast').toBeLessThan(50);
  });

  test('Memory usage should stay reasonable during navigation', async ({ page }) => {
    // Get initial memory
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    if (initialMemory === 0) {
      test.skip('Performance.memory API not available');
    }

    // Navigate through all tabs multiple times
    const tabs = ['dashboard', 'activists', 'neighborhoods', 'cities', 'users'];

    for (let round = 0; round < 3; round++) {
      for (const tab of tabs) {
        await page.click(`[data-testid="nav-link-${tab}"]`);
        await page.waitForLoadState('networkidle');
      }
    }

    // Get final memory
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    const memoryIncrease = finalMemory - initialMemory;
    const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

    console.log(`📊 Initial memory: ${(initialMemory / (1024 * 1024)).toFixed(2)}MB`);
    console.log(`📊 Final memory: ${(finalMemory / (1024 * 1024)).toFixed(2)}MB`);
    console.log(`📊 Memory increase: ${memoryIncreaseMB.toFixed(2)}MB`);

    // Memory increase should be reasonable (< 10MB after 15 navigations)
    expect(memoryIncreaseMB, 'Memory increase should be minimal').toBeLessThan(10);
  });

  test('Long-running navigation stress test', async ({ page }) => {
    const tabs = ['dashboard', 'activists', 'neighborhoods', 'cities', 'users'];
    const iterations = 20; // Navigate 20 times
    const durations: number[] = [];

    console.log(`\n🏃 Starting stress test: ${iterations} navigation cycles...\n`);

    for (let i = 0; i < iterations; i++) {
      const tabIndex = i % tabs.length;
      const tab = tabs[tabIndex];

      const startTime = Date.now();
      await page.click(`[data-testid="nav-link-${tab}"]`);
      await page.waitForLoadState('networkidle');
      const duration = Date.now() - startTime;

      durations.push(duration);

      if ((i + 1) % 5 === 0) {
        const recentAvg =
          durations.slice(-5).reduce((sum, d) => sum + d, 0) / 5;
        console.log(`✅ Completed ${i + 1}/${iterations} - Recent avg: ${recentAvg.toFixed(2)}ms`);
      }
    }

    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);

    console.log(`\n📊 Stress Test Results:`);
    console.log(`   Average: ${avgDuration.toFixed(2)}ms`);
    console.log(`   Min: ${minDuration}ms`);
    console.log(`   Max: ${maxDuration}ms`);

    // Check for performance degradation
    const firstFive = durations.slice(0, 5);
    const lastFive = durations.slice(-5);
    const firstAvg = firstFive.reduce((sum, d) => sum + d, 0) / firstFive.length;
    const lastAvg = lastFive.reduce((sum, d) => sum + d, 0) / lastFive.length;
    const degradation = ((lastAvg - firstAvg) / firstAvg) * 100;

    console.log(`   First 5 avg: ${firstAvg.toFixed(2)}ms`);
    console.log(`   Last 5 avg: ${lastAvg.toFixed(2)}ms`);
    console.log(`   Degradation: ${degradation.toFixed(2)}%`);

    // Performance should not degrade by more than 20%
    expect(degradation, 'Performance should not significantly degrade').toBeLessThan(20);

    // Average should still be acceptable
    expect(avgDuration, 'Average should stay under threshold').toBeLessThan(
      PERFORMANCE_THRESHOLDS.navigationSwitch
    );
  });
});

test.describe('Page Load Performance', () => {
  test('Dashboard should load quickly', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    console.log(`📊 Dashboard load time: ${loadTime}ms`);

    expect(loadTime, 'Dashboard should load quickly').toBeLessThan(3000);
  });

  test('Web Vitals should be within acceptable ranges', async ({ page }) => {
    // Track Web Vitals
    const webVitals: any = {};

    await page.addInitScript(() => {
      (window as any).__webVitals = {};

      // Simplified Web Vitals tracking
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
            (window as any).__webVitals.FCP = entry.startTime;
          }
          if (entry.entryType === 'largest-contentful-paint') {
            (window as any).__webVitals.LCP = entry.startTime;
          }
        }
      });

      observer.observe({ type: 'paint', buffered: true });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Wait a bit for vitals to be captured
    await page.waitForTimeout(1000);

    const vitals = await page.evaluate(() => (window as any).__webVitals);

    console.log('📊 Web Vitals:', vitals);

    if (vitals.FCP) {
      console.log(`   FCP: ${vitals.FCP.toFixed(2)}ms`);
      expect(vitals.FCP, 'FCP should be fast').toBeLessThan(
        PERFORMANCE_THRESHOLDS.firstContentfulPaint
      );
    }

    if (vitals.LCP) {
      console.log(`   LCP: ${vitals.LCP.toFixed(2)}ms`);
      expect(vitals.LCP, 'LCP should be fast').toBeLessThan(
        PERFORMANCE_THRESHOLDS.largestContentfulPaint
      );
    }
  });
});
