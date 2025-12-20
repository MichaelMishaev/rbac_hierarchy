import { chromium, devices } from '@playwright/test';
import path from 'path';
import fs from 'fs';

async function takeScreenshots() {
  // Create screenshots directory if it doesn't exist
  const screenshotsDir = path.join(__dirname, '../screenshots/activists-ux-issue');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: false });

  // iPhone 14 (mobile viewport)
  const mobileContext = await browser.newContext({
    ...devices['iPhone 14'],
    locale: 'he-IL',
    timezoneId: 'Asia/Jerusalem',
  });

  const page = await mobileContext.newPage();

  try {
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3200/login');
    await page.waitForLoadState('networkidle');

    // Take screenshot of login page
    await page.screenshot({
      path: path.join(screenshotsDir, '01-login-page.png'),
      fullPage: true
    });

    console.log('2. Logging in...');
    // Login using the credentials
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    await page.locator('input').first().fill('admin@election.test');
    await page.locator('input[type="password"]').fill('admin123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    console.log('3. Navigating to activists page...');
    await page.goto('http://localhost:3200/activists');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for animations

    // Take screenshot of activists page
    await page.screenshot({
      path: path.join(screenshotsDir, '02-activists-page-initial.png'),
      fullPage: true
    });

    console.log('4. Opening "Add Activist" modal...');
    // Click the "Add Activist" button
    const addButton = page.locator('button:has-text("פעיל חדש"), button:has-text("הוסף פעיל")').first();
    await addButton.click();
    await page.waitForTimeout(500); // Wait for modal animation

    // Take screenshot of modal - top section
    await page.screenshot({
      path: path.join(screenshotsDir, '03-modal-top-section.png'),
      fullPage: false
    });

    console.log('5. Taking screenshot of modal visible area (above fold)...');
    // This shows what user sees WITHOUT scrolling
    await page.screenshot({
      path: path.join(screenshotsDir, '04-modal-above-fold.png'),
    });

    console.log('6. Scrolling modal to show "Access System" section...');
    // Scroll down to the Access System section
    const dialogContent = page.locator('[id="activist-dialog-description"]').first();
    await dialogContent.evaluate((el) => {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    });
    await page.waitForTimeout(1000); // Wait for scroll animation

    // Take screenshot showing Access System section
    await page.screenshot({
      path: path.join(screenshotsDir, '05-modal-access-system-section.png'),
    });

    console.log('7. Taking full modal screenshot...');
    // Full modal screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, '06-modal-full-page.png'),
      fullPage: true
    });

    console.log('8. Enabling "Access System" toggle...');
    // Enable the Access System toggle
    const toggleLabel = page.locator('text=אפשר גישה למערכת').first();
    await toggleLabel.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Click the switch (find the actual switch element)
    const switchElement = page.locator('input[type="checkbox"]').last();
    await switchElement.click();
    await page.waitForTimeout(1000); // Wait for password section to appear with animation

    // Take screenshot with Access System enabled
    await page.screenshot({
      path: path.join(screenshotsDir, '07-modal-access-enabled.png'),
    });

    console.log('9. Scrolling to password section...');
    // The password section should be visible now - scroll to it
    await dialogContent.evaluate((el) => {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(screenshotsDir, '08-modal-password-section.png'),
    });

    console.log('\n✅ Screenshots saved to:', screenshotsDir);
    console.log('\nFiles created:');
    console.log('  01-login-page.png - Login page');
    console.log('  02-activists-page-initial.png - Main activists page');
    console.log('  03-modal-top-section.png - Modal top (title area)');
    console.log('  04-modal-above-fold.png - What user sees initially (THE PROBLEM)');
    console.log('  05-modal-access-system-section.png - After scrolling to Access System');
    console.log('  06-modal-full-page.png - Full modal (for reference)');
    console.log('  07-modal-access-enabled.png - Access System toggle enabled');
    console.log('  08-modal-password-section.png - Password section visible');

  } catch (error) {
    console.error('Error taking screenshots:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshots();
