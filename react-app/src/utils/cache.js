/**
 * Caching Utilities
 * In-memory and localStorage caching with TTL support
 */

// In-memory cache
const memoryCache = new Map();

// Cache configuration
const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  MAX_MEMORY_SIZE: 50, // Maximum items in memory
  STORAGE_PREFIX: 'castly_cache_'
};

/**
 * Set item in memory cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in milliseconds
 */
export const setMemoryCache = (key, value, ttl = CACHE_CONFIG.DEFAULT_TTL) => {
  // Check cache size
  if (memoryCache.size >= CACHE_CONFIG.MAX_MEMORY_SIZE) {
    // Remove oldest item
    const firstKey = memoryCache.keys().next().value;
    memoryCache.delete(firstKey);
  }
  
  const item = {
    value,
    expiry: Date.now() + ttl,
    timestamp: Date.now()
  };
  
  memoryCache.set(key, item);
};

/**
 * Get item from memory cache
 * @param {string} key - Cache key
 * @returns {any} Cached value or null
 */
export const getMemoryCache = (key) => {
  const item = memoryCache.get(key);
  
  if (!item) return null;
  
  // Check if expired
  if (Date.now() > item.expiry) {
    memoryCache.delete(key);
    return null;
  }
  
  return item.value;
};

/**
 * Clear memory cache
 * @param {string} key - Optional key to clear specific item
 */
export const clearMemoryCache = (key) => {
  if (key) {
    memoryCache.delete(key);
  } else {
    memoryCache.clear();
  }
};

/**
 * Set item in localStorage
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in milliseconds
 */
export const setStorageCache = (key, value, ttl = CACHE_CONFIG.DEFAULT_TTL) => {
  try {
    const item = {
      value,
      expiry: Date.now() + ttl,
      timestamp: Date.now()
    };
    
    const storageKey = CACHE_CONFIG.STORAGE_PREFIX + key;
    localStorage.setItem(storageKey, JSON.stringify(item));
  } catch (error) {
    console.error('Error setting storage cache:', error);
  }
};

/**
 * Get item from localStorage
 * @param {string} key - Cache key
 * @returns {any} Cached value or null
 */
export const getStorageCache = (key) => {
  try {
    const storageKey = CACHE_CONFIG.STORAGE_PREFIX + key;
    const itemStr = localStorage.getItem(storageKey);
    
    if (!itemStr) return null;
    
    const item = JSON.parse(itemStr);
    
    // Check if expired
    if (Date.now() > item.expiry) {
      localStorage.removeItem(storageKey);
      return null;
    }
    
    return item.value;
  } catch (error) {
    console.error('Error getting storage cache:', error);
    return null;
  }
};

/**
 * Clear localStorage cache
 * @param {string} key - Optional key to clear specific item
 */
export const clearStorageCache = (key) => {
  try {
    if (key) {
      const storageKey = CACHE_CONFIG.STORAGE_PREFIX + key;
      localStorage.removeItem(storageKey);
    } else {
      // Clear all cache items
      const keys = Object.keys(localStorage);
      keys.forEach(k => {
        if (k.startsWith(CACHE_CONFIG.STORAGE_PREFIX)) {
          localStorage.removeItem(k);
        }
      });
    }
  } catch (error) {
    console.error('Error clearing storage cache:', error);
  }
};

/**
 * Cache API response
 * @param {string} key - Cache key
 * @param {function} fetchFn - Function that returns a promise
 * @param {object} options - Cache options
 * @returns {Promise}
 */
export const cacheApiResponse = async (key, fetchFn, options = {}) => {
  const {
    ttl = CACHE_CONFIG.DEFAULT_TTL,
    useStorage = false,
    forceRefresh = false
  } = options;
  
  // Check cache first
  if (!forceRefresh) {
    const cached = useStorage ? getStorageCache(key) : getMemoryCache(key);
    if (cached) {
      return cached;
    }
  }
  
  // Fetch fresh data
  try {
    const data = await fetchFn();
    
    // Cache the response
    if (useStorage) {
      setStorageCache(key, data, ttl);
    } else {
      setMemoryCache(key, data, ttl);
    }
    
    return data;
  } catch (error) {
    // Return cached data on error if available
    const cached = useStorage ? getStorageCache(key) : getMemoryCache(key);
    if (cached) {
      console.warn('Using cached data due to fetch error');
      return cached;
    }
    
    throw error;
  }
};

/**
 * Memoize function with cache
 * @param {function} fn - Function to memoize
 * @param {function} keyFn - Function to generate cache key
 * @returns {function}
 */
export const memoize = (fn, keyFn = (...args) => JSON.stringify(args)) => {
  const cache = new Map();
  
  return (...args) => {
    const key = keyFn(...args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    return result;
  };
};

/**
 * Debounce function
 * @param {function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {function}
 */
export const debounce = (fn, delay = 300) => {
  let timeoutId;
  
  return (...args) => {
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
};

/**
 * Throttle function
 * @param {function} fn - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {function}
 */
export const throttle = (fn, limit = 300) => {
  let inThrottle;
  
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * Get cache statistics
 * @returns {object}
 */
export const getCacheStats = () => {
  const memorySize = memoryCache.size;
  const storageSize = Object.keys(localStorage).filter(k => 
    k.startsWith(CACHE_CONFIG.STORAGE_PREFIX)
  ).length;
  
  return {
    memory: {
      size: memorySize,
      maxSize: CACHE_CONFIG.MAX_MEMORY_SIZE,
      usage: `${((memorySize / CACHE_CONFIG.MAX_MEMORY_SIZE) * 100).toFixed(2)}%`
    },
    storage: {
      size: storageSize
    }
  };
};

/**
 * Clean expired cache items
 */
export const cleanExpiredCache = () => {
  // Clean memory cache
  for (const [key, item] of memoryCache.entries()) {
    if (Date.now() > item.expiry) {
      memoryCache.delete(key);
    }
  }
  
  // Clean storage cache
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_CONFIG.STORAGE_PREFIX)) {
        const itemStr = localStorage.getItem(key);
        if (itemStr) {
          const item = JSON.parse(itemStr);
          if (Date.now() > item.expiry) {
            localStorage.removeItem(key);
          }
        }
      }
    });
  } catch (error) {
    console.error('Error cleaning expired cache:', error);
  }
};

/**
 * Initialize cache cleanup interval
 */
export const initCacheCleanup = (interval = 60000) => {
  setInterval(cleanExpiredCache, interval);
};

export default {
  setMemoryCache,
  getMemoryCache,
  clearMemoryCache,
  setStorageCache,
  getStorageCache,
  clearStorageCache,
  cacheApiResponse,
  memoize,
  debounce,
  throttle,
  getCacheStats,
  cleanExpiredCache,
  initCacheCleanup
};
