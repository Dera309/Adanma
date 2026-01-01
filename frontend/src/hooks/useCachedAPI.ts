import { useState, useEffect, useCallback } from 'react';
import apiCache, { createCacheKey } from '../utils/apiCache';

interface UseCachedAPIOptions {
  ttl?: number; // Cache time to live in milliseconds
  enabled?: boolean; // Whether to fetch immediately
  refetchOnMount?: boolean; // Whether to refetch when component mounts
}

interface UseCachedAPIResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

/**
 * Custom hook for fetching data with caching support
 * 
 * @param key - Cache key for the request
 * @param fetchFn - Function that fetches the data
 * @param options - Configuration options
 * @returns Object containing data, loading state, error, and utility functions
 */
export function useCachedAPI<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: UseCachedAPIOptions = {}
): UseCachedAPIResult<T> {
  const {
    ttl,
    enabled = true,
    refetchOnMount = false
  } = options;

  const [data, setData] = useState<T | null>(() => {
    // Try to get cached data on mount
    return apiCache.get<T>(key);
  });
  const [isLoading, setIsLoading] = useState<boolean>(!data && enabled);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      const cached = apiCache.get<T>(key);
      if (cached !== null && !refetchOnMount) {
        setData(cached);
        setIsLoading(false);
        return;
      }

      // Fetch fresh data
      const result = await fetchFn();
      
      // Update cache
      apiCache.set(key, result, ttl);
      
      // Update state
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, [key, fetchFn, ttl, refetchOnMount]);

  const invalidate = useCallback(() => {
    apiCache.delete(key);
  }, [key]);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    invalidate
  };
}

/**
 * Hook for creating a cache key from endpoint and params
 */
export function useCacheKey(endpoint: string, params?: Record<string, any>): string {
  return createCacheKey(endpoint, params);
}