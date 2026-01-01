/**
 * Performance monitoring utilities
 * Helps track and optimize application performance
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private marks: Map<string, number> = new Map();

  /**
   * Mark the start of a performance measurement
   */
  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  /**
   * Measure the time since a mark was set
   */
  measure(name: string, startMark: string): number {
    const startTime = this.marks.get(startMark);
    
    if (startTime === undefined) {
      console.warn(`Performance mark "${startMark}" not found`);
      return 0;
    }

    const duration = performance.now() - startTime;
    
    this.metrics.push({
      name,
      value: duration,
      timestamp: Date.now()
    });

    // Clean up the mark
    this.marks.delete(startMark);

    return duration;
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Get average value for a metric
   */
  getAverageMetric(name: string): number {
    const metrics = this.getMetricsByName(name);
    
    if (metrics.length === 0) {
      return 0;
    }

    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.marks.clear();
  }

  /**
   * Log performance metrics to console
   */
  logMetrics(): void {
    if (this.metrics.length === 0) {
      console.log('No performance metrics recorded');
      return;
    }

    console.group('Performance Metrics');
    
    // Group metrics by name
    const grouped = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    // Log each metric group
    Object.entries(grouped).forEach(([name, values]) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      console.log(`${name}:`, {
        count: values.length,
        average: `${avg.toFixed(2)}ms`,
        min: `${min.toFixed(2)}ms`,
        max: `${max.toFixed(2)}ms`
      });
    });

    console.groupEnd();
  }

  /**
   * Monitor Core Web Vitals
   */
  monitorWebVitals(): void {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          
          this.metrics.push({
            name: 'LCP',
            value: lastEntry.renderTime || lastEntry.loadTime,
            timestamp: Date.now()
          });
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.metrics.push({
              name: 'FID',
              value: entry.processingStart - entry.startTime,
              timestamp: Date.now()
            });
          });
        });
        
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          
          this.metrics.push({
            name: 'CLS',
            value: clsValue,
            timestamp: Date.now()
          });
        });
        
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('Performance monitoring not supported:', error);
      }
    }
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Start monitoring web vitals in production
if (import.meta.env.PROD) {
  performanceMonitor.monitorWebVitals();
}

export default performanceMonitor;

/**
 * Higher-order function to measure component render time
 */
export function measureRender<T extends (...args: any[]) => any>(
  componentName: string,
  fn: T
): T {
  return ((...args: any[]) => {
    const markName = `${componentName}-render-start`;
    performanceMonitor.mark(markName);
    
    const result = fn(...args);
    
    performanceMonitor.measure(`${componentName}-render`, markName);
    
    return result;
  }) as T;
}

/**
 * Decorator for measuring async function performance
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const markName = `${name}-start`;
  performanceMonitor.mark(markName);
  
  try {
    const result = await fn();
    performanceMonitor.measure(name, markName);
    return result;
  } catch (error) {
    performanceMonitor.measure(`${name}-error`, markName);
    throw error;
  }
}