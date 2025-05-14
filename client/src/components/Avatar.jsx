import React from 'react';

const Avatar = ({ 
  user, 
  size = 'md', 
  className = '', 
  showStatus = false, 
  statusPosition = 'bottom-right',
  alt = 'User avatar'
}) => {
  // Default image if none provided
  const defaultImage = 'https://via.placeholder.com/150';
  const imageUrl = user?.profileImage || defaultImage;
  
  // Status indicator positions
  const statusPositions = {
    'bottom-right': 'bottom-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0'
  };
  
  // Size variations
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };
  
  // Status indicator sizing
  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5'
  };
  
  const avatarSize = sizeClasses[size] || sizeClasses.md;
  const statusSize = statusSizes[size] || statusSizes.md;
  const statusClass = statusPositions[statusPosition] || statusPositions['bottom-right'];
  const isOnline = user?.isOnline;
  
  return (
    <div className={`relative ${className}`}>
      <div className={`${avatarSize} rounded-full overflow-hidden bg-gray-200`}>
        <img 
          src={imageUrl} 
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultImage;
          }}
        />
      </div>
      
      {showStatus && (
        <span 
          className={`absolute ${statusClass} ${statusSize} rounded-full border-2 border-white ${
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`}
          aria-hidden="true"
        ></span>
      )}
    </div>
  );
};

export default Avatar; 