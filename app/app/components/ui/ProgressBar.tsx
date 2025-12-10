'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { colors } from '@/lib/design-system';

// Configure NProgress
NProgress.configure({
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.08
});

/**
 * Top Loading Progress Bar
 * 
 * Shows progress indicator during page navigation
 * Improves perceived performance
 */
export default function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Start progress on route change
    NProgress.start();
    
    // Complete when route is loaded
    const timer = setTimeout(() => {
      NProgress.done();
    }, 100);

    return () => {
      clearTimeout(timer);
      NProgress.done();
    };
  }, [pathname, searchParams]);

  useEffect(() => {
    // Inject custom styles for RTL
    const style = document.createElement('style');
    style.innerHTML = `
      #nprogress .bar {
        background: ${colors.primary.main} !important;
        height: 3px !important;
      }
      #nprogress .peg {
        box-shadow: 0 0 10px ${colors.primary.main}, 0 0 5px ${colors.primary.main} !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null;
}
