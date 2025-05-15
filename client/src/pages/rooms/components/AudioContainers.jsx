import React from 'react';
import { Mic, MicOff, Users } from 'lucide-react';

const LocalAudioContainer = ({ 
  isMuted,
  userNickname
}) => {
  const userName = userNickname || localStorage.getItem('nickname') || 'You';
  const initial = userName.charAt(0).toUpperCase();
  
  return (
    <div 
      className="bg-surface-800 rounded-md shadow-md flex items-center justify-between transition-all duration-300 p-3 hover:bg-surface-700"
    >
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-base font-medium text-white mr-3">
          {initial}
        </div>
        <span className="text-base font-medium text-white truncate">{userName}</span>
      </div>
      <div className="flex items-center">
        {isMuted ? (
          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
            <MicOff size={16} className="text-red-400" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <Mic size={16} className="text-green-400" />
          </div>
        )}
      </div>
    </div>
  );
};

const RemoteAudioContainer = ({ 
  user
}) => {
  if (!user) {
    console.error('RemoteAudioContainer: Missing user prop');
    return null;
  }
  
  // Try multiple sources for the user's nickname in this priority:
  // 1. Username from the user object (set by RTM attribute fetch)
  // 2. Username from session storage (persisted from previous fetches)
  // 3. Fallback to a friendly anonymous name instead of just the UID
  const displayName = user.username || 
                     window.sessionStorage.getItem(`rtc_user_${user.uid}`) || 
                     `Guest ${user.uid?.toString()?.slice(-4)}`;
  
  const initial = displayName.charAt(0).toUpperCase();
  const isMuted = !user.audioTrack || !user.hasAudio;

  console.log(`Rendering remote user ${user.uid} with name:`, displayName);

  return (
    <div 
      className="bg-surface-800 rounded-md shadow-md flex items-center justify-between transition-all duration-300 p-3 hover:bg-surface-700"
    >
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-base font-medium text-white mr-3">
          {initial}
        </div>
        <span className="text-base font-medium text-white truncate">{displayName}</span>
      </div>
      <div className="flex items-center">
        {isMuted ? (
          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
            <MicOff size={16} className="text-red-400" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <Mic size={16} className="text-green-400" />
          </div>
        )}
      </div>
    </div>
  );
};

const AudioGrid = ({ 
  isMuted, 
  uniqueRemoteUsers, 
  totalUniqueParticipants,
  getGridLayout,
  userNickname
}) => {
  try {
    console.log('AudioGrid rendering with props:', { 
      isMuted, 
      uniqueRemoteUsers: uniqueRemoteUsers?.length || 0, 
      totalUniqueParticipants,
      hasGetGridLayout: !!getGridLayout,
      userNickname
    });
    
    if (!uniqueRemoteUsers) {
      console.error('AudioGrid: uniqueRemoteUsers is undefined or null');
      uniqueRemoteUsers = [];
    }
    
    return (
      <div className="flex flex-col space-y-3 w-full max-w-3xl mx-auto">
        {/* Header with participant count */}
        <div className="flex items-center mb-2 text-white">
          <Users size={20} className="mr-2 text-gray-400" />
          <h2 className="text-lg font-medium">Participants</h2>
          <div className="ml-auto flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
            <span className="text-sm">Live: {totalUniqueParticipants}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-b border-surface-700 mb-2"></div>
        
        {/* Participants list */}
        <div className="space-y-2">
          <LocalAudioContainer 
            isMuted={isMuted}
            userNickname={userNickname}
          />
          
          {uniqueRemoteUsers.map((user) => (
            <RemoteAudioContainer 
              key={user?.uid || Math.random()}
              user={user}
            />
          ))}
          
          {/* Empty state message */}
          {uniqueRemoteUsers.length === 0 && (
            <div className="text-center py-4 text-gray-400 text-sm italic bg-surface-800/50 rounded-md">
              You're the only one here. Invite someone to join!
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering AudioGrid:', error);
    return (
      <div className="p-4 bg-red-500/20 rounded-md text-white">
        <h3 className="font-bold">Error rendering audio grid</h3>
        <p>{error.message}</p>
      </div>
    );
  }
};

export { AudioGrid, LocalAudioContainer, RemoteAudioContainer }; 