import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import FriendCard from './FriendCard';
import Pagination from './Pagination';

// Lazy load ChatPopup component
const ChatPopup = lazy(() => import('./ChatPopup'));

const EmptyFriendsList = ({ searchQuery, toggleSearchMode }) => (
  <div className="col-span-full p-10 bg-surface-800 rounded-lg border border-dashed border-surface-700 flex flex-col items-center justify-center">
    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-500 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
      <line x1="9" y1="9" x2="9.01" y2="9"></line>
      <line x1="15" y1="9" x2="15.01" y2="9"></line>
    </svg>
    {searchQuery ? (
      <>
        <p className="text-white font-medium text-lg mb-1">No friends found matching "{searchQuery}"</p>
        <p className="text-gray-400 text-center">Try a different username or check your spelling</p>
      </>
    ) : (
      <>
        <p className="text-white font-medium text-lg mb-1">Your friends list is empty</p>
        <p className="text-gray-400 text-center">Add friends to see them here</p>
        <button 
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          onClick={() => toggleSearchMode('findPlayers')}
        >
          Find Players
        </button>
      </>
    )}
  </div>
);

const FriendsList = ({ 
  unpinnedFriends,
  searchQuery,
  toggleSearchMode,
  activeDropdown,
  setActiveDropdown,
  handleRemoveFriend,
  dropdownRefs,
  currentPage,
  totalPages,
  handlePageChange,
  handlePrevPage,
  handleNextPage,
  unreadCounts = {},
  onMessageClick
}) => {
  const [activeChatFriend, setActiveChatFriend] = useState(null);
  const [chatError, setChatError] = useState(null);
  
  // Ensure friends array is valid
  const safeFriends = useMemo(() => {
    return Array.isArray(unpinnedFriends) ? unpinnedFriends : [];
  }, [unpinnedFriends]);

  // Helper function to check if a friend object is valid
  const isValidFriend = (friend) => friend && typeof friend === 'object' && friend._id && friend.userName;

  // Filter out invalid friend objects using useMemo to prevent unnecessary re-renders
  const validFriends = useMemo(() => {
    return safeFriends.filter(isValidFriend);
  }, [safeFriends]);
  
  // Memoize the empty state check
  const friendsEmpty = useMemo(() => {
    return validFriends.length === 0;
  }, [validFriends.length]);

  const handleMessageClick = (friend) => {
    try {
      // Check if the friend object has required properties
      if (!friend || !friend._id) {
        setChatError(true);
        return;
      }
      
      // If the user is trying to open a chat that's already open, do nothing
      if (activeChatFriend && activeChatFriend._id === friend._id) {
        return;
      }
      
      setActiveChatFriend(friend);
      
      // If there was an error before, clear it
      if (chatError) setChatError(false);
      
      // Call the parent handler if provided
      if (onMessageClick) {
        onMessageClick(friend);
      }
    } catch (error) {
      setChatError(true);
    }
  };

  const handleCloseChat = () => {
    setActiveChatFriend(null);
    // Clear any error when closing chat
    if (chatError) setChatError(false);
  };

  // Function to create dropdown ref
  const createDropdownRef = (friendId, element) => {
    if (dropdownRefs) {
      dropdownRefs(friendId, element);
    }
  };

  if (friendsEmpty && !searchQuery) {
    return <EmptyFriendsList searchQuery={searchQuery} toggleSearchMode={toggleSearchMode} />;
  }
  
  return (
    <div className="flex flex-col">
      {chatError && !activeChatFriend && (
        <div className="mb-4 p-3 bg-red-500 text-white rounded-md">
          There was a problem opening the chat. Please try again.
          <button 
            className="ml-2 underline"
            onClick={() => setChatError(false)}
          >
            Dismiss
          </button>
        </div>
      )}
    
      {friendsEmpty && searchQuery ? (
        <EmptyFriendsList searchQuery={searchQuery} toggleSearchMode={toggleSearchMode} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {validFriends.map((friend) => (
              <FriendCard
                key={`friend-${friend._id}`}
                friend={friend}
                activeDropdown={activeDropdown}
                setActiveDropdown={setActiveDropdown}
                handleRemoveFriend={handleRemoveFriend}
                dropdownRef={createDropdownRef}
                onMessageClick={handleMessageClick}
                unreadCount={unreadCounts[friend._id] || 0}
              />
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                onPrevPage={handlePrevPage}
                onNextPage={handleNextPage}
              />
            </div>
          )}
        </>
      )}

      {/* Chat popup */}
      {activeChatFriend && !chatError && (
        <Suspense fallback={
          <div className="fixed bottom-4 right-4 w-80 h-[500px] bg-surface-800 rounded-lg shadow-lg border border-surface-700 z-50 flex items-center justify-center">
            <div className="animate-pulse flex space-x-2">
              <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
              <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
              <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
            </div>
          </div>
        }>
          <ChatPopup 
            friend={activeChatFriend} 
            onClose={handleCloseChat} 
          />
        </Suspense>
      )}
    </div>
  );
};

export default React.memo(FriendsList); 