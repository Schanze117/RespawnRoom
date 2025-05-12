import React from 'react';
import UserAvatar, { getAvatarColor, getInitialAvatar } from './UserUtils';

const FriendRequestDropdown = ({ 
  isOpen, 
  loading, 
  requests, 
  handleAccept, 
  handleDecline 
}) => {
  if (!isOpen) return null;

  // Add safe click handlers with debugging
  const onAcceptClick = (e, id) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    console.log('Accept button clicked for:', id);
    if (handleAccept && typeof handleAccept === 'function') {
      handleAccept(id);
    } else {
      console.error('handleAccept is not available or not a function');
    }
  };

  const onDeclineClick = (e, id) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    console.log('Decline button clicked for:', id);
    if (handleDecline && typeof handleDecline === 'function') {
      handleDecline(id);
    } else {
      console.error('handleDecline is not available or not a function');
    }
  };

  return (
    <div className="absolute top-12 right-0 w-72 bg-surface-800 rounded-lg shadow-lg border border-surface-700 z-10 overflow-hidden">
      <div className="flex justify-between items-center p-3 border-b border-surface-700">
        <h3 className="text-sm font-medium text-white">Friend Requests</h3>
        <span className="px-2 py-0.5 rounded-full bg-primary-600 text-white text-xs">
          {requests.length}
        </span>
      </div>
      
      {loading ? (
        <div className="p-4 text-center text-gray-400">Loading requests...</div>
      ) : (
        <>
          {requests.length > 0 ? (
            <div className="max-h-80 overflow-y-auto">
              {requests.map((request) => (
                <div key={request._id} className="p-3 flex items-center border-b border-surface-700 hover:bg-surface-700 transition-colors">
                  <div 
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: getAvatarColor(request.userName) }}
                  >
                    {getInitialAvatar(request.userName)}
                  </div>
                  <div className="ml-3 flex-1">
                    <h4 className="text-sm font-medium text-white">{request.userName}</h4>
                    <p className="text-xs text-gray-400">Sent {request.sentTime || 'recently'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-colors"
                      onClick={(e) => onAcceptClick(e, request._id)}
                      title="Accept"
                      type="button"
                      aria-label={`Accept friend request from ${request.userName}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </button>
                    <button 
                      className="w-8 h-8 rounded-full bg-surface-700 text-gray-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                      onClick={(e) => onDeclineClick(e, request._id)}
                      title="Decline"
                      type="button"
                      aria-label={`Decline friend request from ${request.userName}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-400">
              <p>No friend requests</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FriendRequestDropdown; 