import React from 'react';
import { LuChevronLeft, LuChevronRight, LuChevronsLeft, LuChevronsRight } from 'react-icons/lu';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  // Determine which pages to show
  const showFirst = currentPage > 2;
  const showPrevious = currentPage > 1;
  const showNext = currentPage < totalPages;
  const showLast = currentPage < totalPages - 1;

  return (
    <div className="flex items-center justify-center my-8 px-4">
      {/* First page button */}
      {showFirst && (
        <button
          onClick={() => onPageChange(1)}
          className="flex items-center justify-center p-2 mx-1 transition-colors duration-200 rounded-full text-light hover:text-primary-500 hover:bg-surface-800"
          aria-label="First page"
        >
          <LuChevronsLeft className="w-7 h-7" />
        </button>
      )}
      
      {/* Previous page button */}
      {showPrevious && (
        <button
          onClick={() => onPageChange(currentPage - 1)}
          className="flex items-center justify-center p-2 mx-1 transition-colors duration-200 rounded-full text-light hover:text-primary-500 hover:bg-surface-800"
          aria-label="Previous page"
        >
          <LuChevronLeft className="w-7 h-7" />
        </button>
      )}
      
      {/* Page numbers */}
      <div className="flex items-center justify-center flex-wrap mx-4 space-x-5">
        {/* Current page number */}
        <button
          className="flex items-center justify-center h-12 w-12 text-lg rounded-full bg-primary-600 text-light font-medium scale-110 shadow-md shadow-primary-900/30"
          aria-label={`Page ${currentPage}`}
          aria-current="page"
          disabled
        >
          {currentPage}
        </button>
      </div>
      
      {/* Next page button */}
      {showNext && (
        <button
          onClick={() => onPageChange(currentPage + 1)}
          className="flex items-center justify-center p-2 mx-1 transition-colors duration-200 rounded-full text-light hover:text-primary-500 hover:bg-surface-800"
          aria-label="Next page"
        >
          <LuChevronRight className="w-7 h-7" />
        </button>
      )}
      
      {/* Last page button */}
      {showLast && (
        <button
          onClick={() => onPageChange(totalPages)}
          className="flex items-center justify-center p-2 mx-1 transition-colors duration-200 rounded-full text-light hover:text-primary-500 hover:bg-surface-800"
          aria-label="Last page"
        >
          <LuChevronsRight className="w-7 h-7" />
        </button>
      )}
    </div>
  );
};

export default Pagination; 