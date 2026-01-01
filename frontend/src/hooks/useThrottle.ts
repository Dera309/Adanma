import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook that throttles a value
 * Useful for scroll positions and other rapidly changing values
 * 
 * @param value - The value to throttle
 * @param limit - Time limit in milliseconds (default: 200ms)
 * @returns Throttled value
 */
export function useThrottle<T>(value: T, limit: number = 200): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

/**
 * Hook that returns a throttled callback function
 * Useful for scroll and resize event handlers
 * 
 * @param callback - The function to throttle
 * @param limit - Time limit in milliseconds (default: 200ms)
 * @returns Throttled callback function
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  limit: number = 200
): (...args: Parameters<T>) => void {
  const inThrottle = useRef<boolean>(false);

  return useCallback((...args: Parameters<T>) => {
    if (!inThrottle.current) {
      callback(...args);
      inThrottle.current = true;
      
      setTimeout(() => {
        inThrottle.current = false;
      }, limit);
    }
  }, [callback, limit]);
}