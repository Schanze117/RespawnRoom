/**
 * Centralized error logging utility for RespawnRoom
 * 
 * This module provides standardized error logging functions that can be used
 * throughout the application. In production, it would integrate with a service
 * like Sentry or LogRocket.
 */

// Environment check
const isProd = import.meta.env.PROD || false;

/**
 * Log an error to the console and/or error tracking service
 * @param {Error|string} error - The error object or message
 * @param {string} context - Where the error occurred (component/function name)
 * @param {Object} [extraData] - Additional data related to the error
 */
export function logError(error, context, extraData = {}) {
  // Create a standardized error object
  const errorObject = {
    message: error?.message || error,
    stack: error?.stack,
    context,
    timestamp: new Date().toISOString(),
    ...extraData
  };

  if (isProd) {
    // In production, we'd send to Sentry/LogRocket/etc.
    // Example: Sentry.captureException(error, { extra: { context, ...extraData } });
    
    // For now, just log to console in a production-safe way
    console.error(`[${context}] ${errorObject.message}`);
  } else {
    // In development, show detailed logs
    console.error('ERROR:', errorObject);
  }

  // Return the error to allow for chaining
  return error;
}

/**
 * Log a warning
 * @param {string} message - Warning message
 * @param {string} context - Where the warning occurred
 * @param {Object} [extraData] - Additional data
 */
export function logWarning(message, context, extraData = {}) {
  const warningObject = {
    message,
    context,
    timestamp: new Date().toISOString(),
    ...extraData
  };

  if (isProd) {
    // In production, we'd potentially send warnings to monitoring as well
    // For now, log in a production-safe way
    console.warn(`[${context}] ${message}`);
  } else {
    console.warn('WARNING:', warningObject);
  }
}

/**
 * Create a user-friendly error message from a technical error
 * @param {Error|string} error - The original error
 * @param {string} friendlyMessage - User-friendly message to display
 * @param {string} fallbackMessage - Fallback if friendlyMessage is not provided
 * @returns {string} Safe message to display to users
 */
export function createUserFriendlyError(error, friendlyMessage, fallbackMessage = "Something went wrong. Please try again.") {
  // Log the actual error
  logError(error, "userFriendlyError");
  
  // Return a sanitized message for the user
  return friendlyMessage || fallbackMessage;
}

/**
 * Performance monitoring helper functions
 */
export const performance = {
  /**
   * Measure component rendering time
   * @param {string} componentName - Name of the component being measured
   * @param {function} callback - Function to execute (usually a render)
   * @returns {any} Result of the callback function
   */
  measureRender: (componentName, callback) => {
    if (isProd) return callback(); // Skip in production for now
    
    const start = performance.now();
    const result = callback();
    const end = performance.now();
    const duration = end - start;
    
    if (duration > 100) { // Only log slow renders (>100ms)
      console.warn(`[Performance] Slow render in ${componentName}: ${duration.toFixed(2)}ms`);
    }
    
    return result;
  },
  
  /**
   * Create a performance mark and measure with convenient API
   * @param {string} name - Name of the performance marker
   * @returns {Object} Methods to mark start/end and get duration
   */
  create: (name) => {
    const markName = `${name}_start`;
    const measureName = `${name}_measure`;
    
    return {
      start: () => {
        if (!isProd) performance.mark(markName);
      },
      end: () => {
        if (!isProd) {
          performance.mark(`${name}_end`);
          performance.measure(measureName, markName, `${name}_end`);
          const entries = performance.getEntriesByName(measureName);
          const duration = entries[0]?.duration || 0;
          if (duration > 100) {
            console.warn(`[Performance] Slow operation ${name}: ${duration.toFixed(2)}ms`);
          }
          return duration;
        }
        return 0;
      },
      get: () => {
        if (!isProd) {
          const entries = performance.getEntriesByName(measureName);
          return entries[0]?.duration || 0;
        }
        return 0;
      }
    };
  }
};

export default {
  logError,
  logWarning,
  createUserFriendlyError,
  performance
}; 