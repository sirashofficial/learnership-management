/**
 * In-Memory Caching Layer for PostgreSQL Query Optimization
 * 
 * Caches frequently accessed data with appropriate TTLs:
 * - Curriculum data: 1 hour (rarely changes)
 * - Unit standards: 24 hours (static reference data)
 * - User permissions: 15 minutes (needs freshness for security)
 * 
 * Uses Node-cache for simplicity (no external Redis dependency)
 * For production with multiple instances, consider Redis
 */

import NodeCache from 'node-cache';

// Cache instances with different TTLs
const curriculumCache = new NodeCache({
  stdTTL: 3600, // 1 hour
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false, // Better performance, but be careful with mutations
});

const unitStandardsCache = new NodeCache({
  stdTTL: 86400, // 24 hours
  checkperiod: 3600, // Check every hour
  useClones: false,
});

const permissionsCache = new NodeCache({
  stdTTL: 900, // 15 minutes
  checkperiod: 120, // Check every 2 minutes
  useClones: false,
});

const generalCache = new NodeCache({
  stdTTL: 600, // 10 minutes default
  checkperiod: 120,
  useClones: false,
});

export interface CacheOptions {
  ttl?: number;
  skipCache?: boolean;
}

/**
 * Curriculum data cache (modules, lesson plans, documents)
 */
export const CurriculumCache = {
  get: <T>(key: string): T | undefined => {
    return curriculumCache.get<T>(key);
  },

  set: <T>(key: string, value: T, ttl?: number): boolean => {
    return curriculumCache.set(key, value, ttl || 3600);
  },

  del: (key: string | string[]): number => {
    return curriculumCache.del(key);
  },

  flush: (): void => {
    curriculumCache.flushAll();
  },

  /**
   * Wrap an async function with caching
   */
  wrap: async <T>(
    key: string,
    fn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> => {
    if (options?.skipCache) {
      return fn();
    }

    const cached = curriculumCache.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = await fn();
    curriculumCache.set(key, result, options?.ttl || 3600);
    return result;
  },
};

/**
 * Unit standards cache (reference data, rarely changes)
 */
export const UnitStandardsCache = {
  get: <T>(key: string): T | undefined => {
    return unitStandardsCache.get<T>(key);
  },

  set: <T>(key: string, value: T, ttl?: number): boolean => {
    return unitStandardsCache.set(key, value, ttl || 86400);
  },

  del: (key: string | string[]): number => {
    return unitStandardsCache.del(key);
  },

  flush: (): void => {
    unitStandardsCache.flushAll();
  },

  wrap: async <T>(
    key: string,
    fn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> => {
    if (options?.skipCache) {
      return fn();
    }

    const cached = unitStandardsCache.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = await fn();
    unitStandardsCache.set(key, result, options?.ttl || 86400);
    return result;
  },
};

/**
 * User permissions cache (needs freshness for security)
 */
export const PermissionsCache = {
  get: <T>(key: string): T | undefined => {
    return permissionsCache.get<T>(key);
  },

  set: <T>(key: string, value: T, ttl?: number): boolean => {
    return permissionsCache.set(key, value, ttl || 900);
  },

  del: (key: string | string[]): number => {
    return permissionsCache.del(key);
  },

  flush: (): void => {
    permissionsCache.flushAll();
  },

  wrap: async <T>(
    key: string,
    fn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> => {
    if (options?.skipCache) {
      return fn();
    }

    const cached = permissionsCache.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = await fn();
    permissionsCache.set(key, result, options?.ttl || 900);
    return result;
  },

  /**
   * Invalidate permissions for a specific user
   */
  invalidateUser: (userId: string): void => {
    const keys = permissionsCache.keys();
    const userKeys = keys.filter(k => k.includes(userId));
    if (userKeys.length > 0) {
      permissionsCache.del(userKeys);
    }
  },
};

/**
 * General purpose cache
 */
export const GeneralCache = {
  get: <T>(key: string): T | undefined => {
    return generalCache.get<T>(key);
  },

  set: <T>(key: string, value: T, ttl?: number): boolean => {
    return generalCache.set(key, value, ttl || 600);
  },

  del: (key: string | string[]): number => {
    return generalCache.del(key);
  },

  flush: (): void => {
    generalCache.flushAll();
  },

  wrap: async <T>(
    key: string,
    fn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> => {
    if (options?.skipCache) {
      return fn();
    }

    const cached = generalCache.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = await fn();
    generalCache.set(key, result, options?.ttl || 600);
    return result;
  },
};

/**
 * Clear all caches (use sparingly, typically on data mutations)
 */
export function flushAllCaches(): void {
  curriculumCache.flushAll();
  unitStandardsCache.flushAll();
  permissionsCache.flushAll();
  generalCache.flushAll();
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats() {
  return {
    curriculum: curriculumCache.getStats(),
    unitStandards: unitStandardsCache.getStats(),
    permissions: permissionsCache.getStats(),
    general: generalCache.getStats(),
  };
}

/**
 * Cache key builders for consistency
 */
export const CacheKeys = {
  // Curriculum
  modules: () => 'modules:all',
  module: (id: string) => `module:${id}`,
  moduleByNumber: (num: number) => `module:num:${num}`,
  
  // Unit Standards
  unitStandards: () => 'unit-standards:all',
  unitStandard: (id: string) => `unit-standard:${id}`,
  unitStandardsByModule: (moduleId: string) => `unit-standards:module:${moduleId}`,
  
  // Permissions
  userPermissions: (userId: string) => `permissions:user:${userId}`,
  userGroups: (userId: string) => `permissions:groups:${userId}`,
  
  // Group data
  groupRollout: (groupId: string) => `group:rollout:${groupId}`,
  groupStudents: (groupId: string) => `group:students:${groupId}`,
};
