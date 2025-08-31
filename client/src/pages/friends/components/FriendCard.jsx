import React, { useCallback } from 'react';
import UserAvatar from './UserUtils';

const FriendCard = ({
  friend,
  activeDropdown,
  setActiveDropdown,
  handleRemoveFriend,
  dropdownRef,
  onMessageClick,
  unreadCount = 0
}) => {
  // Safety check to prevent rendering issues
  if (!friend || !friend._id || !friend.userName) {
    return null; // Don't render this card
  }

  // Create memoized handlers to prevent unnecessary re-renders
  const handleDropdownToggle = useCallback(() => {
    setActiveDropdown(prev => prev === friend._id ? null : friend._id);
  }, [friend._id, setActiveDropdown]);

  const handleMessageUser = useCallback(() => {
    onMessageClick(friend);
  }, [friend, onMessageClick]);

  const handleRemoveClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // Close dropdown first to avoid event handling issues
    setActiveDropdown(null);
    // Small timeout to ensure dropdown close happens before removal
    setTimeout(() => {
      if (handleRemoveFriend) {
        handleRemoveFriend(friend._id);
      }
    }, 50);
  }, [friend._id, handleRemoveFriend, setActiveDropdown]);

  const setRef = useCallback((el) => {
    dropdownRef(friend._id, el);
  }, [friend._id, dropdownRef]);
    
  return (
    <div 
      className="p-5 bg-surface-800 rounded-lg border border-surface-700 flex items-center hover:bg-surface-700 transition-colors relative h-24"
      data-friend-id={friend._id}
    >
      <UserAvatar 
        username={friend.userName} 
        status={friend.status} 
        size="md" 
      />
      
      <div className="ml-4 flex-1">
        <div className="flex items-center">
          <h3 className="font-semibold text-white text-lg">{friend.userName}</h3>
          {unreadCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 flex items-center justify-center min-w-[20px]">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-400">{friend.status || 'Offline'}</p>
      </div>
      
      <div className="flex gap-2">
        <button 
          className="w-10 h-10 rounded-lg text-gray-400 hover:text-white hover:bg-surface-600 flex items-center justify-center transition-colors relative" 
          title="Message"
          onClick={handleMessageUser}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
        <div className="relative">
          <button 
            className={`w-10 h-10 rounded-lg ${activeDropdown === friend._id ? 'bg-surface-600 text-white' : 'text-gray-400 hover:text-white hover:bg-surface-600'} flex items-center justify-center transition-colors`}
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
            <div className="absolute left-full ml-2 top-0 w-48 bg-surface-700 rounded-lg shadow-lg z-50 py-1 border border-surface-600">
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