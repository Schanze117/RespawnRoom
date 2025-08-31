import React from 'react';

/**
 * Common loading skeleton components that provide a unified design 
 * for loading states throughout the application.
 */

// Simple loader with dots animation (for small spaces)
export const DotLoader = () => (
  <div className="flex items-center justify-center py-2">
    <div className="animate-pulse flex space-x-2">
      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
    </div>
  </div>
);

// Card skeleton for content cards (game cards, etc.)
export const CardSkeleton = ({ height = 280 }) => (
  <div className="flex-shrink-0 bg-surface-800 rounded-lg overflow-hidden border border-surface-700 animate-pulse">
    <div style={{ height: `${height * 0.57}px` }} className="bg-surface-700"></div>
    <div className="p-4">
      <div className="h-5 bg-surface-700 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-surface-700 rounded w-1/2 mb-4"></div>
      <div className="flex justify-between">
        <div className="h-4 bg-surface-700 rounded w-1/4"></div>
        <div className="h-4 bg-surface-700 rounded w-1/5"></div>
      </div>
    </div>
  </div>
);

// Section skeleton for homepage sections
export const SectionSkeleton = ({ title, cardCount = 5 }) => (
  <section className="w-full mb-12">
    <div className="relative mb-6">
      <div className="absolute left-0 top-0 w-1 h-full bg-primary-600"></div>
      <h2 className="text-2xl font-bold text-primary-500 pl-4">{title}</h2>
    </div>
    <div className="flex space-x-4 overflow-hidden pb-4">
      {[...Array(cardCount)].map((_, index) => (
        <div key={index} className="w-[280px]">
          <CardSkeleton />
        </div>
      ))}
    </div>
  </section>
);

// Page skeleton for full page loading states
export const PageSkeleton = ({ children }) => (
  <div className="page-container flex-1 pt-20 md:pl-64">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-surface-900 border-2 rounded-lg border-tonal-800 shadow-lg overflow-hidden mb-6 animate-pulse">
        <div className="h-14 border-b border-tonal-800 px-5 py-3">
          <div className="h-8 bg-surface-800 rounded w-1/4"></div>
        </div>
        <div className="p-6">
          {children || (
            <div className="space-y-6">
              <div className="h-6 bg-surface-800 rounded w-3/4"></div>
              <div className="h-32 bg-surface-800 rounded"></div>
              <div className="h-6 bg-surface-800 rounded w-1/2"></div>
              <div className="h-32 bg-surface-800 rounded"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

// Discover page specific skeleton that matches the real layout
const DiscoverPageSkeleton = () => (
  <div className="page-container flex-1 pt-20 md:pl-64">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-surface-900 border-2 rounded-lg border-tonal-800 shadow-lg overflow-hidden mb-6">
        {/* Header skeleton */}
        <div className="px-5 py-3 border-b border-tonal-800">
          <div className="h-8 bg-surface-700 w-40 animate-pulse"></div>
        </div>
        
        <div className="flex flex-col w-full">
          {/* Review toggle skeleton */}
          <div className="flex justify-end px-4 pt-4">
            <div className="w-32 h-8 bg-surface-700 rounded animate-pulse"></div>
          </div>
          
          {/* Filter buttons skeleton */}
          <div className="px-4 py-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="w-20 h-9 bg-surface-700 rounded animate-pulse skeleton-stagger-1"></div>
              <div className="w-16 h-9 bg-surface-700 rounded animate-pulse skeleton-stagger-2"></div>
              <div className="w-24 h-9 bg-surface-700 rounded animate-pulse skeleton-stagger-3"></div>
              <div className="w-20 h-9 bg-surface-700 rounded animate-pulse skeleton-stagger-4"></div>
            </div>
            
            {/* Search button skeleton - full width button */}
            <div className="w-full h-12 bg-surface-700 rounded-lg mt-4 animate-pulse skeleton-stagger-1"></div>
          </div>
          
          {/* Results area skeleton - empty space only */}
          <div className="w-full p-4 min-h-[200px]">
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Consistent page loading screen used across Saved, Discover, and Friends pages
export const ConsistentPageLoader = ({ title, showMiddleSkeleton = true }) => {
  // Use specific discover skeleton for discover page
  if (title === "Discover") {
    return <DiscoverPageSkeleton />;
  }
  
  return (
    <div className="flex-1 pt-20 md:pl-64">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-surface-900 border-2 rounded-lg border-tonal-800 shadow-lg overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-tonal-800">
            <div className="h-8 bg-surface-700 w-40 animate-pulse"></div>
          </div>
          <div className="w-full p-4 min-h-[200px]">
            {showMiddleSkeleton && (
              <div className="text-center py-8 animate-pulse">
                <div className="h-6 bg-surface-700 rounded w-48 mx-auto"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Avatar skeleton for user avatars
export const AvatarSkeleton = ({ size = 12 }) => (
  <div className={`w-${size} h-${size} rounded-full bg-surface-700 animate-pulse`}></div>
);

// List item skeleton for lists (friends, messages, etc.)
export const ListItemSkeleton = () => (
  <div className="p-4 bg-surface-800 rounded-lg border border-surface-700 flex items-center animate-pulse">
    <AvatarSkeleton />
    <div className="ml-4 flex-1">
      <div className="h-5 bg-surface-700 rounded w-1/3 mb-2"></div>
      <div className="h-4 bg-surface-700 rounded w-1/4"></div>
    </div>
    <div className="w-20 h-8 bg-surface-700 rounded"></div>
  </div>
);

// Form input skeleton
export const FormFieldSkeleton = () => (
  <div className="mb-4 animate-pulse">
    <div className="h-5 bg-surface-700 rounded w-1/4 mb-2"></div>
    <div className="h-10 bg-surface-700 rounded w-full"></div>
  </div>
);

export default {
  DotLoader,
  CardSkeleton,
  SectionSkeleton,
  PageSkeleton,
  ConsistentPageLoader,
  AvatarSkeleton,
  ListItemSkeleton,
  FormFieldSkeleton
}; 