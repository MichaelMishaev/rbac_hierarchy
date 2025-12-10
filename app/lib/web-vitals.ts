/**
 * Web Vitals Monitoring
 *
 * Tracks Core Web Vitals (LCP, INP, CLS, FCP, TTFB) and sends to analytics.
 * Integrates with Next.js's built-in Web Vitals reporting.
 * Note: INP replaced FID in web-vitals v4
 */

import { Metric } from 'web-vitals';

// Performance thresholds based on Google's recommendations
export const WEB_VITALS_THRESHOLDS = {
  // Largest Contentful Paint (seconds)
  LCP: {
    good: 2.5,
    needsImprovement: 4.0,
  },
  // Cumulative Layout Shift (score)
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  // First Contentful Paint (seconds)
  FCP: {
    good: 1.8,
    needsImprovement: 3.0,
  },
  // Time to First Byte (milliseconds)
  TTFB: {
    good: 800,
    needsImprovement: 1800,
  },
  // Interaction to Next Paint (milliseconds) - replaces FID
  INP: {
    good: 200,
    needsImprovement: 500,
  },
};

/**
 * Get rating (good/needs-improvement/poor) for a metric
 */
function getRating(metric: Metric): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = WEB_VITALS_THRESHOLDS[metric.name as keyof typeof WEB_VITALS_THRESHOLDS];

  if (!thresholds) return 'good';

  const value = metric.name === 'CLS' ? metric.value : metric.value / (metric.name.includes('TTFB') || metric.name.includes('INP') ? 1 : 1000);

  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Format metric value for display
 */
function formatValue(metric: Metric): string {
  if (metric.name === 'CLS') {
    return metric.value.toFixed(3);
  }
  if (metric.name === 'TTFB' || metric.name === 'INP') {
    return `${Math.round(metric.value)}ms`;
  }
  return `${(metric.value / 1000).toFixed(2)}s`;
}

/**
 * Log metric to console (development only)
 */
function logMetricToConsole(metric: Metric) {
  if (process.env.NODE_ENV !== 'development') return;

  const rating = getRating(metric);
  const value = formatValue(metric);

  const emoji = {
    good: '🟢',
    'needs-improvement': '🟡',
    poor: '🔴',
  }[rating];

  const color = {
    good: 'color: green; font-weight: bold',
    'needs-improvement': 'color: orange; font-weight: bold',
    poor: 'color: red; font-weight: bold',
  }[rating];

  console.log(
    `%c[Web Vitals] ${emoji} ${metric.name}: ${value} (${rating})`,
    color
  );

  // Log additional details
  console.log(`  ID: ${metric.id}`);
  console.log(`  Navigation Type: ${metric.navigationType}`);
  // Note: Attribution removed in web-vitals v4 - use onXXX({ reportAllChanges: true }) for detailed metrics
}

/**
 * Send metric to analytics service
 */
async function sendToAnalytics(metric: Metric) {
  const rating = getRating(metric);
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating,
    id: metric.id,
    navigationType: metric.navigationType,
    delta: metric.delta,
    // attribution removed in web-vitals v4
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  });

  // In production, send to your analytics endpoint
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to your API
    try {
      await fetch('/api/analytics/web-vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true, // Ensure request completes even if page unloads
      });
    } catch (error) {
      // Fail silently - don't break user experience
      console.error('Failed to send web vitals:', error);
    }

    // Example: Send to Google Analytics 4
    if ((window as any).gtag) {
      (window as any).gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        metric_id: metric.id,
        metric_value: metric.value,
        metric_delta: metric.delta,
        metric_rating: rating,
      });
    }
  }

  // Store in localStorage for debugging
  if (process.env.NODE_ENV === 'development') {
    const stored = JSON.parse(localStorage.getItem('web-vitals') || '[]');
    stored.push({
      name: metric.name,
      value: metric.value,
      rating,
      timestamp: Date.now(),
    });
    // Keep only last 50 metrics
    if (stored.length > 50) stored.shift();
    localStorage.setItem('web-vitals', JSON.stringify(stored));
  }
}

/**
 * Store metric in Redis (for server-side aggregation)
 */
async function storeInRedis(metric: Metric) {
  if (process.env.NODE_ENV !== 'production') return;

  try {
    await fetch('/api/metrics/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'web-vital',
        name: metric.name,
        value: metric.value,
        rating: getRating(metric),
        timestamp: Date.now(),
        url: window.location.pathname,
      }),
      keepalive: true,
    });
  } catch (error) {
    // Fail silently
  }
}

/**
 * Main Web Vitals reporting function
 * Called by Next.js automatically via reportWebVitals in _app.tsx
 */
export function reportWebVitals(metric: Metric) {
  // Log to console (dev only)
  logMetricToConsole(metric);

  // Send to analytics
  sendToAnalytics(metric);

  // Store in Redis for aggregation
  storeInRedis(metric);

  // Trigger custom event for real-time monitoring
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('web-vital', {
        detail: {
          name: metric.name,
          value: metric.value,
          rating: getRating(metric),
          formatted: formatValue(metric),
        },
      })
    );
  }
}

/**
 * Get stored Web Vitals from localStorage (dev tool)
 */
export function getStoredWebVitals(): Array<{
  name: string;
  value: number;
  rating: string;
  timestamp: number;
}> {
  if (typeof window === 'undefined') return [];

  try {
    return JSON.parse(localStorage.getItem('web-vitals') || '[]');
  } catch {
    return [];
  }
}

/**
 * Clear stored Web Vitals (dev tool)
 */
export function clearStoredWebVitals() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('web-vitals');
  }
}

/**
 * React hook to monitor Web Vitals in real-time
 */
export function useWebVitals(callback: (metric: Metric) => void) {
  if (typeof window === 'undefined') return;

  const handleWebVital = (event: Event) => {
    const customEvent = event as CustomEvent;
    callback(customEvent.detail);
  };

  window.addEventListener('web-vital', handleWebVital);

  return () => {
    window.removeEventListener('web-vital', handleWebVital);
  };
}

/**
 * Performance monitoring helper - measure custom metrics
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  /**
   * Start measuring a custom metric
   */
  start(name: string) {
    this.marks.set(name, performance.now());
  }

  /**
   * End measuring and report
   */
  end(name: string, sendToAnalytics = true) {
    const startTime = this.marks.get(name);
    if (!startTime) {
      console.warn(`Performance mark "${name}" not found`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(name);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    }

    if (sendToAnalytics && process.env.NODE_ENV === 'production') {
      fetch('/api/metrics/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          duration,
          timestamp: Date.now(),
          url: window.location.pathname,
        }),
        keepalive: true,
      }).catch(() => {
        // Fail silently
      });
    }

    return duration;
  }

  /**
   * Measure a function execution time
   */
  async measure<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
    this.start(name);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }
}

/**
 * Global performance monitor instance
 */
export const perfMonitor = new PerformanceMonitor();
