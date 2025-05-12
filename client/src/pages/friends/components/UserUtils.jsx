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

// Helper to get initials from a username (first letter of each word)
export const getInitials = (username) => {
  if (!username) return '?';
  return username
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
};

// Helper to get status color class based on status
export const getStatusColorClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'online':
      return 'bg-green-500';
    case 'away':
      return 'bg-amber-500';
    case 'busy':
      return 'bg-red-500';
    case 'in-game':
      return 'bg-primary-500';
    default:
      return 'bg-gray-500';
  }
};

// Get size classes for avatar
export const getAvatarSizeClass = (size) => {
  switch (size) {
    case 'xs':
      return 'w-6 h-6 text-xs';
    case 'sm':
      return 'w-8 h-8 text-sm';
    case 'md':
      return 'w-10 h-10 text-sm';
    case 'lg':
      return 'w-12 h-12 text-base';
    case 'xl':
      return 'w-16 h-16 text-lg';
    case '2xl':
      return 'w-20 h-20 text-xl';
    default:
      return 'w-10 h-10 text-sm';
  }
};

// Get status indicator size based on avatar size
export const getStatusSizeClass = (size) => {
  switch (size) {
    case 'xs':
      return 'w-1.5 h-1.5';
    case 'sm':
      return 'w-2 h-2';
    case 'md':
      return 'w-2.5 h-2.5';
    case 'lg':
      return 'w-3 h-3';
    case 'xl':
      return 'w-4 h-4';
    case '2xl':
      return 'w-5 h-5';
    default:
      return 'w-2.5 h-2.5';
  }
};

// Avatar component with status indicator
const UserAvatar = ({ 
  username, 
  status = '', 
  size = 'md',
  className = '',
  showStatus = true,
}) => {
  const initials = getInitials(username);
  const avatarSizeClass = getAvatarSizeClass(size);
  const statusColorClass = getStatusColorClass(status);
  const statusSizeClass = getStatusSizeClass(size);
  
  // Generate a simple hash from the username to get a consistent color
  const hashCode = (username || '').split('').reduce(
    (acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0
  );
  const colorIndex = Math.abs(hashCode) % avatarColors.length;
  const bgColorClass = avatarColors[colorIndex];
  
  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      <div className={`${avatarSizeClass} ${bgColorClass} rounded-full flex items-center justify-center font-medium text-white`}>
        {initials}
      </div>
      
      {showStatus && status && (
        <div className={`absolute -bottom-0.5 -right-0.5 ${statusSizeClass} ${statusColorClass} rounded-full border-2 border-surface-800`}></div>
      )}
    </div>
  );
};

// Color array for avatar backgrounds
const avatarColors = [
  'bg-primary-600',
  'bg-red-600',
  'bg-green-600',
  'bg-blue-600',
  'bg-yellow-600',
  'bg-pink-600',
  'bg-purple-600',
  'bg-indigo-600',
  'bg-teal-600',
  'bg-orange-600',
  'bg-lime-600',
  'bg-emerald-600',
  'bg-cyan-600',
  'bg-sky-600',
  'bg-violet-600',
  'bg-fuchsia-600',
  'bg-rose-600',
  'bg-amber-600',
];

export default UserAvatar; 