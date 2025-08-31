import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange, onNextPage, onPrevPage }) => {
  if (totalPages <= 1) return null;
  
  return (
    <div className="flex justify-center items-center mt-6 gap-2">
      <button 
        onClick={onPrevPage} 
        disabled={currentPage === 1}
        className={`w-10 h-10 rounded-md flex items-center justify-center ${currentPage === 1 ? 'bg-surface-700 text-gray-500 cursor-not-allowed' : 'bg-surface-800 text-white hover:bg-primary-600'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      
      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }).map((_, index) => {
          // Show only a window of 5 pages with current page in the middle when possible
          if (
            totalPages <= 5 || 
            index === 0 || 
            index === totalPages - 1 ||
            (currentPage - 3 <= index && index <= currentPage + 1)
          ) {
            return (
              <button
                key={index}
                onClick={() => onPageChange(index + 1)}
                className={`w-9 h-9 rounded-md flex items-center justify-center ${currentPage === index + 1 ? 'bg-primary-600 text-white' : 'bg-surface-800 text-white hover:bg-surface-700'}`}
              >
                {index + 1}
              </button>
            );
          } else if (
            (index === 1 && currentPage > 3) || 
            (index === totalPages - 2 && currentPage < totalPages - 2)
          ) {
            return <span key={index} className="text-gray-500">...</span>;
          } else {
            return null;
          }
        })}
      </div>
      
      <button 
        onClick={onNextPage} 
        disabled={currentPage === totalPages}
        className={`w-10 h-10 rounded-md flex items-center justify-center ${currentPage === totalPages ? 'bg-surface-700 text-gray-500 cursor-not-allowed' : 'bg-surface-800 text-white hover:bg-primary-600'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>
  );
};

export default Pagination; 