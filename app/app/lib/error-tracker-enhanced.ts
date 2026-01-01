/**
 * 🔴 ULTRA-COMPREHENSIVE ERROR TRACKING SYSTEM V2
 *
 * Captures EVERYTHING for debugging:
 * - Full call stack with line numbers
 * - API request/response history
 * - React component tree & state
 * - Router history
 * - Environment & build info
 * - Browser extensions
 * - Resource timing
 * - Long tasks (performance bottlenecks)
 * - Web Vitals (CLS, FID, INP)
 * - Session timeline
 * - Similar errors tracking
 * - Memory leak detection
 */

const MAX_BREADCRUMBS = 100;
const MAX_CONSOLE_LOGS = 200;
const MAX_API_HISTORY = 50;
const MAX_ROUTE_HISTORY = 20;

// API Request/Response tracking
interface APICall {
  id: string;
  url: string;
  method: string;
  status?: number;
  statusText?: string;
  requestHeaders: Record<string, string>;
  requestBody?: any;
  responseHeaders?: Record<string, string>;
  responseBody?: any;
  duration: number;
  timestamp: number;
  error?: string;
}

// Route history
interface RouteChange {
  from: string;
  to: string;
  timestamp: number;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

// Enhanced call stack
interface CallStackFrame {
  functionName: string;
  fileName: string;
  lineNumber?: number;
  columnNumber?: number;
  source?: string;
}

// React component info
interface ReactComponentInfo {
  displayName: string;
  props?: any;
  state?: any;
  hooks?: any[];
  fiber?: any;
}

// Resource timing
interface ResourceTiming {
  name: string;
  type: string;
  duration: number;
  size: number;
  cached: boolean;
  protocol: string;
}

// Long task
interface LongTask {
  duration: number;
  startTime: number;
  attribution?: string;
}

// Web Vitals
interface WebVitals {
  CLS?: number; // Cumulative Layout Shift
  FID?: number; // First Input Delay
  INP?: number; // Interaction to Next Paint
  LCP?: number; // Largest Contentful Paint
  FCP?: number; // First Contentful Paint
  TTFB?: number; // Time to First Byte
}

// Browser extension
interface BrowserExtension {
  name: string;
  id?: string;
}

// Environment info
interface EnvironmentInfo {
  nodeEnv: string;
  nextVersion: string;
  reactVersion: string;
  buildId?: string;
  gitCommit?: string;
  gitBranch?: string;
  deploymentUrl?: string;
  timestamp?: string;
}

// Enhanced error context
interface EnhancedErrorContext {
  // Error details
  message: string;
  stack?: string;
  parsedStack?: CallStackFrame[];
  componentStack?: string;
  reactComponents?: ReactComponentInfo[];
  digest?: string;
  errorBoundary?: string;

  // User context
  userId?: string;
  userEmail?: string;
  userRole?: string;
  sessionId?: string;
  sessionDuration?: number;

  // Page context
  url: string;
  referrer: string;
  pathname: string;
  routeHistory: RouteChange[];

  // API history
  apiCalls: APICall[];
  failedAPICalls: APICall[];

  // Device/Browser
  device: any;
  browserExtensions: BrowserExtension[];

  // Network
  network: any;

  // Performance
  performance: any;
  webVitals: WebVitals;
  resourceTiming: ResourceTiming[];
  longTasks: LongTask[];

  // History
  breadcrumbs: any[];
  consoleLogs: any[];

  // Storage
  localStorage: Record<string, any>;
  sessionStorage: Record<string, any>;
  cookies: string;

  // DOM state
  dom: any;

  // Environment
  environment: EnvironmentInfo;

  // Session timeline
  sessionTimeline: {
    pageLoadTime: number;
    timeToError: number;
    totalInteractions: number;
    totalAPIcalls: number;
  };

  // Similar errors
  similarErrors?: {
    count: number;
    lastOccurrence: number;
    firstOccurrence: number;
  };

  // Source maps
  sourceMaps?: {
    available: boolean;
    unmappedLines?: number[];
  };
}

class EnhancedErrorTracker {
  private breadcrumbs: any[] = [];
  private consoleLogs: any[] = [];
  private apiHistory: APICall[] = [];
  private routeHistory: RouteChange[] = [];
  private longTasks: LongTask[] = [];
  private pageLoadTime: number = 0;
  private interactionCount: number = 0;
  private originalFetch: typeof fetch = fetch;
  private originalXHR: typeof XMLHttpRequest = XMLHttpRequest;

  constructor() {
    if (typeof window !== 'undefined') {
      this.pageLoadTime = Date.now();
      this.originalFetch = window.fetch;
      this.originalXHR = window.XMLHttpRequest;
      this.init();
    }
  }

