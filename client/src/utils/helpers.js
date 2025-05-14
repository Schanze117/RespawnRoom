// Helper functions for date formatting and validation
import { format, formatDistance } from 'date-fns';

/**
 * Validates if a string can be parsed as a valid date
 * @param {string} dateString - Date string to validate
 * @returns {boolean} - Whether the date is valid
 */
export const isValidDate = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Formats a timestamp into a human-readable time string
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} - Formatted time string
 */
export const formatTimeAgo = (timestamp) => {
  if (!isValidDate(timestamp)) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  
  // If it's today, show the time
  if (date.toDateString() === now.toDateString()) {
    return format(date, 'h:mm a');
  }
  
  // If it's within the last 7 days, show the day and time
  const differenceInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (differenceInDays < 7) {
    return formatDistance(date, now, { addSuffix: true });
  }
  
  // Otherwise, show the date
  return format(date, 'MMM d, yyyy');
};

/**
 * Formats a timestamp into a simple time string
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} - Formatted time string (h:mm a)
 */
export const formatTime = (timestamp) => {
  if (!isValidDate(timestamp)) return '';
  return format(new Date(timestamp), 'h:mm a');
};

/**
 * Shows a browser notification if permissions are granted
 * @param {string} title - The notification title
 * @param {Object} options - Notification options (body, icon, etc.)
 * @returns {Promise<boolean>} - Whether notification was shown
 */
export const showNotification = async (title, options = {}) => {
  // Check if the browser supports notifications
  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notifications");
    return false;
  }
  
  // Check if we already have permission
  if (Notification.permission === "granted") {
    // Create and show the notification
    try {
      const notification = new Notification(title, options);
      
      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
      
      return true;
    } catch (error) {
      console.error("Error showing notification:", error);
      return false;
    }
  } 
  // Request permission if not already granted or denied
  else if (Notification.permission !== "denied") {
    try {
      const permission = await Notification.requestPermission();
      
      // If the user grants permission, show the notification
      if (permission === "granted") {
        const notification = new Notification(title, options);
        
        // Auto-close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);
        
        return true;
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  }
  
  return false;
}; 