import React, { useState } from 'react';
import FriendCard from './FriendCard';
import Pagination from './Pagination';
import ChatPopup from './ChatPopup';

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
        <p className="text-white font-medium text-lg mb-1">No friends found</p>
        <p className="text-gray-400 text-center">We couldn't find any friends matching '{searchQuery}'</p>
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
  pinnedFriends,
  unpinnedFriends,
  searchQuery,
  toggleSearchMode,
  activeDropdown,
  setActiveDropdown,
  togglePinFriend,
  handleRemoveFriend,
  dropdownRefs,
  currentPage,
  totalPages,
  handlePageChange,
  handlePrevPage,
  handleNextPage,
  unreadCounts = {}
}) => {
  const [activeChatFriend, setActiveChatFriend] = useState(null);
  const [chatError, setChatError] = useState(false);

  const handleMessageClick = (friend) => {
    try {
      // Check if the friend object has required properties
      if (!friend || !friend._id) {
        console.error("Invalid friend object:", friend);
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
    } catch (error) {
      console.error("Error opening chat:", error);
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
    dropdownRefs.current[friendId] = element;
  };

  const allFriendsEmpty = pinnedFriends.length === 0 && unpinnedFriends.length === 0;

  if (allFriendsEmpty && !searchQuery) {
    return <EmptyFriendsList searchQuery={searchQuery} toggleSearchMode={toggleSearchMode} />;
  }

  const displayedFriends = [...pinnedFriends, ...unpinnedFriends];
  
  return (
    <>
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
    
      {allFriendsEmpty && searchQuery ? (
        <EmptyFriendsList searchQuery={searchQuery} toggleSearchMode={toggleSearchMode} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedFriends.map((friend) => (
              <FriendCard
                key={friend._id}
                friend={friend}
                isPinned={pinnedFriends.some(f => f._id === friend._id)}
                activeDropdown={activeDropdown}
                setActiveDropdown={setActiveDropdown}
                togglePinFriend={togglePinFriend}
                handleRemoveFriend={handleRemoveFriend}
                dropdownRef={createDropdownRef}
                onMessageClick={handleMessageClick}
                unreadCount={unreadCounts[friend._id] || 0}
              />
            ))}
          </div>
          
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onPrevPage={handlePrevPage}
              onNextPage={handleNextPage}
            />
          )}
        </>
      )}

      {/* Chat popup */}
      {activeChatFriend && !chatError && (
        <ChatPopup 
          friend={activeChatFriend} 
          onClose={handleCloseChat} 
        />
      )}
    </>
  );
};

export default FriendsList; 