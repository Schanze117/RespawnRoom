import React from 'react';
import UserAvatar, { getStatusClass } from './UserUtils';
import { SearchUsersSkeleton } from './FriendSkeletonLoader';

const SearchUsers = ({ 
  searchQuery, 
  setSearchQuery,
  onSearch,
  onSendRequest,
  searchResults = [], 
  loading: searchLoading = false, 
  requestSent = {} 
}) => {
  // Empty state - no search performed yet
  if (!searchQuery.trim() && !searchLoading) {
    return (
      <div className="col-span-full p-10 bg-surface-800 rounded-lg border border-dashed border-surface-700 flex flex-col items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-500 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <p className="text-white font-medium mb-1">Search for players to add as friends</p>
        <p className="text-sm text-gray-400">Enter a username to get started</p>
      </div>
    );
  }

  // Loading state
  if (searchLoading) {
    return <SearchUsersSkeleton />;
  }

  // No results found
  if (searchQuery.trim() && searchResults.length === 0 && !searchLoading) {
    return (
      <div className="col-span-full p-10 bg-surface-800 rounded-lg border border-dashed border-surface-700 flex flex-col items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-500 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="8" y1="15" x2="16" y2="15"></line>
          <line x1="9" y1="9" x2="9.01" y2="9"></line>
          <line x1="15" y1="9" x2="15.01" y2="9"></line>
        </svg>
        <p className="text-white font-medium mb-1">No users found matching "{searchQuery}"</p>
        <p className="text-sm text-gray-400">Try a different username or check your spelling</p>
      </div>
    );
  }

  // Display search results
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {searchResults.map((user) => (
        <div key={user._id} className="p-4 bg-surface-800 rounded-lg border border-surface-700 flex items-center hover:bg-surface-700 transition-colors">
          <UserAvatar 
            username={user.userName} 
            status={user.status} 
            size="md" 
          />
          <div className="ml-4 flex-1">
            <h3 className="font-semibold text-white">{user.userName}</h3>
            <p className="text-sm text-gray-400">{user.status || 'Offline'}</p>
          </div>
          <div>
            {requestSent[user._id] ? (
              <button className="px-3 py-2 bg-surface-700 text-gray-400 rounded text-sm font-medium flex items-center gap-2 cursor-not-allowed" disabled>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Request Sent
              </button>
            ) : (
              <button 
                className="px-3 py-2 bg-primary-600 text-white rounded text-sm font-medium flex items-center gap-2 hover:bg-primary-700 transition-colors"
                onClick={() => onSendRequest(user._id)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
                Add Friend
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SearchUsers; 