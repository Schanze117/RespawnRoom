import React, { useCallback } from 'react';
import UserAvatar from './UserUtils';

const FriendCard = ({
  friend,
  isPinned,
  activeDropdown,
  setActiveDropdown,
  togglePinFriend,
  handleRemoveFriend,
  dropdownRef,
  onMessageClick,
  unreadCount = 0
}) => {
  console.log('[FriendCard] Rendering for friend:', friend?.userName, 'ID:', friend?._id);
  console.log('[FriendCard] Props received:', { friend, isPinned, activeDropdown, togglePinFriend, handleRemoveFriendExists: !!handleRemoveFriend });

  // Safety check to prevent rendering issues
  if (!friend || !friend._id || !friend.userName) {
    console.error('[FriendCard] Invalid friend object:', friend);
    return null; // Don't render this card
  }

  // Create memoized handlers to prevent unnecessary re-renders
  const handleDropdownToggle = useCallback(() => {
    console.log('[FriendCard] handleDropdownToggle for:', friend._id);
    setActiveDropdown(prev => prev === friend._id ? null : friend._id);
  }, [friend._id, setActiveDropdown]);

  const handlePinToggle = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[FriendCard] handlePinToggle for:', friend._id);
    togglePinFriend(friend._id);
  }, [friend._id, togglePinFriend]);

  const handleMessageUser = useCallback(() => {
    console.log('[FriendCard] handleMessageUser for:', friend.userName);
    onMessageClick(friend);
  }, [friend, onMessageClick]);

  const handleRemoveClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[FriendCard] handleRemoveClick for:', friend._id);
    // Close dropdown first to avoid event handling issues
    setActiveDropdown(null);
    // Small timeout to ensure dropdown close happens before removal
    setTimeout(() => {
      if (handleRemoveFriend) {
        handleRemoveFriend(friend._id);
      } else {
        console.error('[FriendCard] handleRemoveFriend function is not available');
      }
    }, 50);
  }, [friend._id, handleRemoveFriend, setActiveDropdown]);

  const handleViewProfile = useCallback(() => {
    // Close dropdown
    console.log('[FriendCard] handleViewProfile for:', friend.userName);
    setActiveDropdown(null);
    // Navigate to profile
    window.location.href = `/profile/${friend._id}`;
  }, [friend._id, setActiveDropdown]);

  const setRef = useCallback((el) => {
    dropdownRef(friend._id, el);
  }, [friend._id, dropdownRef]);
    
  return (
    <div 
      className={`p-4 bg-surface-800 rounded-lg border ${isPinned ? 'border-primary-600' : 'border-surface-700'} flex items-center hover:bg-surface-700 transition-colors relative`}
      data-friend-id={friend._id}
    >
      <UserAvatar 
        username={friend.userName} 
        status={friend.status} 
        size="md" 
        showPin={true} 
        isPinned={isPinned} 
      />
      
      <div className="ml-4 flex-1">
        <h3 className="font-semibold text-white">{friend.userName}</h3>
        <p className="text-sm text-gray-400">{friend.status || 'Offline'}</p>
      </div>
      
      <div className="flex gap-2">
        <div className="relative">
          <button 
            className="w-9 h-9 rounded-lg text-gray-400 hover:text-white hover:bg-surface-600 flex items-center justify-center transition-colors" 
            title="Message"
            onClick={handleMessageUser}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        <div className="relative">
          <button 
            className={`w-9 h-9 rounded-lg ${activeDropdown === friend._id ? 'bg-surface-600 text-white' : 'text-gray-400 hover:text-white hover:bg-surface-600'} flex items-center justify-center transition-colors`}
            onClick={handleDropdownToggle}
            title="More Options"
            ref={setRef}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </button>
          
          {/* Friend Action Dropdown */}
          {activeDropdown === friend._id && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-surface-700 rounded-lg shadow-lg z-10 py-1 border border-surface-600">
              <button
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-surface-600 flex items-center gap-2"
                onClick={handleViewProfile}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                View Profile
              </button>
              <div className="border-t border-surface-600 my-1"></div>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-surface-600 flex items-center gap-2"
                style={{ color: isPinned ? '#f59e0b' : '#9ca3af' }}
                onClick={handlePinToggle}
              >
                {isPinned ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L9.5 8.5 2 10l6 5.5-1.5 7.5 5.5-3.5 5.5 3.5-1.5-7.5 6-5.5-7.5-1.5z"></path>
                    </svg>
                    Unpin friend
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L9.5 8.5 2 10l6 5.5-1.5 7.5 5.5-3.5 5.5 3.5-1.5-7.5 6-5.5-7.5-1.5z"></path>
                    </svg>
                    Pin friend
                  </>
                )}
              </button>
              <div className="border-t border-surface-600 my-1"></div>
              <button
                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-surface-600 flex items-center gap-2"
                onClick={handleRemoveClick}
                type="button"
                aria-label={`Remove ${friend.userName} from friends`}
                data-friend-id={friend._id}
                data-testid={`remove-friend-button-${friend._id}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l6 6M15 11l-6 6"></path>
                  <circle cx="12" cy="12" r="10"></circle>
                </svg>
                Remove friend
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(FriendCard); 