import { chromium } from '@playwright/test';

async function verifyOrgTree() {
  console.log('🚀 Starting organizational tree verification...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login page
    console.log('📍 Navigating to login page...');
    await page.goto('http://localhost:3200/he/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Login as SuperAdmin
    console.log('🔑 Logging in as SuperAdmin...');
    await page.fill('input[name="email"]', 'admin@rbac.shop');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    console.log('⏳ Waiting for dashboard...');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.waitForSelector('text=שלום, Super Admin', { timeout: 10000 });
    console.log('✅ Dashboard loaded!');

    // Wait for organizational tree section
    console.log('🌳 Waiting for organizational tree section...');
    await page.waitForSelector('text=היררכיית המערכת', { timeout: 10000 });

    // Wait for the tree to render (D3 takes time)
    await page.waitForTimeout(3000);

    // Scroll to the tree section
    const treeHeading = page.locator('text=היררכיית המערכת');
    await treeHeading.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    // Check if tree has loaded by looking for SVG elements
    const svgElements = page.locator('svg');
    const svgCount = await svgElements.count();
    console.log(`📊 Found ${svgCount} SVG elements`);

    // Look for corporation names in the tree
    const pageContent = await page.content();

    console.log('\n🔍 Checking for real data in organizational tree...');

    const expectedCorporations = [
      'טכנולוגיות אלקטרה',
      'קבוצת בינוי',
      'רשת מזון טעים'
    ];

    const foundCorporations = [];
    for (const corp of expectedCorporations) {
      if (pageContent.includes(corp)) {
        foundCorporations.push(corp);
        console.log(`✅ Found: ${corp}`);
      } else {
        console.log(`❌ Missing: ${corp}`);
      }
    }

    // Take a screenshot
    console.log('\n📸 Taking screenshot...');
    await page.screenshot({
      path: '/Users/michaelmishayev/Desktop/Projects/corporations/org-tree-verification.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved to: /Users/michaelmishayev/Desktop/Projects/corporations/org-tree-verification.png');

    // Results
    console.log('\n' + '='.repeat(60));
    console.log('📊 VERIFICATION RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Corporations found: ${foundCorporations.length}/${expectedCorporations.length}`);
    console.log(`📈 SVG elements: ${svgCount}`);

    if (foundCorporations.length === expectedCorporations.length) {
      console.log('\n🎉 SUCCESS! Organizational tree is displaying REAL DATA from database!');
    } else {
      console.log('\n⚠️  WARNING: Some corporations are missing. Tree might still be loading...');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    console.log('\n🔍 Browser will remain open for manual inspection...');
    console.log('Press Ctrl+C to close when done.');
    // Keep browser open for manual inspection
    await page.waitForTimeout(300000); // 5 minutes
    await browser.close();
  }
}

verifyOrgTree();