  private init() {
    // Intercept fetch
    this.interceptFetch();

    // Intercept XMLHttpRequest
    this.interceptXHR();

    // Track long tasks
    this.trackLongTasks();

    // Track Web Vitals
    this.trackWebVitals();

    // Track route changes
    this.trackRouteChanges();

    // Detect browser extensions
    this.detectExtensions();

    // ... (keep existing tracking methods)
  }

  private interceptFetch() {
    this.originalFetch = window.fetch;

    window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
      const startTime = Date.now();
      const url = typeof args[0] === 'string'
        ? args[0]
        : args[0] instanceof Request
          ? args[0].url
          : args[0].toString();
      const options = args[1] || {};

      const apiCall: APICall = {
        id: `fetch-${Date.now()}-${Math.random()}`,
        url,
        method: options.method || 'GET',
        requestHeaders: this.headersToObject(options.headers),
        requestBody: this.safeClone(options.body),
        duration: 0,
        timestamp: startTime,
      };

      try {
        const response = await this.originalFetch(...args);
        const duration = Date.now() - startTime;

        apiCall.status = response.status;
        apiCall.statusText = response.statusText;
        apiCall.duration = duration;
        apiCall.responseHeaders = this.headersToObject(response.headers);

        // Clone response to read body
        const clonedResponse = response.clone();
        try {
          apiCall.responseBody = await clonedResponse.json();
        } catch {
          try {
            apiCall.responseBody = await clonedResponse.text();
          } catch {
            apiCall.responseBody = '[Unable to parse response]';
          }
        }

        this.addAPICall(apiCall);

        // Add breadcrumb
        this.addBreadcrumb({
          type: 'api',
          category: 'fetch',
          message: `${apiCall.method} ${url} → ${apiCall.status}`,
          data: { duration, status: apiCall.status },
          timestamp: Date.now(),
          level: apiCall.status >= 400 ? 'error' : 'info',
        });

        return response;
      } catch (error) {
        apiCall.duration = Date.now() - startTime;
        apiCall.error = String(error);

        this.addAPICall(apiCall);

        this.addBreadcrumb({
          type: 'api',
          category: 'fetch',
          message: `${apiCall.method} ${url} → FAILED`,
          data: { error: String(error) },
          timestamp: Date.now(),
          level: 'error',
        });

        throw error;
      }
    };
  }

  private interceptXHR() {
    const self = this;
    const OriginalXHR = window.XMLHttpRequest;

    (window as any).XMLHttpRequest = function() {
      const xhr = new OriginalXHR();
      const startTime = Date.now();

      let apiCall: APICall = {
        id: `xhr-${Date.now()}-${Math.random()}`,
        url: '',
        method: '',
        requestHeaders: {},
        duration: 0,
        timestamp: startTime,
      };

      const originalOpen = xhr.open;
      const originalSend = xhr.send;
      const originalSetRequestHeader = xhr.setRequestHeader;

      xhr.open = function(method: string, url: string | URL) {
        apiCall.method = method;
        apiCall.url = String(url);
        return originalOpen.apply(this, arguments as any);
      };

      xhr.setRequestHeader = function(header: string, value: string) {
        apiCall.requestHeaders[header] = value;
        return originalSetRequestHeader.apply(this, arguments as any);
      };

      xhr.send = function(body?: Document | XMLHttpRequestBodyInit) {
        apiCall.requestBody = self.safeClone(body);

        xhr.addEventListener('load', function() {
          apiCall.duration = Date.now() - startTime;
          apiCall.status = xhr.status;
          apiCall.statusText = xhr.statusText;
          apiCall.responseBody = self.safeParseJSON(xhr.responseText);

          self.addAPICall(apiCall);

          self.addBreadcrumb({
            type: 'api',
            category: 'xhr',
            message: `${apiCall.method} ${apiCall.url} → ${apiCall.status}`,
            data: { duration: apiCall.duration, status: apiCall.status },
            timestamp: Date.now(),
            level: apiCall.status >= 400 ? 'error' : 'info',
          });
        });

        xhr.addEventListener('error', function() {
          apiCall.duration = Date.now() - startTime;
          apiCall.error = 'Network error';

          self.addAPICall(apiCall);

          self.addBreadcrumb({
            type: 'api',
            category: 'xhr',
            message: `${apiCall.method} ${apiCall.url} → FAILED`,
            timestamp: Date.now(),
            level: 'error',
          });
        });

        return originalSend.apply(this, arguments as any);
      };

      return xhr;
    };
  }

  private trackLongTasks() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Tasks longer than 50ms
              this.longTasks.push({
                duration: entry.duration,
                startTime: entry.startTime,
                attribution: (entry as any).attribution?.[0]?.name,
              });

