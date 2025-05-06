import React, { useRef } from 'react';
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
  return (
    <div 
      className={`p-4 bg-surface-800 rounded-lg border ${isPinned ? 'border-primary-600' : 'border-surface-700'} flex items-center hover:bg-surface-700 transition-colors relative`}
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
            onClick={() => onMessageClick(friend)}
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
            onClick={() => setActiveDropdown(prev => prev === friend._id ? null : friend._id)}
            title="More Options"
            ref={el => dropdownRef(friend._id, el)}
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
                onClick={() => {
                  // Close dropdown
                  setActiveDropdown(null);
                  // Navigate to profile
                  window.location.href = `/profile/${friend._id}`;
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                View Profile
              </button>
              <div className="border-t border-surface-600 my-1"></div>
              <button
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-surface-600 flex items-center gap-2"
                onClick={() => togglePinFriend(friend._id)}
              >
                {isPinned ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    Unpin Friend
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10L13 10" />
                      <path d="M21 6L13 6" />
                      <path d="M21 14L13 14" />
                      <path d="M21 18L13 18" />
                      <path d="M9 10.46V23a1 1 0 0 1-1.45.9L1 20M9 1v9.46" />
                    </svg>
                    Pin to Top
                  </>
                )}
              </button>
              <div className="border-t border-surface-600 my-1"></div>
              <button
                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-surface-600 flex items-center gap-2"
                onClick={() => handleRemoveFriend(friend._id)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="18" y1="8" x2="23" y2="13"></line>
                  <line x1="23" y1="8" x2="18" y2="13"></line>
                </svg>
                Remove Friend
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendCard; 