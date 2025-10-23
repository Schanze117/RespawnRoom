import React from 'react';

const LoadingSpinner = ({ size = 'md', color = '#6366F1', className = '' }) => {
  // Size variations
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const spinnerSize = sizeClasses[size] || sizeClasses.md;
  
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className={`${spinnerSize} animate-spin rounded-full border-4 border-t-transparent`} 
           style={{ borderTopColor: 'transparent', borderColor: color }}>
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default LoadingSpinner; 