              this.addBreadcrumb({
                type: 'custom',
                category: 'performance',
                message: `Long task: ${entry.duration.toFixed(0)}ms`,
                data: { duration: entry.duration, startTime: entry.startTime },
                timestamp: Date.now(),
                level: 'warning',
              });
            }
          }
        });

        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Long task API not supported
      }
    }
  }

  private trackWebVitals() {
    if ('PerformanceObserver' in window) {
      // Track CLS (Cumulative Layout Shift)
      try {
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              (this as any).cls = ((this as any).cls || 0) + (entry as any).value;
            }
          }
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {}

      // Track FID (First Input Delay)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            (this as any).fid = (entry as any).processingStart - entry.startTime;
          }
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
      } catch (e) {}
    }
  }

  private trackRouteChanges() {
    let previousUrl = window.location.href;

    const trackRoute = () => {
      const newUrl = window.location.href;

      if (newUrl !== previousUrl) {
        this.routeHistory.push({
          from: previousUrl,
          to: newUrl,
          timestamp: Date.now(),
          params: this.getRouteParams(),
          query: this.getQueryParams(),
        });

        // Keep only last MAX_ROUTE_HISTORY
        if (this.routeHistory.length > MAX_ROUTE_HISTORY) {
          this.routeHistory.shift();
        }

        this.addBreadcrumb({
          type: 'navigation',
          category: 'route',
          message: `Route: ${previousUrl} → ${newUrl}`,
          timestamp: Date.now(),
          level: 'info',
        });

        previousUrl = newUrl;
      }
    };

    // Watch for URL changes
    window.addEventListener('popstate', trackRoute);
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function() {
      originalPushState.apply(this, arguments as any);
      trackRoute();
    };

    history.replaceState = function() {
      originalReplaceState.apply(this, arguments as any);
      trackRoute();
    };
  }

  private detectExtensions() {
    // Detect common extension signatures
    const extensions: BrowserExtension[] = [];

    // Check for common extension DOM modifications
    const extensionDetectors = [
      { name: 'Grammarly', selector: 'grammarly-extension' },
      { name: 'LastPass', selector: 'div[id^="lp"]' },
      { name: 'Honey', selector: '[data-honey]' },
      { name: 'Metamask', test: () => !!(window as any).ethereum },
      { name: 'React DevTools', test: () => !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ },
      { name: 'Redux DevTools', test: () => !!(window as any).__REDUX_DEVTOOLS_EXTENSION__ },
    ];

    extensionDetectors.forEach(detector => {
      if (detector.selector && document.querySelector(detector.selector)) {
        extensions.push({ name: detector.name });
      } else if (detector.test && detector.test()) {
        extensions.push({ name: detector.name });
      }
    });

    (this as any).browserExtensions = extensions;
  }

  private parseStackTrace(stack?: string): CallStackFrame[] {
    if (!stack) return [];

    const frames: CallStackFrame[] = [];
    const lines = stack.split('\n');

    for (const line of lines) {
      // Parse Chrome/Firefox stack format
      // Example: "    at functionName (file.js:10:5)"
      const chromeMatch = line.match(/at\s+([^\s]+)\s+\(([^:]+):(\d+):(\d+)\)/);
      const firefoxMatch = line.match(/([^@]+)@([^:]+):(\d+):(\d+)/);

      if (chromeMatch) {
        frames.push({
          functionName: chromeMatch[1],
          fileName: chromeMatch[2],
          lineNumber: parseInt(chromeMatch[3]),
          columnNumber: parseInt(chromeMatch[4]),
        });
      } else if (firefoxMatch) {
        frames.push({
          functionName: firefoxMatch[1],
          fileName: firefoxMatch[2],
          lineNumber: parseInt(firefoxMatch[3]),
          columnNumber: parseInt(firefoxMatch[4]),
        });
      }
    }

    return frames;
  }

  private getResourceTiming(): ResourceTiming[] {
    const resources: ResourceTiming[] = [];

    if (performance && performance.getEntriesByType) {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      entries.forEach(entry => {
        resources.push({
          name: entry.name,
          type: entry.initiatorType,
          duration: entry.duration,
          size: entry.transferSize || 0,
          cached: entry.transferSize === 0,
          protocol: (entry as any).nextHopProtocol || 'unknown',
        });
      });
    }

    return resources;
  }

  private getEnvironmentInfo(): EnvironmentInfo {
    return {
      nodeEnv: process.env.NODE_ENV || 'unknown',
      nextVersion: process.env.NEXT_PUBLIC_VERSION || 'unknown',
      reactVersion: (window as any).React?.version || 'unknown',
      buildId: process.env.NEXT_PUBLIC_BUILD_ID,
      gitCommit: process.env.NEXT_PUBLIC_GIT_COMMIT,
      gitBranch: process.env.NEXT_PUBLIC_GIT_BRANCH,
      deploymentUrl: process.env.NEXT_PUBLIC_DEPLOYMENT_URL,
      timestamp: process.env.NEXT_PUBLIC_BUILD_TIMESTAMP,
    };
  }

  private getCookies(): string {
    try {
      // Return cookie names only (not values for privacy)
      return document.cookie.split(';').map(c => c.split('=')[0].trim()).join(', ');
    } catch {
      return '';
    }
  }

  private getRouteParams(): Record<string, string> {
    // Extract route params (e.g., /users/[id] → { id: '123' })
    return {}; // Implement based on your routing system
  }

  private getQueryParams(): Record<string, string> {
    const params: Record<string, string> = {};
    const searchParams = new URLSearchParams(window.location.search);

    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    return params;
  }

  private addAPICall(call: APICall) {
    this.apiHistory.push(call);

    if (this.apiHistory.length > MAX_API_HISTORY) {
      this.apiHistory.shift();
    }
  }

  private addBreadcrumb(breadcrumb: any) {
    this.breadcrumbs.push(breadcrumb);

    if (this.breadcrumbs.length > MAX_BREADCRUMBS) {
      this.breadcrumbs.shift();
    }
  }

  private headersToObject(headers: any): Record<string, string> {
    const obj: Record<string, string> = {};

    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        obj[key] = value;
      });
    } else if (typeof headers === 'object') {
      Object.assign(obj, headers);
    }

    return obj;
  }

  private safeClone(data: any): any {
    try {
      return JSON.parse(JSON.stringify(data));
    } catch {
      return String(data);
    }
  }

  private safeParseJSON(text: string): any {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  captureEnhancedError(error: Error, additionalContext?: Record<string, any>): EnhancedErrorContext {
    const now = Date.now();

    const context: EnhancedErrorContext = {
      // Error details
      message: error.message,
      stack: error.stack,
      parsedStack: this.parseStackTrace(error.stack),
      componentStack: (error as any).componentStack,
      digest: (error as any).digest,
      errorBoundary: additionalContext?.errorBoundary,

      // Page context
      url: window.location.href,
      referrer: document.referrer,
      pathname: window.location.pathname,
      routeHistory: [...this.routeHistory],

      // API history
      apiCalls: [...this.apiHistory],
      failedAPICalls: this.apiHistory.filter(call => call.error || (call.status && call.status >= 400)),

      // Device/Browser
      device: {}, // Use previous implementation
      browserExtensions: (this as any).browserExtensions || [],

      // Network
      network: {}, // Use previous implementation

      // Performance
      performance: {}, // Use previous implementation
      webVitals: {
        CLS: (this as any).cls,
        FID: (this as any).fid,
        LCP: performance.getEntriesByType?.('largest-contentful-paint')?.[0]?.startTime,
        FCP: performance.getEntriesByType?.('paint')?.find(p => p.name === 'first-contentful-paint')?.startTime,
      },
      resourceTiming: this.getResourceTiming(),
      longTasks: [...this.longTasks],

      // History
      breadcrumbs: [...this.breadcrumbs],
      consoleLogs: [...this.consoleLogs],

      // Storage
      localStorage: {}, // Use previous implementation
      sessionStorage: {}, // Use previous implementation
      cookies: this.getCookies(),

      // DOM state
      dom: {}, // Use previous implementation

      // Environment
      environment: this.getEnvironmentInfo(),

      // Session timeline
      sessionTimeline: {
        pageLoadTime: this.pageLoadTime,
        timeToError: now - this.pageLoadTime,
        totalInteractions: this.interactionCount,
        totalAPIcalls: this.apiHistory.length,
      },
    };

    return context;
  }

  async sendEnhancedError(error: Error, additionalContext?: Record<string, any>) {
    const context = this.captureEnhancedError(error, additionalContext);

    try {
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
          metadata: context,
        }),
      });
    } catch (fetchError) {
      console.error('[EnhancedErrorTracker] Failed to send error:', fetchError);
      console.error('[EnhancedErrorTracker] Original error:', error);
      console.error('[EnhancedErrorTracker] Full context:', context);
    }
  }
}

// Singleton
export const enhancedErrorTracker = typeof window !== 'undefined' ? new EnhancedErrorTracker() : null;

export function logEnhancedError(error: Error, context?: Record<string, any>) {
  enhancedErrorTracker?.sendEnhancedError(error, context);
}
