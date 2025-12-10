'use client';

import { useEffect } from 'react';
import { useReportWebVitals } from 'next/web-vitals';
import { reportWebVitals } from '@/lib/web-vitals';

/**
 * Web Vitals Reporter Component
 *
 * Automatically tracks and reports Core Web Vitals:
 * - LCP (Largest Contentful Paint)
 * - FID (First Input Delay)
 * - CLS (Cumulative Layout Shift)
 * - FCP (First Contentful Paint)
 * - TTFB (Time to First Byte)
 * - INP (Interaction to Next Paint)
 */
export default function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    reportWebVitals(metric);
  });

  useEffect(() => {
    // Log initialization in development
    if (process.env.NODE_ENV === 'development') {
      console.log('%c[Web Vitals] Monitoring enabled', 'color: blue; font-weight: bold');
      console.log('View stored metrics: window.__getWebVitals()');
    }

    // Expose helper functions to window for debugging
    if (typeof window !== 'undefined') {
      (window as any).__getWebVitals = () => {
        const stored = localStorage.getItem('web-vitals');
        if (!stored) {
          console.log('No Web Vitals stored yet');
          return [];
        }
        const vitals = JSON.parse(stored);
        console.table(vitals);
        return vitals;
      };

      (window as any).__clearWebVitals = () => {
        localStorage.removeItem('web-vitals');
        console.log('Web Vitals cleared');
      };
    }
  }, []);

  return null; // This component doesn't render anything
}
