/**
 * In-memory cache with TTL support
 * 
 * For production at scale, replace with Redis (Upstash) or Vercel KV.
 * This works well for single-instance deployments and serverless with
 * short-lived function instances.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  staleAt: number; // For stale-while-revalidate
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxSize = 500; // Max cache entries to prevent memory leaks

  /**
   * Get a cached value
   */
  get<T>(key: string): { data: T; stale: boolean } | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) return null;

    const now = Date.now();

    // Expired - remove and return null
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Stale but not expired - return data marked as stale
    if (now > entry.staleAt) {
      return { data: entry.data, stale: true };
    }

    return { data: entry.data, stale: false };
  }

  /**
   * Set a cached value
   * @param key Cache key
   * @param data Data to cache
   * @param ttlSeconds Time to live in seconds
   * @param staleTtlSeconds Time before data is considered stale (for stale-while-revalidate)
   */
  set<T>(key: string, data: T, ttlSeconds: number, staleTtlSeconds?: number): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    const now = Date.now();
    this.cache.set(key, {
      data,
      expiresAt: now + ttlSeconds * 1000,
      staleAt: now + (staleTtlSeconds ?? ttlSeconds) * 1000,
    });
  }

  /**
   * Delete a specific cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Delete all keys matching a prefix
   */
  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  stats(): { size: number; maxSize: number } {
    return { size: this.cache.size, maxSize: this.maxSize };
  }
}

// Singleton cache instance (persists across requests in same process)
const globalForCache = globalThis as unknown as {
  cache: MemoryCache | undefined;
};

export const cache = globalForCache.cache ?? new MemoryCache();

if (process.env.NODE_ENV !== "production") {
  globalForCache.cache = cache;
}

// Cache key builders for type safety
export const cacheKeys = {
  tutorsList: (params: string) => `tutors:list:${params}`,
  tutorProfile: (id: string) => `tutors:profile:${id}`,
  tutorCount: (params: string) => `tutors:count:${params}`,
  userProfile: (id: string) => `users:profile:${id}`,
  conversations: (userId: string) => `conversations:${userId}`,
};

// Cache TTL presets (in seconds)
export const cacheTTL = {
  SHORT: 30,           // 30 seconds - for frequently changing data
  MEDIUM: 120,         // 2 minutes - for tutor lists
  LONG: 300,           // 5 minutes - for individual tutor profiles
  VERY_LONG: 600,      // 10 minutes - for rarely changing data
};

/**
 * Higher-order function for caching async operations
 * Implements stale-while-revalidate pattern
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = cacheTTL.MEDIUM,
  staleTtlSeconds?: number
): Promise<T> {
  const cached = cache.get<T>(key);

  if (cached && !cached.stale) {
    return cached.data;
  }

  // If stale, return stale data and revalidate in background
  if (cached?.stale) {
    // Fire-and-forget revalidation
    fetcher().then((freshData) => {
      cache.set(key, freshData, ttlSeconds, staleTtlSeconds);
    }).catch((err) => {
      console.error(`Cache revalidation failed for key ${key}:`, err);
    });
    return cached.data;
  }

  // Cache miss - fetch and cache
  const data = await fetcher();
  cache.set(key, data, ttlSeconds, staleTtlSeconds);
  return data;
}
