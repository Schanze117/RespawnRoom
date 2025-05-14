import React, { useState, useEffect } from 'react';
import FilterToggle from './FilterToggle';

const ReviewToggle = () => {
  // Initialize from localStorage or default to false
  const [showHighReviewsOnly, setShowHighReviewsOnly] = useState(false);
  
  // Load the saved preference from localStorage on component mount
  useEffect(() => {
    const savedPreference = localStorage.getItem('showHighReviewsOnly');
    if (savedPreference !== null) {
      setShowHighReviewsOnly(savedPreference === 'true');
    }
  }, []);
  
  // Update localStorage when preference changes
  const handleToggleChange = (newValue) => {
    setShowHighReviewsOnly(newValue);
    localStorage.setItem('showHighReviewsOnly', newValue);
    
    // Dispatch a custom event so other components can react to the change
    window.dispatchEvent(new CustomEvent('reviewFilterChange', { 
      detail: { showHighReviewsOnly: newValue }
    }));
  };
  
  return (
    <FilterToggle 
      enabled={showHighReviewsOnly} 
      setEnabled={handleToggleChange}
      label="Show games with 5+ reviews only" 
    />
  );
};

export default ReviewToggle; 