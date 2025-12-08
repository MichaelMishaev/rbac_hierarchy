import { expect, Page } from '@playwright/test';

/**
 * UI Test Helpers - For actual UI rendering tests
 * These tests verify that the UI renders correctly (unlike API-only E2E tests)
 */

/**
 * Verify RTL (Right-to-Left) layout is correctly applied
 */
export async function verifyRTL(page: Page) {
  const htmlDir = await page.locator('html').getAttribute('dir');
  expect(htmlDir).toBe('rtl');
}

/**
 * Verify Hebrew locale is active
 */
export async function verifyHebrewLocale(page: Page) {
  const htmlLang = await page.locator('html').getAttribute('lang');
  expect(htmlLang).toBe('he');
}

/**
 * Verify no loading skeletons are visible (data has loaded)
 */
export async function waitForDataLoad(page: Page, timeout: number = 10000) {
  // First, wait for network to be idle to ensure API calls complete
  try {
    await page.waitForLoadState('networkidle', { timeout: 5000 });
  } catch (e) {
    console.warn('⚠️ Warning: Network not idle after 5s, continuing...');
  }

  // Wait for loading skeletons to disappear
  try {
    await page.waitForFunction(
      () => {
        const skeletons = document.querySelectorAll('[class*="MuiSkeleton"]');
        return skeletons.length === 0;
      },
      { timeout }
    );
  } catch (e) {
    // If skeletons don't disappear, just continue
    // The actual assertions will catch if data didn't load
    const skeletons = await page.locator('[class*="MuiSkeleton"]').count();
    if (skeletons > 0) {
      console.warn(`⚠️ Warning: ${skeletons} skeleton loaders still visible after ${timeout}ms`);
    }
  }

  // Add a buffer to ensure data finishes rendering
  await page.waitForTimeout(1000);
}

/**
 * Verify Hebrew text is present on page
 */
export async function verifyHebrewText(page: Page, text: string) {
  const pageContent = await page.textContent('body');
  expect(pageContent).toContain(text);
}

/**
 * Verify multiple Hebrew texts are present
 */
export async function verifyMultipleHebrewTexts(page: Page, texts: string[]) {
  const pageContent = await page.textContent('body');
  for (const text of texts) {
    expect(pageContent).toContain(text);
  }
}

/**
 * Verify navigation sidebar is visible with Hebrew labels
 */
export async function verifyNavigationSidebar(page: Page, expectedItems: string[]) {
  const nav = page.locator('nav');
  await expect(nav).toBeVisible();

  for (const item of expectedItems) {
    await expect(nav.getByText(item)).toBeVisible();
  }
}

/**
 * Verify user greeting is displayed
 */
export async function verifyUserGreeting(page: Page, userName: string) {
  // Hebrew greeting pattern: "שלום, [name]" or "שלום [name]"
  const greeting = page.locator(`text=/שלום.*${userName}/i`);
  await expect(greeting).toBeVisible({ timeout: 10000 });
}

/**
 * Verify error message is displayed
 */
export async function verifyErrorMessage(page: Page, errorText?: string) {
  const alert = page.locator('[role="alert"]');
  await expect(alert).toBeVisible();

  if (errorText) {
    const alertContent = await alert.textContent();
    expect(alertContent).toContain(errorText);
  }
}

/**
 * Verify success message is displayed
 */
export async function verifySuccessMessage(page: Page, successText?: string) {
  const alert = page.locator('[role="alert"]');
  await expect(alert).toBeVisible();

  if (successText) {
    const alertContent = await alert.textContent();
    expect(alertContent).toContain(successText);
  }
}

/**
 * Verify table has data rows (for traditional tables)
 */
export async function verifyTableHasData(page: Page, minRows: number = 1) {
  // Wait for table to load
  await page.waitForSelector('table', { timeout: 5000 });

  // Count tbody rows (excluding header)
  const rows = await page.locator('tbody tr').count();
  expect(rows).toBeGreaterThanOrEqual(minRows);
}

/**
 * Verify Grid layout has data cards (for Material-UI Grid + Card layouts)
 */
export async function verifyGridHasData(page: Page, minCards: number = 1) {
  // Wait for Grid container to load
  await page.waitForSelector('[class*="MuiGrid-container"]', { timeout: 5000 });

  // Count cards in grid
  const cards = await page.locator('[class*="MuiCard"]').count();
  expect(cards).toBeGreaterThanOrEqual(minCards);
}

/**
 * Verify data is displayed (works for tables, MUI Cards, and custom Box-based card layouts)
 */
