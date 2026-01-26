/**
 * 🔴 COMPREHENSIVE ERROR TRACKING SYSTEM
 *
 * Captures ALL possible details for debugging:
 * - Full stack traces
 * - Component stack
 * - User session info
 * - Action breadcrumbs (last 50 actions)
 * - Browser/device info
 * - Network state
 * - Console logs history
 * - LocalStorage/SessionStorage
 * - Performance metrics
 * - DOM state
 * - Window size/orientation
 */

// Maximum breadcrumbs to keep
const MAX_BREADCRUMBS = 50;
const MAX_CONSOLE_LOGS = 100;

// Breadcrumb types
type BreadcrumbType = 'navigation' | 'click' | 'input' | 'api' | 'console' | 'error' | 'custom';

interface Breadcrumb {
  type: BreadcrumbType;
  category: string;
  message: string;
  data?: any;
  timestamp: number;
  level: 'info' | 'warning' | 'error';
}

interface ConsoleLog {
  level: 'log' | 'info' | 'warn' | 'error';
  message: string;
  args: any[];
  timestamp: number;
  stack?: string;
}

interface PerformanceMetrics {
  loadTime: number;
  domReady: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint?: number;
  timeToInteractive?: number;
  totalBlockingTime?: number;
  cumulativeLayoutShift?: number;
  memoryUsage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  languages: string[];
  cookieEnabled: boolean;
  doNotTrack: string | null;
  screen: {
    width: number;
    height: number;
    availWidth: number;
    availHeight: number;
    colorDepth: number;
    pixelDepth: number;
    orientation: string;
  };
  window: {
    innerWidth: number;
    innerHeight: number;
    outerWidth: number;
    outerHeight: number;
    devicePixelRatio: number;
  };
  connection?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  };
  battery?: {
    charging: boolean;
    level: number;
    chargingTime: number;
    dischargingTime: number;
  };
}

interface NetworkState {
  online: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

interface ErrorContext {
  // Error details
  message: string;
  stack?: string;
  componentStack?: string;
  digest?: string;

  // User context
  userId?: string;
  userEmail?: string;
  userRole?: string;
  sessionId?: string;

  // Page context
  url: string;
  referrer: string;
  pathname: string;
  search: string;
  hash: string;

  // Device/Browser
  device: DeviceInfo;

  // Network
  network: NetworkState;

  // Performance
  performance: PerformanceMetrics;

  // History
  breadcrumbs: Breadcrumb[];
  consoleLogs: ConsoleLog[];

  // Storage
  localStorage: Record<string, any>;
  sessionStorage: Record<string, any>;

  // DOM state
  dom: {
    activeElement?: string;
    focusedElement?: string;
    scrollPosition: { x: number; y: number };
    visibilityState: string;
  };

  // React/App state (if available)
  appState?: any;

  // Custom metadata
  metadata?: Record<string, any>;
}

class ErrorTracker {
  private breadcrumbs: Breadcrumb[] = [];
  private consoleLogs: ConsoleLog[] = [];
  private originalConsole: any = {};

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    // Intercept console methods
    this.interceptConsole();

    // Track navigation
    this.trackNavigation();

    // Track clicks
    this.trackClicks();

    // Track inputs
    this.trackInputs();

    // Track network errors
    this.trackNetworkErrors();

    // Track unhandled promise rejections
    this.trackUnhandledRejections();

    // Track visibility changes
    this.trackVisibility();
  }

  /**
   * Safely stringify objects with circular references, DOM nodes, and React internals
   */
  private safeStringify(obj: any, maxDepth = 3): string {
    const seen = new WeakSet();

    const stringify = (value: any, depth: number): any => {
      if (depth > maxDepth) return '[Max Depth]';
      if (value === null) return null;
      if (value === undefined) return undefined;

      if (typeof value !== 'object') return value;

      // Handle DOM nodes
      if (value instanceof HTMLElement) {
        return `[HTMLElement: ${value.tagName}${value.id ? '#' + value.id : ''}]`;
      }

      // Handle circular references
      if (seen.has(value)) return '[Circular]';
      seen.add(value);

      // Handle arrays
      if (Array.isArray(value)) {
        return value.slice(0, 10).map(v => stringify(v, depth + 1));
      }

      // Handle objects
      const result: any = {};
      const keys = Object.keys(value).slice(0, 20);
      for (const key of keys) {
        // Skip React internal properties
        if (key.startsWith('__react') || key.startsWith('_react')) continue;
        try {
          result[key] = stringify(value[key], depth + 1);
        } catch {
          result[key] = '[Error]';
        }
      }
      return result;
    };

    try {
      return JSON.stringify(stringify(obj, 0));
    } catch {
      return '[Unserializable]';
    }
  }

