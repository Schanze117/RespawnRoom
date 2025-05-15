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
          {/* Page header skeleton */}
          <div className="h-14 border-b border-tonal-800 px-5 py-3 flex items-center">
            <div className="h-8 bg-surface-800 rounded w-1/4 animate-pulse"></div>
          </div>
          
          <div className="p-4">
            {/* Friends header with dropdown skeleton */}
            <HeaderSkeleton />
            
            {/* Search tabs skeleton */}
            <SearchTabsSkeleton />
            
            {/* Friends list skeleton */}
            <div className="mt-4">
              <FriendListSkeleton />
            </div>
            
            {/* Pagination skeleton */}
            <PaginationSkeleton />
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