export async function verifyDataDisplayed(page: Page, minItems: number = 1) {
  // Wait for data to appear with generous timeout
  try {
    await page.waitForFunction(
      () => {
        const tableRows = document.querySelectorAll('tbody tr').length;
        const muiCards = document.querySelectorAll('[class*="MuiCard"]').length;
        // Custom card pattern: Grid items containing Avatars (corporations, sites, workers)
        const customCards = document.querySelectorAll('[class*="MuiGrid-item"]:has([class*="MuiAvatar"])').length;
        return (tableRows + muiCards + customCards) > 0;
      },
      { timeout: 10000 }
    );
  } catch (e) {
    // If nothing appears, log current state for debugging
    const tableRows = await page.locator('tbody tr').count();
    const muiCards = await page.locator('[class*="MuiCard"]').count();
    const customCards = await page.locator('[class*="MuiGrid-item"]:has([class*="MuiAvatar"])').count();
    console.warn(`⚠️ Warning: No data found after 10s (tables: ${tableRows}, MUI cards: ${muiCards}, custom cards: ${customCards})`);
  }

  const tableRows = await page.locator('tbody tr').count();
  const muiCards = await page.locator('[class*="MuiCard"]').count();
  const customCards = await page.locator('[class*="MuiGrid-item"]:has([class*="MuiAvatar"])').count();

  const totalItems = tableRows + muiCards + customCards;
  expect(totalItems).toBeGreaterThanOrEqual(minItems);
}

/**
 * Verify empty state is shown (no data)
 */
export async function verifyEmptyState(page: Page, emptyText: string) {
  await verifyHebrewText(page, emptyText);
}

/**
 * Verify page title/heading (works with both HTML headings and MUI Typography)
 */
export async function verifyPageTitle(page: Page, title: string) {
  // Try to find either traditional heading or MUI Typography with the title text
  const heading = page.getByText(title, { exact: false });
  await expect(heading.first()).toBeVisible({ timeout: 10000 });
}

/**
 * Verify action button is visible
 */
export async function verifyActionButton(page: Page, buttonText: string) {
  const button = page.locator(`button:has-text("${buttonText}")`);
  await expect(button).toBeVisible();
}

/**
 * Verify modal/dialog is open
 */
export async function verifyModalOpen(page: Page, modalTitle: string) {
  const modal = page.locator('[role="dialog"]');
  await expect(modal).toBeVisible();

  const title = modal.locator(`text=${modalTitle}`);
  await expect(title).toBeVisible();
}

/**
 * Verify modal/dialog is closed
 */
export async function verifyModalClosed(page: Page) {
  const modal = page.locator('[role="dialog"]');
  await expect(modal).not.toBeVisible();
}

/**
 * Take screenshot for visual regression
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `tests/e2e/ui/screenshots/${name}.png`, fullPage: true });
}

/**
 * Verify responsive design (mobile viewport)
 */
export async function verifyMobileLayout(page: Page) {
  await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
  await page.waitForTimeout(500); // Wait for layout reflow
}

/**
 * Verify responsive design (tablet viewport)
 */
export async function verifyTabletLayout(page: Page) {
  await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
  await page.waitForTimeout(500);
}

/**
 * Verify responsive design (desktop viewport)
 */
export async function verifyDesktopLayout(page: Page) {
  await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop size
  await page.waitForTimeout(500);
}

/**
 * Click action button with Hebrew text
 */
export async function clickActionButton(page: Page, buttonText: string) {
  const button = page.locator(`button:has-text("${buttonText}")`);
  await button.click();
}

/**
 * Fill form field with Hebrew label
 */
export async function fillFormField(page: Page, label: string, value: string) {
  const input = page.locator(`input[aria-label="${label}"], textarea[aria-label="${label}"]`);
  await input.fill(value);
}

/**
 * Verify form validation error
 */
export async function verifyFormValidationError(page: Page, errorText: string) {
  const error = page.locator(`text=${errorText}`);
  await expect(error).toBeVisible();
}

/**
 * Verify KPI card displays value
 * Uses data-testid when available, falls back to text search
 */
export async function verifyKPICard(page: Page, labelOrTestId: string, value?: string) {
  // Try data-testid first (e.g., "kpi-card-0")
  let card = page.locator(`[data-testid="${labelOrTestId}"]`);

  // If no data-testid, search by text content
  if (await card.count() === 0) {
    card = page.locator('[class*="MuiCard"]').filter({ hasText: labelOrTestId }).first();
  }

  await expect(card).toBeVisible();

  if (value) {
    const cardContent = await card.textContent();
    expect(cardContent).toContain(value);
  }
}
