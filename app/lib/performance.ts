/**
 * Performance Monitoring Utilities
 *
 * Use these utilities to measure component render performance
 * and identify bottlenecks in the application.
 */

import { useEffect, useRef, Profiler, type ProfilerOnRenderCallback } from 'react';

/**
 * Hook to measure component render time
 * Logs render duration in development mode
 *
 * @example
 * function MyComponent() {
 *   useRenderPerformance('MyComponent');
 *   return <div>Content</div>;
 * }
 */
export function useRenderPerformance(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    const endTime = performance.now();
    const duration = endTime - startTime.current;

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[Performance] ${componentName} render #${renderCount.current}: ${duration.toFixed(2)}ms`
      );
    }

    startTime.current = performance.now();
  });
}

/**
 * Measure navigation transition performance
 * Tracks time from navigation click to page interactive
 *
 * @example
 * const perfMonitor = measureNavigationPerformance();
 * perfMonitor.start('Dashboard');
 * // ... navigation happens
 * perfMonitor.end();
 */
export function measureNavigationPerformance() {
  let startTime: number | null = null;
  let startRoute: string | null = null;

  return {
    start(routeName: string) {
      startTime = performance.now();
      startRoute = routeName;
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Navigation] Starting transition to: ${routeName}`);
      }
    },

    end() {
      if (startTime !== null) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        if (process.env.NODE_ENV === 'development') {
          console.log(
            `[Navigation] Completed transition to ${startRoute}: ${duration.toFixed(2)}ms`
          );

          // Color-coded feedback
          if (duration < 100) {
            console.log('%c✅ Excellent performance!', 'color: green; font-weight: bold');
          } else if (duration < 300) {
            console.log('%c⚠️ Good performance', 'color: orange; font-weight: bold');
          } else {
            console.log('%c❌ Slow performance - needs optimization', 'color: red; font-weight: bold');
          }
        }

        startTime = null;
        startRoute = null;
      }
    },
  };
}

/**
 * Performance benchmarking for comparing implementations
 *
 * @example
 * const results = await benchmarkFunction(
 *   () => heavyComputation(),
 *   'Heavy Computation',
 *   100 // iterations
 * );
 */
export async function benchmarkFunction(
  fn: () => void | Promise<void>,
  name: string,
  iterations = 100
): Promise<{ average: number; min: number; max: number }> {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }

  const average = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Benchmark] ${name}:`);
    console.log(`  Average: ${average.toFixed(2)}ms`);
    console.log(`  Min: ${min.toFixed(2)}ms`);
    console.log(`  Max: ${max.toFixed(2)}ms`);
  }

  return { average, min, max };
}

/**
 * React DevTools Profiler wrapper for measuring component tree performance
 *
 * @example
 * <PerformanceProfiler id="Navigation">
 *   <NavigationV3 {...props} />
 * </PerformanceProfiler>
 */

type ProfilerProps = {
  id: string;
  children: React.ReactNode;
};

// TODO: Move to .tsx file or component
// export function PerformanceProfiler({ id, children }: ProfilerProps) {
//   const onRender: ProfilerOnRenderCallback = (
//     id,
//     phase,
//     actualDuration,
//     baseDuration,
//     startTime,
//     commitTime
//   ) => {
//     if (process.env.NODE_ENV === 'development') {
//       console.log(`[Profiler] ${id} (${phase}):`, {
//         actualDuration: `${actualDuration.toFixed(2)}ms`,
//         baseDuration: `${baseDuration.toFixed(2)}ms`,
//         startTime,
//         commitTime,
//       });

//       // Warning for slow renders
//       if (actualDuration > 16.67) {
//         // 60fps threshold
//         console.warn(
//           `%c[Profiler] ${id} render took ${actualDuration.toFixed(2)}ms (slower than 16.67ms)`,
//           'color: red; font-weight: bold'
//         );
//       }
//     }
//   };

//   return (
//     <Profiler id={id} onRender={onRender}>
//       {children}
//     </Profiler>
//   );
// }

/**
 * Hook to detect expensive re-renders
 * Logs when component re-renders with unchanged props
 *
 * @example
 * function MyComponent(props: Props) {
 *   useWhyDidYouUpdate('MyComponent', props);
 *   return <div>Content</div>;
 * }
 */
export function useWhyDidYouUpdate(name: string, props: Record<string, any>) {
  const previousProps = useRef<Record<string, any>>();

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};

      allKeys.forEach((key) => {
        if (previousProps.current?.[key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current?.[key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length === 0) {
        console.warn(
          `%c[WhyDidYouUpdate] ${name} re-rendered with no prop changes!`,
          'color: orange; font-weight: bold'
        );
      } else if (process.env.NODE_ENV === 'development') {
        console.log(`[WhyDidYouUpdate] ${name} props changed:`, changedProps);
      }
    }

    previousProps.current = props;
  });
}

/**
 * Web Vitals monitoring
 * Tracks Core Web Vitals: LCP, FID, CLS, FCP, TTFB
 */
export function reportWebVitals(metric: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    });

    // Color-coded feedback
    const color =
      metric.rating === 'good' ? 'green' : metric.rating === 'needs-improvement' ? 'orange' : 'red';
    console.log(
      `%c${metric.rating.toUpperCase()}`,
      `color: ${color}; font-weight: bold; font-size: 12px;`
    );
  }

  // In production, send to analytics
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to Google Analytics
    // gtag('event', metric.name, {
    //   value: Math.round(metric.value),
    //   metric_rating: metric.rating,
    // });
  }
}
