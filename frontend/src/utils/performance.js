/**
 * Performance monitoring — track Web Vitals and key metrics.
 */

export function trackPerformance() {
  // Track Cumulative Layout Shift (CLS)
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver(list => {
        let cls = 0;
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            cls += entry.value;
            console.debug('CLS update:', cls.toFixed(3));
          }
        }
      });
      observer.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      console.debug('CLS observation not supported');
    }
  }

  // Track Largest Contentful Paint (LCP)
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.debug('LCP:', lastEntry.renderTime || lastEntry.loadTime);
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      console.debug('LCP observation not supported');
    }
  }

  // Track First Input Delay (FID)
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          console.debug('FID:', entry.processingDuration);
        }
      });
      observer.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      console.debug('FID observation not supported');
    }
  }

  // Log page visibility change
  document.addEventListener('visibilitychange', () => {
    const state = document.hidden ? 'hidden' : 'visible';
    console.debug('Page visibility:', state);
  });
}
