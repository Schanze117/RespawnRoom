import React from 'react';

const FriendCardSkeleton = () => (
  <div className="p-5 bg-surface-800 rounded-lg border border-surface-700 flex items-center relative h-24 animate-pulse">
    {/* Avatar skeleton */}
    <div className="w-12 h-12 rounded-full bg-surface-700"></div>
    
    {/* Content skeleton */}
    <div className="ml-4 flex-1">
      <div className="h-5 bg-surface-700 rounded w-1/3 mb-2"></div>
      <div className="h-4 bg-surface-700 rounded w-1/4"></div>
    </div>
    
    {/* Action buttons skeleton */}
    <div className="flex gap-2">
      <div className="w-10 h-10 rounded-lg bg-surface-700"></div>
      <div className="w-10 h-10 rounded-lg bg-surface-700"></div>
    </div>
  </div>
);

const FriendListSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
    {Array(6).fill().map((_, index) => (
      <FriendCardSkeleton key={`skeleton-${index}`} />
    ))}
  </div>
);

const SearchUserCardSkeleton = () => (
  <div className="p-4 bg-surface-800 rounded-lg border border-surface-700 flex items-center animate-pulse">
    {/* Avatar skeleton */}
    <div className="w-12 h-12 rounded-full bg-surface-700"></div>
    
    {/* Content skeleton */}
    <div className="ml-4 flex-1">
      <div className="h-5 bg-surface-700 rounded w-1/3 mb-2"></div>
      <div className="h-4 bg-surface-700 rounded w-1/4"></div>
    </div>
    
    {/* Button skeleton */}
    <div className="w-28 h-10 bg-surface-700 rounded"></div>
  </div>
);

const SearchUsersSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    {Array(4).fill().map((_, index) => (
      <SearchUserCardSkeleton key={`search-skeleton-${index}`} />
    ))}
  </div>
);

const SearchTabsSkeleton = () => (
  <div className="animate-pulse">
    <div className="flex items-center border-b border-surface-700 mb-4">
      <div className="flex space-x-2">
        <div className="h-10 w-24 bg-surface-700 rounded-t-lg"></div>
        <div className="h-10 w-24 bg-surface-700 rounded-t-lg"></div>
      </div>
    </div>
    <div className="w-full h-10 bg-surface-700 rounded-lg"></div>
  </div>
);

const HeaderSkeleton = () => (
  <div className="flex justify-between items-center mb-6 animate-pulse">
    <div className="flex items-center">
      <div className="w-8 h-6 bg-surface-700 rounded-full"></div>
    </div>
    <div className="w-36 h-10 bg-surface-700 rounded-lg"></div>
  </div>
);

const PaginationSkeleton = () => (
  <div className="flex justify-center mt-8 animate-pulse">
    <div className="flex space-x-2">
      <div className="w-10 h-10 rounded-lg bg-surface-700"></div>
      <div className="w-10 h-10 rounded-lg bg-surface-700"></div>
      <div className="w-10 h-10 rounded-lg bg-surface-700"></div>
      <div className="w-10 h-10 rounded-lg bg-surface-700"></div>
    </div>
  </div>
);

const FriendsPageSkeleton = () => {
  return (
    <div className="page-container flex-1 pt-20 md:pl-64">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-surface-900 border-2 rounded-lg border-tonal-800 shadow-lg overflow-hidden mb-6">
          {/* FRIENDS PAGE SPECIFIC HEADER */}
          <div className="px-5 py-3 border-b border-tonal-800 bg-surface-900">
            <div className="w-32 h-8 skeleton-shimmer rounded skeleton-stagger-1"></div>
          </div>
          
          <div className="p-4">
            {/* FRIENDS-SPECIFIC TOP BAR: Counter + Friend Requests Button */}
            <div className="flex justify-between items-center mb-4">
              {/* Left: Friends count badge */}
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-surface-700 rounded-full skeleton-shimmer skeleton-stagger-1"></div>
              </div>
              
              {/* Right: Friend Requests dropdown button */}
              <div className="flex items-center gap-2 bg-surface-800 hover:bg-surface-700 px-3 py-2 rounded-lg skeleton-stagger-2">
                {/* User plus icon placeholder */}
                <div className="w-4 h-4 skeleton-shimmer rounded"></div>
                {/* "Friend Requests" text */}
                <div className="w-24 h-3 skeleton-shimmer rounded"></div>
                {/* Request count badge */}
                <div className="w-4 h-4 bg-surface-700 rounded-full skeleton-shimmer"></div>
              </div>
            </div>
            
            {/* FRIENDS-SPECIFIC TAB NAVIGATION */}
            <div className="border-b border-surface-700 mb-4">
              <div className="flex space-x-0 -mb-px">
                {/* Active "My Friends" tab */}
                <div className="px-5 py-2 bg-surface-800 text-white font-medium rounded-t-lg border-b-2 border-surface-700 friends-pulse skeleton-stagger-3">
                  <div className="w-20 h-3 bg-surface-700 rounded"></div>
                </div>
                {/* Inactive "Find Players" tab */}
                <div className="px-5 py-2 bg-surface-800 text-surface-400 rounded-t-lg skeleton-stagger-4">
                  <div className="w-20 h-3 skeleton-shimmer rounded"></div>
                </div>
              </div>
            </div>
            
            {/* FRIENDS-SPECIFIC SEARCH BAR */}
            <div className="relative mb-6">
              <div className="w-full h-9 skeleton-shimmer border border-surface-700 rounded-lg skeleton-stagger-5 relative overflow-hidden">
                {/* Search icon placeholder */}
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 skeleton-shimmer rounded"></div>
                {/* Placeholder text area */}
                <div className="absolute left-8 top-1/2 transform -translate-y-1/2 w-24 h-3 skeleton-shimmer rounded"></div>
              </div>
            </div>
            
            {/* FRIENDS-SPECIFIC EMPTY STATE */}
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-4">
              {/* Smaller smiley face */}
              <div className="relative">
                {/* Outer circle */}
                <div className="w-14 h-14 rounded-full border-3 border-surface-600 flex items-center justify-center friends-pulse skeleton-stagger-1">
                  {/* Inner smile elements */}
                  <div className="flex flex-col items-center space-y-1">
                    {/* Eyes */}
                    <div className="flex space-x-1 mb-1">
                      <div className="w-1.5 h-1.5 bg-surface-600 rounded-full"></div>
                      <div className="w-1.5 h-1.5 bg-surface-600 rounded-full"></div>
                    </div>
                    {/* Smile curve */}
                    <div className="w-4 h-2 border-b-2 border-surface-600 rounded-full"></div>
                  </div>
                </div>
              </div>
              
              {/* "Your friends list is empty" text */}
              <div className="space-y-2">
                <div className="w-44 h-5 skeleton-shimmer rounded skeleton-stagger-2"></div>
                <div className="w-36 h-3 skeleton-shimmer rounded skeleton-stagger-3"></div>
              </div>
              
              {/* "Find Players" button */}
              <div className="mt-3">
                <div className="w-28 h-9 bg-surface-700 rounded-lg friends-pulse skeleton-stagger-4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export skeletons for individual use
export { 
  FriendCardSkeleton, 
  FriendListSkeleton, 
  SearchUserCardSkeleton, 
  SearchUsersSkeleton,
  SearchTabsSkeleton,
  HeaderSkeleton,
  PaginationSkeleton
};

export default FriendsPageSkeleton; 