  private interceptConsole() {
    ['log', 'info', 'warn', 'error'].forEach((method) => {
      this.originalConsole[method] = console[method as keyof Console];

      (console as any)[method] = (...args: any[]) => {
        // Call original
        this.originalConsole[method](...args);

        // Store log
        this.addConsoleLog(method as any, args);
      };
    });
  }

  private addConsoleLog(level: ConsoleLog['level'], args: any[]) {
    const log: ConsoleLog = {
      level,
      message: args.map(arg =>
        typeof arg === 'object' ? this.safeStringify(arg) : String(arg)
      ).join(' '),
      args,
      timestamp: Date.now(),
      stack: new Error().stack,
    };

    this.consoleLogs.push(log);

    // Keep only last MAX_CONSOLE_LOGS
    if (this.consoleLogs.length > MAX_CONSOLE_LOGS) {
      this.consoleLogs.shift();
    }
  }

  private trackNavigation() {
    window.addEventListener('popstate', () => {
      this.addBreadcrumb({
        type: 'navigation',
        category: 'navigation',
        message: `Navigation to ${window.location.href}`,
        timestamp: Date.now(),
        level: 'info',
      });
    });
  }

  private trackClicks() {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      const id = target.id ? `#${target.id}` : '';
      const classes = target.className && typeof target.className === 'string'
        ? `.${target.className.split(' ').join('.')}`
        : '';

      this.addBreadcrumb({
        type: 'click',
        category: 'user',
        message: `Clicked ${tagName}${id}${classes}`,
        data: {
          tagName,
          id: target.id,
          className: target.className,
          text: target.textContent?.slice(0, 100),
        },
        timestamp: Date.now(),
        level: 'info',
      });
    }, { passive: true });
  }

  private trackInputs() {
    document.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;

      this.addBreadcrumb({
        type: 'input',
        category: 'user',
        message: `Input in ${target.name || target.id || target.tagName}`,
        data: {
          name: target.name,
          id: target.id,
          type: target.type,
          // Don't log actual values for privacy
        },
        timestamp: Date.now(),
        level: 'info',
      });
    }, { passive: true });
  }

  private trackNetworkErrors() {
    window.addEventListener('error', (e) => {
      if (e.target !== window) {
        const target = e.target as HTMLElement;
        this.addBreadcrumb({
          type: 'error',
          category: 'resource',
          message: `Failed to load ${target.tagName}: ${(e.target as any).src || (e.target as any).href}`,
          timestamp: Date.now(),
          level: 'error',
        });
      }
    }, true);
  }

  private trackUnhandledRejections() {
    window.addEventListener('unhandledrejection', (e) => {
      this.addBreadcrumb({
        type: 'error',
        category: 'promise',
        message: `Unhandled rejection: ${e.reason}`,
        data: { reason: e.reason },
        timestamp: Date.now(),
        level: 'error',
      });
    });
  }

  private trackVisibility() {
    document.addEventListener('visibilitychange', () => {
      this.addBreadcrumb({
        type: 'custom',
        category: 'visibility',
        message: `Page visibility: ${document.visibilityState}`,
        timestamp: Date.now(),
        level: 'info',
      });
    });
  }

  addBreadcrumb(breadcrumb: Breadcrumb) {
    this.breadcrumbs.push(breadcrumb);

    // Keep only last MAX_BREADCRUMBS
    if (this.breadcrumbs.length > MAX_BREADCRUMBS) {
      this.breadcrumbs.shift();
    }
  }

  private getDeviceInfo(): DeviceInfo {
    const nav = navigator as any;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

    return {
      userAgent: nav.userAgent,
      platform: nav.platform,
      language: nav.language,
      languages: nav.languages || [],
      cookieEnabled: nav.cookieEnabled,
      doNotTrack: nav.doNotTrack,
      screen: {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth,
        orientation: screen.orientation?.type || 'unknown',
      },
      window: {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight,
        devicePixelRatio: window.devicePixelRatio,
      },
      connection: conn ? {
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
        saveData: conn.saveData,
      } : undefined,
    };
  }

  private getNetworkState(): NetworkState {
    const nav = navigator as any;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

    return {
      online: nav.onLine,
      effectiveType: conn?.effectiveType,
      downlink: conn?.downlink,
      rtt: conn?.rtt,
    };
  }

  private getPerformanceMetrics(): PerformanceMetrics {
    const perf = performance;
    const timing = perf.timing;
    const nav = perf.getEntriesByType('navigation')[0] as any;
    const paint = perf.getEntriesByType('paint');
    const lcp = perf.getEntriesByType('largest-contentful-paint')[0] as any;

    const metrics: PerformanceMetrics = {
      loadTime: timing.loadEventEnd - timing.navigationStart,
      domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
      firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      largestContentfulPaint: lcp?.startTime,
      timeToInteractive: nav?.domInteractive - nav?.fetchStart,
    };

    // Memory (if available)
    if ((performance as any).memory) {
      metrics.memoryUsage = {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
      };
    }

    return metrics;
  }

  private getStorageData(storage: Storage): Record<string, any> {
    try {
      const data: Record<string, any> = {};
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key) {
          // Don't log sensitive keys
          if (!key.includes('password') && !key.includes('token') && !key.includes('secret')) {
            try {
              data[key] = JSON.parse(storage.getItem(key) || '');
            } catch {
              data[key] = storage.getItem(key);
            }
          }
        }
      }
      return data;
    } catch {
      return {};
    }
  }

  captureError(error: Error, additionalContext?: Record<string, any>): ErrorContext {
    const context: ErrorContext = {
      // Error details
      message: error.message,
      stack: error.stack,
      componentStack: (error as any).componentStack,
      digest: (error as any).digest,

      // Page context
      url: window.location.href,
      referrer: document.referrer,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,

      // Device/Browser
      device: this.getDeviceInfo(),

      // Network
      network: this.getNetworkState(),

      // Performance
      performance: this.getPerformanceMetrics(),

      // History
      breadcrumbs: [...this.breadcrumbs],
      consoleLogs: [...this.consoleLogs],

      // Storage
      localStorage: this.getStorageData(localStorage),
      sessionStorage: this.getStorageData(sessionStorage),

      // DOM state
      dom: {
        activeElement: document.activeElement?.tagName,
        focusedElement: document.activeElement?.id || document.activeElement?.className,
        scrollPosition: {
          x: window.scrollX,
          y: window.scrollY,
        },
        visibilityState: document.visibilityState,
      },

      // Custom metadata
      metadata: additionalContext,
    };

    return context;
  }

  /**
   * Fetch recent session events for additional context
   */
  private async fetchSessionJourney(): Promise<any[] | null> {
    try {
      // Get session ID from sessionStorage
      const sessionId = sessionStorage.getItem('session_tracker_id');
      if (!sessionId) return null;

      // Fetch last 20 session events
      const response = await fetch(`/api/session-event/journey?sessionId=${sessionId}&limit=20`, {
        method: 'GET',
      });

      if (!response.ok) return null;

      const data = await response.json();
      return data.events || null;
    } catch (err) {
      console.warn('[ErrorTracker] Failed to fetch session journey:', err);
      return null;
    }
  }

  async sendError(error: Error, additionalContext?: Record<string, any>) {
    const context = this.captureError(error, additionalContext);

    // Fetch session journey (non-blocking)
    const sessionJourneyPromise = this.fetchSessionJourney();

    try {
      // Wait for session journey (with timeout)
      const sessionJourney = await Promise.race([
        sessionJourneyPromise,
        new Promise(resolve => setTimeout(() => resolve(null), 1000)), // 1s timeout
      ]);

      await fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          digest: (error as any).digest,
          errorType: error.name,
          level: 'ERROR',
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          metadata: {
            ...context,
            // Add session journey to metadata
            sessionJourney,
          },
        }),
      });
    } catch (fetchError) {
      // Fallback: log to console
      console.error('[ErrorTracker] Failed to send error:', fetchError);
      console.error('[ErrorTracker] Original error:', error);
      console.error('[ErrorTracker] Full context:', context);
    }
  }
}

// Singleton instance
export const errorTracker = typeof window !== 'undefined' ? new ErrorTracker() : null;

// Helper function to log custom errors
export function logError(error: Error, context?: Record<string, any>) {
  errorTracker?.sendError(error, context);
}

// Helper function to add breadcrumbs manually
export function addBreadcrumb(message: string, data?: any, level: 'info' | 'warning' | 'error' = 'info') {
  errorTracker?.addBreadcrumb({
    type: 'custom',
    category: 'manual',
    message,
    data,
    timestamp: Date.now(),
    level,
  });
}
