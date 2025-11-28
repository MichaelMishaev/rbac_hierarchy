import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for SuperAdmin/Manager Dashboard
 * Supports RTL (Hebrew) UI testing
 */
export class DashboardPage {
  readonly page: Page;

  // Top Bar elements
  readonly corporationSelector: Locator;
  readonly searchBar: Locator;
  readonly userGreeting: Locator;

  // Sidebar navigation (Hebrew labels)
  readonly sidebarCorporations: Locator;
  readonly sidebarUsers: Locator;
  readonly sidebarRoles: Locator;
  readonly sidebarOrgStructure: Locator;
  readonly sidebarAuditLogs: Locator;
  readonly sidebarSettings: Locator;

  // KPI Cards
  readonly kpiActiveCorporations: Locator;
  readonly kpiManagers: Locator;
  readonly kpiSupervisors: Locator;
  readonly kpiSites: Locator;
  readonly kpiWorkers: Locator;

  // Organizational Diagram
  readonly orgDiagram: Locator;

  constructor(page: Page) {
    this.page = page;

    // Top Bar
    this.corporationSelector = page.locator('[data-testid="corporation-selector"]');
    this.searchBar = page.locator('[data-testid="search-bar"]');
    this.userGreeting = page.locator('[data-testid="user-greeting"]');

    // Sidebar (using Hebrew text or data-testid)
    this.sidebarCorporations = page.locator('[data-testid="sidebar-corporations"]');
    this.sidebarUsers = page.locator('[data-testid="sidebar-users"]');
    this.sidebarRoles = page.locator('[data-testid="sidebar-roles"]');
    this.sidebarOrgStructure = page.locator('[data-testid="sidebar-org-structure"]');
    this.sidebarAuditLogs = page.locator('[data-testid="sidebar-audit-logs"]');
    this.sidebarSettings = page.locator('[data-testid="sidebar-settings"]');

    // KPI Cards
    this.kpiActiveCorporations = page.locator('[data-testid="kpi-active-corporations"]');
    this.kpiManagers = page.locator('[data-testid="kpi-managers"]');
    this.kpiSupervisors = page.locator('[data-testid="kpi-supervisors"]');
    this.kpiSites = page.locator('[data-testid="kpi-sites"]');
    this.kpiWorkers = page.locator('[data-testid="kpi-workers"]');

    // Org Diagram
    this.orgDiagram = page.locator('[data-testid="org-diagram"]');
  }

  /**
   * Navigate to dashboard
   */
  async goto() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Verify page is in RTL mode (for Hebrew)
   */
  async verifyRTL() {
    const htmlDir = await this.page.locator('html').getAttribute('dir');
    expect(htmlDir).toBe('rtl');
  }

  /**
   * Select a corporation (SuperAdmin only)
   */
  async selectCorporation(corporationName: string) {
    await this.corporationSelector.click();
    await this.page.locator(`[data-value="${corporationName}"]`).click();
    await this.page.waitForTimeout(500); // Wait for data to refresh
  }

  /**
   * Get KPI value
   */
  async getKPIValue(kpiName: 'corporations' | 'managers' | 'supervisors' | 'sites' | 'workers'): Promise<number> {
    const locatorMap = {
      corporations: this.kpiActiveCorporations,
      managers: this.kpiManagers,
      supervisors: this.kpiSupervisors,
      sites: this.kpiSites,
      workers: this.kpiWorkers,
    };

    const text = await locatorMap[kpiName].textContent();
    return parseInt(text?.replace(/[^0-9]/g, '') || '0', 10);
  }

  /**
   * Navigate to section via sidebar
   */
  async navigateToSection(section: 'corporations' | 'users' | 'roles' | 'org-structure' | 'audit-logs' | 'settings') {
    const locatorMap = {
      corporations: this.sidebarCorporations,
      users: this.sidebarUsers,
      roles: this.sidebarRoles,
      'org-structure': this.sidebarOrgStructure,
      'audit-logs': this.sidebarAuditLogs,
      settings: this.sidebarSettings,
    };

    await locatorMap[section].click();
  }

  /**
   * Verify user greeting shows correct role
   */
  async verifyUserGreeting(expectedRole: string) {
    const greeting = await this.userGreeting.textContent();
    expect(greeting).toContain(expectedRole);
  }

  /**
   * Search for entity
   */
  async search(query: string) {
    await this.searchBar.fill(query);
    await this.page.keyboard.press('Enter');
  }
}
