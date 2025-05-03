import React from 'react';

/**
 * User utility functions for avatars and status indicators
 */

// Generate initial avatar for users
export const getInitialAvatar = (name) => {
  return name ? name.charAt(0).toUpperCase() : '?';
};

// Get random color for avatar based on username
export const getAvatarColor = (name) => {
  const colors = [
    "#4f46e5", "#0891b2", "#059669", "#7c3aed", "#db2777", 
    "#d97706", "#2563eb", "#dc2626", "#475569", "#84cc16"
  ];
  
  if (!name) return colors[0];
  
  // Simple hash function to get consistent color
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

// Handle status indicator color
export const getStatusClass = (status) => {
  if (status?.toLowerCase().includes('online')) return 'bg-green-500';
  if (status?.toLowerCase().includes('playing')) return 'bg-green-500';
  return 'bg-gray-500';
};

// User Avatar Component
const UserAvatar = ({ username, status, size = "md", showPin = false, isPinned = false }) => {
  // Size classes
  const sizeClasses = {
    sm: "w-9 h-9", 
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };
  
  const statusSizeClasses = {
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-4 h-4"
  };

  return (
    <div className="relative">
      <div 
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-bold`}
        style={{ backgroundColor: getAvatarColor(username) }}
      >
        {getInitialAvatar(username)}
      </div>
      {status && (
        <div className={`absolute bottom-0 right-0 ${statusSizeClasses[size]} rounded-full border-2 border-surface-800 ${getStatusClass(status)}`}></div>
      )}
      {showPin && isPinned && (
        <div className="absolute -top-1 -left-1 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10L13 10" />
            <path d="M21 6L13 6" />
            <path d="M21 14L13 14" />
            <path d="M21 18L13 18" />
            <path d="M9 10.46V23a1 1 0 0 1-1.45.9L1 20M9 1v9.46" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default UserAvatar; 