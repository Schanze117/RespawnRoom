/**
 * Memoized selectors to optimize performance by caching results
 * and preventing unnecessary re-renders and API calls
 */

// Create a cache for API results
const apiCache = new Map();

/**
 * Memoized API caller - caches results for a specified time
 * @param {Function} apiFn - The API function to call
 * @param {Array} args - Arguments to pass to the API function
 * @param {Number} cacheDuration - Cache duration in milliseconds (default: 5 minutes)
 * @returns {Promise<any>} - The API result
 */
export const memoizedApiCall = async (apiFn, args = [], cacheDuration = 5 * 60 * 1000) => {
  // Create a cache key from the function name and arguments
  const cacheKey = `${apiFn.name}:${JSON.stringify(args)}`;
  
  // Check if we have a valid cached result
  const cachedResult = apiCache.get(cacheKey);
  if (cachedResult && Date.now() - cachedResult.timestamp < cacheDuration) {
    return cachedResult.data;
  }
  
  // Make the actual API call
  const result = await apiFn(...args);
  
  // Cache the result with timestamp
  apiCache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });
  
  return result;
};

/**
 * Clear all cache entries or specific ones
 * @param {String|null} keyPattern - Optional pattern to match cache keys
 */
export const clearApiCache = (keyPattern = null) => {
  if (!keyPattern) {
    apiCache.clear();
    return;
  }
  
  // Clear only matching keys
  const keysToDelete = [];
  apiCache.forEach((_, key) => {
    if (key.includes(keyPattern)) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => apiCache.delete(key));
};

/**
 * Get cache statistics
 * @returns {Object} Statistics about the cache
 */
export const getCacheStats = () => {
  const stats = {
    totalEntries: apiCache.size,
    entries: [],
    totalSize: 0
  };
  
  apiCache.forEach((value, key) => {
    const age = Date.now() - value.timestamp;
    const ageMinutes = Math.round(age / 60000);
    
    stats.entries.push({
      key,
      age: `${ageMinutes} minutes`,
      size: JSON.stringify(value.data).length
    });
    
    stats.totalSize += JSON.stringify(value.data).length;
  });
  
  return stats;
};

// Debounce function to limit the rate of function calls
export const debounce = (fn, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}; 