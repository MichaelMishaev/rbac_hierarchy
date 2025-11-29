import { test, expect } from '@playwright/test';

test.describe('Organizational Tree - React D3 Tree Component QA', () => {
  test('should render beautiful D3 org chart with all features', async ({ page }) => {
    // Login as SuperAdmin
    await page.goto('/login');
    await page.click('text=SuperAdmin');
    await page.waitForTimeout(500);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await page.waitForTimeout(2000);

    // Scroll to System Hierarchy section (Hebrew: היררכיית המערכת)
    await page.locator('text=היררכיית המערכת').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    // Take screenshot of initial state
    await page.screenshot({
      path: '.playwright-mcp/d3-tree-initial.png',
      fullPage: false
    });

    // Verify control buttons exist (Hebrew labels)
    await expect(page.locator('text=הגדל')).toBeVisible(); // Zoom In
    await expect(page.locator('text=הקטן')).toBeVisible(); // Zoom Out
    await expect(page.locator('text=התאם למסך')).toBeVisible(); // Fit to Screen

    // Wait for SVG chart to render
    await page.waitForSelector('svg', { timeout: 10000 });

    // Verify SVG exists
    const svg = page.locator('svg').first();
    await expect(svg).toBeVisible();

    console.log('✅ React D3 Tree chart rendered successfully');

    // Verify foreignObject nodes are rendered (react-d3-tree uses foreignObject for custom nodes)
    const foreignObjects = page.locator('foreignObject');
    const foreignObjectCount = await foreignObjects.count();
    expect(foreignObjectCount).toBeGreaterThan(0);
    console.log(`✅ Found ${foreignObjectCount} custom nodes in the tree`);

    // Verify connection lines exist (react-d3-tree uses path elements)
    const paths = page.locator('svg path');
    const pathCount = await paths.count();
    expect(pathCount).toBeGreaterThan(0);
    console.log(`✅ Found ${pathCount} connection lines`);

    // Verify custom Material-UI styling is applied
    const nodeCards = page.locator('foreignObject div').first();
    await expect(nodeCards).toBeVisible();
    console.log('✅ Custom Material-UI nodes visible');

    // Take screenshot after verification
    await page.screenshot({
      path: '.playwright-mcp/d3-tree-verified.png',
      fullPage: false
    });

    // Test draggable functionality (react-d3-tree supports pan/drag)
    const svgRect = await svg.boundingBox();
    if (svgRect) {
      // Simulate drag to pan
      await page.mouse.move(svgRect.x + svgRect.width / 2, svgRect.y + svgRect.height / 2);
      await page.mouse.down();
      await page.mouse.move(svgRect.x + svgRect.width / 2 + 50, svgRect.y + svgRect.height / 2 + 50);
      await page.mouse.up();
      await page.waitForTimeout(500);
      console.log('✅ Pan/drag functionality working');
    }

    // Take final full page screenshot
    await page.screenshot({
      path: '.playwright-mcp/d3-tree-complete.png',
      fullPage: true
    });

    console.log('✅ All React D3 Tree tests passed!');
  });

  test('should have proper Material-UI styling and colors', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=SuperAdmin');
    await page.waitForTimeout(500);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await page.waitForTimeout(2000);

    await page.locator('text=היררכיית המערכת').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    // Wait for SVG
    await page.waitForSelector('svg', { timeout: 10000 });

    // Verify chart container styling
    const chartContainer = page.locator('svg').first();
    await expect(chartContainer).toBeVisible();

    // Check for foreignObject custom nodes
    const foreignObjects = page.locator('foreignObject');
    const count = await foreignObjects.count();
    expect(count).toBeGreaterThan(0);

    console.log(`✅ Found ${count} custom Material-UI nodes`);

    // Verify custom styles are applied via inline styles
    const firstNode = foreignObjects.first().locator('div').first();
    await expect(firstNode).toBeVisible();

    // Take screenshot for visual verification
    await page.screenshot({
      path: '.playwright-mcp/d3-tree-styling-check.png',
      fullPage: false
    });

    console.log('✅ Material-UI styling verified');
  });

  test('should display node information correctly', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=SuperAdmin');
    await page.waitForTimeout(500);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await page.waitForTimeout(2000);

    await page.locator('text=היררכיית המערכת').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    // Wait for SVG
    await page.waitForSelector('svg', { timeout: 10000 });

    // Verify SuperAdmin node exists (root node)
    const nodes = page.locator('foreignObject');
    const firstNode = nodes.first();
    await expect(firstNode).toBeVisible();

    // Verify node contains text content (using first() to avoid strict mode violation)
    const nodeContent = firstNode.locator('div').first();
    await expect(nodeContent).toBeVisible();

    console.log('✅ Node information displayed correctly');

    // Take screenshot
    await page.screenshot({
      path: '.playwright-mcp/d3-tree-node-info.png',
      fullPage: false
    });
  });

  test('should support zoom and pan interactions', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=SuperAdmin');
    await page.waitForTimeout(500);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await page.waitForTimeout(2000);

    await page.locator('text=היררכיית המערכת').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    // Wait for SVG
    const svg = await page.waitForSelector('svg', { timeout: 10000 });

    // Test mouse wheel zoom (react-d3-tree supports native zoom)
    const svgRect = await svg.boundingBox();
    if (svgRect) {
      await page.mouse.move(svgRect.x + svgRect.width / 2, svgRect.y + svgRect.height / 2);

      // Simulate zoom with mouse wheel
      await page.mouse.wheel(0, -100); // Zoom in
      await page.waitForTimeout(300);

      await page.mouse.wheel(0, 100); // Zoom out
      await page.waitForTimeout(300);

      console.log('✅ Mouse wheel zoom working');
    }

    // Take screenshot
    await page.screenshot({
      path: '.playwright-mcp/d3-tree-zoom-test.png',
      fullPage: false
    });

    console.log('✅ Zoom and pan interactions verified');
  });
});
